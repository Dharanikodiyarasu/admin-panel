import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

type SenderType = 'me' | 'them' | 'bot';
type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

type Message = {
  id?: string;
  text?: string;
  sender: SenderType;
  time?: string;
  timestamp?: number;
  streaming?: boolean;
  filePath?: string;
  status?: MessageStatus;
};

const SOCKET_URL = 'http://localhost:5000';
const API_BASE = 'http://localhost:5000/api/auth';

let socket: Socket;

const Settings = () => {
  const [iframeError, setIframeError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const textBoxRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const sendSoundRef = useRef<HTMLAudioElement | null>(null);
  const receiveSoundRef = useRef<HTMLAudioElement | null>(null);

  const myRoomId = 'Admin';

  useEffect(() => {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      setIsConnected(true);
      setConnectionError(null);
      socket.emit('join', myRoomId);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
      setIsBotTyping(false);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error', error);
      setIsConnected(false);
      setConnectionError('Connection failed. Please check if the server is running.');
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setConnectionError(null);
    });

    socket.on('reconnect_error', (error) => {
      console.error('❌ Socket reconnection failed:', error);
      setConnectionError('Reconnection failed. Please refresh the page.');
    });

    socket.on('guest-message', (data: any) => {
      console.log('📩 Received guest-message:', data);
      const mapped: Message = {
        text: data.message,
        sender: data.from === myRoomId ? 'me' : data.from === 'AutoBot' ? 'bot' : 'them',
        time: new Date(data.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: data.timestamp || Date.now(),
        streaming: false,
        status: data.from === myRoomId ? 'delivered' : undefined
      };

      setMessages(prev => {
        const noStream = prev.filter(m => !m.streaming);
        const isDuplicate = noStream.some(m =>
          m.text === mapped.text &&
          m.sender === mapped.sender &&
          Math.abs((m.timestamp || 0) - (mapped.timestamp || 0)) < 2000
        );

        if (isDuplicate) {
          console.log('🔄 Duplicate message detected, skipping');
          return prev;
        }

        if (mapped.sender === 'me') {
          const updated = noStream.map(m => {
            if (m.sender === 'me' && m.status === 'sending' &&
              Math.abs((m.timestamp || 0) - (mapped.timestamp || 0)) < 5000) {
              setTimeout(() => {
                setMessages(prev => prev.map(msg =>
                  msg === m ? { ...msg, status: 'read' as MessageStatus } : msg
                ));
              }, 1000);
              return { ...m, status: 'delivered' as MessageStatus };
            }
            return m;
          });
          return updated;
        }

        return [...noStream, mapped].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      });
      setIsBotTyping(false);
    });

    socket.on('bot-typing', () => {
      console.log('⌨️ Bot typing indicator received');
      setIsBotTyping(true);
      setMessages(prev => {
        const existsStreaming = prev.some(m => m.streaming);
        if (existsStreaming) return prev;
        const placeholder: Message = {
          text: '●●●',
          sender: 'bot',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now(),
          streaming: true
        };
        return [...prev, placeholder];
      });
    });

    socket.on('bot-stream', (data: any) => {
      console.log('📡 Streaming chunk received:', data.chunk);
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.streaming && last.sender === 'bot') {
          const updated = [...prev];
          const currentText = last.text === '●●●' ? '' : (last.text || '');
          updated[updated.length - 1] = {
            ...last,
            text: currentText + String(data.chunk || ''),
            timestamp: Date.now()
          };
          return updated;
        } else {
          const streamingMsg: Message = {
            text: String(data.chunk || ''),
            sender: 'bot',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: Date.now(),
            streaming: true
          };
          return [...prev, streamingMsg];
        }
      });
    });

    socket.on('bot-complete', (data: any) => {
      console.log('✅ Bot response complete:', data);
      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.map(m => m.streaming).lastIndexOf(true);
        if (lastIdx >= 0 && updated[lastIdx].sender === 'bot') {
          updated[lastIdx] = {
            ...updated[lastIdx],
            text: String(data.message || updated[lastIdx].text || ''),
            streaming: false,
            timestamp: Date.now(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
        } else {
          updated.push({
            text: String(data.message || ''),
            sender: 'bot',
            timestamp: Date.now(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            streaming: false
          });
        }
        return updated;
      });
      setIsBotTyping(false);
    });

    return () => {
      console.log('🧹 Cleaning up socket listeners');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('reconnect');
      socket.off('reconnect_error');
      socket.off('guest-message');
      socket.off('bot-typing');
      socket.off('bot-stream');
      socket.off('bot-complete');
      socket.disconnect();
    };
  }, [myRoomId]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setIframeError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setIframeError(true);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Chat Page</h2>

      {isLoading && (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          Loading Chat panel...
        </div>
      )}

      {iframeError ? (
        <div style={{
          padding: '20px',
          border: '1px solid #ff6b6b',
          borderRadius: '8px',
          backgroundColor: '#ffe0e0',
          margin: '10px 0'
        }}>
          <h3>Unable to load settings panel</h3>
          <p>The settings server at 192.168.68.196:3000 is not responding.</p>
          <p><strong>Possible solutions:</strong></p>
          <ul>
            <li>Check if the server is running</li>
            <li>Verify network connectivity</li>
            <li>Try accessing the URL directly: <a href="http://192.168.68.196:3000/#/float" target="_blank" rel="noopener noreferrer">http://192.168.68.196:3000/#/float</a></li>
          </ul>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        <iframe
          src="http://192.168.68.196:3000/#/float"
          sandbox="allow-scripts allow-same-origin allow-forms"
          style={{
            width: '100%',
            height: 'calc(100vh - 100px)',
            border: '1px solid #ddd',
            borderRadius: '8px'
          }}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          title="Settings Panel"
        />
      )}
    </div>
  );
};

export default Settings;
