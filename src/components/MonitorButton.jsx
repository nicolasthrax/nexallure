import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase.js";
import { toast } from "react-hot-toast";

export function MonitorButton({ industry, region, userId, onMonitorChange }) {
  const [state, setState] = useState("idle");
  const [showModal, setShowModal] = useState(false);
  const [isMonitored, setIsMonitored] = useState(false);

  useEffect(() => {
    async function checkMonitorStatus() {
      if (!userId || !industry || !region) return;

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
    if (!userId) {
      toast.error("Please sign in to monitor markets");
      return;
    }
    
    setShowModal(false);
    setState("loading");

    try {
      const { error } = await supabase
        .from("monitored_markets")
        .insert({
          user_id: userId,
          category: industry,
          region: region,
          created_at: new Date().toISOString()
        });

      if (error) {
        if (error.code === "23505") {
          toast.error("This market is already being monitored");
          setState("idle");
          return;
        }
          throw error;
        }

        setState("active");
        setIsMonitored(true);
        toast.success("Market added to Monitor");
        // Instead of calling onMonitorChange directly here,
        // the useEffect in WatchlistDashboard will refetch when `isMonitored` changes.
        // if (onMonitorChange) onMonitorChange(); 
      
      if (onMonitorChange) onMonitorChange();
    } catch (err) {
      console.error(err);
      toast.error("Failed to monitor this market");
      setState("idle");
    }
  }

  async function handleRemove() {
    if (!userId) return;
    
    setState("loading");
    
    try {
      const { error } = await supabase
        .from("monitored_markets")
        .delete()
        .match({ user_id: userId, category: industry, region: region });

      if (error) throw error;

      setState("idle");
      setIsMonitored(false);
      toast.success("Market removed from Monitor");
      // Instead of calling onMonitorChange directly here,
      // the useEffect in WatchlistDashboard will refetch when `isMonitored` changes.
      // if (onMonitorChange) onMonitorChange();
      
      if (onMonitorChange) onMonitorChange();
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove market");
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

  // If already monitored, show remove button. Ensure isMonitored is checked.
  if (isMonitored) {
    return (
      <button
        onClick={handleRemove}
        disabled={state === "loading"}
        className="flex items-center gap-2 px-4 py-2 border border-red-500/40 text-red-400 hover:bg-red-500/10 font-mono text-xs tracking-widest transition-colors disabled:opacity-50"
      >
        {state === "loading" ? "REMOVING..." : "REMOVE FROM MONITOR"}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={openModal}
        disabled={state === "loading"}
        className="flex items-center gap-2 px-4 py-2 border border-white/20 hover:border-[#E8826A]/60 text-white/70 hover:text-[#E8826A] font-mono text-xs tracking-widest transition-colors disabled:opacity-50"
      >
        {state === "loading" ? (
          <span className="w-3 h-3 border border-[#E8826A]/40 border-t-[#E8826A] rounded-full animate-spin" />
        ) : (
          <span className="text-[#E8826A]">+</span>
        )}
        {state === "loading" ? "ADDING..." : "MONITOR THIS MARKET"}
      </button>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1D2027] border border-[#E8826A]/20 p-10 max-w-[480px] w-full mx-4"
            >
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-white/40 hover:text-white text-xl"
              >
                ×
              </button>

              <div className="font-mono text-[#E8826A] text-xs tracking-[3px] uppercase mb-5">
                MARKET INTELLIGENCE
              </div>

              <h3 className="font-display font-extrabold text-2xl text-[#EEE9DD] mb-4 leading-tight">
                Initialize Market Monitor?
              </h3>

              <p className="text-white/55 text-sm leading-relaxed mb-8">
                This will add <strong>{industry}</strong> in <strong>{region}</strong> to your Monitor page. 
                You will receive updates and alerts for this market.
              </p>

              <button
                onClick={handleMonitor}
                className="w-full border border-[#E8826A]/50 text-[#E8826A] py-3.5 font-mono text-xs tracking-[2px] hover:bg-[#E8826A]/10 hover:border-[#E8826A] transition"
              >
                CONFIRM MONITORING
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
