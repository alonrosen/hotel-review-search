"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function ReturnPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      router.push("/");
      return;
    }

    fetch(`/api/stripe/session?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setStatus(data.status);
          setCustomerEmail(data.customer_email || null);
        } else {
          setStatus("error");
        }
      })
      .catch((err) => {
        console.error(err);
        setStatus("error");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [searchParams, router]);

  if (loading) {
    return (
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <span className="spinner" style={{ width: 64, height: 64, borderWidth: 6, borderTopColor: "var(--accent)" }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="card" style={{ maxWidth: 500, textAlign: "center", padding: 48, width: "100%" }}>
        {status === "open" ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏱️</div>
            <h2>Payment Incomplete</h2>
            <p style={{ color: "var(--text-secondary)", marginTop: 16 }}>
              It looks like your payment is still being processed or was not completed.
            </p>
          </>
        ) : status === "complete" ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h2 style={{ color: "var(--green)" }}>Subscription Successful!</h2>
            <p style={{ color: "var(--text-secondary)", marginTop: 16, marginBottom: 8 }}>
              Thank you for subscribing! Your payment was successful.
            </p>
            {customerEmail && (
              <p style={{ color: "var(--text-tertiary)", fontSize: 13, marginBottom: 24 }}>
                A confirmation email will be sent to {customerEmail}.
              </p>
            )}
            <p style={{ color: "var(--text-secondary)" }}>
              You now have unlimited searches and full access to our database.
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
            <h2 style={{ color: "var(--red)" }}>Payment Error</h2>
            <p style={{ color: "var(--text-secondary)", marginTop: 16 }}>
              There was an issue retrieving your payment status. Please try again or contact support.
            </p>
          </>
        )}
        <div style={{ marginTop: 32 }}>
          <button className="btn btn-primary" onClick={() => router.push("/")} style={{ width: "100%", padding: "12px 0", fontSize: 16, borderRadius: 30 }}>
            Return to Search
          </button>
        </div>
      </div>
    </div>
  );
}
