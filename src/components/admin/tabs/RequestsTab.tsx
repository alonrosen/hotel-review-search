import React, { useState, useEffect, useCallback } from 'react';

export default function RequestsTab({ onFulfillRequest }: { onFulfillRequest?: (request: any) => void }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // We might not need setActiveRequestId etc. here if this is just showing requests.
  // Actually, handleUpdateRequest needs to be implemented.
  const loadRequests = useCallback(() => {
    setRequestsLoading(true);
    fetch("/api/hotel-requests")
      .then(r => r.json())
      .then(data => {
        setRequests(data.requests || []);
        setRequestsLoading(false);
      })
      .catch(() => setRequestsLoading(false));
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleUpdateRequest = async (id: string, action: string) => {
    const note = prompt(`Enter optional admin note for ${action}ing request:`);
    if (note === null) return;
    try {
      await fetch(`/api/admin/hotel-requests/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, adminNote: note || undefined })
      });
      loadRequests();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="section-title">Hotel Requests</div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {requestsLoading ? (
            <div className="table-responsive">
              <table className="table admin-table">
                <thead>
                  <tr>
                    <th>Hotel Name</th><th>Location</th><th>Requested By</th><th>Status</th><th>Date</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3].map(i => (
                    <tr key={i}>
                      <td><div className="loading-skeleton" style={{ width: 120, height: 16 }} /></td>
                      <td><div className="loading-skeleton" style={{ width: 100, height: 16 }} /></td>
                      <td>
                         <div className="loading-skeleton" style={{ width: 100, height: 16, marginBottom: 4 }} />
                         <div className="loading-skeleton" style={{ width: 140, height: 12 }} />
                      </td>
                      <td><div className="loading-skeleton" style={{ width: 80, height: 24, borderRadius: 12 }} /></td>
                      <td><div className="loading-skeleton" style={{ width: 80, height: 16 }} /></td>
                      <td>
                         <div style={{ display: "flex", gap: 8 }}>
                            <div className="loading-skeleton" style={{ width: 80, height: 32, borderRadius: 6 }} />
                            <div className="loading-skeleton" style={{ width: 80, height: 32, borderRadius: 6 }} />
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : requests.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, color: "var(--text-tertiary)" }}>No hotel requests.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--bg-glass)", borderBottom: "1px solid var(--border-color)", textAlign: "left" }}>
                  <th style={{ padding: "12px 8px", color: "var(--text-secondary)", fontWeight: 600 }}>Hotel Name</th>
                  <th style={{ padding: "12px 8px", color: "var(--text-secondary)", fontWeight: 600 }}>Location</th>
                  <th style={{ padding: "12px 8px", color: "var(--text-secondary)", fontWeight: 600 }}>Requested By</th>
                  <th style={{ padding: "12px 8px", color: "var(--text-secondary)", fontWeight: 600 }}>Status</th>
                  <th style={{ padding: "12px 8px", color: "var(--text-secondary)", fontWeight: 600, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "12px 8px", fontWeight: 600 }}>{r.name}</td>
                    <td style={{ padding: "12px 8px", color: "var(--text-secondary)" }}>{[r.city, r.state, r.country].filter(Boolean).join(", ")}</td>
                    <td style={{ padding: "12px 8px", color: "var(--text-secondary)" }}>{r.user?.name} ({r.user?.email})</td>
                    <td style={{ padding: "12px 8px" }}>
                      <span style={{
                        padding: "4px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600,
                        background: r.status === 'approved' ? 'rgba(52, 199, 89, 0.15)' : r.status === 'rejected' ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 149, 0, 0.15)',
                        color: r.status === 'approved' ? 'var(--green)' : r.status === 'rejected' ? 'var(--red)' : 'var(--orange)'
                      }}>
                        {r.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "12px 8px", textAlign: "right" }}>
                      {r.status === 'pending' && (
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          {onFulfillRequest && (
                            <button className="btn btn-primary btn-sm" onClick={() => onFulfillRequest(r)} title="Fulfill">✅ <span className="desktop-only" style={{ marginLeft: 4 }}>Fulfill</span></button>
                          )}
                          <button className="btn btn-secondary btn-sm" onClick={() => handleUpdateRequest(r.id, "reject")} title="Reject">❌ <span className="desktop-only" style={{ marginLeft: 4 }}>Reject</span></button>
                        </div>
                      )}
                      {r.adminNote && (
                        <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>Note: {r.adminNote}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
