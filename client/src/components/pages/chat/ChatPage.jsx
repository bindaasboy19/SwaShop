import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Send,
  MessageSquare,
  Store,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  Navigation,
  ArrowLeft,
  Search,
  Package,
  User as UserIcon,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import axiosClient from '../../../api/axiosClient.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';

const ChatPage = () => {
  const { user, isSeller } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const querySellerId = searchParams.get('sellerId');
  const queryProductId = searchParams.get('productId');
  const queryConversationId = searchParams.get('conversationId');

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Fetch all conversations on mount
  const fetchConversations = async (selectTargetId = null) => {
    try {
      const res = await axiosClient.get('/chat/conversations');
      if (res.success) {
        setConversations(res.conversations || []);

        if (selectTargetId) {
          const found = res.conversations.find((c) => c._id === selectTargetId);
          if (found) setActiveConversation(found);
        } else if (!activeConversation && res.conversations.length > 0 && !querySellerId) {
          setActiveConversation(res.conversations[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  useEffect(() => {
    // If sellerId is passed in URL, initiate or get that conversation
    const initChat = async () => {
      if (querySellerId) {
        try {
          setIsLoadingMessages(true);
          const res = await axiosClient.post('/chat/conversations', {
            sellerId: querySellerId,
            productId: queryProductId || null
          });
          if (res.success) {
            setActiveConversation(res.conversation);
            await fetchConversations(res.conversation._id);
          }
        } catch (err) {
          showToast(err.message || 'Could not open chat with shop.', 'error');
          await fetchConversations();
        } finally {
          setIsLoadingMessages(false);
        }
      } else if (queryConversationId) {
        await fetchConversations(queryConversationId);
      } else {
        await fetchConversations();
      }
    };

    initChat();
  }, [querySellerId, queryProductId, queryConversationId]);

  // 2. Fetch messages for active conversation
  const fetchMessages = async (convId, silent = false) => {
    if (!convId) return;
    if (!silent) setIsLoadingMessages(true);
    try {
      const res = await axiosClient.get(`/chat/conversations/${convId}/messages`);
      if (res.success) {
        setMessages(res.messages || []);
        if (res.conversation) {
          setActiveConversation(res.conversation);
        }
      }
    } catch (err) {
      if (!silent) showToast(err.message || 'Failed to load messages.', 'error');
    } finally {
      if (!silent) setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (activeConversation?._id) {
      fetchMessages(activeConversation._id);
      scrollToBottom();
    }
  }, [activeConversation?._id]);

  // 3. Polling for live updates every 3.5s while chat is active
  useEffect(() => {
    if (!activeConversation?._id) return;

    const interval = setInterval(() => {
      fetchMessages(activeConversation._id, true);
    }, 3500);

    return () => clearInterval(interval);
  }, [activeConversation?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle Send Message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !activeConversation?._id || isSending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      const res = await axiosClient.post(`/chat/conversations/${activeConversation._id}/messages`, {
        text: textToSend
      });

      if (res.success) {
        setMessages((prev) => [...prev, res.message]);
        scrollToBottom();
        // Refresh conversations list to update snippet
        fetchConversations(activeConversation._id);
      }
    } catch (err) {
      showToast(err.message || 'Could not send message. Please try again.', 'error');
      setInputText(textToSend); // Restore unsent message
    } finally {
      setIsSending(false);
    }
  };

  const isCurrentCustomer =
    activeConversation &&
    user?._id &&
    activeConversation.customerId?._id?.toString() === user._id.toString();

  const otherPartyName = isCurrentCustomer
    ? activeConversation?.sellerId?.businessName || 'Local Shop'
    : activeConversation?.customerId?.name || 'Customer';

  const otherPartyAddress = isCurrentCustomer
    ? `${activeConversation?.sellerId?.address ? `${activeConversation.sellerId.address}, ` : ''}${activeConversation?.sellerId?.city || ''}`
    : '';

  const filteredConversations = conversations.filter((c) => {
    const isCust = c.customerId?._id?.toString() === user?._id?.toString();
    const targetName = isCust ? c.sellerId?.businessName : c.customerId?.name;
    return (targetName || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-brand-600" />
            <span>Messages & Shop Chat</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Connect directly with local shops and artisans to verify product quality, stock, and visiting hours.
          </p>
        </div>

        <Link
          to="/explore"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Discover More Products</span>
        </Link>
      </div>

      {/* Main Chat Grid (Messenger Layout) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[640px] max-h-[780px]">
        {/* Left Column: Conversations List */}
        <div
          className={`md:col-span-4 lg:col-span-4 border-r border-slate-200 flex flex-col bg-slate-50/60 ${
            activeConversation ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Search bar inside list */}
          <div className="p-3.5 border-b border-slate-200 bg-white">
            <div className="relative">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 rounded-xl border border-slate-200 focus:bg-white focus:border-brand-500 outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Conversations Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {isLoadingConversations ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex items-center gap-3 animate-pulse">
                    <div className="w-12 h-12 rounded-2xl bg-slate-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                      <div className="h-3 bg-slate-200 rounded-md w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => {
                const isCust = conv.customerId?._id?.toString() === user?._id?.toString();
                const title = isCust ? conv.sellerId?.businessName : conv.customerId?.name;
                const unread = isCust ? conv.unreadCountCustomer : conv.unreadCountSeller;
                const isSelected = activeConversation?._id === conv._id;

                return (
                  <button
                    key={conv._id}
                    onClick={() => setActiveConversation(conv)}
                    className={`w-full p-3.5 text-left transition flex items-start gap-3 hover:bg-slate-100/80 ${
                      isSelected ? 'bg-amber-50/70 border-l-4 border-brand-600' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 overflow-hidden shrink-0 shadow-2xs relative">
                      {isCust && conv.sellerId?.logo ? (
                        <img src={conv.sellerId.logo} alt={title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm">
                          {title ? title.charAt(0).toUpperCase() : <Store className="w-5 h-5 text-slate-400" />}
                        </div>
                      )}
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white">
                          {unread}
                        </span>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-bold text-slate-900 text-xs truncate">
                          {title || 'Chat Conversation'}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">
                          {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {conv.lastMessage || 'Tap to open chat'}
                      </p>

                      {/* Associated Product Chip */}
                      {conv.productId && (
                        <div className="mt-1.5 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] text-slate-600 w-fit max-w-[200px] truncate">
                          <Package className="w-3 h-3 text-brand-600 shrink-0" />
                          <span className="truncate">{conv.productId.name}</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <MessageSquare className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-600">No active conversations</p>
                <p className="text-[11px] leading-relaxed">
                  Start a conversation from any product or shop page to confirm availability.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Chat Room */}
        <div
          className={`md:col-span-8 lg:col-span-8 flex flex-col bg-white ${
            !activeConversation ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back button */}
                  <button
                    onClick={() => setActiveConversation(null)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 md:hidden"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 overflow-hidden shrink-0 shadow-2xs">
                    {isCurrentCustomer && activeConversation.sellerId?.logo ? (
                      <img
                        src={activeConversation.sellerId.logo}
                        alt={otherPartyName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-sm">
                        {otherPartyName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-slate-900 text-sm truncate">
                        {otherPartyName}
                      </h3>
                      {isCurrentCustomer &&
                        (activeConversation.sellerId?.verificationStatus === 'APPROVED' ||
                          activeConversation.sellerId?.verificationStatus === 'VERIFIED') && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" title="Verified Shop" />
                        )}
                    </div>
                    {otherPartyAddress && (
                      <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{otherPartyAddress}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2">
                  {isCurrentCustomer && activeConversation.sellerId && (
                    <>
                      <Link
                        to={`/sellers/${activeConversation.sellerId._id}`}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1"
                      >
                        <Store className="w-3.5 h-3.5 text-brand-600" />
                        <span className="hidden sm:inline">View Shop</span>
                      </Link>

                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${activeConversation.sellerId.businessName} ${activeConversation.sellerId.city || ''}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition flex items-center gap-1 border border-emerald-200"
                      >
                        <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">Directions</span>
                      </a>
                    </>
                  )}
                </div>
              </div>

              {/* Pinned Product Card (if discussing a product) */}
              {activeConversation.productId && (
                <div className="px-4 py-2.5 bg-amber-50/80 border-b border-amber-200/80 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={
                        activeConversation.productId.images?.[0] ||
                        'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=100'
                      }
                      alt={activeConversation.productId.name}
                      className="w-9 h-9 rounded-lg object-cover border border-amber-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                        Discussing Product:
                      </span>
                      <p className="font-extrabold text-slate-900 truncate">
                        {activeConversation.productId.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-black text-slate-900">
                      ₹{activeConversation.productId.price}
                    </span>
                    <Link
                      to={`/products/${activeConversation.productId._id}`}
                      className="text-brand-700 hover:text-brand-800 underline font-bold"
                    >
                      View
                    </Link>
                  </div>
                </div>
              )}

              {/* Message History Stream */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 bg-slate-50/40">
                {isLoadingMessages ? (
                  <div className="text-center py-12 text-slate-400 text-xs animate-pulse">
                    Loading chat messages...
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((msg) => {
                    const isMe = msg.senderId?.toString() === user?._id?.toString();

                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[80%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                            isMe
                              ? 'bg-brand-600 text-white rounded-br-xs'
                              : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {msg.createdAt
                            ? new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : ''}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    <p className="font-bold text-slate-600">No messages yet.</p>
                    <p className="mt-1">Send a message below to start chatting with {otherPartyName}.</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Inquiry Prompts for Customer */}
              {isCurrentCustomer && (
                <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">
                    Quick Ask:
                  </span>
                  {[
                    'Is this in stock right now?',
                    'Can I visit your shop today?',
                    'What are your store hours today?'
                  ].map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setInputText(prompt)}
                      className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold shrink-0 transition"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat Input Box */}
              <form onSubmit={handleSendMessage} className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Write a message to ${otherPartyName}...`}
                  className="flex-1 px-4 py-2.5 bg-slate-100 rounded-2xl text-xs sm:text-sm border border-slate-200 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="p-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white rounded-2xl shadow-xs transition shrink-0 flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-slate-700 text-base">Select a conversation</h3>
              <p className="text-xs max-w-sm leading-relaxed">
                Choose a shopkeeper or customer conversation from the list to start chatting.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
