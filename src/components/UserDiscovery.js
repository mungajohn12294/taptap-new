import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { auth, database } from '../firebase';
import { ref, onValue, set } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { serverTimestamp } from 'firebase/database';

const MainPage = ({ currentUser }) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      console.log('No currentUser, skipping fetches');
      return;
    }

    // Fetch online users
    const usersRef = ref(database, 'users');
    const usersUnsubscribe = onValue(
      usersRef,
      (snapshot) => {
        const users = [];
        if (snapshot.exists()) {
          snapshot.forEach((child) => {
            const user = child.val();
            if (user.online && child.key !== currentUser.uid) {
              users.push({ id: child.key, ...user });
            }
          });
          console.log('Filtered online users:', users);
        } else {
          console.log('No users found');
        }
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

    // Fetch chats
    const chatsRef = ref(database, 'chats');
    const chatsUnsubscribe = onValue(
      chatsRef,
      (snapshot) => {
        const chatList = [];
        if (snapshot.exists()) {
          snapshot.forEach((child) => {
            const chat = child.val();
            if (chat.participants && chat.participants[currentUser.uid]) {
              chatList.push({ id: child.key, ...chat });
            }
          });
          console.log('Fetched chats:', chatList);
        }
        setChats(chatList);
      },
      (error) => {
        console.error('Error fetching chats:', error);
      }
    );

    // Fetch recent posts (limit to 3)
    const postsRef = ref(database, 'posts');
    const postsUnsubscribe = onValue(
      postsRef,
      (snapshot) => {
        const postList = [];
        if (snapshot.exists()) {
          snapshot.forEach((child) => {
            const post = child.val();
            postList.push({ id: child.key, ...post });
          });
          console.log('Fetched posts:', postList);
        }
        setPosts(postList.slice(0, 3).reverse());
      },
      (error) => {
        console.error('Error fetching posts:', error);
      }
    );

    return () => {
      usersUnsubscribe();
      chatsUnsubscribe();
      postsUnsubscribe();
      console.log('Unsubscribed from users, chats, posts');
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
      <h2 className="text-2xl font-semibold text-cyan-400 mb-4">Your Chats</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {chats.length === 0 ? (
          <p className="text-gray-400 text-center">No chats yet. Start one!</p>
        ) : (
          chats.map((chat) => (
            <motion.div
              key={chat.id}
              className="p-4 rounded-lg bg-white bg-opacity-10 backdrop-blur-lg border border-cyan-500 border-opacity-50 cursor-pointer hover:bg-opacity-20"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              onClick={() => navigate(`/chat/${chat.id}`)}
            >
              <p className="text-cyan-500">Chat with {Object.keys(chat.participants).find(id => id !== currentUser.uid)}</p>
            </motion.div>
          ))
        )}
      </div>
      <h2 className="text-2xl font-semibold text-cyan-400 mb-4">Find Friends</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {onlineUsers.length === 0 ? (
          <p className="text-gray-400 text-center">No users online. Invite friends!</p>
        ) : (
          onlineUsers.map((user) => (
            <motion.div
              key={user.id}
              className="p-4 rounded-lg bg-white bg-opacity-10 backdrop-blur-lg border border-cyan-500 border-opacity-50 cursor-pointer hover:bg-opacity-20"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
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
      <h2 className="text-2xl font-semibold text-cyan-400 mb-4">Recent Posts</h2>
      <div className="space-y-4 max-w-2xl mx-auto">
        {posts.length === 0 ? (
          <p className="text-gray-400 text-center">No posts yet. Share something!</p>
        ) : (
          posts.map((post) => (
            <motion.div
              key={post.id}
              className="p-4 rounded-lg bg-white bg-opacity-10 backdrop-blur-lg border border-cyan-500 border-opacity-50"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-white">{post.text}</p>
              <p className="text-gray-400 text-sm mt-2">
                By {post.authorName} at {post.timestamp ? new Date(post.timestamp).toLocaleString() : 'Just now'}
              </p>
            </motion.div>
          ))
        )}
        <motion.button
          onClick={() => navigate('/posts')}
          className="mt-4 p-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          View All Posts
        </motion.button>
      </div>
    </div>
  );
};

export default MainPage;
