import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase.js";

export function NotificationFeed({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Fetch initial notifications
    async function fetchNotifications() {
      const { data } = await supabase
        .from("market_notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) setNotifications(data);
    }

    fetchNotifications();

    // Realtime subscription
    const channel = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "market_notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev].slice(0, 10));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function markAllAsRead() {
    if (!userId || unreadCount === 0) return;
    
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    await supabase
      .from("market_notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) markAllAsRead();
        }}
        className="relative p-2 text-white/70 hover:text-[#E8826A] transition-colors focus:outline-none"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#E8826A] rounded-full" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute right-0 mt-2 w-80 bg-[#1D2027] border border-white/10 shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-3 border-b border-white/10 flex justify-between items-center bg-[#15171C]">
                <span className="font-mono text-[10px] tracking-widest text-white/40 uppercase">ALERTS</span>
                {unreadCount > 0 && (
                  <span className="font-mono text-[9px] text-[#E8826A] bg-[#E8826A]/10 px-1.5 py-0.5 uppercase tracking-wider">
                    {unreadCount} NEW
                  </span>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-white/30 font-mono text-xs">
                    NO NEW NOTIFICATIONS
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={`p-3 transition-colors ${n.is_read ? 'bg-transparent' : 'bg-[#E8826A]/5'}`}>
                      <p className="text-white text-xs font-sans mb-1">{n.message}</p>
                      <span className="font-mono text-[9px] text-white/40 block uppercase">
                        {new Date(n.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}