import React, { useEffect, useState } from 'react';
import OrderTable from '../components/OrderTable';

const STATUSES = ["Collected", "Washing", "Washing Finished", "Ready", "Out for Delivery", "Delivered"];

export default function Dashboard({ token, onLogout }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (token) fetchOrders();
  }, [token]);

  async function fetchOrders() {
    const res = await fetch('http://localhost:4000/api/orders', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const data = await res.json();
    setOrders(data);
  }

  async function addOrder(payload) {
    const res = await fetch('http://localhost:4000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify(payload)
    });
    const order = await res.json();
    setOrders(prev => [order, ...prev]);
  }

  async function updateOrder(id, payload) {
    const res = await fetch(`http://localhost:4000/api/orders/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify(payload)
    });
    const updated = await res.json();
    setOrders(prev => prev.map(o => (o.id === updated.id ? updated : o)));
  }

  return (
    <div className="p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Laundry Dashboard</h1>
        <button
          onClick={onLogout}
          className="px-3 py-1 border rounded hover:bg-gray-100"
        >
          Logout
        </button>
      </header>

      <section className="mb-4 grid grid-cols-3 gap-4">
        {STATUSES.slice(0, 3).map(s => (
          <div key={s} className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">{s}</div>
            <div className="text-2xl font-semibold">
              {orders.filter(o => o.status === s).length}
            </div>
          </div>
        ))}
      </section>

      <OrderTable
        orders={orders}
        onRefresh={fetchOrders}
        onUpdate={updateOrder}
        onAdd={addOrder}
        token={token}
      />
    </div>
  );
}
