import { useEffect, useState } from 'react';

export default function GlobalLoader({ children }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Wait for fonts + a small delay for 3D globe
    const timer = setTimeout(() => {
      setLoaded(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  if (!loaded) {
    return (
      <div className="fixed inset-0 bg-[#15171C] flex items-center justify-center z-[99999]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#E8826A]/30 border-t-[#E8826A] rounded-full animate-spin" />
          <p className="font-mono text-xs text-white/40 tracking-[3px]">LOADING NEXALLURE</p>
        </div>
      </div>
    );
  }

  return children;
}
