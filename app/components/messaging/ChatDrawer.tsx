'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { toast } from 'sonner';
import { askToLeave } from '@/app/components/ui/UnsavedChangesDialog';
import {
  QuoteProductPicker,
  ConversationStart,
  type QuoteProduct,
} from './MessagePickers';
import { useRouter } from 'next/navigation';
import {
  MessageCircle,
  X,
  Send,
  BadgeDollarSign,
  Check,
  XCircle,
  Repeat2,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { useFocusTrap } from '@/app/hooks/useFocusTrap';
import { useBodyOverlay } from '@/app/hooks/useBodyOverlay';
import { useLocalDraft } from '@/app/hooks/useLocalDraft';
import {
  readCart,
  writeCart,
  calculateTotals,
  type CartItem,
} from '@/lib/cart';
import { formatMoney, formatQuantity } from '@/lib/format';
import { MESSAGE_TEMPLATE_GROUPS } from '@/lib/ux-workflow';

type Counterparty = {
  id: string;
  name: string;
  role: 'GROWER' | 'DISPENSARY';
};

type ConversationSummary = {
  id: string;
  growerId: string;
  dispensaryId: string;
  productId: string | null;
  product: { id: string; name: string; unit: string | null } | null;
  lastMessageAt: string;
  unreadCount: number;
  lastMessagePreview: string;
  counterpart: Counterparty;
};

type ConversationMessage = {
  id: string;
  senderUserId: string;
  sender: {
    id: string;
    name: string | null;
    email: string;
    role: 'GROWER' | 'DISPENSARY';
  } | null;
  messageType: 'TEXT' | 'PRICING_REQUEST' | 'OFFER' | 'SYSTEM';
  body: string;
  productId: string | null;
  product: { id: string; name: string; unit: string | null } | null;
  offerQuantity: number | null;
  offerUnitPrice: number | null;
  offerNote: string | null;
  offerStatus:
    | 'PENDING'
    | 'ACCEPTED'
    | 'REJECTED'
    | 'COUNTERED'
    | 'EXPIRED'
    | null;
  respondedToMessageId: string | null;
  acceptedQuote: {
    id: string;
    acceptedAt: string;
    expiresAt: string;
    consumedByOrderId: string | null;
  } | null;
  createdAt: string;
};

type OpenChatEventDetail = {
  conversationId?: string;
  context?: Array<{ label: string; value: string }>;
  /** Prefill the composer without sending — the user reviews and sends. */
  draft?: string;
  /** Briefly highlight the drawer when another surface sends users here. */
  flash?: boolean;
  quoteProductId?: string;
};

interface MessageDraft {
  offerProductId: string;
  messageInput: string;
  offerPrice: string;
  offerQty: string;
  offerNote: string;
}

type MessageDaySeparator = {
  type: 'day';
  id: string;
  label: string;
};

type MessageSenderGroup = {
  type: 'group';
  id: string;
  dayKey: string;
  senderUserId: string;
  senderLabel: string;
  isMine: boolean;
  messages: ConversationMessage[];
  createdAt: string;
  lastCreatedAt: string;
};

type MessageListItem = MessageDaySeparator | MessageSenderGroup;

interface ChatDrawerProps {
  currentUserId: string;
  currentRole: 'GROWER' | 'DISPENSARY';
}

function getSafeDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function getDayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatDayLabel(date: Date) {
  const today = new Date();
  if (getDayKey(date) === getDayKey(today)) return 'Today';

  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };
  if (date.getFullYear() !== today.getFullYear()) {
    options.year = 'numeric';
  }

  return date.toLocaleDateString(undefined, options);
}

function formatMessageTime(value: string) {
  return getSafeDate(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getSenderLabel(message: ConversationMessage, currentUserId: string) {
  if (message.senderUserId === currentUserId) return 'You';
  return message.sender?.name || message.sender?.email || 'User';
}

function groupMessagesBySender(
  messages: ConversationMessage[],
  currentUserId: string
): MessageListItem[] {
  const items: MessageListItem[] = [];
  let currentDayKey = '';

  messages.forEach((message) => {
    const messageDate = getSafeDate(message.createdAt);
    const dayKey = getDayKey(messageDate);

    if (dayKey !== currentDayKey) {
      currentDayKey = dayKey;
      items.push({
        type: 'day',
        id: `day-${dayKey}-${message.id}`,
        label: formatDayLabel(messageDate),
      });
    }

    const previousItem = items[items.length - 1];
    if (
      previousItem?.type === 'group' &&
      previousItem.dayKey === dayKey &&
      previousItem.senderUserId === message.senderUserId
    ) {
      previousItem.messages.push(message);
      previousItem.lastCreatedAt = message.createdAt;
      return;
    }

    items.push({
      type: 'group',
      id: `group-${message.id}`,
      dayKey,
      senderUserId: message.senderUserId,
      senderLabel: getSenderLabel(message, currentUserId),
      isMine: message.senderUserId === currentUserId,
      messages: [message],
      createdAt: message.createdAt,
      lastCreatedAt: message.createdAt,
    });
  });

  return items;
}

export function ChatDrawer({ currentUserId, currentRole }: ChatDrawerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [conversationSearch, setConversationSearch] = useState('');
  const [offerProduct, setOfferProduct] = useState<QuoteProduct | null>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const [showOfferComposer, setShowOfferComposer] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerQty, setOfferQty] = useState('');
  const [offerNote, setOfferNote] = useState('');
  const [sending, setSending] = useState(false);
  const [counterTargetId, setCounterTargetId] = useState<string | null>(null);
  const [requestingPricing, setRequestingPricing] = useState(false);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterQty, setCounterQty] = useState('');
  const [counterNote, setCounterNote] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [pendingDeclines, setPendingDeclines] = useState<string[]>([]);
  const declineTimers = useRef(new Map<string, number>());
  const [mobileListMode, setMobileListMode] = useState(true);
  const [flashDrawer, setFlashDrawer] = useState(false);
  const [conversationContexts, setConversationContexts] = useState<
    Record<string, Array<{ label: string; value: string }>>
  >({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
  const [mobileTriggerHost, setMobileTriggerHost] =
    useState<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);
  const [desktop, setDesktop] = useState(false);
  const threadVisible =
    open && Boolean(activeConversationId) && (desktop || !mobileListMode);
  const activeIdRef = useRef(activeConversationId);
  const visibleRef = useRef(threadVisible);
  const messageRequestRef = useRef<AbortController | null>(null);
  const cursorRef = useRef<{ id: string; createdAt: string } | null>(null);
  const pendingReadsRef = useRef(
    new Map<string, { id: string; createdAt: string }>()
  );
  const acknowledgedReadsRef = useRef(
    new Map<string, { id: string; createdAt: string }>()
  );
  const sentMessagesRef = useRef(new Map<string, ConversationMessage[]>());
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const nearBottomRef = useRef(true);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendingRef = useRef(false);
  const actionRef = useRef(false);
  useEffect(() => {
    visibleRef.current = threadVisible;
  }, [threadVisible]);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const update = () =>
      setMobileTriggerHost(
        query.matches
          ? null
          : document.getElementById('portal-desktop-messages')
      );
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const update = () => setDesktop(query.matches);
    update();
    query.addEventListener('change', update);
    return () => {
      query.removeEventListener('change', update);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === activeConversationId
      ) || null,
    [conversations, activeConversationId]
  );

  const draftValue = useMemo(
    () => ({
      messageInput,
      offerPrice,
      offerQty,
      offerNote,
      offerProductId: offerProduct?.id || activeConversation?.productId || '',
    }),
    [
      messageInput,
      offerPrice,
      offerQty,
      offerNote,
      offerProduct?.id,
      activeConversation?.productId,
    ]
  );
  const latestDraftRef = useRef({
    conversationId: activeConversationId,
    value: draftValue,
  });
  useEffect(() => {
    latestDraftRef.current = {
      conversationId: activeConversationId,
      value: draftValue,
    };
  }, [activeConversationId, draftValue]);
  const messageDraft = useLocalDraft<MessageDraft>({
    key: `phenofarm:draft:message:${activeConversationId || ''}`,
    value: draftValue,
    enabled: open && Boolean(activeConversationId),
    autoRestore: false,
    onRestore: (value) => {
      if (!value || typeof value !== 'object') return;
      setMessageInput(
        typeof value.messageInput === 'string'
          ? value.messageInput.slice(0, 5000)
          : ''
      );
      setOfferPrice(
        typeof value.offerPrice === 'string'
          ? value.offerPrice.slice(0, 20)
          : ''
      );
      setOfferQty(
        typeof value.offerQty === 'string' ? value.offerQty.slice(0, 10) : ''
      );
      setOfferNote(
        typeof value.offerNote === 'string'
          ? value.offerNote.slice(0, 5000)
          : ''
      );
      setOfferProduct(
        value.offerProductId
          ? {
              id: value.offerProductId,
              name: '',
              price: null,
              unit: null,
              inventoryQty: 0,
            }
          : null
      );
    },
    shouldSave: (value) =>
      Boolean(
        value.messageInput.trim() ||
          value.offerPrice.trim() ||
          value.offerQty.trim() ||
          value.offerNote.trim()
      ),
  });
  const saveMessageDraftRef = useRef(messageDraft.saveDraft);
  useEffect(() => {
    saveMessageDraftRef.current = messageDraft.saveDraft;
  }, [messageDraft.saveDraft]);
  const saveMessageDraft = useCallback(() => saveMessageDraftRef.current(), []);
  const selectConversation = useCallback(
    (id: string, prefill?: string) => {
      if (activeIdRef.current !== id) {
        saveMessageDraft();
        messageRequestRef.current?.abort();
        cursorRef.current = null;
        activeIdRef.current = id;
        setMessages(sentMessagesRef.current.get(id) || []);
        setMessageInput(prefill?.slice(0, 5000) || '');
        setOfferPrice('');
        setOfferQty('');
        setOfferNote('');
        setOfferProduct(null);
        setCounterTargetId(null);
        setShowOfferComposer(false);
        setError('');
        nearBottomRef.current = true;
        setActiveConversationId(id);
      } else if (prefill) {
        setMessageInput((current) =>
          current.trim() ? current : prefill.slice(0, 5000)
        );
      }
      setMobileListMode(false);
      if (prefill) requestAnimationFrame(() => composerRef.current?.focus());
    },
    [saveMessageDraft]
  );

  const totalUnread = useMemo(
    () =>
      conversations.reduce(
        (sum, conversation) => sum + (conversation.unreadCount || 0),
        0
      ),
    [conversations]
  );

  const messageListItems = useMemo(
    () => groupMessagesBySender(messages, currentUserId),
    [messages, currentUserId]
  );

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
  }, []);

  const openDrawer = useCallback(() => {
    setOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    saveMessageDraft();
    visibleRef.current = false;
    messageRequestRef.current?.abort();
    setOpen(false);
  }, [saveMessageDraft]);

  useFocusTrap({
    active: open,
    containerRef: drawerRef,
    initialFocusRef: closeButtonRef,
    returnFocusRef: triggerButtonRef,
    onEscape: closeDrawer,
  });

  useBodyOverlay(open);

  const conversationsRequestRef = useRef<AbortController | null>(null);
  const hasConversationsRef = useRef(false);
  const fetchConversations = useCallback(async () => {
    if (document.hidden || conversationsRequestRef.current) return;
    const controller = new AbortController();
    conversationsRequestRef.current = controller;
    if (!hasConversationsRef.current) setLoadingConversations(true);
    try {
      const response = await fetch('/api/messages/conversations', {
        signal: controller.signal,
      });
      if (!response.ok)
        throw new Error('We could not load conversations. Please try again.');
      const data = await response.json();
      if (!controller.signal.aborted) {
        const loaded: ConversationSummary[] = Array.isArray(data.conversations)
          ? data.conversations
          : [];
        setConversations(loaded);
        if (!activeIdRef.current && loaded.length)
          selectConversation(
            (loaded.find((item) => item.unreadCount > 0) || loaded[0]).id
          );
        hasConversationsRef.current = true;
      }
    } catch (err) {
      if (!controller.signal.aborted)
        setError(
          err instanceof Error
            ? err.message
            : 'We could not load conversations. Please try again.'
        );
    } finally {
      if (conversationsRequestRef.current === controller)
        conversationsRequestRef.current = null;
      if (!controller.signal.aborted) setLoadingConversations(false);
    }
  }, [selectConversation]);

  const fetchMessages = useCallback(
    async (conversationId: string, withLoading = true) => {
      if (
        !visibleRef.current ||
        document.hidden ||
        activeIdRef.current !== conversationId
      )
        return;
      if (messageRequestRef.current) return;
      const controller = new AbortController();
      messageRequestRef.current = controller;
      if (withLoading && !cursorRef.current) setLoadingMessages(true);
      try {
        const cursor = cursorRef.current;
        const query = cursor
          ? `?${new URLSearchParams({ after: cursor.createdAt, afterId: cursor.id })}`
          : '';
        const response = await fetch(
          `/api/messages/conversations/${conversationId}/messages${query}`,
          { signal: controller.signal }
        );
        if (!response.ok)
          throw new Error('We could not load messages. Please try again.');
        const data = await response.json();
        if (
          controller.signal.aborted ||
          activeIdRef.current !== conversationId ||
          !visibleRef.current
        )
          return;
        const incoming: ConversationMessage[] = Array.isArray(data.messages)
          ? data.messages
          : [];
        const updates = new Map<
          string,
          Pick<ConversationMessage, 'offerStatus' | 'acceptedQuote'>
        >(
          (Array.isArray(data.offerUpdates) ? data.offerUpdates : []).map(
            (update: ConversationMessage) => [
              update.id,
              {
                offerStatus: update.offerStatus,
                acceptedQuote: update.acceptedQuote,
              },
            ]
          )
        );
        if (incoming.length || updates.size)
          setMessages((current) => {
            const byId = new Map(
              current.map((message) => [message.id, message])
            );
            incoming.forEach((message) => byId.set(message.id, message));
            return [...byId.values()]
              .map((message) =>
                updates.has(message.id)
                  ? { ...message, ...updates.get(message.id) }
                  : message
              )
              .sort(
                (a, b) =>
                  a.createdAt.localeCompare(b.createdAt) ||
                  a.id.localeCompare(b.id)
              )
              .slice(-1000);
          });
        const last = incoming.at(-1);
        if (last)
          cursorRef.current = { id: last.id, createdAt: last.createdAt };
        const lastIncoming = incoming
          .filter((message) => message.senderUserId !== currentUserId)
          .at(-1);
        const acknowledged = acknowledgedReadsRef.current.get(conversationId);
        if (
          lastIncoming &&
          (!acknowledged ||
            lastIncoming.createdAt > acknowledged.createdAt ||
            (lastIncoming.createdAt === acknowledged.createdAt &&
              lastIncoming.id > acknowledged.id))
        ) {
          pendingReadsRef.current.set(conversationId, {
            id: lastIncoming.id,
            createdAt: lastIncoming.createdAt,
          });
        }
        // Reading and fetching have separate cursors: a failed/aborted acknowledgement
        // is retried even when the next incremental fetch contains no new messages.
        const pendingRead = pendingReadsRef.current.get(conversationId);
        if (
          pendingRead &&
          visibleRef.current &&
          activeIdRef.current === conversationId &&
          !document.hidden
        ) {
          const readResponse = await fetch(
            `/api/messages/conversations/${conversationId}/read`,
            {
              method: 'POST',
              signal: controller.signal,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ throughMessageId: pendingRead.id }),
            }
          );
          if (readResponse.ok && !controller.signal.aborted) {
            const readResult = await readResponse.json().catch(() => ({}));
            if (controller.signal.aborted) return;
            acknowledgedReadsRef.current.delete(conversationId);
            acknowledgedReadsRef.current.set(conversationId, pendingRead);
            if (acknowledgedReadsRef.current.size > 100)
              acknowledgedReadsRef.current.delete(
                acknowledgedReadsRef.current.keys().next().value!
              );
            if (
              pendingReadsRef.current.get(conversationId)?.id === pendingRead.id
            )
              pendingReadsRef.current.delete(conversationId);
            const unreadCount =
              Number.isSafeInteger(readResult.unreadCount) &&
              readResult.unreadCount >= 0
                ? readResult.unreadCount
                : 0;
            setConversations((current) =>
              current.map((conversation) =>
                conversation.id === conversationId
                  ? { ...conversation, unreadCount }
                  : conversation
              )
            );
          }
        }
      } catch (err) {
        if (
          !controller.signal.aborted &&
          activeIdRef.current === conversationId
        )
          setError(
            err instanceof Error
              ? err.message
              : 'We could not load messages. Please try again.'
          );
      } finally {
        if (messageRequestRef.current === controller)
          messageRequestRef.current = null;
        if (
          !controller.signal.aborted &&
          activeIdRef.current === conversationId
        )
          setLoadingMessages(false);
      }
    },
    [currentUserId]
  );

  const openFromEvent = useCallback(
    (event: Event) => {
      const detail = (event as CustomEvent<OpenChatEventDetail>).detail || {};
      openDrawer();
      if (typeof detail.conversationId === 'string' && detail.conversationId) {
        selectConversation(
          detail.conversationId,
          typeof detail.draft === 'string' ? detail.draft : undefined
        );
        if (detail.quoteProductId)
          setOfferProduct({
            id: detail.quoteProductId,
            name: '',
            unit: 'unit',
            price: null,
            inventoryQty: 0,
          });
        if (Array.isArray(detail.context)) {
          const context = detail.context
            .filter(
              (chip) =>
                chip &&
                typeof chip.label === 'string' &&
                typeof chip.value === 'string'
            )
            .slice(0, 8)
            .map((chip) => ({
              label: chip.label.slice(0, 80),
              value: chip.value.slice(0, 500),
            }));
          setConversationContexts((prev) =>
            Object.fromEntries([
              ...Object.entries(prev)
                .filter(([id]) => id !== detail.conversationId)
                .slice(-19),
              [detail.conversationId!, context],
            ])
          );
        }
      }
      if (detail.flash) {
        setFlashDrawer(true);
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        flashTimerRef.current = setTimeout(() => setFlashDrawer(false), 1400);
      }
    },
    [openDrawer, selectConversation]
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (!params.has('messages')) return;
    openDrawer();
    const growerId = params.get('chatGrower');
    const productId = params.get('chatProduct');
    if (growerId && currentRole === 'DISPENSARY') {
      void fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ growerId, productId }),
      })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw Error(data.error);
          selectConversation(data.conversationId);
          void fetchConversations();
        })
        .catch((error) => setError(error.message));
    }
    params.delete('messages');
    params.delete('chatGrower');
    params.delete('chatProduct');
    history.replaceState(
      null,
      '',
      location.pathname + (params.size ? '?' + params : '') + location.hash
    );
  }, [openDrawer, selectConversation, fetchConversations, currentRole]);

  useEffect(() => {
    window.addEventListener('phenofarm-open-chat', openFromEvent);
    return () =>
      window.removeEventListener('phenofarm-open-chat', openFromEvent);
  }, [openFromEvent]);

  useEffect(() => {
    if (!open) return;
    void fetchConversations();
    const interval = window.setInterval(() => void fetchConversations(), 15000);
    const onVisible = () => {
      if (!document.hidden) void fetchConversations();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      conversationsRequestRef.current?.abort();
      conversationsRequestRef.current = null;
    };
  }, [open, fetchConversations]);

  useEffect(() => {
    if (!threadVisible || !activeConversationId) return;
    visibleRef.current = true;
    void fetchMessages(activeConversationId);
    const poll = () => void fetchMessages(activeConversationId, false);
    const interval = window.setInterval(poll, 12000);
    document.addEventListener('visibilitychange', poll);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', poll);
      messageRequestRef.current?.abort();
      messageRequestRef.current = null;
    };
  }, [threadVisible, activeConversationId, fetchMessages]);

  useEffect(() => {
    if (!threadVisible || !nearBottomRef.current) return;
    const frame = requestAnimationFrame(scrollToBottom);
    return () => cancelAnimationFrame(frame);
  }, [messages, threadVisible, scrollToBottom]);

  const appendSentMessage = useCallback(
    (conversationId: string, data: ConversationMessage) => {
      const message: ConversationMessage = {
        ...data,
        sender: {
          id: currentUserId,
          name: 'You',
          email: '',
          role: currentRole,
        },
        product: data.product || null,
        respondedToMessageId: null,
        acceptedQuote: null,
      };
      const cached = sentMessagesRef.current.get(conversationId) || [];
      sentMessagesRef.current.delete(conversationId);
      sentMessagesRef.current.set(
        conversationId,
        [...cached.filter((item) => item.id !== message.id), message].slice(-10)
      );
      if (sentMessagesRef.current.size > 20)
        sentMessagesRef.current.delete(
          sentMessagesRef.current.keys().next().value!
        );
      if (activeIdRef.current === conversationId) {
        nearBottomRef.current = true;
        setMessages((current) =>
          current.some((item) => item.id === message.id)
            ? current
            : [...current, message]
        );
        // Keep the polling cursor at the last server fetch so concurrent incoming messages are not skipped.
      }
      setConversations((current) =>
        current
          .map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  lastMessageAt: message.createdAt,
                  lastMessagePreview: message.body,
                }
              : conversation
          )
          .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
      );
    },
    [currentRole, currentUserId]
  );

  const clearSubmittedDraft = useCallback(
    (
      conversationId: string,
      submitted: MessageDraft,
      fields: Array<keyof MessageDraft>
    ) => {
      const matches = (value: MessageDraft) =>
        fields.every((field) => value[field] === submitted[field]);
      const current = latestDraftRef.current;
      if (activeIdRef.current === conversationId) {
        // A newer edit in the originating conversation owns its draft, even when
        // the older request completes after switching away and back.
        if (
          current.conversationId !== conversationId ||
          !matches(current.value)
        )
          return;
        if (fields.includes('messageInput'))
          setMessageInput((value) =>
            value === submitted.messageInput ? '' : value
          );
        if (fields.includes('offerPrice'))
          setOfferPrice((value) =>
            value === submitted.offerPrice ? '' : value
          );
        if (fields.includes('offerQty'))
          setOfferQty((value) => (value === submitted.offerQty ? '' : value));
        if (fields.includes('offerNote'))
          setOfferNote((value) => (value === submitted.offerNote ? '' : value));
        if (fields.includes('offerPrice')) setShowOfferComposer(false);
        if (fields.includes('offerProductId')) setOfferProduct(null);
      }
      const storageKey = `phenofarm:user:${encodeURIComponent(currentUserId)}:phenofarm:draft:message:${conversationId}`;
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) return;
        const stored = JSON.parse(raw);
        if (
          !stored?.value ||
          typeof stored.value !== 'object' ||
          !matches(stored.value)
        )
          return;
        const value = { ...stored.value };
        fields.forEach((field) => {
          value[field] = '';
        });
        if (
          Object.values(value).some(
            (entry) => typeof entry === 'string' && entry.trim()
          )
        ) {
          window.localStorage.setItem(
            storageKey,
            JSON.stringify({ value, savedAt: new Date().toISOString() })
          );
        } else window.localStorage.removeItem(storageKey);
      } catch {
        // Sending remains successful when browser storage is unavailable.
      }
    },
    [currentUserId]
  );

  const postMessage = useCallback(
    async (
      payload: Record<string, unknown>,
      draftFields: Array<keyof MessageDraft> = []
    ) => {
      if (!activeConversationId || sendingRef.current) return false;
      sendingRef.current = true;
      const submittedDraft = { ...draftValue };
      setSending(true);
      setError('');
      try {
        const response = await fetch(
          `/api/messages/conversations/${activeConversationId}/messages`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...payload,
              productId:
                payload.productId || activeConversation?.productId || undefined,
            }),
          }
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok)
          throw new Error(
            data.error || 'We could not send message. Please try again.'
          );
        appendSentMessage(activeConversationId, data);
        if (draftFields.length)
          clearSubmittedDraft(
            activeConversationId,
            submittedDraft,
            draftFields
          );
        return true;
      } catch (err) {
        if (activeIdRef.current === activeConversationId)
          setError(
            err instanceof Error
              ? err.message
              : 'We could not send message. Please try again.'
          );
        return false;
      } finally {
        sendingRef.current = false;
        setSending(false);
      }
    },
    [
      activeConversationId,
      activeConversation?.productId,
      appendSentMessage,
      clearSubmittedDraft,
      draftValue,
    ]
  );

  const sendMessage = useCallback(async () => {
    if (!messageInput.trim()) return;
    await postMessage({ messageType: 'TEXT', body: messageInput.trim() }, [
      'messageInput',
    ]);
  }, [messageInput, postMessage]);

  const sendOffer = useCallback(async () => {
    const productId = offerProduct?.id || activeConversation?.productId;
    if (!productId) {
      setError('Choose a product to quote.');
      return;
    }
    const unitPrice = Number(offerPrice.replace(/[$,]/g, '').trim());
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      setError('Enter a valid quote unit price.');
      return;
    }
    const quantity = offerQty.trim() ? Number(offerQty) : undefined;
    if (
      quantity !== undefined &&
      (!Number.isInteger(quantity) || quantity < 1 || quantity > 9999)
    ) {
      setError('Quote quantity must be a whole number between 1 and 9999.');
      return;
    }
    await postMessage(
      {
        productId,
        messageType: 'OFFER',
        body: offerNote.trim() || 'Quote terms',
        offer: { unitPrice, quantity, note: offerNote.trim() || undefined },
      },
      ['offerPrice', 'offerQty', 'offerNote', 'offerProductId']
    );
  }, [
    offerPrice,
    offerQty,
    offerNote,
    postMessage,
    offerProduct,
    activeConversation?.productId,
  ]);

  const sendPricingRequest = useCallback(async () => {
    if (sendingRef.current) return;
    setRequestingPricing(true);
    await postMessage({
      messageType: 'PRICING_REQUEST',
      body: 'Requesting pricing for this product. Please send quote terms.',
    });
    setRequestingPricing(false);
  }, [postMessage]);

  const offerAction = useCallback(
    async (messageId: string, payload: Record<string, unknown>) => {
      if (actionRef.current) return false;
      actionRef.current = true;
      setActionLoadingId(messageId);
      setError('');
      try {
        const response = await fetch(
          `/api/messages/messages/${messageId}/offer-action`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok)
          throw new Error(
            data.error || 'We could not update this quote. Please try again.'
          );
        if (
          activeConversationId &&
          activeIdRef.current === activeConversationId
        ) {
          const status =
            payload.action === 'ACCEPT'
              ? 'ACCEPTED'
              : payload.action === 'REJECT'
                ? 'REJECTED'
                : 'COUNTERED';
          setMessages((current) =>
            current.map((message) =>
              message.id === messageId
                ? { ...message, offerStatus: status }
                : message
            )
          );
          await fetchMessages(activeConversationId, false);
        }
        return data;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'We could not update this quote. Please try again.'
        );
        return false;
      } finally {
        actionRef.current = false;
        setActionLoadingId(null);
      }
    },
    [activeConversationId, fetchMessages]
  );
  const handleOfferAction = useCallback(
    (messageId: string, action: 'ACCEPT' | 'REJECT') => {
      if (action === 'REJECT') {
        if (declineTimers.current.has(messageId)) return Promise.resolve(false);
        setPendingDeclines((ids) => [...ids, messageId]);
        const decline = () => {
          if (actionRef.current) {
            declineTimers.current.set(
              messageId,
              window.setTimeout(decline, 250)
            );
            return;
          }
          declineTimers.current.delete(messageId);
          void offerAction(messageId, { action }).finally(() =>
            setPendingDeclines((ids) => ids.filter((id) => id !== messageId))
          );
        };
        declineTimers.current.set(messageId, window.setTimeout(decline, 8000));
        toast('Quote will be declined in 8 seconds.', {
          duration: 8000,
          action: {
            label: 'Undo',
            onClick: () => {
              clearTimeout(declineTimers.current.get(messageId));
              declineTimers.current.delete(messageId);
              setPendingDeclines((ids) => ids.filter((id) => id !== messageId));
              toast.success('Quote kept open');
            },
          },
        });
        return Promise.resolve(false);
      }
      return offerAction(messageId, { action });
    },
    [offerAction]
  );
  const submitCounterOffer = useCallback(
    async (messageId: string) => {
      const unitPrice = Number(counterPrice.replace(/[$,]/g, '').trim());
      const quantity = counterQty.trim() ? Number(counterQty) : undefined;
      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        setError('Enter a valid counter quote price.');
        return;
      }
      if (
        quantity !== undefined &&
        (!Number.isInteger(quantity) || quantity < 1 || quantity > 9999)
      ) {
        setError('Quote quantity must be a whole number between 1 and 9999.');
        return;
      }
      if (
        await offerAction(messageId, {
          action: 'COUNTER',
          counter: {
            unitPrice,
            quantity,
            note: counterNote.trim() || undefined,
          },
        })
      ) {
        setCounterTargetId(null);
        setCounterPrice('');
        setCounterQty('');
        setCounterNote('');
      }
    },
    [counterPrice, counterQty, counterNote, offerAction]
  );

  const renderOfferStatus = (status: ConversationMessage['offerStatus']) => {
    if (!status) return null;
    const base = 'px-2 py-0.5 rounded text-sm font-medium';
    if (status === 'PENDING')
      return (
        <span className={`${base} bg-pf-warning-bg text-pf-warning`}>
          Pending
        </span>
      );
    if (status === 'ACCEPTED')
      return (
        <span className={`${base} bg-pf-accent-bg text-pf-accent`}>
          Accepted
        </span>
      );
    if (status === 'REJECTED')
      return (
        <span className={`${base} bg-pf-danger-bg text-pf-danger`}>
          Declined
        </span>
      );
    if (status === 'COUNTERED')
      return (
        <span className={`${base} bg-pf-info-bg text-pf-info`}>Countered</span>
      );
    return (
      <span className={`${base} bg-pf-surface text-pf-secondary`}>
        {status}
      </span>
    );
  };

  const messageTemplates = useMemo(() => {
    const productName = activeConversation?.product?.name;
    const templates = MESSAGE_TEMPLATE_GROUPS[currentRole];

    return templates.map((template) => {
      if (!productName) return template;

      return {
        ...template,
        body: template.body
          .replace('this item', productName)
          .replace('this product', productName),
      };
    });
  }, [activeConversation?.product?.name, currentRole]);

  const contextChips = useMemo(() => {
    if (!activeConversationId) return [];

    const chips = [...(conversationContexts[activeConversationId] || [])];

    return chips.filter(
      (chip, index, list) =>
        list.findIndex(
          (candidate) =>
            candidate.label === chip.label && candidate.value === chip.value
        ) === index
    );
  }, [activeConversationId, conversationContexts]);

  const renderMessageContent = (
    message: ConversationMessage,
    isMine: boolean
  ) => {
    const isOffer = message.messageType === 'OFFER';
    const canRespondToOffer =
      isOffer &&
      !isMine &&
      message.offerStatus === 'PENDING' &&
      !pendingDeclines.includes(message.id);
    const isOfferActionLoading = actionLoadingId === message.id;

    const addAcceptedQuoteToDraft = async (quote = message.acceptedQuote) => {
      if (!activeConversation || !message.product || !message.offerUnitPrice)
        return;
      if (!quote || new Date(quote.expiresAt).getTime() <= Date.now()) {
        setError(
          'This quote has expired. Request a new quote before adding it.'
        );
        return;
      }
      try {
        const productResponse = await fetch(
          `/api/dispensary/products/${message.product.id}`
        );
        const productData = await productResponse.json().catch(() => null);
        if (!productResponse.ok) {
          setError(
            productData?.error || 'This product is no longer available.'
          );
          return;
        }
        const quantity = message.offerQuantity || 1;
        const cart = readCart();
        const existing = cart.items.find(
          (item) => item.id === message.product!.id
        );
        if (
          existing &&
          existing.acceptedQuoteId !== quote.id &&
          !(await askToLeave(
            `Replace the ${existing.quantity} ${existing.unit || 'units'} of ${existing.name} in your cart with this agreed quote?`,
            {
              title: 'Replace cart item?',
              confirmLabel: 'Use agreed quote',
              cancelLabel: 'Keep current item',
            }
          ))
        )
          return;
        const quoted: CartItem = {
          ...existing,
          id: message.product.id,
          name: message.product.name,
          price: message.offerUnitPrice,
          quantity,
          image: productData.product.images?.[0],
          maxQty: productData.product.inventoryQty,
          unit: message.product.unit || 'unit',
          growerId: activeConversation.growerId,
          grower: activeConversation.counterpart.name,
          acceptedQuoteId: quote.id,
          quotedQuantity: quantity,
          quotedUnitPrice: message.offerUnitPrice,
          listPrice:
            existing?.listPrice ?? existing?.price ?? message.offerUnitPrice,
        };
        const items = existing
          ? cart.items.map((item) => (item.id === quoted.id ? quoted : item))
          : [...cart.items, quoted];
        if (!writeCart({ items, ...calculateTotals(items) })) {
          setError('Your browser could not save the cart.');
          return;
        }
        setError('');
        closeDrawer();
        router.push('/dispensary/cart');
      } catch {
        setError(
          'Could not update your cart. Try again; your accepted quote is saved.'
        );
      }
    };

    if (isOffer) {
      return (
        <div className="space-y-2">
          <div
            className={`rounded-lg p-3 ${isMine ? 'border border-pf-accent-line bg-pf-accent-bg' : 'border border-pf-accent-line bg-pf-accent-bg'}`}
          >
            <div className="flex items-start justify-between gap-2">
              <p
                className={`text-sm font-semibold ${isMine ? 'text-white' : 'text-pf-accent'}`}
              >
                Quote{' '}
                {message.product?.name ? `for ${message.product.name}` : ''}
              </p>
              {pendingDeclines.includes(message.id) ? (
                <span className="text-sm text-pf-muted">Declining…</span>
              ) : (
                renderOfferStatus(message.offerStatus)
              )}
            </div>
            <p
              className={`mt-1 text-sm ${isMine ? 'text-pf-text' : 'text-pf-accent'}`}
            >
              {message.offerQuantity
                ? `${formatQuantity(message.offerQuantity, message.product?.unit || 'unit')} @ `
                : ''}
              <span className="font-bold">
                {message.offerUnitPrice !== null &&
                Number.isFinite(message.offerUnitPrice)
                  ? formatMoney(message.offerUnitPrice)
                  : 'Price unavailable'}
              </span>
            </p>
            {message.offerNote && (
              <p
                className={`mt-1 text-sm ${isMine ? 'text-pf-text' : 'text-pf-accent'}`}
              >
                {message.offerNote}
              </p>
            )}
          </div>

          {message.offerStatus === 'ACCEPTED' &&
            message.acceptedQuote &&
            !message.acceptedQuote.consumedByOrderId && (
              <div className="space-y-2">
                <p className="text-sm text-pf-accent">Quote accepted.</p>
                {currentRole === 'DISPENSARY' ? (
                  <button
                    type="button"
                    onClick={() => void addAcceptedQuoteToDraft()}
                    className="min-h-11 rounded-lg bg-emerald-500 px-3 text-sm font-semibold text-pf-canvas"
                  >
                    Add to cart
                  </button>
                ) : (
                  <Link
                    href={`/grower/orders/add?quote=${message.acceptedQuote.id}`}
                    onClick={closeDrawer}
                    className="inline-flex min-h-11 items-center rounded-lg bg-emerald-500 px-3 text-sm font-semibold text-pf-canvas"
                  >
                    Create order from quote
                  </Link>
                )}
              </div>
            )}

          {canRespondToOffer && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  const result = await handleOfferAction(message.id, 'ACCEPT');
                  if (result && currentRole === 'DISPENSARY')
                    await addAcceptedQuoteToDraft(result.acceptedQuote);
                }}
                disabled={isOfferActionLoading}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-sm font-semibold text-[#032116] hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-70"
              >
                {isOfferActionLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                {currentRole === 'DISPENSARY'
                  ? 'Accept & add to cart'
                  : 'Accept'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCounterTargetId((prev) =>
                    prev === message.id ? null : message.id
                  );
                  setCounterPrice(
                    message.offerUnitPrice ? String(message.offerUnitPrice) : ''
                  );
                  setCounterQty(
                    message.offerQuantity ? String(message.offerQuantity) : ''
                  );
                  setCounterNote('');
                }}
                disabled={isOfferActionLoading}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-pf-line-strong bg-pf-surface px-3 text-sm font-semibold text-pf-secondary hover:bg-pf-canvas disabled:cursor-wait disabled:opacity-60"
              >
                {isOfferActionLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Repeat2 className="h-3.5 w-3.5" />
                )}
                Suggest a price
              </button>
              <button
                type="button"
                onClick={() => handleOfferAction(message.id, 'REJECT')}
                disabled={isOfferActionLoading}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-pf-danger hover:bg-pf-danger-bg hover:text-pf-danger disabled:cursor-wait disabled:opacity-60"
              >
                {isOfferActionLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                Decline
              </button>
            </div>
          )}

          {counterTargetId === message.id && (
            <div className="mt-2 space-y-2 rounded-lg border border-pf-line bg-pf-surface p-2">
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1 text-sm text-pf-secondary">
                  <span>Unit price ($)</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={counterPrice}
                    onChange={(e) => setCounterPrice(e.target.value)}
                    placeholder="Quote unit price"
                    disabled={isOfferActionLoading}
                    className="w-full rounded border border-pf-line-strong px-2 py-1 text-sm disabled:cursor-not-allowed disabled:bg-pf-canvas"
                  />
                </label>
                <label className="space-y-1 text-sm text-pf-secondary">
                  <span>Quantity (optional)</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    min="1"
                    value={counterQty}
                    onChange={(e) => setCounterQty(e.target.value)}
                    placeholder="Qty (optional)"
                    disabled={isOfferActionLoading}
                    className="w-full rounded border border-pf-line-strong px-2 py-1 text-sm disabled:cursor-not-allowed disabled:bg-pf-canvas"
                  />
                </label>
              </div>
              <label className="block space-y-1 text-sm text-pf-secondary">
                <span>Notes for your offer (optional)</span>
                <input
                  type="text"
                  value={counterNote}
                  onChange={(e) => setCounterNote(e.target.value)}
                  placeholder="Notes for your offer (optional)"
                  disabled={isOfferActionLoading}
                  className="w-full rounded border border-pf-line-strong px-2 py-1 text-sm disabled:cursor-not-allowed disabled:bg-pf-canvas"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCounterTargetId(null)}
                  disabled={isOfferActionLoading}
                  className="rounded border border-pf-line-strong px-2 py-1 text-sm text-pf-muted disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => submitCounterOffer(message.id)}
                  disabled={isOfferActionLoading}
                  className="inline-flex items-center gap-1.5 rounded bg-emerald-500 px-2 py-1 text-sm font-semibold text-[#032116] hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-60"
                  data-testid="send-counter"
                >
                  {isOfferActionLoading && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  Send counteroffer
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (message.messageType === 'PRICING_REQUEST') {
      return (
        <div
          className={`rounded-lg p-3 border border-pf-purple-line bg-pf-purple-bg`}
        >
          <div className="flex items-center gap-2">
            <BadgeDollarSign
              className={`h-4 w-4 ${isMine ? 'text-pf-purple' : 'text-pf-purple'}`}
            />
            <p
              className={`text-sm font-semibold ${isMine ? 'text-white' : 'text-pf-purple'}`}
            >
              Price request
            </p>
          </div>
          <p
            className={`mt-1 text-sm ${isMine ? 'text-pf-purple' : 'text-pf-purple'}`}
          >
            {message.body}
          </p>
          {message.product?.name && (
            <p
              className={`mt-1 text-sm ${isMine ? 'text-pf-purple' : 'text-pf-purple'}`}
            >
              For: {message.product.name}
            </p>
          )}
        </div>
      );
    }

    return <p className="whitespace-pre-wrap text-sm">{message.body}</p>;
  };

  const trigger = (
    <button
      ref={triggerButtonRef}
      type="button"
      onClick={openDrawer}
      className="pf-portal-fab-trigger pf-portal-chat-trigger relative z-[70] flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-[#032116] shadow-lg transition-[opacity,background-color] duration-150 hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 ring-offset-pf-canvas"
      aria-label="Open messages"
      title="Open messages"
      data-testid="chat-button"
    >
      <MessageCircle className="w-5 h-5" />
      {totalUnread > 0 && (
        <span
          data-testid="unread-badge"
          className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-sm font-bold flex items-center justify-center"
        >
          {totalUnread > 99 ? '99+' : totalUnread}
        </span>
      )}
    </button>
  );

  return (
    <>
      {mobileTriggerHost ? createPortal(trigger, mobileTriggerHost) : null}
      {open
        ? createPortal(
            <div className="fixed inset-0 z-[80]">
              <button
                className="absolute inset-0 bg-black/40"
                onClick={closeDrawer}
                aria-label="Close messages overlay"
              />
              <aside
                ref={drawerRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="messages-drawer-title"
                className={`absolute right-0 top-0 h-full w-full sm:w-[420px] lg:w-[760px] bg-pf-surface shadow-2xl border-l border-pf-line flex transition-shadow ${
                  flashDrawer ? 'ring-4 ring-pf-accent-line ring-inset' : ''
                }`}
              >
                <div
                  className={`w-full lg:w-[300px] border-r border-pf-line flex flex-col ${!mobileListMode && 'hidden lg:flex'}`}
                >
                  <div className="px-3 py-1 sm:px-4 sm:py-3 border-b border-pf-line flex items-center justify-between">
                    <h2
                      id="messages-drawer-title"
                      className="font-semibold text-pf-text"
                    >
                      Messages
                    </h2>
                    <button
                      ref={closeButtonRef}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-pf-muted hover:text-pf-secondary"
                      onClick={closeDrawer}
                      data-testid="close-chat"
                      aria-label="Close messages"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <ConversationStart
                    role={currentRole}
                    onStarted={(id) => {
                      selectConversation(id);
                      void fetchConversations();
                    }}
                  />
                  <label className="px-3 py-2">
                    <span className="sr-only">Search conversations</span>
                    <input
                      type="search"
                      value={conversationSearch}
                      onChange={(e) => setConversationSearch(e.target.value)}
                      placeholder="Search messages"
                      className="w-full rounded-lg border px-3 py-2 text-base"
                    />
                  </label>
                  <div className="flex-1 overflow-y-auto">
                    {loadingConversations ? (
                      <div className="p-4 text-sm text-pf-muted flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading...
                      </div>
                    ) : conversations.length === 0 ? (
                      <div className="p-4 text-sm text-pf-muted">
                        <p className="font-medium text-pf-text">
                          No conversations yet
                        </p>
                        <p className="mt-1">
                          {currentRole === 'GROWER'
                            ? 'Choose New message to contact a dispensary.'
                            : 'Choose New message or message a grower from a product.'}
                        </p>
                      </div>
                    ) : (
                      conversations
                        .filter((conversation) =>
                          `${conversation.counterpart.name} ${conversation.product?.name || ''} ${conversation.lastMessagePreview}`
                            .toLowerCase()
                            .includes(conversationSearch.toLowerCase())
                        )
                        .map((conversation) => (
                          <button
                            key={conversation.id}
                            onClick={() => {
                              selectConversation(conversation.id);
                            }}
                            className={`w-full text-left px-4 py-3 border-b border-pf-line hover:bg-pf-canvas ${
                              conversation.id === activeConversationId
                                ? 'bg-pf-accent-bg'
                                : ''
                            }`}
                            data-testid="conversation-item"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-medium text-sm text-pf-text truncate">
                                  {conversation.counterpart.name}
                                </p>
                                {conversation.product?.name && (
                                  <p className="text-sm text-pf-muted break-words">
                                    {conversation.product.name}
                                  </p>
                                )}

                                <p className="text-sm text-pf-muted truncate mt-1">
                                  {conversation.lastMessagePreview}
                                </p>
                              </div>
                              {conversation.unreadCount > 0 && (
                                <span
                                  data-testid="conversation-unread-badge"
                                  className="min-w-[18px] h-[18px] px-1 rounded-full bg-pf-accent-bg text-pf-accent text-sm flex items-center justify-center"
                                >
                                  {conversation.unreadCount}
                                </span>
                              )}
                            </div>
                          </button>
                        ))
                    )}
                  </div>
                </div>

                <div
                  className={`min-w-0 flex-1 flex-col ${mobileListMode ? 'hidden lg:flex' : 'flex'}`}
                >
                  <div className="px-3 py-1 sm:px-4 sm:py-3 border-b border-pf-line flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        aria-label="Back to conversations"
                        onClick={() => {
                          saveMessageDraft();
                          visibleRef.current = false;
                          setMobileListMode(true);
                        }}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-pf-muted hover:text-pf-secondary lg:hidden"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-pf-text break-words">
                          {activeConversation?.counterpart.name ||
                            'Select a conversation'}
                        </p>
                        {activeConversation && (
                          <div className="flex flex-wrap gap-2 text-sm">
                            <Link
                              onClick={closeDrawer}
                              className="inline-flex min-h-11 items-center text-pf-accent underline"
                              href={
                                currentRole === 'DISPENSARY'
                                  ? `/dispensary/grower/${activeConversation.growerId}`
                                  : `/grower/customers/${activeConversation.dispensaryId}`
                              }
                            >
                              {currentRole === 'DISPENSARY'
                                ? 'View shop'
                                : 'View customer'}
                            </Link>
                            {activeConversation.productId && (
                              <Link
                                onClick={closeDrawer}
                                className="inline-flex min-h-11 items-center text-pf-accent underline"
                                href={
                                  currentRole === 'DISPENSARY'
                                    ? `/dispensary/catalog?product=${activeConversation.productId}`
                                    : `/grower/products/${activeConversation.productId}/preview`
                                }
                              >
                                View product
                              </Link>
                            )}
                          </div>
                        )}
                        {activeConversation && (
                          <p className="text-sm text-pf-muted break-words">
                            {activeConversation.product?.name || ''}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-pf-muted hover:text-pf-secondary lg:hidden"
                      onClick={closeDrawer}
                      data-testid="close-chat-mobile"
                      aria-label="Close messages"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {contextChips.length > 0 && (
                    <div className="border-b border-pf-line bg-pf-canvas/80 px-4 py-2">
                      <div className="flex flex-wrap gap-2">
                        {contextChips.map((chip) => (
                          <span
                            key={`${chip.label}-${chip.value}`}
                            className="inline-flex max-w-full items-center overflow-hidden rounded-full border border-pf-line bg-pf-surface text-sm shadow-sm"
                          >
                            <span className="shrink-0 border-r border-pf-line bg-pf-canvas px-2 py-1 font-semibold uppercase tracking-wide text-pf-muted">
                              {chip.label}
                            </span>
                            <span className="truncate px-2 py-1 font-medium text-pf-secondary">
                              {chip.value}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div
                    ref={scrollContainerRef}
                    onScroll={() => {
                      const node = scrollContainerRef.current;
                      if (node)
                        nearBottomRef.current =
                          node.scrollHeight -
                            node.scrollTop -
                            node.clientHeight <
                          100;
                    }}
                    className="min-w-0 flex-1 space-y-4 overflow-y-auto bg-pf-canvas p-4 pr-5"
                  >
                    {loadingMessages ? (
                      <div className="text-sm text-pf-muted flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading messages...
                      </div>
                    ) : !activeConversationId ? (
                      <div className="rounded-lg border border-dashed border-pf-line-strong bg-pf-surface p-4 text-sm text-pf-muted">
                        <p className="font-medium text-pf-text">
                          Choose a conversation
                        </p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-pf-line-strong bg-pf-surface p-4 text-sm text-pf-muted">
                        <p className="font-medium text-pf-text">
                          No messages yet
                        </p>
                        <p className="mt-1">
                          Write a message to start this conversation.
                        </p>
                      </div>
                    ) : (
                      messageListItems.map((item) => {
                        if (item.type === 'day') {
                          return (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 py-1"
                            >
                              <div className="h-px flex-1 bg-pf-raised" />
                              <span className="rounded-full bg-pf-surface px-3 py-1 text-sm font-semibold uppercase tracking-wide text-pf-muted shadow-sm ring-1 ring-pf-line">
                                {item.label}
                              </span>
                              <div className="h-px flex-1 bg-pf-raised" />
                            </div>
                          );
                        }

                        return (
                          <div
                            key={item.id}
                            className={`flex min-w-0 ${item.isMine ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`flex min-w-0 max-w-[85%] flex-col gap-1.5 ${item.isMine ? 'items-end' : 'items-start'}`}
                            >
                              <p
                                className={`px-1 text-sm ${item.isMine ? 'text-pf-accent' : 'text-pf-muted'}`}
                              >
                                {item.senderLabel} •{' '}
                                {formatMessageTime(item.createdAt)}
                                {item.lastCreatedAt !== item.createdAt
                                  ? ` - ${formatMessageTime(item.lastCreatedAt)}`
                                  : ''}
                              </p>
                              {item.messages.map((message) => {
                                const testId =
                                  message.messageType === 'OFFER'
                                    ? 'offer-message'
                                    : message.messageType === 'PRICING_REQUEST'
                                      ? 'pricing-request-message'
                                      : 'message-bubble';

                                return (
                                  <div
                                    key={message.id}
                                    data-testid={testId}
                                    className={`max-w-full break-words rounded-2xl px-3 py-2 ${
                                      item.isMine
                                        ? 'rounded-br-md border border-pf-accent-line bg-pf-accent-bg text-pf-text'
                                        : 'rounded-bl-md border border-pf-line bg-pf-surface text-pf-text'
                                    }`}
                                  >
                                    {renderMessageContent(message, item.isMine)}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {activeConversationId && (
                    <div className="min-w-0 space-y-2 border-t border-pf-line bg-pf-surface p-3">
                      {error && (
                        <p role="alert" className="text-sm text-pf-danger">
                          {error}
                        </p>
                      )}

                      {requestingPricing && (
                        <p role="status" className="text-sm text-pf-purple">
                          Requesting pricing...
                        </p>
                      )}
                      {messageDraft.availableDraft && (
                        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                          <span>Unsent draft available.</span>
                          <button
                            type="button"
                            className="min-h-11 px-2 text-pf-accent underline"
                            onClick={messageDraft.restoreDraft}
                          >
                            Restore draft
                          </button>
                          <button
                            type="button"
                            className="min-h-11 px-2 text-pf-muted underline"
                            onClick={messageDraft.clearDraft}
                          >
                            Discard
                          </button>
                        </div>
                      )}
                      {showOfferComposer ? (
                        <div className="space-y-3 rounded-lg border border-pf-info-line bg-pf-info-bg p-3">
                          <h3 className="font-semibold text-sm">
                            {currentRole === 'GROWER'
                              ? 'Send quote'
                              : 'Make an offer'}
                          </h3>
                          <QuoteProductPicker
                            conversationId={activeConversationId}
                            value={
                              offerProduct?.id ||
                              activeConversation?.productId ||
                              ''
                            }
                            onChange={(product) => {
                              setOfferProduct(product);
                              if (product.price !== null)
                                setOfferPrice(String(product.price));
                            }}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <label className="text-sm">
                              Unit price
                              <input
                                type="text"
                                inputMode="decimal"
                                value={offerPrice}
                                onChange={(e) => setOfferPrice(e.target.value)}
                                className="mt-1 w-full rounded-lg border px-2 py-2 text-base"
                              />
                            </label>
                            <label className="text-sm">
                              Quantity (optional)
                              <input
                                type="text"
                                inputMode="numeric"
                                value={offerQty}
                                onChange={(e) => setOfferQty(e.target.value)}
                                className="mt-1 w-full rounded-lg border px-2 py-2 text-base"
                              />
                            </label>
                          </div>
                          <label className="block text-sm">
                            Note (optional)
                            <textarea
                              rows={2}
                              value={offerNote}
                              onChange={(e) => setOfferNote(e.target.value)}
                              className="mt-1 w-full rounded-lg border px-2 py-2 text-base"
                            />
                          </label>
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setShowOfferComposer(false)}
                              className="min-h-10 rounded border border-pf-line-strong px-3 text-sm"
                            >
                              Cancel
                            </button>
                            {
                              <button
                                type="button"
                                onClick={sendOffer}
                                disabled={sending}
                                className="min-h-10 rounded bg-emerald-500 px-3 text-sm font-semibold text-[#032116] hover:bg-emerald-400 disabled:opacity-60"
                                data-testid="send-offer"
                              >
                                {sending ? 'Sending...' : 'Send quote'}
                              </button>
                            }
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-end gap-2">
                            <textarea
                              ref={composerRef}
                              rows={1}
                              maxLength={5000}
                              aria-label="Message"
                              value={messageInput}
                              onChange={(e) => setMessageInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  sendMessage();
                                }
                              }}
                              placeholder="Type a message..."
                              disabled={sending}
                              className="min-h-[44px] max-h-28 min-w-0 flex-1 resize-y rounded-lg border border-pf-line-strong px-3 py-2 text-base sm:text-sm"
                            />
                            <button
                              type="button"
                              onClick={sendMessage}
                              disabled={sending || !messageInput.trim()}
                              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-[#032116] hover:bg-emerald-400 disabled:opacity-50"
                              aria-label="Send message"
                            >
                              {sending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          <div className="flex flex-wrap items-start gap-2">
                            <select
                              aria-label="Message templates"
                              value=""
                              onChange={(event) => {
                                const template =
                                  messageTemplates[Number(event.target.value)];
                                if (template)
                                  setMessageInput((current) =>
                                    current.trim()
                                      ? `${current}\n${template.body}`
                                      : template.body
                                  );
                              }}
                              className="min-h-10 max-w-[55%] rounded-lg border border-pf-line-strong bg-pf-surface px-2 text-base sm:text-sm"
                            >
                              <option value="" disabled>
                                Templates
                              </option>
                              {messageTemplates.map((template, index) => (
                                <option key={template.label} value={index}>
                                  {template.label
                                    .replace('Quote follow-up', 'Follow up')
                                    .replace('Delivery timing', 'Delivery')
                                    .replace('Order terms', 'Terms')}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => setShowOfferComposer(true)}
                              className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-emerald-500 px-3 text-sm font-semibold text-pf-canvas"
                              data-testid="toggle-offer-composer"
                            >
                              <BadgeDollarSign className="h-4 w-4" />
                              {currentRole === 'GROWER'
                                ? 'Send quote'
                                : 'Make an offer'}
                            </button>
                            {currentRole === 'DISPENSARY' && (
                              <button
                                type="button"
                                onClick={sendPricingRequest}
                                disabled={requestingPricing}
                                className="min-h-11 rounded-lg border border-pf-line-strong px-3 text-sm"
                                data-testid="request-pricing"
                              >
                                Ask for a price
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </aside>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
