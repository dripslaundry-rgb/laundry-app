import React from 'react';

const STATUSES = ["Collected", "Washing", "Washing Finished", "Ready", "Out for Delivery", "Delivered"];

export default function OrderTable({ orders, onRefresh, onUpdate, onAdd, token }) {
  async function changeStatus(order, dir) {
    const idx = STATUSES.indexOf(order.status);
    const newIdx = Math.max(0, Math.min(STATUSES.length - 1, idx + dir));
    const newStatus = STATUSES[newIdx];
    await onUpdate(order.id, { ...order, status: newStatus });
  }

  async function exportCSV() {
    const res = await fetch('http://localhost:4000/api/orders-export', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orders.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="flex justify-between mb-3">
        <div className="flex gap-2">
          <button
            onClick={() => onAdd({ customer: 'New Customer', phone: '', items: 1, status: 'Collected', estReady: '' })}
            className="px-3 py-1 border rounded hover:bg-gray-50"
          >
            New Order
          </button>
          <button onClick={exportCSV} className="px-3 py-1 border rounded hover:bg-gray-50">
            Export CSV
          </button>
        </div>
        <button onClick={onRefresh} className="px-3 py-1 border rounded hover:bg-gray-50">
          Refresh
        </button>
      </div>

      <table className="w-full text-left">
        <thead className="text-sm text-gray-600">
          <tr>
            <th className="px-2 py-1">ID</th>
            <th className="px-2 py-1">Customer</th>
            <th className="px-2 py-1">Phone</th>
            <th className="px-2 py-1">Items</th>
            <th className="px-2 py-1">Status</th>
            <th className="px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id} className="border-t">
              <td className="px-2 py-1">{o.id}</td>
              <td className="px-2 py-1">{o.customer}</td>
              <td className="px-2 py-1">{o.phone}</td>
              <td className="px-2 py-1">{o.items}</td>
              <td className="px-2 py-1">{o.status}</td>
              <td className="px-2 py-1 space-x-1">
                <button onClick={() => changeStatus(o, -1)} className="px-2 py-1 border rounded hover:bg-gray-50">
                  ←
                </button>
                <button onClick={() => changeStatus(o, +1)} className="px-2 py-1 border rounded hover:bg-gray-50">
                  →
                </button>
                <a
                  className="ml-2 text-indigo-600 hover:underline"
                  href={`http://localhost:4000/api/orders/${o.id}/invoice`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Invoice
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
