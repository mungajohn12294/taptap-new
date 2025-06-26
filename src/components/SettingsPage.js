import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { auth, database } from '../firebase';
import { ref, update, get } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

const SettingsPage = ({ currentUser }) => {
  const [settings, setSettings] = useState({
    theme: 'dark',
    notifications: true,
    profileVisibility: 'public',
  });
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;
    const settingsRef = ref(database, `users/${currentUser.uid}/settings`);
    get(settingsRef).then((snapshot) => {
      if (snapshot.exists()) {
        console.log('Fetched settings:', snapshot.val());
        setSettings(snapshot.val());
      }
    }).catch((err) => {
      console.error('Error fetching settings:', err);
    });
  }, [currentUser]);

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const settingsRef = ref(database, `users/${currentUser.uid}/settings`);
      await update(settingsRef, settings);
      setSuccess('Settings saved successfully!');
    } catch (err) {
      setError(err.message);
      console.error('Error saving settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      if (newEmail) {
        await updateEmail(currentUser, newEmail);
        await update(ref(database, `users/${currentUser.uid}`), { email: newEmail });
      }
      if (newPassword) {
        await updatePassword(currentUser, newPassword);
      }
      setSuccess('Account updated successfully!');
      setNewEmail('');
      setNewPassword('');
      setCurrentPassword('');
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
      console.error('Account update error:', err);
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
        Settings
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
      {success && (
        <motion.p
          className="text-green-400 mb-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {success}
        </motion.p>
      )}
      <div className="bg-white bg-opacity-10 backdrop-blur-lg p-6 rounded-xl border border-cyan-500 border-opacity-50 max-w-md mx-auto">
        <h2 className="text-2xl font-semibold text-cyan-400 mb-4">Preferences</h2>
        <form onSubmit={handleSettingsSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 mb-1">Theme</label>
            <select
              value={settings.theme}
              onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
              className="w-full p-3 bg-transparent border border-cyan-400 rounded-lg text-white"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
          <div>
            <label className="flex items-center text-gray-400">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={() => setSettings({ ...settings, notifications: !settings.notifications })}
                className="mr-2"
              />
              Enable Notifications
            </label>
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Profile Visibility</label>
            <select
              value={settings.profileVisibility}
              onChange={(e) => setSettings({ ...settings, profileVisibility: e.target.value })}
              className="w-full p-3 bg-transparent border border-cyan-400 rounded-lg text-white"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
          <motion.button
            type="submit"
            className={`w-full p-3 ${loading ? 'bg-gray-500' : 'bg-cyan-400'} text-black rounded-lg font-semibold hover:bg-cyan-500`}
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </motion.button>
        </form>
        <h2 className="text-2xl font-semibold text-cyan-400 mt-6 mb-4">Update Account</h2>
        <form onSubmit={handleAccountUpdate} className="space-y-4">
          <div>
            <label className="block text-gray-400 mb-1">New Email (optional)</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full p-3 bg-transparent border border-cyan-400 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-600"
              placeholder="Enter new email"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">New Password (optional)</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 bg-transparent border border-cyan-400 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-600"
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Current Password (required)</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-3 bg-transparent border border-cyan-400 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-600"
              placeholder="Enter current password"
              required
            />
          </div>
          <motion.button
            type="submit"
            className={`w-full p-3 ${loading ? 'bg-gray-500' : 'bg-cyan-400'} text-black rounded-lg font-semibold hover:bg-cyan-500`}
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {loading ? 'Updating...' : 'Update Account'}
          </motion.button>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
