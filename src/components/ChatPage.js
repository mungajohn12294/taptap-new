import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { database } from '../firebase';
import { ref, onValue, push, serverTimestamp } from 'firebase/database';
import { useParams, useNavigate } from 'react-router-dom';

const ChatPage = ({ currentUser }) => {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser || !chatId) {
      console.error('Missing currentUser or chatId:', { currentUser, chatId });
      return;
    }

    const messagesRef = ref(database, `chats/${chatId}/messages`);
    console.log('Subscribing to:', `chats/${chatId}/messages`);

    const unsubscribe = onValue(
      messagesRef,
      (snapshot) => {
        const msgs = [];
        if (snapshot.exists()) {
          snapshot.forEach((child) => {
            const message = child.val();
            msgs.push({ id: child.key, ...message });
          });
          console.log('Fetched messages:', msgs);
        } else {
          console.log('No messages in chat:', chatId);
        }
        setMessages(msgs);
      },
      (error) => {
        console.error('Error fetching messages:', error);
      }
    );

    return () => {
      console.log('Unsubscribing from:', `chats/${chatId}/messages`);
      unsubscribe();
    };
  }, [chatId, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      console.log('Sending message:', { text: newMessage, sender: currentUser.uid });
      await push(ref(database, `chats/${chatId}/messages`), {
        sender: currentUser.uid,
        text: newMessage,
        timestamp: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-purple-900 flex flex-col">
      <motion.div
        className="flex justify-between p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-cyan-400">Chat</h1>
        <motion.button
          onClick={() => navigate('/main')}
          className="p-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          Back to Main
        </motion.button>
      </motion.div>
      <div className="flex-1 p-6 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-center">No messages yet. Start chatting!</p>
        ) : (
          messages.map((msg) => (
            <motion.div
              key={msg.id}
              className={`flex ${msg.sender === currentUser.uid ? 'justify-end' : 'justify-start'} mb-4`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div
                className={`max-w-xs p-3 rounded-lg ${
                  msg.sender === currentUser.uid
                    ? 'bg-cyan-400 text-black'
                    : 'bg-white bg-opacity-10 text-white'
                }`}
              >
                <p>{msg.text}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : 'Sending...'}
                </p>
              </div>
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="p-6">
        <div className="flex space-x-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-3 bg-transparent border border-cyan-400 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-600"
          />
          <motion.button
            type="submit"
            className="p-3 bg-cyan-400 text-black rounded-lg font-semibold hover:bg-cyan-500"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Send
          </motion.button>
        </div>
      </form>
    </div>
  );
};

export default ChatPage;
