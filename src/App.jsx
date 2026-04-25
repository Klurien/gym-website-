import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navigation from './components/Navigation';
import Header from './components/Header';
import Feed from './pages/Feed';
import Messages from './pages/Messages';
import Calendar from './pages/Calendar';
import Tasks from './pages/Tasks';
import Live from './pages/Live';

function Layout({ children }) {
  const location = useLocation();
  // Don't show header/nav on immersive screens like Live
  const isImmersive = location.pathname.includes('/live');

  return (
    <div className="relative">
      {!isImmersive && <Header />}
      {children}
      {!isImmersive && <Navigation />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/live" element={<Live />} />
        </Routes>
      </Layout>
    </Router>
  );
}
