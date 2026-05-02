"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function WorkBackButtons() {
  const router = useRouter();

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <motion.button
        type="button"
        onClick={() => router.back()}
        whileHover={{ y: -1.5, scale: 1.015 }}
        whileTap={{ scale: 0.985 }}
        style={btnStyle}
      >
        返回上一页
      </motion.button>

      <motion.div whileHover={{ y: -1.5, scale: 1.015 }} whileTap={{ scale: 0.985 }}>
        <Link href="/" style={btnStyle}>
          回到主页
        </Link>
      </motion.div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.30)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.76), rgba(255,255,255,0.26)), rgba(255,255,255,0.24)",
  color: "var(--bf-panel-text)",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), 0 10px 24px rgba(15,23,42,0.08)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};