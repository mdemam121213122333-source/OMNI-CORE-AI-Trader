import React, { useState, useEffect } from 'react';
// FIX: Separating value and type imports for Firebase to resolve potential module resolution issues.
import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, User, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import Login from './components/Login';
import Layout from './components/Layout';
import { firebaseConfig } from './constants';

// --- Firebase Initialization ---
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  console.log("Firebase Connected Successfully.");
} catch (error) {
  console.error("Firebase connection failed.", error);
  // In a real app, you might show a full-page error here
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Apply saved theme from local storage on initial load
    const savedTheme = localStorage.getItem('omni-core-theme') || 'omni-core';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-tertiary)] text-[var(--text-primary)]">
        Initializing OMNI-CORE AI...
      </div>
    );
  }

  return (
    <div className="min-h-screen antialiased">
      {user ? <Layout user={user} auth={auth} db={db} /> : <Login auth={auth} />}
    </div>
  );
};

export default App;
