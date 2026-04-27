import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import Navigation from './components/Navigation';
import Header from './components/Header';
import Feed from './pages/Feed';
import Messages from './pages/Messages';
import Calendar from './pages/Calendar';
import Tasks from './pages/Tasks';
import Live from './pages/Live';
import Auth from './pages/Auth';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Timer from './pages/Timer';
import Community from './pages/Community';
import Search from './pages/Search';
import { connectSocket, disconnectSocket } from './services/socket';

function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}

function Layout({ children }) {
  const location = useLocation();
  // Don't show header/nav on immersive screens like Live or Auth
  const isImmersive = location.pathname.includes('/live') || location.pathname.includes('/auth');

  return (
    <div className="relative">
      {!isImmersive && <Header />}
      {children}
      {!isImmersive && <Navigation />}
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Community /></PageWrapper>} />
        <Route path="/feed" element={<PageWrapper><Community /></PageWrapper>} />
        <Route path="/messages" element={<PageWrapper><Messages /></PageWrapper>} />
        <Route path="/calendar" element={<PageWrapper><Calendar /></PageWrapper>} />
        <Route path="/timer" element={<PageWrapper><Timer /></PageWrapper>} />
        <Route path="/tasks" element={<PageWrapper><Tasks /></PageWrapper>} />
        <Route path="/live" element={<PageWrapper><Live /></PageWrapper>} />
        <Route path="/auth" element={<PageWrapper><Auth /></PageWrapper>} />
        <Route path="/admin" element={<PageWrapper><AdminDashboard /></PageWrapper>} />
        <Route path="/profile" element={<PageWrapper><Profile /></PageWrapper>} />
        <Route path="/notifications" element={<PageWrapper><Notifications /></PageWrapper>} />
        <Route path="/community" element={<PageWrapper><Community /></PageWrapper>} />
        <Route path="/search" element={<PageWrapper><Search /></PageWrapper>} />
        
        {/* Legacy Catch-alls to prevent loops */}
        <Route path="/login.html" element={<Navigate to="/auth" replace />} />
        <Route path="/register.html" element={<Navigate to="/auth" replace />} />
        <Route path="/dashboard.html" element={<Navigate to="/feed" replace />} />
        <Route path="/index.html" element={<Navigate to="/" replace />} />
        
        {/* Wildcard catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (token && user.id) {
      connectSocket(token);
    }
    return () => disconnectSocket();
  }, []);

  return (
    <Router>
      <Layout>
        <AnimatedRoutes />
      </Layout>
    </Router>
  );
}
