import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function NotificationList() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (user && user.status === 'active') {
      fetch("/api/hotel-requests/notifications")
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setNotifications(data);
          }
        })
        .catch(console.error);
    }
  }, [user]);

  const dismissNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await fetch("/api/hotel-requests/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] })
      });
    } catch (err) {
      console.error("Failed to dismiss notification", err);
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="container" style={{ marginTop: 24 }}>
      {notifications.map(n => (
        <div key={n.id} style={{
          background: "rgba(52, 199, 89, 0.1)",
          border: "1px solid rgba(52, 199, 89, 0.2)",
          padding: "16px 20px",
          borderRadius: "var(--radius-md)",
          marginBottom: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <strong style={{ color: "var(--green)", display: "block", marginBottom: 4 }}>Hotel Request Approved!</strong>
            <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>
              Your request to add <strong>{n.name}</strong> has been approved. The hotel is now available for search.
            </span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => dismissNotification(n.id)} style={{ color: "var(--text-tertiary)" }}>
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
}
