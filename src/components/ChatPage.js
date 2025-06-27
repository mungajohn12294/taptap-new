import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { database, storage } from '../firebase';
import { ref as dbRef, onValue, push, serverTimestamp } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useParams, useNavigate } from 'react-router-dom';

const ChatPage = ({ currentUser }) => {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser || !chatId) {
      console.error('Missing currentUser or chatId:', { currentUser, chatId });
      setError('Invalid chat. Returning to main.');
      setTimeout(() => navigate('/main'), 2000);
      return;
    }

    const messagesRef = dbRef(database, `chats/${chatId}/messages`);
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
        setMessages(msgs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)));
      },
      (error) => {
        console.error('Error fetching messages:', error);
        setError('Failed to load messages. Please try again.');
      }
    );

    return () => {
      console.log('Unsubscribing from:', `chats/${chatId}/messages`);
      unsubscribe();
    };
  }, [chatId, currentUser, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !file) {
      setError('Message or file required');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const messagesRef = dbRef(database, `chats/${chatId}/messages`);
      let messageData = {
        sender: currentUser.uid,
        timestamp: serverTimestamp(),
      };

      if (newMessage.trim()) {
        messageData.text = newMessage;
      }

      if (file) {
        const fileRef = storageRef(storage, `chat_files/${chatId}/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        const fileURL = await getDownloadURL(fileRef);
        messageData.fileURL = fileURL;
        messageData.fileName = file.name;
        messageData.fileType = file.type;
      }

      console.log('Sending message:', messageData);
      await push(messagesRef, messageData);
      setNewMessage('');
      setFile(null);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
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
      {error && (
        <motion.p
          className="text-red-400 text-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </motion.p>
      )}
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
                {msg.text && <p>{msg.text}</p>}
                {msg.fileURL && (
                  <div className="mt-2">
                    {msg.fileType.startsWith('image/') ? (
                      <img
                        src={msg.fileURL}
                        alt={msg.fileName}
                        className="max-w-full rounded-lg"
                      />
                    ) : msg.fileType.startsWith('video/') ? (
                      <video
                        src={msg.fileURL}
                        controls
                        className="max-w-full rounded-lg"
                      />
                    ) : (
                      <a
                        href={msg.fileURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 underline"
                      >
                        {msg.fileName}
                      </a>
                    )}
                  </div>
                )}
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
        <div className="flex flex-col space-y-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="p-3 bg-transparent border border-cyan-400 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-600"
          />
          <div className="flex space-x-4">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files[0])}
              className="p-3 bg-transparent border border-cyan-400 rounded-lg text-white"
            />
            <motion.button
              type="submit"
              className={`p-3 ${loading ? 'bg-gray-500' : 'bg-cyan-400'} text-black rounded-lg font-semibold hover:bg-cyan-500`}
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {loading ? 'Sending...' : 'Send'}
            </motion.button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatPage;
