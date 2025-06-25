import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { auth, database } from '../firebase';
import { ref, onValue, set } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { serverTimestamp } from 'firebase/database';

const MainPage = ({ currentUser }) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      console.log('No currentUser, skipping user fetch');
      return;
    }

    console.log('Current user:', currentUser.uid, currentUser.email);
    const usersRef = ref(database, 'users');
    console.log('Subscribing to usersRef:', usersRef.path);

    const unsubscribe = onValue(
      usersRef,
      (snapshot) => {
        const users = [];
        if (snapshot.exists()) {
          snapshot.forEach((child) => {
            const user = child.val();
            console.log('Raw user data:', child.key, user);
            if (user.online && child.key !== currentUser.uid) {
              users.push({ id: child.key, ...user });
            }
          });
          console.log('Filtered online users:', users);
        } else {
          console.log('No users found in database');
        }
        // Sort by location proximity (basic: same location first)
        const sortedUsers = users.sort((a, b) => {
          if (a.location === currentUser.location && b.location !== currentUser.location) return -1;
          if (a.location !== currentUser.location && b.location === currentUser.location) return 1;
          return 0;
        });
        setOnlineUsers(sortedUsers);
      },
      (error) => {
        console.error('Error fetching users:', error);
      }
    );

    return () => {
      console.log('Unsubscribing from usersRef');
      unsubscribe();
    };
  }, [currentUser]);

  const startChat = async (selectedUserId) => {
    const chatId = [currentUser.uid, selectedUserId].sort().join('_');
    try {
      console.log('Starting chat:', chatId, 'Participants:', currentUser.uid, selectedUserId);
      await set(ref(database, `chats/${chatId}`), {
        participants: {
          [currentUser.uid]: true,
          [selectedUserId]: true,
        },
        createdAt: serverTimestamp(),
      });
      console.log('Chat created, navigating to:', `/chat/${chatId}`);
      navigate(`/chat/${chatId}`);
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-purple-900 p-6">
      <motion.h1
        className="text-4xl font-bold text-cyan-500 mb-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        TapTap Community
      </motion.h1>
      <div className="flex justify-between mb-4">
        <motion.button
          onClick={() => navigate('/settings')}
          className="p-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          Settings
        </motion.button>
        <motion.button
          onClick={() => navigate('/posts')}
          className="p-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          Posts
        </motion.button>
        <motion.button
          onClick={() => auth.signOut()}
          className="p-2 bg-red-800 text-white rounded-lg hover:bg-red-900"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          Log Out
        </motion.button>
      </div>
      <h2 className="text-2xl font-semibold text-cyan-400 mb-4">Online Users</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {onlineUsers.length === 0 ? (
          <p className="text-gray-400 text-center">No users online. Invite friends to TapTap!</p>
        ) : (
          onlineUsers.map((user) => (
            <motion.div
              key={user.id}
              className="p-4 rounded-lg bg-white bg-opacity-10 backdrop-blur-lg border border-cyan-500 border-opacity-50 cursor-pointer hover:bg-opacity-20"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => startChat(user.id)}
            >
              <h3 className="text-lg font-semibold text-cyan-500">{user.displayName}</h3>
              <p className="text-gray-400">{user.email}</p>
              {user.location && <p className="text-gray-400">📍 {user.location}</p>}
              <span className="inline-block w-2 h-2 bg-green-400 rounded-full mt-2"></span>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default MainPage;
