import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "../lib/supabase.js";
import { toast } from "react-hot-toast";

export default function WatchlistDashboard({ userId, t = {}, setPage }) {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchMonitoredMarkets() {
      if (!userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("monitored_markets")
          .select("id, category, region, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (!cancelled) setMarkets(data || []);
      } catch (err) {
        console.error("Failed to fetch monitored markets:", err);
        toast.error("Could not load your monitored markets");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchMonitoredMarkets();
    return () => { cancelled = true; };
  }, [userId]);

  async function handleRemove(id) {
    // Optimistic update
    const previousMarkets = [...markets];
    setMarkets((prev) => prev.filter((m) => m.id !== id));

    try {
      const { error } = await supabase
        .from("monitored_markets")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Market removed from Monitor");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove market");
      setMarkets(previousMarkets); // rollback
    }
  }

  const shell = {
    minHeight: "100vh",
    background: "var(--paper)",
    padding: "calc(100px + clamp(40px, 6vw, 80px)) 0 120px",
  };

  if (loading) {
    return (
      <div style={{ ...shell, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="w-6 h-6 border-2 border-[#A8321F]/30 border-t-[#A8321F] rounded-full animate-spin" />
      </div>
    );
  }

  const fmt = (d) =>
    new Date(d).toLocaleDateString(t._lang === "EN" ? "en-GB" : t._lang === "TW" ? "zh-TW" : "zh-CN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <main style={shell}>
      <div className="nx-wrap">
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 24,
            flexWrap: "wrap",
            paddingBottom: 28,
            borderBottom: "2px solid var(--ink)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="nx-label">
              {markets.length} · {t.nav_monitor || "Monitor"}
            </span>
            <h1 className="nx-display" style={{ fontSize: "clamp(48px, 6vw, 88px)" }}>Market Monitor</h1>
          </div>
          <button className="nx-btn nx-btn--seal" onClick={() => setPage?.("marketGuide")}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            {t.nav_market_guide || "Market Guide"}
          </button>
        </header>

        {!userId ? (
          <div
            style={{
              marginTop: 40,
              padding: "56px 32px",
              border: "1px dashed var(--rule-strong)",
              borderRadius: 4,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <p style={{ fontSize: 18, fontWeight: 600 }}>{t.mg_blur_body}</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              <button className="nx-btn nx-btn--ink" onClick={() => setPage?.("login")}>{t.nav_signin}</button>
              <button className="nx-btn nx-btn--line" onClick={() => setPage?.("register")}>{t.mg_blur_signup}</button>
            </div>
          </div>
        ) : markets.length === 0 ? (
          <div
            style={{
              marginTop: 40,
              padding: "56px 32px",
              border: "1px dashed var(--rule-strong)",
              borderRadius: 4,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <p style={{ fontSize: 18, fontWeight: 600 }}>No markets monitored yet</p>
            <p style={{ fontSize: 15, color: "var(--ink-2)", maxWidth: 440, lineHeight: 1.6 }}>
              Open any Market Guide report and press “Monitor this market” to start tracking it here.
            </p>
          </div>
        ) : (
          <div
            style={{
              marginTop: 40,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 24,
            }}
          >
            <AnimatePresence initial={false}>
              {markets.map((market, i) => (
                <motion.article
                  key={market.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
                  exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.2 } }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 20,
                    padding: 28,
                    background: "var(--paper-light)",
                    border: "1px solid var(--rule)",
                    borderRadius: 4,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--go)" }}>
                      NXLU {String(markets.length - i).padStart(3, "0")}
                    </span>
                    <button
                      className="nx-link"
                      style={{ fontSize: 13, color: "var(--ink-3)", minHeight: 44 }}
                      onClick={() => handleRemove(market.id)}
                    >
                      Remove
                    </button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <h2 className="nx-display" style={{ fontSize: 36, lineHeight: 1, textTransform: "capitalize" }}>
                      {market.category}
                    </h2>
                    <span style={{ fontSize: 15, color: "var(--ink-2)" }}>{market.region || "Global"}</span>
                  </div>
                  <div
                    style={{
                      marginTop: "auto",
                      paddingTop: 16,
                      borderTop: "1px solid var(--rule)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "var(--ink-3)",
                    }}
                  >
                    Added {fmt(market.created_at)}
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  );
}
