import React, { useState, useEffect, useCallback } from 'react';

interface LogEntry {
  id: string;
  level: string;
  source: string;
  message: string;
  details: string | null;
  hotelId: string | null;
  createdAt: string;
}

export default function LogsTab() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilterLevel, setLogFilterLevel] = useState("");
  const [logFilterSource, setLogFilterSource] = useState("");
  const [logFilterStartDate, setLogFilterStartDate] = useState("");
  const [logFilterEndDate, setLogFilterEndDate] = useState("");
  const [logLimit, setLogLimit] = useState("100");

  const loadLogs = useCallback(() => {
    setLogsLoading(true);
    const params = new URLSearchParams();
    if (logLimit) params.append("limit", logLimit);
    if (logFilterLevel) params.append("level", logFilterLevel);
    if (logFilterSource) params.append("source", logFilterSource);
    if (logFilterStartDate) params.append("startDate", logFilterStartDate);
    if (logFilterEndDate) params.append("endDate", logFilterEndDate);

    fetch(`/api/admin/logs?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setLogs(Array.isArray(data) ? data : []);
        setLogsLoading(false);
      })
      .catch(() => setLogsLoading(false));
  }, [logLimit, logFilterLevel, logFilterSource, logFilterStartDate, logFilterEndDate]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div>
      <div className="section-title">System Logs</div>
      
      <div className="card" style={{ marginBottom: 16, padding: "16px 20px" }}>
        <div className="form-row" style={{ gap: 12 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label style={{ fontSize: 11 }}>Level</label>
            <select className="select" value={logFilterLevel} onChange={(e) => { setLogFilterLevel(e.target.value); setTimeout(loadLogs, 0); }} style={{ padding: "8px 12px", fontSize: 13 }}>
              <option value="">All Levels</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label style={{ fontSize: 11 }}>Source</label>
            <select className="select" value={logFilterSource} onChange={(e) => { setLogFilterSource(e.target.value); setTimeout(loadLogs, 0); }} style={{ padding: "8px 12px", fontSize: 13 }}>
              <option value="">All Sources</option>
              <option value="cron">CRON</option>
              <option value="apify">APIFY</option>
              <option value="rapidapi">RAPIDAPI</option>
              <option value="system">SYSTEM</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label style={{ fontSize: 11 }}>Start Date</label>
            <input type="date" className="input" value={logFilterStartDate} onChange={(e) => { setLogFilterStartDate(e.target.value); setTimeout(loadLogs, 0); }} style={{ padding: "8px 12px", fontSize: 13 }} />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label style={{ fontSize: 11 }}>End Date</label>
            <input type="date" className="input" value={logFilterEndDate} onChange={(e) => { setLogFilterEndDate(e.target.value); setTimeout(loadLogs, 0); }} style={{ padding: "8px 12px", fontSize: 13 }} />
          </div>
          <div className="form-group" style={{ flex: 0.5 }}>
            <label style={{ fontSize: 11 }}>Limit</label>
            <select className="select" value={logLimit} onChange={(e) => { setLogLimit(e.target.value); setTimeout(loadLogs, 0); }} style={{ padding: "8px 12px", fontSize: 13 }}>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="500">500</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {logsLoading ? (
            <div className="card" style={{ padding: 0 }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)", display: "flex", gap: 16, alignItems: "center" }}>
                  <div className="loading-skeleton" style={{ width: 120, height: 16 }} />
                  <div className="loading-skeleton" style={{ width: 48, height: 20, borderRadius: 4 }} />
                  <div className="loading-skeleton" style={{ flex: 1, height: 16 }} />
                  <div className="loading-skeleton" style={{ width: 120, height: 16 }} />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, color: "var(--text-tertiary)" }}>No logs found matching criteria.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--bg-glass)", borderBottom: "1px solid var(--border-color)", textAlign: "left" }}>
                  <th style={{ padding: "12px 8px", color: "var(--text-secondary)", fontWeight: 600 }}>Timestamp</th>
                  <th style={{ padding: "12px 8px", color: "var(--text-secondary)", fontWeight: 600 }}>Level</th>
                  <th style={{ padding: "12px 8px", color: "var(--text-secondary)", fontWeight: 600 }}>Source</th>
                  <th style={{ padding: "12px 8px", color: "var(--text-secondary)", fontWeight: 600 }}>Message</th>
                  <th style={{ padding: "12px 8px", color: "var(--text-secondary)", fontWeight: 600 }}>Hotel ID</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "12px 8px", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: "12px 8px" }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700,
                        background: log.level === "ERROR" ? "rgba(255, 59, 48, 0.15)" : log.level === "WARN" ? "rgba(255, 149, 0, 0.15)" : "rgba(52, 199, 89, 0.15)",
                        color: log.level === "ERROR" ? "var(--red)" : log.level === "WARN" ? "var(--orange)" : "var(--green)"
                      }}>
                        {log.level}
                      </span>
                    </td>
                    <td style={{ padding: "12px 8px", textTransform: "uppercase", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>
                      {log.source}
                    </td>
                    <td style={{ padding: "12px 8px" }}>
                      <div style={{ color: "var(--text-primary)" }}>{log.message}</div>
                      {log.details && (
                        <details style={{ marginTop: 8 }}>
                          <summary style={{ cursor: "pointer", fontSize: 11, color: "var(--accent)" }}>View Details</summary>
                          <pre style={{ margin: "8px 0 0", padding: 8, background: "rgba(0,0,0,0.3)", borderRadius: 4, overflowX: "auto", fontSize: 11, color: "var(--text-tertiary)" }}>
                            {log.details}
                          </pre>
                        </details>
                      )}
                    </td>
                    <td style={{ padding: "12px 8px", color: "var(--text-tertiary)", fontFamily: "monospace", fontSize: 11 }}>
                      {log.hotelId || "-"}
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
