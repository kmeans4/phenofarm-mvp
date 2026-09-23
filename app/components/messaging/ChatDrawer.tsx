'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, X, Send, BadgeDollarSign, Check, XCircle, Repeat2, Loader2, ArrowLeft } from 'lucide-react';
import { useFocusTrap } from '@/app/hooks/useFocusTrap';
import { useBodyOverlay } from '@/app/hooks/useBodyOverlay';
import { DraftAutosaveStatus } from '@/app/components/ux/DraftAutosaveStatus';
import { useLocalDraft } from '@/app/hooks/useLocalDraft';
import { readCart, writeCart, calculateTotals, type CartItem } from '@/lib/cart';
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
  sender: { id: string; name: string | null; email: string; role: 'GROWER' | 'DISPENSARY' } | null;
  messageType: 'TEXT' | 'PRICING_REQUEST' | 'OFFER' | 'SYSTEM';
  body: string;
  productId: string | null;
  product: { id: string; name: string; unit: string | null } | null;
  offerQuantity: number | null;
  offerUnitPrice: number | null;
  offerNote: string | null;
  offerStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED' | 'EXPIRED' | null;
  respondedToMessageId: string | null;
  acceptedQuote: { id: string; acceptedAt: string; expiresAt: string; consumedByOrderId: string | null } | null;
  createdAt: string;
};

type OpenChatEventDetail = {
  conversationId?: string;
  context?: Array<{ label: string; value: string }>;
  /** Prefill the composer without sending — the user reviews and sends. */
  draft?: string;
  /** Briefly highlight the drawer when another surface sends users here. */
  flash?: boolean;
};

interface MessageDraft {
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

  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  if (date.getFullYear() !== today.getFullYear()) {
    options.year = 'numeric';
  }

  return date.toLocaleDateString(undefined, options);
}

function formatMessageTime(value: string) {
  return getSafeDate(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function getSenderLabel(message: ConversationMessage, currentUserId: string) {
  if (message.senderUserId === currentUserId) return 'You';
  return message.sender?.name || message.sender?.email || 'User';
}

function groupMessagesBySender(messages: ConversationMessage[], currentUserId: string): MessageListItem[] {
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

function getConversationPurpose(conversation: ConversationSummary, currentRole: 'GROWER' | 'DISPENSARY') {
  const preview = conversation.lastMessagePreview.toLowerCase();

  if (conversation.product?.name) {
    return currentRole === 'GROWER' ? 'Buyer product conversation' : 'Grower product conversation';
  }

  if (preview.includes('pricing') || preview.includes('quote') || preview.includes('offer')) return 'Quote follow-up';
  if (preview.includes('cancel')) return 'Cancellation follow-up';
  if (preview.includes('order') || preview.includes('ship')) return 'Order follow-up';
  return 'General conversation';
}

export function ChatDrawer({ currentUserId, currentRole }: ChatDrawerProps) {
  const [open, setOpen] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
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
  const [mobileListMode, setMobileListMode] = useState(true);
  const [flashDrawer, setFlashDrawer] = useState(false);
  const [conversationContexts, setConversationContexts] = useState<Record<string, Array<{ label: string; value: string }>>>({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
  const [mobileTriggerHost, setMobileTriggerHost] = useState<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);
  const [desktop, setDesktop] = useState(false);
  const threadVisible = open && Boolean(activeConversationId) && (desktop || !mobileListMode);
  const activeIdRef = useRef(activeConversationId);
  const visibleRef = useRef(threadVisible);
  const messageRequestRef = useRef<AbortController | null>(null);
  const cursorRef = useRef<{ id: string; createdAt: string } | null>(null);
  const pendingReadsRef = useRef(new Map<string, { id: string; createdAt: string }>());
  const acknowledgedReadsRef = useRef(new Map<string, { id: string; createdAt: string }>());
  const sentMessagesRef = useRef(new Map<string, ConversationMessage[]>());
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const nearBottomRef = useRef(true);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendingRef = useRef(false);
  const actionRef = useRef(false);
  useEffect(() => { visibleRef.current = threadVisible; }, [threadVisible]);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const update = () => setMobileTriggerHost(query.matches ? document.getElementById('portal-mobile-messages') : null);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const update = () => setDesktop(query.matches);
    update(); query.addEventListener('change', update);
    return () => { query.removeEventListener('change', update); if (flashTimerRef.current) clearTimeout(flashTimerRef.current); };
  }, []);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );

  const draftValue = useMemo(() => ({ messageInput, offerPrice, offerQty, offerNote }), [messageInput, offerPrice, offerQty, offerNote]);
  const latestDraftRef = useRef({ conversationId: activeConversationId, value: draftValue });
  useEffect(() => { latestDraftRef.current = { conversationId: activeConversationId, value: draftValue }; }, [activeConversationId, draftValue]);
  const messageDraft = useLocalDraft<MessageDraft>({
    key: `phenofarm:draft:message:${activeConversationId || ''}`,
    value: draftValue,
    enabled: open && Boolean(activeConversationId),
    onRestore: (value) => {
      if (!value || typeof value !== 'object') return;
      setMessageInput(typeof value.messageInput === 'string' ? value.messageInput.slice(0, 5000) : '');
      setOfferPrice(typeof value.offerPrice === 'string' ? value.offerPrice.slice(0, 20) : '');
      setOfferQty(typeof value.offerQty === 'string' ? value.offerQty.slice(0, 10) : '');
      setOfferNote(typeof value.offerNote === 'string' ? value.offerNote.slice(0, 5000) : '');
    },
    shouldSave: (value) =>
      Boolean(
        value.messageInput.trim() ||
        value.offerPrice.trim() ||
        value.offerQty.trim() ||
        value.offerNote.trim()
      ),
  });
  const saveMessageDraft = messageDraft.saveDraft;
  const selectConversation = useCallback((id: string, prefill?: string) => {
    if (activeIdRef.current !== id) {
      saveMessageDraft();
      messageRequestRef.current?.abort();
      cursorRef.current = null;
      activeIdRef.current = id;
      setMessages(sentMessagesRef.current.get(id) || []);
      setMessageInput(prefill?.slice(0, 5000) || '');
      setOfferPrice(''); setOfferQty(''); setOfferNote('');
      setCounterTargetId(null); setShowOfferComposer(false); setError('');
      nearBottomRef.current = true;
      setActiveConversationId(id);
    } else if (prefill) {
      setMessageInput(current => current.trim() ? current : prefill.slice(0, 5000));
    }
    setMobileListMode(false);
  }, [saveMessageDraft]);

  const totalUnread = useMemo(
    () => conversations.reduce((sum, conversation) => sum + (conversation.unreadCount || 0), 0),
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
      const response = await fetch('/api/messages/conversations', { signal: controller.signal });
      if (!response.ok) throw new Error('Failed to load conversations');
      const data = await response.json();
      if (!controller.signal.aborted) {
        setConversations(Array.isArray(data.conversations) ? data.conversations : []);
        hasConversationsRef.current = true;
      }
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      if (conversationsRequestRef.current === controller) conversationsRequestRef.current = null;
      if (!controller.signal.aborted) setLoadingConversations(false);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId: string, withLoading = true) => {
    if (!visibleRef.current || document.hidden || activeIdRef.current !== conversationId) return;
    if (messageRequestRef.current) return;
    const controller = new AbortController();
    messageRequestRef.current = controller;
    if (withLoading && !cursorRef.current) setLoadingMessages(true);
    try {
      const cursor = cursorRef.current;
      const query = cursor ? `?${new URLSearchParams({ after: cursor.createdAt, afterId: cursor.id })}` : '';
      const response = await fetch(`/api/messages/conversations/${conversationId}/messages${query}`, { signal: controller.signal });
      if (!response.ok) throw new Error('Failed to load messages');
      const data = await response.json();
      if (controller.signal.aborted || activeIdRef.current !== conversationId || !visibleRef.current) return;
      const incoming: ConversationMessage[] = Array.isArray(data.messages) ? data.messages : [];
      const updates = new Map<string, Pick<ConversationMessage, 'offerStatus' | 'acceptedQuote'>>(
        (Array.isArray(data.offerUpdates) ? data.offerUpdates : []).map((update: ConversationMessage) => [update.id, { offerStatus: update.offerStatus, acceptedQuote: update.acceptedQuote }])
      );
      if (incoming.length || updates.size) setMessages(current => {
        const byId = new Map(current.map(message => [message.id, message]));
        incoming.forEach(message => byId.set(message.id, message));
        return [...byId.values()].map(message => updates.has(message.id) ? { ...message, ...updates.get(message.id) } : message)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)).slice(-1000);
      });
      const last = incoming.at(-1);
      if (last) cursorRef.current = { id: last.id, createdAt: last.createdAt };
      const lastIncoming = incoming.filter(message => message.senderUserId !== currentUserId).at(-1);
      const acknowledged = acknowledgedReadsRef.current.get(conversationId);
      if (lastIncoming && (!acknowledged || lastIncoming.createdAt > acknowledged.createdAt || (lastIncoming.createdAt === acknowledged.createdAt && lastIncoming.id > acknowledged.id))) {
        pendingReadsRef.current.set(conversationId, { id: lastIncoming.id, createdAt: lastIncoming.createdAt });
      }
      // Reading and fetching have separate cursors: a failed/aborted acknowledgement
      // is retried even when the next incremental fetch contains no new messages.
      const pendingRead = pendingReadsRef.current.get(conversationId);
      if (pendingRead && visibleRef.current && activeIdRef.current === conversationId && !document.hidden) {
        const readResponse = await fetch(`/api/messages/conversations/${conversationId}/read`, {
          method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ throughMessageId: pendingRead.id }),
        });
        if (readResponse.ok && !controller.signal.aborted) {
          const readResult = await readResponse.json().catch(() => ({}));
          if (controller.signal.aborted) return;
          acknowledgedReadsRef.current.delete(conversationId);
          acknowledgedReadsRef.current.set(conversationId, pendingRead);
          if (acknowledgedReadsRef.current.size > 100) acknowledgedReadsRef.current.delete(acknowledgedReadsRef.current.keys().next().value!);
          if (pendingReadsRef.current.get(conversationId)?.id === pendingRead.id) pendingReadsRef.current.delete(conversationId);
          const unreadCount = Number.isSafeInteger(readResult.unreadCount) && readResult.unreadCount >= 0 ? readResult.unreadCount : 0;
          setConversations(current => current.map(conversation => conversation.id === conversationId ? { ...conversation, unreadCount } : conversation));
        }
      }

    } catch (err) {
      if (!controller.signal.aborted && activeIdRef.current === conversationId) setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      if (messageRequestRef.current === controller) messageRequestRef.current = null;
      if (!controller.signal.aborted && activeIdRef.current === conversationId) setLoadingMessages(false);
    }
  }, [currentUserId]);

  const openFromEvent = useCallback((event: Event) => {
    const detail = (event as CustomEvent<OpenChatEventDetail>).detail || {};
    openDrawer();
    if (typeof detail.conversationId === 'string' && detail.conversationId) {
      selectConversation(detail.conversationId, typeof detail.draft === 'string' ? detail.draft : undefined);
      if (Array.isArray(detail.context)) {
        const context = detail.context.filter(chip => chip && typeof chip.label === 'string' && typeof chip.value === 'string')
          .slice(0, 8).map(chip => ({ label: chip.label.slice(0, 80), value: chip.value.slice(0, 500) }));
        setConversationContexts(prev => Object.fromEntries([...Object.entries(prev).filter(([id]) => id !== detail.conversationId).slice(-19), [detail.conversationId!, context]]));
      }
    }
    if (detail.flash) {
      setFlashDrawer(true);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setFlashDrawer(false), 1400);
    }
  }, [openDrawer, selectConversation]);

  useEffect(() => {
    window.addEventListener('phenofarm-open-chat', openFromEvent);
    return () => window.removeEventListener('phenofarm-open-chat', openFromEvent);
  }, [openFromEvent]);

  useEffect(() => {
    if (!open) return;
    void fetchConversations();
    const interval = window.setInterval(() => void fetchConversations(), 15000);
    const onVisible = () => { if (!document.hidden) void fetchConversations(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); conversationsRequestRef.current?.abort(); conversationsRequestRef.current = null; };
  }, [open, fetchConversations]);

  useEffect(() => {
    if (!threadVisible || !activeConversationId) return;
    visibleRef.current = true;
    void fetchMessages(activeConversationId);
    const poll = () => void fetchMessages(activeConversationId, false);
    const interval = window.setInterval(poll, 12000);
    document.addEventListener('visibilitychange', poll);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', poll); messageRequestRef.current?.abort(); messageRequestRef.current = null; };
  }, [threadVisible, activeConversationId, fetchMessages]);

  useEffect(() => {
    if (!threadVisible || !nearBottomRef.current) return;
    const frame = requestAnimationFrame(scrollToBottom);
    return () => cancelAnimationFrame(frame);
  }, [messages, threadVisible, scrollToBottom]);

  const appendSentMessage = useCallback((conversationId: string, data: ConversationMessage) => {
    const message: ConversationMessage = { ...data, sender: { id: currentUserId, name: 'You', email: '', role: currentRole },
      product: activeConversation?.product || null, respondedToMessageId: null, acceptedQuote: null };
    const cached = sentMessagesRef.current.get(conversationId) || [];
    sentMessagesRef.current.delete(conversationId);
    sentMessagesRef.current.set(conversationId, [...cached.filter(item => item.id !== message.id), message].slice(-10));
    if (sentMessagesRef.current.size > 20) sentMessagesRef.current.delete(sentMessagesRef.current.keys().next().value!);
    if (activeIdRef.current === conversationId) {
      nearBottomRef.current = true;
      setMessages(current => current.some(item => item.id === message.id) ? current : [...current, message]);
      // Keep the polling cursor at the last server fetch so concurrent incoming messages are not skipped.
    }
    setConversations(current => current.map(conversation => conversation.id === conversationId
      ? { ...conversation, lastMessageAt: message.createdAt, lastMessagePreview: message.body } : conversation)
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt)));
  }, [activeConversation?.product, currentRole, currentUserId]);

  const clearSubmittedDraft = useCallback((conversationId: string, submitted: MessageDraft, fields: Array<keyof MessageDraft>) => {
    const matches = (value: MessageDraft) => fields.every(field => value[field] === submitted[field]);
    const current = latestDraftRef.current;
    if (activeIdRef.current === conversationId) {
      // A newer edit in the originating conversation owns its draft, even when
      // the older request completes after switching away and back.
      if (current.conversationId !== conversationId || !matches(current.value)) return;
      if (fields.includes('messageInput')) setMessageInput(value => value === submitted.messageInput ? '' : value);
      if (fields.includes('offerPrice')) setOfferPrice(value => value === submitted.offerPrice ? '' : value);
      if (fields.includes('offerQty')) setOfferQty(value => value === submitted.offerQty ? '' : value);
      if (fields.includes('offerNote')) setOfferNote(value => value === submitted.offerNote ? '' : value);
      if (fields.includes('offerPrice')) setShowOfferComposer(false);
    }
    const storageKey = `phenofarm:user:${encodeURIComponent(currentUserId)}:phenofarm:draft:message:${conversationId}`;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const stored = JSON.parse(raw);
      if (!stored?.value || typeof stored.value !== 'object' || !matches(stored.value)) return;
      const value = { ...stored.value };
      fields.forEach(field => { value[field] = ''; });
      if (Object.values(value).some(entry => typeof entry === 'string' && entry.trim())) {
        window.localStorage.setItem(storageKey, JSON.stringify({ value, savedAt: new Date().toISOString() }));
      } else window.localStorage.removeItem(storageKey);
    } catch {
      // Sending remains successful when browser storage is unavailable.
    }
  }, [currentUserId]);

  const postMessage = useCallback(async (payload: Record<string, unknown>, draftFields: Array<keyof MessageDraft> = []) => {
    if (!activeConversationId || sendingRef.current) return false;
    sendingRef.current = true;
    const submittedDraft = { ...draftValue };
    setSending(true); setError('');
    try {
      const response = await fetch(`/api/messages/conversations/${activeConversationId}/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, productId: activeConversation?.productId || undefined }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Failed to send message');
      appendSentMessage(activeConversationId, data);
      if (draftFields.length) clearSubmittedDraft(activeConversationId, submittedDraft, draftFields);
      return true;
    } catch (err) {
      if (activeIdRef.current === activeConversationId) setError(err instanceof Error ? err.message : 'Failed to send message');
      return false;
    } finally { sendingRef.current = false; setSending(false); }
  }, [activeConversationId, activeConversation?.productId, appendSentMessage, clearSubmittedDraft, draftValue]);

  const sendMessage = useCallback(async () => {
    if (!messageInput.trim()) return;
    await postMessage({ messageType: 'TEXT', body: messageInput.trim() }, ['messageInput']);
  }, [messageInput, postMessage]);

  const sendOffer = useCallback(async () => {
    const unitPrice = Number(offerPrice);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) { setError('Enter a valid quote unit price.'); return; }
    const quantity = offerQty.trim() ? Number(offerQty) : undefined;
    if (quantity !== undefined && (!Number.isInteger(quantity) || quantity < 1 || quantity > 9999)) { setError('Quote quantity must be a whole number between 1 and 9999.'); return; }
    await postMessage({ messageType: 'OFFER', body: offerNote.trim() || 'Quote terms', offer: { unitPrice, quantity, note: offerNote.trim() || undefined } }, ['offerPrice', 'offerQty', 'offerNote']);
  }, [offerPrice, offerQty, offerNote, postMessage]);

  const sendPricingRequest = useCallback(async () => {
    if (sendingRef.current) return;
    setRequestingPricing(true);
    await postMessage({ messageType: 'PRICING_REQUEST', body: 'Requesting pricing for this product. Please send quote terms.' });
    setRequestingPricing(false);
  }, [postMessage]);

  const offerAction = useCallback(async (messageId: string, payload: Record<string, unknown>) => {
    if (actionRef.current) return false;
    actionRef.current = true; setActionLoadingId(messageId); setError('');
    try {
      const response = await fetch(`/api/messages/messages/${messageId}/offer-action`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Quote action failed');
      if (activeConversationId && activeIdRef.current === activeConversationId) {
        const status = payload.action === 'ACCEPT' ? 'ACCEPTED' : payload.action === 'REJECT' ? 'REJECTED' : 'COUNTERED';
        setMessages(current => current.map(message => message.id === messageId ? { ...message, offerStatus: status } : message));
        await fetchMessages(activeConversationId, false);
      }
      return true;
    } catch (err) { setError(err instanceof Error ? err.message : 'Quote action failed'); return false; }
    finally { actionRef.current = false; setActionLoadingId(null); }
  }, [activeConversationId, fetchMessages]);
  const handleOfferAction = useCallback((messageId: string, action: 'ACCEPT' | 'REJECT') => offerAction(messageId, { action }), [offerAction]);
  const submitCounterOffer = useCallback(async (messageId: string) => {
    const unitPrice = Number(counterPrice);
    const quantity = counterQty.trim() ? Number(counterQty) : undefined;
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) { setError('Enter a valid counter quote price.'); return; }
    if (quantity !== undefined && (!Number.isInteger(quantity) || quantity < 1 || quantity > 9999)) { setError('Quote quantity must be a whole number between 1 and 9999.'); return; }
    if (await offerAction(messageId, { action: 'COUNTER', counter: { unitPrice, quantity, note: counterNote.trim() || undefined } })) {
      setCounterTargetId(null); setCounterPrice(''); setCounterQty(''); setCounterNote('');
    }
  }, [counterPrice, counterQty, counterNote, offerAction]);

  const renderOfferStatus = (status: ConversationMessage['offerStatus']) => {
    if (!status) return null;
    const base = 'px-2 py-0.5 rounded text-xs font-medium';
    if (status === 'PENDING') return <span className={`${base} bg-pf-warning-bg text-pf-warning`}>Pending</span>;
    if (status === 'ACCEPTED') return <span className={`${base} bg-pf-accent-bg text-pf-accent`}>Accepted</span>;
    if (status === 'REJECTED') return <span className={`${base} bg-pf-danger-bg text-pf-danger`}>Rejected</span>;
    if (status === 'COUNTERED') return <span className={`${base} bg-pf-info-bg text-pf-info`}>Countered</span>;
    return <span className={`${base} bg-pf-surface text-pf-secondary`}>{status}</span>;
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

    return chips.filter((chip, index, list) =>
      list.findIndex((candidate) => candidate.label === chip.label && candidate.value === chip.value) === index
    );
  }, [activeConversationId, conversationContexts]);

  const renderMessageContent = (message: ConversationMessage, isMine: boolean) => {
    const isOffer = message.messageType === 'OFFER';
    const canRespondToOffer = isOffer && !isMine && message.offerStatus === 'PENDING';
    const isOfferActionLoading = actionLoadingId === message.id;

    const addAcceptedQuoteToDraft = () => {
      if (!activeConversation || !message.product || !message.offerQuantity || !message.offerUnitPrice) return;
      if (!message.acceptedQuote || new Date(message.acceptedQuote.expiresAt).getTime() <= Date.now()) {
        setError('This quote has expired. Request a new quote before adding it.'); return;
      }
      const cart = readCart();
      const existing = cart.items.find(item => item.id === message.product!.id);
      const quoted: CartItem = { ...existing, id: message.product.id, name: message.product.name,
        price: message.offerUnitPrice, quantity: message.offerQuantity, maxQty: Math.max(existing?.maxQty || 0, message.offerQuantity),
        unit: message.product.unit || 'unit', growerId: activeConversation.growerId, grower: activeConversation.counterpart.name,
        acceptedQuoteId: message.acceptedQuote.id, quotedQuantity: message.offerQuantity, quotedUnitPrice: message.offerUnitPrice,
        listPrice: existing?.listPrice ?? existing?.price ?? message.offerUnitPrice };
      const items = existing ? cart.items.map(item => item.id === quoted.id ? quoted : item) : [...cart.items, quoted];
      if (!writeCart({ items, ...calculateTotals(items) })) { setError('Your browser could not save the request draft.'); return; }
      setError('');
    };

    if (isOffer) {
      return (
        <div className="space-y-2">
          <div className={`rounded-lg p-3 ${isMine ? 'border border-pf-accent-line bg-pf-accent-bg' : 'border border-pf-accent-line bg-pf-accent-bg'}`}>
            <div className="flex items-start justify-between gap-2">
              <p className={`text-sm font-semibold ${isMine ? 'text-white' : 'text-pf-accent'}`}>
                Quote {message.product?.name ? `for ${message.product.name}` : ''}
              </p>
              {renderOfferStatus(message.offerStatus)}
            </div>
            <p className={`mt-1 text-sm ${isMine ? 'text-pf-text' : 'text-pf-accent'}`}>
              {message.offerQuantity ? `${message.offerQuantity} ${message.product?.unit || 'units'} @ ` : ''}
              <span className="font-bold">{message.offerUnitPrice !== null && Number.isFinite(message.offerUnitPrice) ? `$${message.offerUnitPrice.toFixed(2)}` : 'Price unavailable'}</span>
            </p>
            {message.offerNote && (
              <p className={`mt-1 text-xs ${isMine ? 'text-pf-text' : 'text-pf-accent'}`}>{message.offerNote}</p>
            )}
          </div>

          {message.offerStatus === 'ACCEPTED' && (
            <div className="space-y-2"><p className={`text-xs ${isMine ? 'text-pf-text' : 'text-pf-accent'}`}>Quote terms accepted. Create or review an order request to coordinate fulfillment; payment is handled directly.</p>{currentRole === 'DISPENSARY' && message.acceptedQuote && !message.acceptedQuote.consumedByOrderId ? <button type="button" onClick={addAcceptedQuoteToDraft} className="inline-flex h-8 items-center rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-[#032116] hover:bg-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400">Add to request draft</button> : null}</div>
          )}

          {canRespondToOffer && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleOfferAction(message.id, 'ACCEPT')}
                disabled={isOfferActionLoading}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-[#032116] hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-70"
              >
                {isOfferActionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Accept
              </button>
              <button
                type="button"
                onClick={() => {
                  setCounterTargetId((prev) => (prev === message.id ? null : message.id));
                  setCounterPrice(message.offerUnitPrice ? String(message.offerUnitPrice) : '');
                  setCounterQty(message.offerQuantity ? String(message.offerQuantity) : '');
                  setCounterNote('');
                }}
                disabled={isOfferActionLoading}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-pf-line-strong bg-pf-surface px-3 text-xs font-semibold text-pf-secondary hover:bg-pf-canvas disabled:cursor-wait disabled:opacity-60"
              >
                {isOfferActionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Repeat2 className="h-3.5 w-3.5" />}
                Counter
              </button>
              <button
                type="button"
                onClick={() => handleOfferAction(message.id, 'REJECT')}
                disabled={isOfferActionLoading}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-pf-danger hover:bg-pf-danger-bg hover:text-pf-danger disabled:cursor-wait disabled:opacity-60"
              >
                {isOfferActionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                Reject
              </button>
            </div>
          )}

          {counterTargetId === message.id && (
            <div className="mt-2 space-y-2 rounded-lg border border-pf-line bg-pf-surface p-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value)}
                  placeholder="Quote unit price"
                  disabled={isOfferActionLoading}
                  className="w-full rounded border border-pf-line-strong px-2 py-1 text-xs disabled:cursor-not-allowed disabled:bg-pf-canvas"
                />
                <input
                  type="number"
                  min="1"
                  value={counterQty}
                  onChange={(e) => setCounterQty(e.target.value)}
                  placeholder="Qty (optional)"
                  disabled={isOfferActionLoading}
                  className="w-full rounded border border-pf-line-strong px-2 py-1 text-xs disabled:cursor-not-allowed disabled:bg-pf-canvas"
                />
              </div>
              <input
                type="text"
                value={counterNote}
                onChange={(e) => setCounterNote(e.target.value)}
                placeholder="Counter terms note (optional)"
                disabled={isOfferActionLoading}
                className="w-full rounded border border-pf-line-strong px-2 py-1 text-xs disabled:cursor-not-allowed disabled:bg-pf-canvas"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCounterTargetId(null)}
                  disabled={isOfferActionLoading}
                  className="rounded border border-pf-line-strong px-2 py-1 text-xs text-pf-muted disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => submitCounterOffer(message.id)}
                  disabled={isOfferActionLoading}
                  className="inline-flex items-center gap-1.5 rounded bg-emerald-500 px-2 py-1 text-xs font-semibold text-[#032116] hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-60"
                  data-testid="send-counter"
                >
                  {isOfferActionLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                  Send counter
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (message.messageType === 'PRICING_REQUEST') {
      return (
        <div className={`rounded-lg p-3 border border-pf-purple-line bg-pf-purple-bg`}>
          <div className="flex items-center gap-2">
            <BadgeDollarSign className={`h-4 w-4 ${isMine ? 'text-pf-purple' : 'text-pf-purple'}`} />
            <p className={`text-sm font-semibold ${isMine ? 'text-white' : 'text-pf-purple'}`}>
              Pricing Request
            </p>
          </div>
          <p className={`mt-1 text-sm ${isMine ? 'text-pf-purple' : 'text-pf-purple'}`}>
            {message.body}
          </p>
          {message.product?.name && (
            <p className={`mt-1 text-xs ${isMine ? 'text-pf-purple' : 'text-pf-purple'}`}>
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
          <span data-testid="unread-badge" className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>
  );

  return (
    <>
      {mobileTriggerHost ? createPortal(trigger, mobileTriggerHost) : trigger}
      {open ? createPortal((
        <div className="fixed inset-0 z-[80]">
          <button className="absolute inset-0 bg-black/40" onClick={closeDrawer} aria-label="Close messages overlay" />
          <aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="messages-drawer-title"
            className={`absolute right-0 top-0 h-full w-full sm:w-[420px] lg:w-[760px] bg-pf-surface shadow-2xl border-l border-pf-line flex transition-shadow ${
              flashDrawer ? 'ring-4 ring-pf-accent-line ring-inset' : ''
            }`}
          >
            <div className={`w-full lg:w-[300px] border-r border-pf-line flex flex-col ${!mobileListMode && 'hidden lg:flex'}`}>
              <div className="px-3 py-1 sm:px-4 sm:py-3 border-b border-pf-line flex items-center justify-between">
                <h2 id="messages-drawer-title" className="font-semibold text-pf-text">Messages</h2>
                <button ref={closeButtonRef} className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-pf-muted hover:text-pf-secondary" onClick={closeDrawer} data-testid="close-chat" aria-label="Close messages">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loadingConversations ? (
                  <div className="p-4 text-sm text-pf-muted flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Loading...</div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-sm text-pf-muted">
                    <p className="font-medium text-pf-text">No conversations yet</p>
                    <p className="mt-1">Conversations start from a product&apos;s Message Grower button.</p>
                    <p className="mt-2 text-xs text-pf-muted">
                      Once a buyer or grower opens a thread, quote terms and order context stay here.
                    </p>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => {
                        selectConversation(conversation.id);
                      }}
                      className={`w-full text-left px-4 py-3 border-b border-pf-line hover:bg-pf-canvas ${
                        conversation.id === activeConversationId ? 'bg-pf-accent-bg' : ''
                      }`}
                      data-testid="conversation-item"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-pf-text truncate">{conversation.counterpart.name}</p>
                          {conversation.product?.name && (
                            <p className="text-xs text-pf-muted break-words">{conversation.product.name}</p>
                          )}
                          <span className="mt-1 inline-flex rounded-full bg-pf-surface px-2 py-0.5 text-[11px] font-medium text-pf-muted">
                            {getConversationPurpose(conversation, currentRole)}
                          </span>
                          <p className="text-xs text-pf-muted truncate mt-1">{conversation.lastMessagePreview}</p>
                        </div>
                        {conversation.unreadCount > 0 && (
                          <span data-testid="conversation-unread-badge" className="min-w-[18px] h-[18px] px-1 rounded-full bg-pf-accent-bg text-pf-accent text-[11px] flex items-center justify-center">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className={`min-w-0 flex-1 flex-col ${mobileListMode ? 'hidden lg:flex' : 'flex'}`}>
              <div className="px-3 py-1 sm:px-4 sm:py-3 border-b border-pf-line flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    aria-label="Back to conversations"
                    onClick={() => { saveMessageDraft(); visibleRef.current = false; setMobileListMode(true); }}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-pf-muted hover:text-pf-secondary lg:hidden"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-pf-text break-words">
                      {activeConversation?.counterpart.name || 'Messages'}
                    </p>
                    {activeConversation && (
                      <p className="text-xs text-pf-muted break-words">
                        {getConversationPurpose(activeConversation, currentRole)}
                        {activeConversation.product?.name ? ` - ${activeConversation.product.name}` : ''}
                      </p>
                    )}
                  </div>
                </div>
                <button className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-pf-muted hover:text-pf-secondary lg:hidden" onClick={closeDrawer} data-testid="close-chat-mobile" aria-label="Close messages">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {contextChips.length > 0 && (
                <div className="border-b border-pf-line bg-pf-canvas/80 px-4 py-2">
                  <div className="flex flex-wrap gap-2">
                    {contextChips.map((chip) => (
                      <span
                        key={`${chip.label}-${chip.value}`}
                        className="inline-flex max-w-full items-center overflow-hidden rounded-full border border-pf-line bg-pf-surface text-[11px] shadow-sm"
                      >
                        <span className="shrink-0 border-r border-pf-line bg-pf-canvas px-2 py-1 font-semibold uppercase tracking-wide text-pf-muted">
                          {chip.label}
                        </span>
                        <span className="truncate px-2 py-1 font-medium text-pf-secondary">{chip.value}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div ref={scrollContainerRef} onScroll={() => { const node = scrollContainerRef.current; if (node) nearBottomRef.current = node.scrollHeight - node.scrollTop - node.clientHeight < 100; }} className="min-w-0 flex-1 space-y-4 overflow-y-auto bg-pf-canvas p-4 pr-5">
                {loadingMessages ? (
                  <div className="text-sm text-pf-muted flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Loading messages...</div>
                ) : !activeConversationId ? (
                  <div className="rounded-lg border border-dashed border-pf-line-strong bg-pf-surface p-4 text-sm text-pf-muted">
                    <p className="font-medium text-pf-text">Choose a conversation</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-pf-line-strong bg-pf-surface p-4 text-sm text-pf-muted">
                    <p className="font-medium text-pf-text">No messages yet</p>
                    <p className="mt-1">Write a message to start this conversation.</p>

                  </div>
                ) : (
                  messageListItems.map((item) => {
                    if (item.type === 'day') {
                      return (
                        <div key={item.id} className="flex items-center gap-3 py-1">
                          <div className="h-px flex-1 bg-pf-raised" />
                          <span className="rounded-full bg-pf-surface px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-pf-muted shadow-sm ring-1 ring-pf-line">
                            {item.label}
                          </span>
                          <div className="h-px flex-1 bg-pf-raised" />
                        </div>
                      );
                    }

                    return (
                      <div key={item.id} className={`flex min-w-0 ${item.isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex min-w-0 max-w-[85%] flex-col gap-1.5 ${item.isMine ? 'items-end' : 'items-start'}`}>
                          <p className={`px-1 text-[11px] ${item.isMine ? 'text-pf-accent' : 'text-pf-muted'}`}>
                            {item.senderLabel} • {formatMessageTime(item.createdAt)}
                            {item.lastCreatedAt !== item.createdAt ? ` - ${formatMessageTime(item.lastCreatedAt)}` : ''}
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

              {activeConversationId && <div className="min-w-0 space-y-2 border-t border-pf-line bg-pf-surface p-3">
                {error && <p role="alert" className="text-sm text-pf-danger">{error}</p>}
                <DraftAutosaveStatus compact savedAt={messageDraft.savedAt} label="Draft" onClear={messageDraft.clearDraft} />
                {requestingPricing && <p role="status" className="text-sm text-pf-purple">Requesting pricing...</p>}
                {showOfferComposer ? (
                  <div className="space-y-3 rounded-lg border border-pf-info-line bg-pf-info-bg p-3">
                    <div><h3 className="font-semibold text-sm">Quote</h3><p className="text-sm text-pf-muted">{activeConversation?.product?.name || 'Open a product listing to quote.'}</p></div>
                    {activeConversation?.product ? <>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="text-xs font-medium text-pf-secondary">Unit price ($/{activeConversation.product.unit || 'unit'})
                          <input type="number" min="0.01" step="0.01" value={offerPrice} onChange={e => setOfferPrice(e.target.value)} placeholder="Quote unit price" className="mt-1 w-full rounded border border-pf-line-strong px-2 py-2 text-base sm:text-sm" />
                        </label>
                        <label className="text-xs font-medium text-pf-secondary">Qty (optional)
                          <input type="number" min="1" value={offerQty} onChange={e => setOfferQty(e.target.value)} placeholder="Qty (optional)" className="mt-1 w-full rounded border border-pf-line-strong px-2 py-2 text-base sm:text-sm" />
                        </label>
                      </div>
                      <label className="block text-xs font-medium text-pf-secondary">Terms (optional)
                        <textarea rows={2} value={offerNote} onChange={e => setOfferNote(e.target.value)} placeholder="Quote terms note (optional)" className="mt-1 w-full rounded border border-pf-line-strong px-2 py-2 text-base sm:text-sm" />
                      </label>
                      <p className="text-xs text-pf-muted">Payment arranged directly.</p>
                    </> : <a href={currentRole === 'GROWER' ? '/grower/products' : '/dispensary/catalog'} className="inline-flex min-h-10 items-center text-sm text-pf-accent underline">Choose a product</a>}
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setShowOfferComposer(false)} className="min-h-10 rounded border border-pf-line-strong px-3 text-sm">Cancel</button>
                      {activeConversation?.product && <button type="button" onClick={sendOffer} disabled={sending} className="min-h-10 rounded bg-emerald-500 px-3 text-sm font-semibold text-[#032116] hover:bg-emerald-400 disabled:opacity-60" data-testid="send-offer">{sending ? 'Sending...' : 'Send quote'}</button>}
                    </div>
                  </div>
                ) : <>
                  <div className="flex items-end gap-2">
                    <textarea rows={1} maxLength={5000} aria-label="Message" value={messageInput} onChange={e => setMessageInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Type a message..." disabled={sending} className="min-h-[44px] max-h-28 min-w-0 flex-1 resize-y rounded-lg border border-pf-line-strong px-3 py-2 text-base sm:text-sm" />
                    <button type="button" onClick={sendMessage} disabled={sending || !messageInput.trim()} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-[#032116] hover:bg-emerald-400 disabled:opacity-50" aria-label="Send message">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button>
                  </div>
                  <div className="flex flex-wrap items-start gap-2">
                    <select aria-label="Message templates" value="" onChange={event => {
                      const template = messageTemplates[Number(event.target.value)];
                      if (template) setMessageInput(current => current.trim() ? `${current}\n${template.body}` : template.body);
                    }} className="min-h-10 max-w-[55%] rounded-lg border border-pf-line-strong bg-pf-surface px-2 text-base sm:text-sm">
                      <option value="" disabled>Templates</option>
                      {messageTemplates.map((template, index) => <option key={template.label} value={index}>{template.label.replace('Quote follow-up', 'Follow up').replace('Delivery timing', 'Delivery').replace('Commercial terms', 'Terms')}</option>)}
                    </select>
                    <details className="rounded-lg border border-pf-line-strong text-sm">
                      <summary className="min-h-10 cursor-pointer px-3 py-2 font-medium">Quote</summary>
                      <div className="flex flex-wrap gap-2 border-t border-pf-line p-2">
                        <button type="button" onClick={() => setShowOfferComposer(true)} className="inline-flex min-h-10 items-center gap-1 rounded px-3 text-pf-info hover:bg-pf-info-bg" data-testid="toggle-offer-composer"><BadgeDollarSign className="h-4 w-4" />Create quote</button>
                        <button type="button" onClick={sendPricingRequest} disabled={requestingPricing} className="min-h-10 rounded px-3 text-pf-purple hover:bg-pf-purple-bg disabled:opacity-50" data-testid="request-pricing">Request pricing</button>
                      </div>
                    </details>
                  </div>
                </>}
              </div>}
            </div>
          </aside>
        </div>
      ), document.body) : null}
    </>
  );
}
