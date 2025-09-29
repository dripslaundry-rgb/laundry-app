import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route path="/login" element={<Login onLogin={(t) => { setToken(t); localStorage.setItem('token', t); navigate('/'); }} />} />
        <Route path="/" element={<Dashboard token={token} onLogout={() => { setToken(null); localStorage.removeItem('token'); navigate('/login'); }} />} />
      </Routes>
    </div>
  );
}

export default App;
