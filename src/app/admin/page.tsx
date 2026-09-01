"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import AdminTabs from "@/components/admin/AdminTabs";
import HotelsTab from "@/components/admin/tabs/HotelsTab";
import UsersTab from "@/components/admin/tabs/UsersTab";
import RequestsTab from "@/components/admin/tabs/RequestsTab";
import SettingsTab from "@/components/admin/tabs/SettingsTab";
import LogsTab from "@/components/admin/tabs/LogsTab";
import StatsTab from "@/components/admin/tabs/StatsTab";

interface Hotel {
  id: string;
  name: string;
  googlePlaceId: string | null;
  tripAdvisorId: string | null;
  tripAdvisorUrl: string | null;
  city: string | null;
  country: string | null;
  _count?: { reviews: number };
  stats?: {
    googleCount: number;
    tripadvisorCount: number;
    latestGoogleReviewDate: string | null;
    latestTripadvisorReviewDate: string | null;
    lastFetchDate: string | null;
  };
}

export default function AdminPage() {
  const { user, loading: userLoading, logout } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"hotels" | "users" | "requests" | "settings" | "logs" | "stats">("hotels");

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelsLoading, setHotelsLoading] = useState(true);

  useEffect(() => {
    if (!userLoading) {
      if (!user) router.push("/login");
      else if (user.role !== 'admin') router.push("/");
    }
  }, [user, userLoading, router]);

  const loadHotels = useCallback(() => {
    setHotelsLoading(true);
    fetch("/api/hotels")
      .then((r) => r.json())
      .then((data) => {
        setHotels(Array.isArray(data) ? data : data.hotels || []);
        setHotelsLoading(false);
      })
      .catch(() => setHotelsLoading(false));
  }, []);

  useEffect(() => {
    if (user?.role === 'admin' && activeTab === "hotels" && hotels.length === 0) {
      loadHotels();
    }
  }, [user, activeTab, hotels.length, loadHotels]);

  if (userLoading || !user || user.role !== 'admin') {
    return (
      <>
        <header className="header" style={{ paddingBottom: 0 }}>
          <div className="container header-inner" style={{ marginBottom: 16 }}>
            <div className="logo"><div className="logo-icon">⚙️</div>Admin Panel</div>
            <button className="btn btn-ghost" onClick={logout} disabled>Logout</button>
          </div>
        </header>
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
          <span className="spinner" style={{ width: 64, height: 64, borderWidth: 6, borderTopColor: "var(--accent)" }} />
        </div>
      </>
    );
  }

  return (
    <>
      <header className="header" style={{ paddingBottom: 0 }}>
        <div className="container header-inner" style={{ marginBottom: 16 }}>
          <div className="logo">
            <div className="logo-icon">⚙️</div>
            Admin Panel
          </div>
          <div className="nav-links" style={{ flex: 1, display: "flex", gap: 24, marginLeft: 32 }}>
            <a href="/" className="nav-link">Search</a>
            <a href="/admin" className="nav-link active">Admin</a>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <a href="/profile" style={{ color: "var(--text-secondary)", fontSize: 13, textDecoration: "none" }}>{user.name}</a>
            <button className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
          </div>
        </div>
        
        <AdminTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      </header>

      <div className="container page-content" style={{ marginTop: 24 }}>
        {activeTab === "hotels" && <HotelsTab hotels={hotels} loadHotels={loadHotels} hotelsLoading={hotelsLoading} />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "requests" && <RequestsTab />}
        {activeTab === "settings" && <SettingsTab />}
        {activeTab === "logs" && <LogsTab />}
        {activeTab === "stats" && <StatsTab hotels={hotels} />}
      </div>
    </>
  );
}
