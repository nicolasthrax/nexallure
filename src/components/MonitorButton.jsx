import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase.js";
import { toast } from "react-hot-toast";

// `industry` and `region` are translation keys (e.g. "industry_machinery",
// "market_eu", or "any"), never translated labels: rows saved in one language
// must still match when the reader switches to another.
export function MonitorButton({ industry, region, userId, t = {}, onMonitorChange }) {
  const [state, setState] = useState("idle");
  const [showModal, setShowModal] = useState(false);
  const [isMonitored, setIsMonitored] = useState(false);

  const industryLabel = t[industry] || industry;
  const regionLabel = region === "any" ? t.mg_global || region : t[region] || region;

  useEffect(() => {
    async function checkMonitorStatus() {
      if (!userId || !industry || !region || !supabase) return;

      const { data, error } = await supabase
        .from("monitored_markets")
        .select("id")
        .eq("user_id", userId)
        .eq("category", industry)
        .eq("region", region)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking monitor status:", error);
      }
      setIsMonitored(!!data);
    }
    checkMonitorStatus();
  }, [userId, industry, region]);

  async function handleMonitor() {
    if (!userId || !supabase) return;

    setShowModal(false);
    setState("loading");

    try {
      const { error } = await supabase
        .from("monitored_markets")
        .insert({
          user_id: userId,
          category: industry,
          region: region,
          created_at: new Date().toISOString(),
        });

      if (error) {
        if (error.code === "23505") {
          toast.error(t.mon_exists);
          setState("active");
          setIsMonitored(true);
          return;
        }
        throw error;
      }

      setState("active");
      setIsMonitored(true);
      toast.success(t.mon_added);
      if (onMonitorChange) onMonitorChange();
    } catch (err) {
      console.error(err);
      toast.error(t.mon_add_failed);
      setState("idle");
    }
  }

  async function handleRemove() {
    if (!userId || !supabase) return;

    setState("loading");

    try {
      const { error } = await supabase
        .from("monitored_markets")
        .delete()
        .match({ user_id: userId, category: industry, region: region });

      if (error) throw error;

      setState("idle");
      setIsMonitored(false);
      toast.success(t.mon_removed);
      if (onMonitorChange) onMonitorChange();
    } catch (err) {
      console.error(err);
      toast.error(t.mon_remove_failed);
      setState("active");
    }
  }

  function openModal() {
    if (!userId) return;
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

  useEffect(() => {
    if (!showModal) return;
    const onKey = (e) => { if (e.key === "Escape") setShowModal(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showModal]);

  const buttonStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    minHeight: 40,
    padding: "0 16px",
    background: "transparent",
    border: "1px solid var(--ink-rule)",
    borderRadius: 2,
    color: "var(--on-ink)",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  };

  if (isMonitored) {
    return (
      <button onClick={handleRemove} disabled={state === "loading"} style={{ ...buttonStyle, opacity: state === "loading" ? 0.5 : 1 }}>
        {state === "loading" ? t.mon_removing : t.mon_remove}
      </button>
    );
  }

  return (
    <>
      <button onClick={openModal} disabled={state === "loading"} style={{ ...buttonStyle, opacity: state === "loading" ? 0.5 : 1 }}>
        <span aria-hidden="true" style={{ color: "var(--seal-on-ink)" }}>+</span>
        {state === "loading" ? t.mon_adding : t.mon_add}
      </button>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            style={{
              position: "fixed", inset: 0, zIndex: 9999,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(6, 12, 22, 0.72)", padding: 16,
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="monitor-dialog-title"
              style={{
                position: "relative", width: "100%", maxWidth: 460,
                padding: 40, background: "var(--paper-light)", color: "var(--ink)",
                border: "1px solid var(--rule-strong)", outline: "1px solid var(--gold)", outlineOffset: -7,
              }}
            >
              <button
                type="button"
                onClick={closeModal}
                aria-label={t.nav_close || "Close"}
                style={{
                  position: "absolute", top: 12, right: 12, width: 44, height: 44,
                  background: "none", border: 0, fontSize: 22, color: "var(--ink-3)", cursor: "pointer",
                }}
              >
                ×
              </button>

              <h3 id="monitor-dialog-title" className="nx-display" style={{ fontSize: 30, marginBottom: 14, paddingRight: 32 }}>
                {t.mon_dialog_title}
              </h3>

              <p style={{ fontSize: 15, lineHeight: 1.65, color: "var(--ink-2)", marginBottom: 28 }}>
                {(t.mon_dialog_body || "").replace("{industry}", industryLabel).replace("{region}", regionLabel)}
              </p>

              <button onClick={handleMonitor} className="nx-btn nx-btn--ink" style={{ width: "100%" }}>
                {t.mon_confirm}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
