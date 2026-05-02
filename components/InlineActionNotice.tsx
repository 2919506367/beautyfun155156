"use client";

import { AnimatePresence, motion } from "framer-motion";

export default function InlineActionNotice({
  message,
  type = "error",
}: {
  message: string;
  type?: "error" | "warning" | "success";
}) {
  const styles =
    type === "success"
      ? {
          background: "rgba(34,197,94,0.14)",
          border: "1px solid rgba(34,197,94,0.22)",
          color: "#166534",
          icon: "✅",
        }
      : type === "warning"
      ? {
          background: "rgba(245,158,11,0.14)",
          border: "1px solid rgba(245,158,11,0.24)",
          color: "#92400e",
          icon: "⚠️",
        }
      : {
          background: "rgba(244,63,94,0.14)",
          border: "1px solid rgba(244,63,94,0.22)",
          color: "#be123c",
          icon: "⛔",
        };

  return (
    <AnimatePresence initial={false}>
      {message ? (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.99 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: styles.background,
            border: styles.border,
            color: styles.color,
            padding: "12px 14px",
            borderRadius: 18,
            fontSize: 14,
            fontWeight: 800,
            lineHeight: 1.7,
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          <span style={{ lineHeight: 1.4 }}>{styles.icon}</span>
          <span>{message}</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}