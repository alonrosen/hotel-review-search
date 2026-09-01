import React from 'react';

interface AdminTabsProps {
  activeTab: "hotels" | "users" | "requests" | "settings" | "logs" | "stats";
  setActiveTab: (tab: "hotels" | "users" | "requests" | "settings" | "logs" | "stats") => void;
}

export default function AdminTabs({ activeTab, setActiveTab }: AdminTabsProps) {
  return (
    <div className="container admin-tabs-container" style={{ display: "flex", gap: 32, borderBottom: "1px solid var(--border-color)", paddingBottom: 0, overflowX: "auto", whiteSpace: "nowrap", scrollbarWidth: "none", msOverflowStyle: "none" }}>
      <style>{`.admin-tabs-container::-webkit-scrollbar { display: none; }`}</style>
      {[
        { id: "hotels", label: "Hotels", icon: "🏨" },
        { id: "users", label: "Users", icon: "👥" },
        { id: "requests", label: "Requests", icon: "📥" },
        { id: "settings", label: "Settings", icon: "🎛️" },
        { id: "logs", label: "Logs", icon: "📜" },
        { id: "stats", label: "Stats", icon: "📊" },
      ].map((tab) => (
        <button 
          key={tab.id}
          className={`admin-tab ${activeTab === tab.id ? "active" : ""}`}
          onClick={() => setActiveTab(tab.id as any)}
          title={tab.label}
          style={{
            padding: "12px 8px", background: "none", border: "none",
            borderBottom: activeTab === tab.id ? "2px solid var(--accent)" : "2px solid transparent",
            color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-tertiary)",
            fontWeight: activeTab === tab.id ? 600 : 400,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 14,
            transition: "all 0.2s"
          }}
        >
          <span>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}
