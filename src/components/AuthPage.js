import { useState } from 'react';
import { motion } from 'framer-motion';
import { auth, googleProvider, setAuthPersistence } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (rememberMe) {
        await setAuthPersistence();
      }
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      console.log('Auth successful, redirecting to /profile');
      navigate('/profile');
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      if (rememberMe) {
        await setAuthPersistence();
      }
      await signInWithPopup(auth, googleProvider);
      console.log('Google Sign-In successful, redirecting to /profile');
      navigate('/profile');
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
      console.error('Google Sign-In error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setError('Password reset email sent! Check your inbox.');
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
      console.error('Password reset error:', err);
    } finally {
      setLoading(false);
      setShowReset(false);
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
          {isLogin ? 'Welcome Back!' : 'Join TapTap!'}
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
        {!showReset ? (
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-transparent border border-cyan-400 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-600"
                placeholder="Enter your email"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-transparent border border-cyan-400 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-600"
                placeholder="Enter your password"
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center text-gray-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="mr-2"
                />
                Remember Me
              </label>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => setShowReset(true)}
                  className="text-cyan-400 hover:underline"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <motion.button
              type="submit"
              className={`w-full p-3 ${loading ? 'bg-gray-500' : 'bg-cyan-400'} text-black rounded-lg font-semibold hover:bg-cyan-500`}
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {loading ? 'Processing...' : isLogin ? 'Log In' : 'Sign Up'}
            </motion.button>
          </form>
        ) : (
          <div className="space-y-4">
            <label className="block text-gray-400 mb-1">Enter Email for Reset</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-transparent border border-cyan-400 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-600"
              placeholder="Enter your email"
              required
            />
            <motion.button
              onClick={handlePasswordReset}
              className={`w-full p-3 ${loading ? 'bg-gray-500' : 'bg-cyan-400'} text-black rounded-lg font-semibold hover:bg-cyan-500`}
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {loading ? 'Sending...' : 'Send Reset Email'}
            </motion.button>
            <button
              onClick={() => setShowReset(false)}
              className="text-cyan-400 hover:underline"
            >
              Back to Login
            </button>
          </div>
        )}
        <div className="mt-6 text-center">
          <p className="text-gray-400 mb-4">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-cyan-400 hover:underline ml-1"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
          <motion.button
            onClick={handleGoogleSignIn}
            className={`w-full p-3 ${loading ? 'bg-gray-500' : 'bg-white'} text-black rounded-lg font-semibold hover:bg-gray-100 flex items-center justify-center`}
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="w-5 h-5 mr-2"
            />
            Sign in with Google
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
