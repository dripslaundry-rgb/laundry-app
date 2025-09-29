import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Store/Branch');

  async function submit(e) {
    e.preventDefault();
    const res = await fetch('http://localhost:4000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      const data = await res.json();
      onLogin(data.token);
    } else {
      alert('Login failed: invalid credentials');
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded shadow">
        <h2 className="text-2xl font-bold mb-2">Sign in your account</h2>
        <p className="text-sm text-gray-500 mb-4">
          Welcome back! Login with your data that you entered during registration
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm">User Name</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border px-2 py-1 rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border px-2 py-1 rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm">Continue With</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border px-2 py-1 rounded"
            >
              <option>Master Admin</option>
              <option>Sub Admin</option>
              <option>Store/Branch</option>
              <option>Sub Store</option>
              <option>Customer</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input type="checkbox" />
              <span className="text-sm">Remember my preference</span>
            </div>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">
              Sign Me In
            </button>
          </div>
        </form>
        <div className="mt-4 text-sm">
          <a className="text-indigo-600 mr-4" href="/signup-customer">
            Sign up as customer
          </a>
          <a className="text-indigo-600" href="/signup-store">
            Sign up as store/branch
          </a>
        </div>
      </div>
    </div>
  );
}
