import React, { useState, useEffect, useCallback } from 'react';

export default function SettingsTab() {
  const [providerGoogle, setProviderGoogle] = useState("rapidapi");
  const [providerTripAdvisor, setProviderTripAdvisor] = useState("rapidapi");
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsResult, setSettingsResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadSettings = useCallback(() => {
    setSettingsLoading(true);
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setProviderGoogle(data.provider_google || "rapidapi");
        setProviderTripAdvisor(data.provider_tripadvisor || "rapidapi");
        setSettingsLoading(false);
      })
      .catch(() => setSettingsLoading(false));
  }, []);

  useEffect(() => {
    loadSettings();
    setSettingsResult(null);
  }, [loadSettings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsResult(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_google: providerGoogle,
          provider_tripadvisor: providerTripAdvisor,
        }),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      setSettingsResult({ type: "success", message: "Settings saved successfully!" });
    } catch (err: any) {
      setSettingsResult({ type: "error", message: err.message });
    } finally {
      setSettingsSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <div className="section-title">Global Provider Settings</div>
      <div className="card">
        <p style={{ color: "var(--text-secondary)", marginBottom: 24, fontSize: 14 }}>
          Configure which external vendor API is used by default for fetching reviews. 
          If the selected provider fails during a fetch, the system will automatically fall back to the alternate provider.
        </p>

        {settingsLoading ? (
            <div className="admin-section">
              <div className="section-title">API Keys</div>
              <div className="card">
                <div className="form-group" style={{ marginBottom: 16 }}>
                   <div className="loading-skeleton" style={{ width: 120, height: 16, marginBottom: 8 }} />
                   <div className="loading-skeleton" style={{ width: "100%", height: 44, borderRadius: 12 }} />
                </div>
                <div className="form-group">
                   <div className="loading-skeleton" style={{ width: 150, height: 16, marginBottom: 8 }} />
                   <div className="loading-skeleton" style={{ width: "100%", height: 44, borderRadius: 12 }} />
                </div>
                <div style={{ marginTop: 16 }}>
                   <div className="loading-skeleton" style={{ width: 100, height: 40, borderRadius: 8 }} />
                </div>
              </div>
            </div>
          ) : (
          <form onSubmit={handleSaveSettings}>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Default Google Reviews Provider</label>
              <select className="select" value={providerGoogle} onChange={(e) => setProviderGoogle(e.target.value)}>
                <option value="rapidapi">RapidAPI (local-business-data)</option>
                <option value="apify">Apify (Google Maps Scraper)</option>
              </select>
            </div>
            
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label>Default TripAdvisor Reviews Provider</label>
              <select className="select" value={providerTripAdvisor} onChange={(e) => setProviderTripAdvisor(e.target.value)}>
                <option value="rapidapi">RapidAPI (TripAdvisor-com1)</option>
                <option value="apify">Apify (TripAdvisor Scraper)</option>
              </select>
            </div>

            {settingsResult && (
              <div className={`toast ${settingsResult.type === "success" ? "toast-success" : "toast-error"}`} style={{ position: "relative", bottom: "auto", right: "auto", marginBottom: 16, maxWidth: "100%" }}>
                {settingsResult.message}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={settingsSaving}>
              {settingsSaving ? <span className="spinner" /> : "Save Settings"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
