import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import TetrisLoading from "./ui/TetrisLoader";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
      staggerChildren: 0.15,
    }
  },
  exit: { opacity: 0, transition: { duration: 0.3 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export default function MarketLoader({ text = "Analyzing export markets..." }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    const spacing = 28;
    let frame = 0;
    let raf;

    const draw = () => {
      const cols = Math.ceil(canvas.width / spacing);
      const rows = Math.ceil(canvas.height / spacing);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * spacing + spacing / 2;
          const y = r * spacing + spacing / 2;
          const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
          const pulse = Math.sin(frame * 0.04 - dist * 0.018) * 0.5 + 0.5;

          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${0.08 + pulse * 0.22})`;
          ctx.fill();
        }
      }

      frame++;
      raf = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return createPortal(
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{
        position: "fixed",
        top: 0, left: 0,
        width: "100vw", height: "100vh",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Background layers fade in first */}
      <motion.div variants={itemVariants} style={{
        position: "absolute", top: 0, left: 0,
        width: "100%", height: "100%",
        background: "rgba(10, 15, 30, 0.85)",
      }} />

      <motion.canvas
        ref={canvasRef}
        variants={itemVariants}
        style={{
          position: "absolute", top: 0, left: 0,
          width: "100%", height: "100%",
          opacity: 0.5,
        }}
      />

      {/* Content fades in last */}
      <motion.div
        variants={itemVariants}
        style={{
          position: "relative", zIndex: 2,
          display: "flex", flexDirection: "column",
          alignItems: "center", gap: "16px",
        }}
      >
        <div style={{ marginBottom: "-24px" }}>
          <TetrisLoading size="sm" speed="fast" showLoadingText={false} />
        </div>
        <p style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "12px",
          color: "rgba(238,233,221,0.7)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          margin: 0,
        }}>
          {text}
        </p>
      </motion.div>
    </motion.div>,
    document.body
  );
}
