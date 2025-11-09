// Architecture Understanding & Separation of Concerns Exercise
//
// This component violates proper architecture principles by:
// 1. Mixing data fetching, business logic, and UI rendering all in one place
// 2. Performing multiple responsibilities within a single component
// 3. Lacking proper separation between API calls, data processing, and UI
// 4. Containing both data fetching and state updates for unrelated features
//
// Your task: Refactor this component by:
// 1. Separating API calls into a dedicated service
// 2. Breaking down the UI into smaller, focused components
// 3. Properly separating business logic from presentation
// 4. Creating a proper architecture with clear separation of concerns

import React, { useState, useEffect } from "react";

const OrdersDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [customerEmails, setCustomerEmails] = useState([]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/orders");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch orders");
      }

      setOrders(data);

      // Calculate total revenue
      const revenue = data.reduce((sum, order) => sum + order.total, 0);
      setTotalRevenue(revenue);

      // Extract customer emails
      const emails = [...new Set(data.map((order) => order.customerEmail))];
      setCustomerEmails(emails);

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Fetch orders
  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter and sort orders
  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true;
    if (filter === "completed") return order.status === "completed";
    if (filter === "processing") return order.status === "processing";
    if (filter === "shipped") return order.status === "shipped";
    return true;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === "date") {
      return new Date(b.date) - new Date(a.date);
    } else if (sortBy === "total") {
      return b.total - a.total;
    }
    return 0;
  });

  // Send reminder email
  const sendReminderEmail = async (orderId) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/send-reminder`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send reminder");
      }

      alert("Reminder email sent successfully");
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Mark order as shipped
  const markAsShipped = async (orderId) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "shipped" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update order");
      }

      setOrders(
        orders.map((order) =>
          order.id === orderId ? { ...order, status: "shipped" } : order
        )
      );
      alert("Order marked as shipped");
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Orders Dashboard</h1>

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Dashboard Summary</h2>
        <p className="mb-1">Total Orders: {orders.length}</p>
        <p className="mb-1">Total Revenue: ${totalRevenue.toFixed(2)}</p>
        <p>Unique Customers: {customerEmails.length}</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md"
        >
          <option value="all">All Orders</option>
          <option value="completed">Completed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md"
        >
          <option value="date">Sort by Date</option>
          <option value="total">Sort by Total</option>
        </select>
      </div>

      <OrdersTableRendering
        sortedOrders={sortedOrders}
        loading={loading}
        error={error}
        markAsShipped={markAsShipped}
        sendReminderEmail={sendReminderEmail}
      />
    </div>
  );
};

const OrdersTableRendering = ({
  sortedOrders,
  loading,
  error,
  sendReminderEmail,
  markAsShipped,
}) => {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded-lg overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Order ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sortedOrders.map((order) => (
            <tr key={order.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                #{order.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {order.customerName}
                <br />
                {order.customerEmail}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(order.date).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${
                        order.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : order.status === "processing"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                >
                  {order.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${order.total.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => sendReminderEmail(order.id)}
                  className="text-indigo-600 hover:text-indigo-900 mr-4"
                >
                  Send Reminder
                </button>
                {order.status !== "shipped" && (
                  <button
                    onClick={() => markAsShipped(order.id)}
                    className="text-green-600 hover:text-green-900"
                  >
                    Mark Shipped
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersDashboard;
