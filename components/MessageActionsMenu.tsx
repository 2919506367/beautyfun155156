"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function MessageActionsMenu({
  isMine,
  onReply,
  onForward,
  onDelete,
}: {
  isMine: boolean;
  onReply: () => void;
  onForward?: () => void;
  onDelete?: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({
    display: "none",
  });

  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuWidth = 150;
  const estimatedMenuHeight = isMine ? 170 : 110;
  const gap = 8;

  useEffect(() => {
    setMounted(true);
  }, []);

  function closeMenu() {
    setOpen(false);
  }

  function openMenuFromEvent(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();

    let left = rect.right - menuWidth;
    let top = rect.top - estimatedMenuHeight - gap;

    if (left < 8) {
      left = 8;
    }

    if (left + menuWidth > window.innerWidth - 8) {
      left = window.innerWidth - menuWidth - 8;
    }

    if (top < 8) {
      top = rect.bottom + gap;
    }

    setMenuStyle({
      position: "fixed",
      top,
      left,
      width: menuWidth,
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      boxShadow: "0 12px 30px rgba(15,23,42,0.16)",
      padding: 8,
      zIndex: 999999,
      display: "grid",
      gap: 6,
    });

    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      closeMenu();
    }

    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeMenu();
      }
    }

    function handleWindowChange() {
      closeMenu();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    window.addEventListener("resize", handleWindowChange);
    window.addEventListener("scroll", handleWindowChange, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
      window.removeEventListener("resize", handleWindowChange);
      window.removeEventListener("scroll", handleWindowChange, true);
    };
  }, [open]);

  const menu =
    mounted && open
      ? createPortal(
          <div ref={menuRef} style={menuStyle}>
            <button
              type="button"
              onClick={() => {
                closeMenu();
                onReply();
              }}
              style={menuBtnStyle}
            >
              回复
            </button>

            {onForward && (
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  onForward();
                }}
                style={menuBtnStyle}
              >
                转发
              </button>
            )}

            {isMine && onDelete && (
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  onDelete();
                }}
                style={{
                  ...menuBtnStyle,
                  color: "#be123c",
                  background: "#fff1f2",
                  borderColor: "#fecdd3",
                }}
              >
                删除
              </button>
            )}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          if (open) {
            closeMenu();
          } else {
            openMenuFromEvent(e);
          }
        }}
        style={{
          padding: "6px 10px",
          borderRadius: 10,
          border: "1px solid #d1d5db",
          background: "#fff",
          color: "#111827",
          fontWeight: 700,
          cursor: "pointer",
          fontSize: 12,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        操作
      </button>

      {menu}
    </>
  );
}

const menuBtnStyle: React.CSSProperties = {
  width: "100%",
  textAlign: "left",
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#111827",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 12,
  whiteSpace: "nowrap",
};