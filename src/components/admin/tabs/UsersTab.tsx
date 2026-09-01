import React, { useState, useEffect, useCallback, Fragment } from 'react';

export default function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const loadUsers = useCallback(() => {
    setUsersLoading(true);
    fetch("/api/admin/users")
      .then(r => r.json())
      .then(data => {
        setUsers(data.users || []);
        setUsersLoading(false);
      })
      .catch(() => setUsersLoading(false));
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleUpdateUserStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/admin/users/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateUserVerification = async (id: string, emailVerified: boolean) => {
    try {
      await fetch(`/api/admin/users/${id}/verify`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailVerified })
      });
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateUserRole = async (id: string, role: string) => {
    try {
      await fetch(`/api/admin/users/${id}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
      });
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="section-title">User Management</div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {usersLoading ? (
            <div className="table-responsive">
              <table className="table admin-table">
                <thead>
                  <tr>
                    <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Verified</th><th>Joined</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4].map(i => (
                    <tr key={i}>
                      <td><div className="loading-skeleton" style={{ width: 100, height: 16 }} /></td>
                      <td><div className="loading-skeleton" style={{ width: 140, height: 16 }} /></td>
                      <td><div className="loading-skeleton" style={{ width: 60, height: 24, borderRadius: 12 }} /></td>
                      <td><div className="loading-skeleton" style={{ width: 80, height: 24, borderRadius: 12 }} /></td>
                      <td><div className="loading-skeleton" style={{ width: 24, height: 24, borderRadius: '50%' }} /></td>
                      <td><div className="loading-skeleton" style={{ width: 80, height: 16 }} /></td>
                      <td><div className="loading-skeleton" style={{ width: 120, height: 32, borderRadius: 16 }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--bg-glass)", borderBottom: "1px solid var(--border-color)", textAlign: "left" }}>
                  <th style={{ padding: "12px 8px", color: "var(--text-secondary)", fontWeight: 600 }}>Name</th>
                  <th style={{ padding: "12px 8px", color: "var(--text-secondary)", fontWeight: 600 }}>Email</th>
                  <th style={{ padding: "12px 8px", color: "var(--text-secondary)", fontWeight: 600 }}>Role</th>
                  <th style={{ padding: "12px 8px", color: "var(--text-secondary)", fontWeight: 600 }}>Status</th>
                  <th style={{ padding: "12px 8px", color: "var(--text-secondary)", fontWeight: 600 }}>Verified</th>
                  <th style={{ padding: "12px 8px", color: "var(--text-secondary)", fontWeight: 600, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <Fragment key={u.id}>
                    <tr style={{ borderBottom: "1px solid var(--border-color)", background: expandedUserId === u.id ? "var(--bg-glass-hover)" : "transparent" }}>
                      <td style={{ padding: "12px 8px", fontWeight: 600 }}>{u.name}</td>
                      <td style={{ padding: "12px 8px", color: "var(--text-secondary)" }}>{u.email}</td>
                      <td style={{ padding: "12px 8px" }}>
                        <select 
                          className="input desktop-only" 
                          value={u.role} 
                          onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                          style={{ padding: "0 8px", fontSize: 13, height: 32, width: "100%", background: u.role === 'admin' ? 'rgba(10,132,255,0.1)' : 'rgba(255,255,255,0.05)', color: u.role === 'admin' ? 'var(--blue)' : 'var(--text-secondary)', border: "none", borderRadius: 8, outline: "none", cursor: "pointer", appearance: "none", WebkitAppearance: "none", MozAppearance: "none" }}
                        >
                          <option value="user" style={{ color: "var(--text-primary)", background: "#111" }}>👤 User</option>
                          <option value="admin" style={{ color: "var(--text-primary)", background: "#111" }}>👑 Admin</option>
                        </select>
                        <select 
                          className="input mobile-only" 
                          value={u.role} 
                          onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                          style={{ padding: "0", textAlign: "center", fontSize: 13, height: 32, width: 32, background: u.role === 'admin' ? 'rgba(10,132,255,0.1)' : 'rgba(255,255,255,0.05)', color: u.role === 'admin' ? 'var(--blue)' : 'var(--text-secondary)', border: "none", borderRadius: 8, outline: "none", cursor: "pointer", appearance: "none", WebkitAppearance: "none", MozAppearance: "none" }}
                        >
                          <option value="user" style={{ color: "var(--text-primary)", background: "#111" }}>👤</option>
                          <option value="admin" style={{ color: "var(--text-primary)", background: "#111" }}>👑</option>
                        </select>
                      </td>
                      <td style={{ padding: "12px 8px" }}>
                        <select 
                          className="input desktop-only" 
                          value={u.status} 
                          onChange={(e) => handleUpdateUserStatus(u.id, e.target.value)}
                          style={{ padding: "0 8px", fontSize: 13, height: 32, width: "100%", background: u.status === 'pending' ? 'rgba(255,149,0,0.1)' : 'rgba(52,199,89,0.1)', color: u.status === 'pending' ? 'var(--orange)' : 'var(--green)', border: "none", borderRadius: 8, outline: "none", cursor: "pointer", appearance: "none", WebkitAppearance: "none", MozAppearance: "none" }}
                        >
                          <option value="active" style={{ color: "var(--text-primary)", background: "#111" }}>✅ Active</option>
                          <option value="pending" style={{ color: "var(--text-primary)", background: "#111" }}>⏳ Pending</option>
                        </select>
                        <select 
                          className="input mobile-only" 
                          value={u.status} 
                          onChange={(e) => handleUpdateUserStatus(u.id, e.target.value)}
                          style={{ padding: "0", textAlign: "center", fontSize: 13, height: 32, width: 32, background: u.status === 'pending' ? 'rgba(255,149,0,0.1)' : 'rgba(52,199,89,0.1)', color: u.status === 'pending' ? 'var(--orange)' : 'var(--green)', border: "none", borderRadius: 8, outline: "none", cursor: "pointer", appearance: "none", WebkitAppearance: "none", MozAppearance: "none" }}
                        >
                          <option value="active" style={{ color: "var(--text-primary)", background: "#111" }}>✅</option>
                          <option value="pending" style={{ color: "var(--text-primary)", background: "#111" }}>⏳</option>
                        </select>
                      </td>
                      <td style={{ padding: "12px 8px" }}>
                        <select 
                          className="input desktop-only" 
                          value={u.emailVerified ? "verified" : "unverified"} 
                          onChange={(e) => handleUpdateUserVerification(u.id, e.target.value === "verified")}
                          style={{ padding: "0 8px", fontSize: 13, height: 32, width: "100%", background: !u.emailVerified ? 'rgba(255,59,48,0.1)' : 'rgba(52,199,89,0.1)', color: !u.emailVerified ? 'var(--red)' : 'var(--green)', border: "none", borderRadius: 8, outline: "none", cursor: "pointer", appearance: "none", WebkitAppearance: "none", MozAppearance: "none" }}
                        >
                          <option value="verified" style={{ color: "var(--text-primary)", background: "#111" }}>🟢 Verified</option>
                          <option value="unverified" style={{ color: "var(--text-primary)", background: "#111" }}>❌ Unverified</option>
                        </select>
                        <select 
                          className="input mobile-only" 
                          value={u.emailVerified ? "verified" : "unverified"} 
                          onChange={(e) => handleUpdateUserVerification(u.id, e.target.value === "verified")}
                          style={{ padding: "0", textAlign: "center", fontSize: 13, height: 32, width: 32, background: !u.emailVerified ? 'rgba(255,59,48,0.1)' : 'rgba(52,199,89,0.1)', color: !u.emailVerified ? 'var(--red)' : 'var(--green)', border: "none", borderRadius: 8, outline: "none", cursor: "pointer", appearance: "none", WebkitAppearance: "none", MozAppearance: "none" }}
                        >
                          <option value="verified" style={{ color: "var(--text-primary)", background: "#111" }}>🟢</option>
                          <option value="unverified" style={{ color: "var(--text-primary)", background: "#111" }}>❌</option>
                        </select>
                      </td>
                      <td style={{ padding: "12px 8px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", flexWrap: "nowrap" }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => setExpandedUserId(expandedUserId === u.id ? null : u.id)} style={{ marginRight: 0, color: "var(--accent)" }} title="Logs">
                          <span>📋</span><span className="desktop-only" style={{ marginLeft: 4 }}>Logs ({u.searchLogs?.length || 0})</span>
                        </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteUser(u.id)} style={{ color: "var(--red)" }} title="Delete">
                          <span>🗑️</span><span className="desktop-only" style={{ marginLeft: 4 }}>Delete</span>
                        </button>
                        </div>
                      </td>
                    </tr>
                    {expandedUserId === u.id && (
                      <tr style={{ background: "rgba(0,0,0,0.2)" }}>
                        <td colSpan={6} style={{ padding: "16px 24px", borderBottom: "1px solid var(--border-color)" }}>
                          <h4 style={{ margin: "0 0 12px 0", fontSize: 13, color: "var(--text-secondary)" }}>Recent Search Logs</h4>
                          {(!u.searchLogs || u.searchLogs.length === 0) ? (
                            <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>No search logs recorded for this user.</div>
                          ) : (
                            <div style={{ maxHeight: 200, overflowY: "auto", overflowX: "auto", border: "1px solid var(--border-color)", borderRadius: 6 }}>
                              <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                                <thead style={{ background: "#1a1a1a", position: "sticky", top: 0, zIndex: 10 }}>
                                  <tr>
                                    <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600 }}>Date</th>
                                    <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600 }}>Hotel</th>
                                    <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600 }}>Query</th>
                                    <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600 }}>Matches</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {u.searchLogs.map((log: any) => (
                                    <tr key={log.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                      <td style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>{new Date(log.createdAt).toLocaleString()}</td>
                                      <td style={{ padding: "8px 12px" }}>{log.hotels?.map((h: any) => h.name).join(", ") || "Unknown"}</td>
                                      <td style={{ padding: "8px 12px" }}>
                                        <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: 4, color: "var(--text-primary)" }}>{log.query}</code>
                                      </td>
                                      <td style={{ padding: "8px 12px", textAlign: "right", color: log.resultCount > 0 ? "var(--green)" : "var(--text-tertiary)" }}>{log.resultCount}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
