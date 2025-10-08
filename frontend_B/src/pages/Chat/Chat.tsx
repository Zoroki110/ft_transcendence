import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { api } from '../../services/api';
import { useUser } from '../../contexts/UserContext';
import { storageService } from '../../utils/storage';
import './Chat.css';

interface User {
  id: number;
  username: string;
  displayName?: string;
  avatar?: string;
  isOnline: boolean;
}

interface Message {
  id: number;
  content: string;
  senderId: number;
  sender?: User;
  sentAt: string;
}

interface Conversation {
  user: User;
  lastMessage: {
    content: string;
    sentAt: string;
    senderId: number;
  };
  unreadCount: number;
}

const Chat: React.FC = () => {
  const { userId: urlUserId } = useParams<{ userId: string }>();
  const { user } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const token = storageService.getToken();

    if (!token || !user) {
      return;
    }

    // Connect to chat WebSocket
    const newSocket = io(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/chat`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      newSocket.emit('authenticate', { userId: user.id });
    });

    newSocket.on('connect_error', (error) => {
      console.error('Chat WebSocket error:', error);
    });

    newSocket.on('newPrivateMessage', (message: Message) => {
        if (selectedConversation && message.senderId === selectedConversation.id) {
          setMessages((prev) => [...prev, message]);
          scrollToBottom();
        }
        loadConversations();
      });

      newSocket.on('userTyping', ({ userId, isTyping: typing }: { userId: number; isTyping: boolean }) => {
        if (selectedConversation && userId === selectedConversation.id) {
          setIsTyping(typing);
        }
      });

      newSocket.on('messagesRead', ({ userId }: { userId: number }) => {
        if (selectedConversation && userId === selectedConversation.id) {
          setMessages((prev) =>
            prev.map((msg) => ({ ...msg, isRead: true }))
          );
        }
      });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [user]);

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, []);

  // If URL has userId, select that conversation or create a new one
  useEffect(() => {
    if (urlUserId && user) {
      const userId = parseInt(urlUserId);

      // Check if conversation already exists
      const conv = conversations.find((c) => c.user.id === userId);
      if (conv) {
        selectConversation(conv.user);
      } else {
        // Create a new conversation by fetching the user info
        api.get(`/users/${userId}`).then((response) => {
          const user = response.data;
          // Start a new conversation with this user
          selectConversation({
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatar: user.avatar,
            isOnline: user.isOnline,
          });
        }).catch((error) => {
          console.error('Failed to load user:', error);
        });
      }
    }
  }, [urlUserId, conversations, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const response = await api.get('/chat/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const selectConversation = async (user: User) => {
    setSelectedConversation(user);
    try {
      const response = await api.get(`/chat/conversations/${user.id}`);
      setMessages(response.data);

      // Mark as read
      await api.patch(`/chat/conversations/${user.id}/read`);
      if (socket) {
        socket.emit('markAsRead', { otherUserId: user.id });
      }

      // Update conversations to reset unread count
      loadConversations();
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const sendMessage = () => {
    if (!messageInput.trim() || !selectedConversation || !socket || !user) {
      return;
    }

    socket.emit('sendPrivateMessage', {
      recipientId: selectedConversation.id,
      content: messageInput.trim(),
    });

    // Optimistically add message to UI
    const newMessage: Message = {
      id: Date.now(),
      content: messageInput.trim(),
      senderId: user.id,
      sentAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessageInput('');
    scrollToBottom();
    loadConversations();
  };

  const handleTyping = () => {
    if (!socket || !selectedConversation) return;

    socket.emit('typing', { recipientId: selectedConversation.id, isTyping: true });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { recipientId: selectedConversation.id, isTyping: false });
    }, 1000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-sidebar">
        <h2>Messages</h2>
        <div className="conversations-list">
          {conversations.length > 0 ? (
            conversations.map((conv) => (
              <div
                key={conv.user.id}
                className={`conversation-item ${selectedConversation?.id === conv.user.id ? 'active' : ''}`}
                onClick={() => selectConversation(conv.user)}
              >
                <div className="conversation-info">
                  <h3>{conv.user.displayName || conv.user.username}</h3>
                  <p className="last-message">
                    {conv.lastMessage.senderId === user?.id ? 'You: ' : ''}
                    {conv.lastMessage.content.substring(0, 30)}
                    {conv.lastMessage.content.length > 30 ? '...' : ''}
                  </p>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="unread-badge">{conv.unreadCount}</span>
                )}
              </div>
            ))
          ) : (
            <p className="empty-conversations">No conversations yet</p>
          )}
        </div>
      </div>

      <div className="chat-main">
        {selectedConversation ? (
          <>
            <div className="chat-header">
              <h2>{selectedConversation.displayName || selectedConversation.username}</h2>
            </div>

            <div className="messages-container">
              {messages.map((message, index) => (
                <div
                  key={message.id || index}
                  className={`message ${message.senderId === user?.id ? 'sent' : 'received'}`}
                >
                  <div className="message-content">{message.content}</div>
                  <div className="message-time">
                    {new Date(message.sentAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="message-input-container">
              <textarea
                className="message-input"
                value={messageInput}
                onChange={(e) => {
                  setMessageInput(e.target.value);
                  handleTyping();
                }}
                onKeyDown={handleKeyPress}
                placeholder="Type a message..."
                rows={1}
              />
              <button className="send-button" onClick={sendMessage} disabled={!messageInput.trim()}>
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="no-conversation-selected">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
