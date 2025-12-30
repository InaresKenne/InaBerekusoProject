import { useState, useEffect, useRef, useCallback } from 'react';
import { FiSend, FiMessageCircle, FiX } from 'react-icons/fi';
import useAuthStore from '../store/authStore';
import socketService from '../services/socket.service';
import api from '../utils/api';

function TripChat({ tripId, otherUser }) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/messages/${tripId}`);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleNewMessage = useCallback((data) => {
    // Backend sends { message: messageObject }, extract it
    const message = data.message || data;
    
    // Validate message object
    if (!message || !message._id || !message.message) {
      console.warn('Invalid message received:', data);
      return;
    }
    
    // Prevent duplicates - check if message already exists
    setMessages(prev => {
      // Check by ID (convert both to strings for comparison)
      const messageId = message._id?.toString();
      const exists = prev.some(msg => {
        const existingId = msg._id?.toString();
        return existingId === messageId;
      });
      
      if (exists) {
        return prev; // Skip duplicate
      }
      
      return [...prev, message];
    });
    
    // Increment unread count if chat is closed and message is from other user
    if (!isOpen && message.sender && message.sender._id !== user._id) {
      setUnreadCount(prev => prev + 1);
    }
  }, [isOpen, user._id]);

  useEffect(() => {
    if (tripId) {
      fetchMessages();
      
      // Join trip room
      socketService.joinTrip(tripId);
      
      // Listen for new messages
      socketService.onNewMessage(handleNewMessage);

      return () => {
        socketService.leaveTrip(tripId);
        socketService.offEvent('new_message');
      };
    }
  }, [tripId, handleNewMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage;
    setNewMessage('');

    try {
      const response = await api.post('/messages', {
        tripId,
        message: messageText
      });
      
      // Add message from API response (socket will also send it, but duplicate check will prevent double display)
      if (response.data && response.data.message) {
        setMessages(prev => {
          const newMsg = response.data.message;
          const msgId = newMsg._id?.toString();
          const exists = prev.some(msg => msg._id?.toString() === msgId);
          if (exists) return prev;
          return [...prev, newMsg];
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore the message text so user can retry
      setNewMessage(messageText);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-primary text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-all z-40"
      >
        <div className="relative">
          <FiMessageCircle className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 bg-white rounded-lg shadow-2xl z-50 flex flex-col" style={{ height: '500px' }}>
          {/* Header */}
          <div className="bg-primary text-white p-4 rounded-t-lg flex items-center justify-between">
            <div>
              <h3 className="font-semibold">
                {otherUser?.firstName} {otherUser?.lastName}
              </h3>
              <p className="text-xs text-blue-100">Trip Chat</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 rounded p-1">
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg) => {
              // Skip invalid messages
              if (!msg || !msg._id || !msg.message || typeof msg.message !== 'string') {
                console.warn('Skipping invalid message:', msg);
                return null;
              }
              
              const isOwn = msg.sender?._id === user._id;
              return (
                <div
                  key={msg._id?.toString()}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      isOwn
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    {!isOwn && msg.sender?.firstName && (
                      <p className="text-xs font-semibold mb-1">
                        {msg.sender.firstName}
                      </p>
                    )}
                    <p className="text-sm">{msg.message}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwn ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiSend className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export default TripChat;
