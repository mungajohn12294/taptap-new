import { motion } from "framer-motion";
import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './components/AuthPage';
import ProfilePage from './components/ProfilePage';
import MainPage from './components/UserDiscovery';
import ChatPage from './components/ChatPage';
import { auth, database } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, update, onDisconnect, serverTimestamp } from 'firebase/database';
import Particles from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [particlesInit, setParticlesInit] = useState(false);

  useEffect(() => {
    loadSlim().then(() => {
      console.log('Particles initialized');
      setParticlesInit(true);
    });
  }, []);

  useEffect(() => {
    console.log('Setting up auth listener');
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        console.log('User signed in:', currentUser.uid, currentUser.email);
        setUser(currentUser);
        const userRef = ref(database, `users/${currentUser.uid}`);
        const userData = {
          email: currentUser.email,
          online: true,
          lastActive: serverTimestamp(),
        };
        console.log('Writing user data:', userData);
        update(userRef, userData)
          .then(() => console.log('User data written successfully'))
          .catch((error) => console.error('Error setting user data:', error));
        onDisconnect(userRef)
          .update({ online: false, lastActive: serverTimestamp() })
          .then(() => console.log('onDisconnect set up'))
          .catch((error) => console.error('Error setting onDisconnect:', error));
      } else {
        console.log('No user signed in');
        setUser(null);
      }
      setIsLoading(false);
    });
    return () => {
      console.log('Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-b from-black to-purple-900 flex items-center justify-center">
      <motion.p
        className="text-cyan-400 text-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        Loading TapTap...
      </motion.p>
    </div>;
  }

  return (
    <div className="relative">
      {particlesInit && (
        <Particles
          options={{
            particles: {
              number: { value: 50 },
              size: { value: { min: 1, max: 3 } },
              move: { enable: true, speed: 0.5 },
              color: { value: '#00f7ff' },
            },
          }}
        />
      )}
      <Router>
        <Routes>
          <Route
            path="/"
            element={user ? <Navigate to="/profile" /> : <AuthPage />}
          />
          <Route
            path="/profile"
            element={user ? <ProfilePage currentUser={user} /> : <Navigate to="/" />}
          />
          <Route
            path="/main"
            element={user ? <MainPage currentUser={user} /> : <Navigate to="/" />}
          />
          <Route
            path="/chat/:chatId"
            element={user ? <ChatPage currentUser={user} /> : <Navigate to="/" />}
          />
          <Route
            path="/settings"
            element={user ? <div>Settings Page (Coming Soon)</div> : <Navigate to="/" />}
          />
          <Route
            path="/posts"
            element={user ? <div>Posts Page (Coming Soon)</div> : <Navigate to="/" />}
          />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
