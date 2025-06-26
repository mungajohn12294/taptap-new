import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { database } from '../firebase';
import { ref, push, onValue } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { serverTimestamp } from 'firebase/database';

const PostsPage = ({ currentUser }) => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;
    const postsRef = ref(database, 'posts');
    console.log('Subscribing to postsRef:', postsRef.path);

    const unsubscribe = onValue(
      postsRef,
      (snapshot) => {
        const postList = [];
        if (snapshot.exists()) {
          snapshot.forEach((child) => {
            const post = child.val();
            postList.push({ id: child.key, ...post });
          });
          console.log('Fetched posts:', postList);
        } else {
          console.log('No posts found');
        }
        setPosts(postList.reverse()); // Newest first
      },
      (error) => {
        console.error('Error fetching posts:', error);
      }
    );

    return () => {
      console.log('Unsubscribing from postsRef');
      unsubscribe();
    };
  }, [currentUser]);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!newPost.trim()) {
      setError('Post cannot be empty');
      setLoading(false);
      return;
    }

    try {
      const postsRef = ref(database, 'posts');
      await push(postsRef, {
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email.split('@')[0],
        text: newPost,
        timestamp: serverTimestamp(),
      });
      setNewPost('');
    } catch (err) {
      setError(err.message);
      console.error('Error creating post:', err);
    } finally {
      setLoading(false);
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
        Community Posts
      </motion.h1>
      <motion.button
        onClick={() => navigate('/main')}
        className="mb-4 p-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900"
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        Back to Main
      </motion.button>
      {error && (
        <motion.p
          className="text-red-400 mb-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </motion.p>
      )}
      <div className="bg-white bg-opacity-10 backdrop-blur-lg p-6 rounded-xl border border-cyan-500 border-opacity-50 max-w-md mx-auto mb-6">
        <form onSubmit={handlePostSubmit} className="space-y-4">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="w-full p-3 bg-transparent border border-cyan-400 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-600"
            placeholder="What's on your mind?"
            rows="4"
          />
          <motion.button
            type="submit"
            className={`w-full p-3 ${loading ? 'bg-gray-500' : 'bg-cyan-400'} text-black rounded-lg font-semibold hover:bg-cyan-500`}
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {loading ? 'Posting...' : 'Post'}
          </motion.button>
        </form>
      </div>
      <div className="space-y-4 max-w-2xl mx-auto">
        {posts.length === 0 ? (
          <p className="text-gray-400 text-center">No posts yet. Be the first!</p>
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
      </div>
    </div>
  );
};

export default PostsPage;
