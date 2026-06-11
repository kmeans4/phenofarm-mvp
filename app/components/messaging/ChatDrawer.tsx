'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, X, Send, BadgeDollarSign, Check, XCircle, Repeat2, Loader2, ArrowLeft } from 'lucide-react';
import { useFocusTrap } from '@/app/hooks/useFocusTrap';
import { DraftAutosaveStatus } from '@/app/components/ux/DraftAutosaveStatus';
import { useLocalDraft } from '@/app/hooks/useLocalDraft';
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
  createdAt: string;
};

type OpenChatEventDetail = {
  conversationId?: string;
  context?: Array<{ label: string; value: string }>;
  /** Prefill the composer without sending — the user reviews and sends. */
  draft?: string;
};

interface MessageDraft {
  messageInput: string;
  offerPrice: string;
  offerQty: string;
  offerNote: string;
}

interface ChatDrawerProps {
  currentUserId: string;
  currentRole: 'GROWER' | 'DISPENSARY';
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
  const [conversationContexts, setConversationContexts] = useState<Record<string, Array<{ label: string; value: string }>>>({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);
  const conversationPollRef = useRef<number | null>(null);
  const messagePollRef = useRef<number | null>(null);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );

  const messageDraft = useLocalDraft<MessageDraft>({
    key: `phenofarm:draft:message:${activeConversationId || 'none'}`,
    value: { messageInput, offerPrice, offerQty, offerNote },
    enabled: open && Boolean(activeConversationId),
    onRestore: (value) => {
      setMessageInput(value.messageInput || '');
      setOfferPrice(value.offerPrice || '');
      setOfferQty(value.offerQty || '');
      setOfferNote(value.offerNote || '');
    },
    shouldSave: (value) =>
      Boolean(
        value.messageInput.trim() ||
        value.offerPrice.trim() ||
        value.offerQty.trim() ||
        value.offerNote.trim()
      ),
  });
  const clearMessageDraft = messageDraft.clearDraft;

  const totalUnread = useMemo(
    () => conversations.reduce((sum, conversation) => sum + (conversation.unreadCount || 0), 0),
    [conversations]
  );

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  const openDrawer = useCallback(() => {
    setOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setOpen(false);
  }, []);

  useFocusTrap({
    active: open,
    containerRef: drawerRef,
    initialFocusRef: closeButtonRef,
    returnFocusRef: triggerButtonRef,
    onEscape: closeDrawer,
  });

  const conversationsRequestRef = useRef<Promise<void> | null>(null);

  // Stable identity + in-flight dedupe so layout remounts and the two pollers
  // don't stack duplicate /api/messages/conversations requests.
  const fetchConversations = useCallback(() => {
    if (conversationsRequestRef.current) {
      return conversationsRequestRef.current;
    }

    setLoadingConversations(true);
    const request = (async () => {
      try {
        const response = await fetch('/api/messages/conversations');
        if (!response.ok) throw new Error('Failed to load conversations');
        const data = await response.json();
        const list: ConversationSummary[] = data.conversations || [];
        setConversations(list);
        setActiveConversationId((prev) => prev ?? (list.length > 0 ? list[0].id : null));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load conversations');
      } finally {
        setLoadingConversations(false);
        conversationsRequestRef.current = null;
      }
    })();

    conversationsRequestRef.current = request;
    return request;
  }, []);

  const markConversationRead = useCallback(async (conversationId: string) => {
    try {
      await fetch(`/api/messages/conversations/${conversationId}/read`, {
        method: 'POST',
      });
    } catch {
      // best-effort
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId: string, withLoading = true) => {
    if (withLoading) setLoadingMessages(true);
    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}/messages`);
      if (!response.ok) throw new Error('Failed to load messages');
      const data = await response.json();
      setMessages(data.messages || []);
      await markConversationRead(conversationId);
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation
        )
      );
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      if (withLoading) setLoadingMessages(false);
    }
  }, [markConversationRead, scrollToBottom]);

  const openFromEvent = useCallback((event: Event) => {
    const custom = event as CustomEvent<OpenChatEventDetail>;
    const detail = custom.detail || {};
    openDrawer();
    if (detail.conversationId) {
      setActiveConversationId(detail.conversationId);
      setMobileListMode(false);
      if (Array.isArray(detail.context) && detail.context.length > 0) {
        setConversationContexts((prev) => ({
          ...prev,
          [detail.conversationId as string]: detail.context || [],
        }));
      }
    }
    if (typeof detail.draft === 'string' && detail.draft.trim()) {
      setMessageInput(detail.draft);
    }
  }, [openDrawer]);

  useEffect(() => {
    window.addEventListener('phenofarm-open-chat', openFromEvent as EventListener);
    return () => window.removeEventListener('phenofarm-open-chat', openFromEvent as EventListener);
  }, [openFromEvent]);

  useEffect(() => {
    if (!open || !activeConversationId) return;
    fetchMessages(activeConversationId, true);
  }, [open, activeConversationId, fetchMessages]);

  useEffect(() => {
    const poll = () => {
      if (document.hidden) return;
      fetchConversations();
    };

    // Initial load is unconditional (background tabs still need the unread
    // badge); only the recurring polls are visibility-gated.
    fetchConversations();
    conversationPollRef.current = window.setInterval(poll, open ? 15000 : 30000);

    return () => {
      if (conversationPollRef.current !== null) {
        window.clearInterval(conversationPollRef.current);
      }
    };
  }, [open, fetchConversations]);

  useEffect(() => {
    if (!open || !activeConversationId) return;

    const poll = () => {
      if (document.hidden) return;
      fetchMessages(activeConversationId, false);
    };

    messagePollRef.current = window.setInterval(poll, 12000);

    return () => {
      if (messagePollRef.current !== null) {
        window.clearInterval(messagePollRef.current);
      }
    };
  }, [open, activeConversationId, fetchMessages]);

  const sendMessage = useCallback(async () => {
    if (!activeConversationId || !messageInput.trim() || sending) return;

    setSending(true);
    setError('');

    try {
      const response = await fetch(`/api/messages/conversations/${activeConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageType: 'TEXT',
          body: messageInput.trim(),
          productId: activeConversation?.productId || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send message');
      }

      setMessageInput('');
      clearMessageDraft();
      await fetchMessages(activeConversationId, false);
      await fetchConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  }, [activeConversationId, activeConversation?.productId, messageInput, sending, clearMessageDraft, fetchMessages, fetchConversations]);

  const sendOffer = useCallback(async () => {
    if (!activeConversationId || sending) return;

    const unitPrice = Number(offerPrice);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      setError('Enter a valid quote unit price.');
      return;
    }

    const quantityNumber = Number(offerQty);

    setSending(true);
    setError('');

    try {
      const response = await fetch(`/api/messages/conversations/${activeConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageType: 'OFFER',
          body: offerNote.trim() || 'Quote terms',
          productId: activeConversation?.productId || undefined,
          offer: {
            unitPrice,
            quantity: Number.isFinite(quantityNumber) && quantityNumber > 0 ? quantityNumber : undefined,
            note: offerNote.trim() || undefined,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send quote');
      }

      setOfferPrice('');
      setOfferQty('');
      setOfferNote('');
      setShowOfferComposer(false);
      clearMessageDraft();
      await fetchMessages(activeConversationId, false);
      await fetchConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send quote');
    } finally {
      setSending(false);
    }
  }, [activeConversationId, activeConversation?.productId, offerPrice, offerQty, offerNote, sending, clearMessageDraft, fetchMessages, fetchConversations]);

  const sendPricingRequest = useCallback(async () => {
    if (!activeConversationId || requestingPricing) return;

    setRequestingPricing(true);
    setError('');

    try {
      const response = await fetch(`/api/messages/conversations/${activeConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageType: 'PRICING_REQUEST',
          body: 'Requesting pricing for this product. Please send quote terms.',
          productId: activeConversation?.productId || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send pricing request');
      }

      await fetchMessages(activeConversationId, false);
      await fetchConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send pricing request');
    } finally {
      setRequestingPricing(false);
    }
  }, [activeConversationId, activeConversation?.productId, requestingPricing, fetchMessages, fetchConversations]);

  const handleOfferAction = useCallback(async (messageId: string, action: 'ACCEPT' | 'REJECT') => {
    setActionLoadingId(messageId);
    setError('');
    try {
      const response = await fetch(`/api/messages/messages/${messageId}/offer-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Failed to ${action.toLowerCase()} quote`);
      }

      if (activeConversationId) {
        await fetchMessages(activeConversationId, false);
      }
      await fetchConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Quote action failed');
    } finally {
      setActionLoadingId(null);
    }
  }, [activeConversationId, fetchMessages, fetchConversations]);

  const submitCounterOffer = useCallback(async (messageId: string) => {
    const unitPrice = Number(counterPrice);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      setError('Enter a valid counter quote price.');
      return;
    }

    const quantity = Number(counterQty);

    setActionLoadingId(messageId);
    setError('');

    try {
      const response = await fetch(`/api/messages/messages/${messageId}/offer-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'COUNTER',
          counter: {
            unitPrice,
            quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : undefined,
            note: counterNote.trim() || undefined,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send counter quote');
      }

      setCounterTargetId(null);
      setCounterPrice('');
      setCounterQty('');
      setCounterNote('');

      if (activeConversationId) {
        await fetchMessages(activeConversationId, false);
      }
      await fetchConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Counter quote failed');
    } finally {
      setActionLoadingId(null);
    }
  }, [activeConversationId, counterPrice, counterQty, counterNote, fetchMessages, fetchConversations]);

  const renderOfferStatus = (status: ConversationMessage['offerStatus']) => {
    if (!status) return null;
    const base = 'px-2 py-0.5 rounded text-xs font-medium';
    if (status === 'PENDING') return <span className={`${base} bg-yellow-100 text-yellow-700`}>Pending</span>;
    if (status === 'ACCEPTED') return <span className={`${base} bg-green-100 text-green-700`}>Accepted</span>;
    if (status === 'REJECTED') return <span className={`${base} bg-red-100 text-red-700`}>Rejected</span>;
    if (status === 'COUNTERED') return <span className={`${base} bg-blue-100 text-blue-700`}>Countered</span>;
    return <span className={`${base} bg-gray-100 text-gray-700`}>{status}</span>;
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
    if (activeConversation?.product?.name) {
      chips.unshift({ label: 'Product', value: activeConversation.product.name });
    }
    chips.push({ label: 'Settlement', value: 'Direct outside PhenoFarm' });

    return chips.filter((chip, index, list) =>
      list.findIndex((candidate) => candidate.label === chip.label && candidate.value === chip.value) === index
    );
  }, [activeConversation?.product?.name, activeConversationId, conversationContexts]);

  return (
    <>
      <button
        ref={triggerButtonRef}
        type="button"
        onClick={openDrawer}
        className="fixed bottom-5 right-5 z-[70] h-12 w-12 rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700 flex items-center justify-center"
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

      {open && (
        <div className="fixed inset-0 z-[80]">
          <button className="absolute inset-0 bg-black/40" onClick={closeDrawer} aria-label="Close messages overlay" />
          <aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="messages-drawer-title"
            className="absolute right-0 top-0 h-full w-full sm:w-[420px] lg:w-[760px] bg-white shadow-2xl border-l border-gray-200 flex"
          >
            <div className={`w-full lg:w-[300px] border-r border-gray-200 flex flex-col ${!mobileListMode && 'hidden lg:flex'}`}>
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h2 id="messages-drawer-title" className="font-semibold text-gray-900">Messages</h2>
                <button ref={closeButtonRef} className="text-gray-500 hover:text-gray-700" onClick={closeDrawer} data-testid="close-chat" aria-label="Close messages">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loadingConversations ? (
                  <div className="p-4 text-sm text-gray-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Loading...</div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">
                    <p className="font-medium text-gray-900">No conversations yet</p>
                    <p className="mt-1">
                      Start from a product, order, or grower profile so the other party knows what the message is about.
                    </p>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => {
                        setActiveConversationId(conversation.id);
                        setMobileListMode(false);
                      }}
                      className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
                        conversation.id === activeConversationId ? 'bg-green-50' : ''
                      }`}
                      data-testid="conversation-item"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">{conversation.counterpart.name}</p>
                          {conversation.product?.name && (
                            <p className="text-xs text-gray-500 truncate">{conversation.product.name}</p>
                          )}
                          <span className="mt-1 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                            {getConversationPurpose(conversation, currentRole)}
                          </span>
                          <p className="text-xs text-gray-500 truncate mt-1">{conversation.lastMessagePreview}</p>
                        </div>
                        {conversation.unreadCount > 0 && (
                          <span data-testid="conversation-unread-badge" className="min-w-[18px] h-[18px] px-1 rounded-full bg-green-600 text-white text-[11px] flex items-center justify-center">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className={`flex-1 flex flex-col ${mobileListMode ? 'hidden lg:flex' : 'flex'}`}>
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileListMode(true)}
                    className="lg:hidden text-gray-500 hover:text-gray-700"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {activeConversation?.counterpart.name || 'Select a conversation'}
                    </p>
                    {activeConversation && (
                      <p className="text-xs text-gray-500 truncate">
                        {getConversationPurpose(activeConversation, currentRole)}
                        {activeConversation.product?.name ? ` - ${activeConversation.product.name}` : ''}
                      </p>
                    )}
                  </div>
                </div>
                <button className="text-gray-500 hover:text-gray-700 lg:hidden" onClick={closeDrawer} data-testid="close-chat-mobile" aria-label="Close messages">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {contextChips.length > 0 && (
                <div className="border-b border-gray-200 bg-white px-4 py-2">
                  <div className="flex flex-wrap gap-2">
                    {contextChips.map((chip) => (
                      <span
                        key={`${chip.label}-${chip.value}`}
                        className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-700"
                      >
                        <span className="text-gray-500">{chip.label}:</span> {chip.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {loadingMessages ? (
                  <div className="text-sm text-gray-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Loading messages...</div>
                ) : !activeConversationId ? (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
                    <p className="font-medium text-gray-900">Select a conversation</p>
                    <p className="mt-1">Conversation context, pricing actions, and message templates will appear here.</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
                    <p className="font-medium text-gray-900">No messages yet</p>
                    <p className="mt-1">Use a template below or write the first note with the product/order context already attached.</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isMine = message.senderUserId === currentUserId;
                    const isOffer = message.messageType === 'OFFER';
                    const canRespondToOffer = isOffer && !isMine && message.offerStatus === 'PENDING';

                    return (
                      <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div data-testid={isOffer ? 'offer-message' : message.messageType === 'PRICING_REQUEST' ? 'pricing-request-message' : 'message-bubble'} className={`max-w-[85%] rounded-lg px-3 py-2 ${isMine ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-900'}`}>
                          <p className={`text-[11px] mb-1 ${isMine ? 'text-green-100' : 'text-gray-500'}`}>
                            {isMine ? 'You' : message.sender?.name || message.sender?.email || 'User'} • {new Date(message.createdAt).toLocaleString()}
                          </p>

                          {isOffer ? (
                            <div className="space-y-2">
                              <div className={`rounded-md p-2 ${isMine ? 'bg-green-700/70' : 'bg-green-50 border border-green-200'}`}>
                                <div className="flex items-center justify-between gap-2">
                                  <p className={`text-sm font-semibold ${isMine ? 'text-white' : 'text-green-800'}`}>
                                    Quote {message.product?.name ? `for ${message.product.name}` : ''}
                                  </p>
                                  {renderOfferStatus(message.offerStatus)}
                                </div>
                                <p className={`text-sm mt-1 ${isMine ? 'text-green-50' : 'text-green-900'}`}>
                                  {message.offerQuantity ? `${message.offerQuantity} ${message.product?.unit || 'units'} @ ` : ''}
                                  <span className="font-bold">${message.offerUnitPrice?.toFixed(2)}</span>
                                </p>
                                {message.offerNote && (
                                  <p className={`text-xs mt-1 ${isMine ? 'text-green-100' : 'text-green-700'}`}>{message.offerNote}</p>
                                )}
                              </div>

                              {message.offerStatus === 'ACCEPTED' && (
                                <p className={`text-xs ${isMine ? 'text-green-100' : 'text-green-700'}`}>
                                  Quote terms accepted. Create or review an order request to coordinate fulfillment; payment is handled directly.
                                </p>
                              )}

                              {canRespondToOffer && (
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleOfferAction(message.id, 'ACCEPT')}
                                    disabled={actionLoadingId === message.id}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-600 text-white text-xs hover:bg-green-700 disabled:opacity-60"
                                  >
                                    <Check className="w-3 h-3" /> Accept quote
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOfferAction(message.id, 'REJECT')}
                                    disabled={actionLoadingId === message.id}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-600 text-white text-xs hover:bg-red-700 disabled:opacity-60"
                                  >
                                    <XCircle className="w-3 h-3" /> Reject
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCounterTargetId((prev) => (prev === message.id ? null : message.id));
                                      setCounterPrice(message.offerUnitPrice ? String(message.offerUnitPrice) : '');
                                      setCounterQty(message.offerQuantity ? String(message.offerQuantity) : '');
                                      setCounterNote('');
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                                  >
                                    <Repeat2 className="w-3 h-3" /> Counter
                                  </button>
                                </div>
                              )}

                              {counterTargetId === message.id && (
                                <div className="mt-2 rounded-md border border-gray-200 bg-white p-2 space-y-2">
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={counterPrice}
                                      onChange={(e) => setCounterPrice(e.target.value)}
                                      placeholder="Quote unit price"
                                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                                    />
                                    <input
                                      type="number"
                                      min="1"
                                      value={counterQty}
                                      onChange={(e) => setCounterQty(e.target.value)}
                                      placeholder="Qty (optional)"
                                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                                    />
                                  </div>
                                  <input
                                    type="text"
                                    value={counterNote}
                                    onChange={(e) => setCounterNote(e.target.value)}
                                      placeholder="Counter terms note (optional)"
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                                  />
                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setCounterTargetId(null)}
                                      className="px-2 py-1 text-xs rounded border border-gray-300 text-gray-600"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => submitCounterOffer(message.id)}
                                      disabled={actionLoadingId === message.id}
                                      className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                                      data-testid="send-counter"
                                    >
                                      Send Counter
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : message.messageType === 'PRICING_REQUEST' ? (
                            <div className={`rounded-md p-2 ${isMine ? 'bg-purple-700/70' : 'bg-purple-50 border border-purple-200'}`}>
                              <div className="flex items-center gap-2">
                                <BadgeDollarSign className={`w-4 h-4 ${isMine ? 'text-purple-200' : 'text-purple-700'}`} />
                                <p className={`text-sm font-semibold ${isMine ? 'text-white' : 'text-purple-800'}`}>
                                  Pricing Request
                                </p>
                              </div>
                              <p className={`text-sm mt-1 ${isMine ? 'text-purple-100' : 'text-purple-900'}`}>
                                {message.body}
                              </p>
                              {message.product?.name && (
                                <p className={`text-xs mt-1 ${isMine ? 'text-purple-200' : 'text-purple-700'}`}>
                                  For: {message.product.name}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-gray-200 p-3 space-y-2 bg-white">
                {error && <p className="text-xs text-red-600">{error}</p>}

                <DraftAutosaveStatus
                  savedAt={messageDraft.savedAt}
                  label="Message browser draft"
                  onClear={messageDraft.clearDraft}
                />

                {requestingPricing && (
                  <div className="rounded-lg border border-purple-200 bg-purple-50 p-2 text-center">
                    <p className="text-sm text-purple-800">Sending pricing request...</p>
                  </div>
                )}

                {showOfferComposer && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={offerPrice}
                        onChange={(e) => setOfferPrice(e.target.value)}
                        placeholder="Quote unit price"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                      />
                      <input
                        type="number"
                        min="1"
                        value={offerQty}
                        onChange={(e) => setOfferQty(e.target.value)}
                        placeholder="Qty (optional)"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                      />
                    </div>
                    <input
                      type="text"
                      value={offerNote}
                      onChange={(e) => setOfferNote(e.target.value)}
                        placeholder="Quote terms note (optional)"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowOfferComposer(false)}
                        className="px-3 py-1.5 text-xs rounded border border-gray-300 text-gray-600"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={sendOffer}
                        disabled={sending}
                        className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                        data-testid="send-offer"
                      >
                        Send Quote
                      </button>
                    </div>
                  </div>
                )}

                {activeConversationId && !showOfferComposer && (
                  <div className="space-y-2">
                    {contextChips.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {contextChips.slice(0, 3).map((chip) => (
                          <button
                            key={`insert-${chip.label}-${chip.value}`}
                            type="button"
                            onClick={() => {
                              const insert = `${chip.label}: ${chip.value}`;
                              setMessageInput((prev) => prev.trim() ? `${prev.trim()}\n${insert}` : insert);
                            }}
                            className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Add {chip.label.toLowerCase()}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                    {messageTemplates.map((template) => (
                      <button
                        key={template.label}
                        type="button"
                        onClick={() => setMessageInput(template.body)}
                        className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        {template.label}
                      </button>
                    ))}
                    </div>
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowOfferComposer((prev) => !prev)}
                    className={`h-10 px-3 rounded border text-sm font-medium ${
                      showOfferComposer
                        ? 'border-blue-600 text-blue-700 bg-blue-50'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                    title="Send structured quote terms"
                    data-testid="toggle-offer-composer"
                  >
                    <span className="inline-flex items-center gap-1"><BadgeDollarSign className="w-4 h-4" /> Quote</span>
                  </button>
                  <button
                    type="button"
                    onClick={sendPricingRequest}
                    disabled={requestingPricing || !activeConversationId}
                    className={`h-10 px-3 rounded border text-sm font-medium ${
                      requestingPricing
                        ? 'border-purple-600 text-purple-700 bg-purple-50'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title="Request pricing from the other party"
                    data-testid="request-pricing"
                  >
                    <span className="inline-flex items-center gap-1">Request Pricing</span>
                  </button>
                  <textarea
                    rows={1}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder={activeConversationId ? 'Type a message...' : 'Select a conversation first'}
                    disabled={!activeConversationId || sending}
                    className="flex-1 min-h-[40px] max-h-28 resize-y px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={!activeConversationId || sending || !messageInput.trim()}
                    className="h-10 w-10 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500">
                  {currentRole === 'GROWER' ? 'You are messaging as Grower' : 'You are messaging as Dispensary'} • Quotes set terms only; wholesale payment is handled directly.
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
