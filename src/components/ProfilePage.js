import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { auth, database } from '../firebase';
import { ref, update, get } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { serverTimestamp } from 'firebase/database';

const ProfilePage = ({ currentUser }) => {
  const [profile, setProfile] = useState({
    displayName: '',
    location: '',
    dateOfBirth: '',
    bio: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;
    const userRef = ref(database, `users/${currentUser.uid}`);
    get(userRef).then((snapshot) => {
      if (snapshot.exists()) {
        console.log('Fetched profile:', snapshot.val());
        setProfile(snapshot.val());
      }
    }).catch((err) => {
      console.error('Error fetching profile:', err);
    });
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!profile.displayName.trim()) {
      setError('Display name is required');
      setLoading(false);
      return;
    }

    try {
      const userRef = ref(database, `users/${currentUser.uid}`);
      const updatedProfile = {
        ...profile,
        email: currentUser.email,
        online: true,
        lastActive: serverTimestamp(),
      };
      console.log('Saving profile:', updatedProfile);
      await update(userRef, updatedProfile);
      navigate('/main');
    } catch (err) {
      setError(err.message);
      console.error('Profile update error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-purple-900 flex items-center justify-center p-4">
      <motion.div
        className="bg-white bg-opacity-10 backdrop-blur-lg p-8 rounded-xl border border-cyan-500 border-opacity-50 max-w-md w-full"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold text-cyan-400 mb-6 text-center">
          Create Your Profile
        </h2>
        {error && (
          <motion.p
            className="text-red-400 mb-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 mb-1">Display Name</label>
            <input
              type="text"
              value={profile.displayName}
              onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
              className="w-full p-3 bg-transparent border border-cyan-400 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-600"
              placeholder="Enter your name"
              required
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Location</label>
            <input
              type="text"
              value={profile.location}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              className="w-full p-3 bg-transparent border border-cyan-400 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-600"
              placeholder="e.g., Nairobi, Kenya"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Date of Birth</label>
            <input
              type="date"
              value={profile.dateOfBirth}
              onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
              className="w-full p-3 bg-transparent border border-cyan-400 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-600"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Bio</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="w-full p-3 bg-transparent border border-cyan-400 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-600"
              placeholder="Tell us about yourself"
              rows="4"
            />
          </div>
          <motion.button
            type="submit"
            className={`w-full p-3 ${loading ? 'bg-gray-500' : 'bg-cyan-400'} text-black rounded-lg font-semibold hover:bg-cyan-500`}
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
