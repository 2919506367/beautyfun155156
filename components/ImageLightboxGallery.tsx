"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

export default function ImageLightboxGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [mounted, setMounted] = useState(false);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const isOpen = currentIndex !== null;

  useEffect(() => {
    setMounted(true);
  }, []);

  function resetView() {
    setScale(1);
    setOffsetX(0);
    setOffsetY(0);
    setDragging(false);
    dragRef.current = null;
  }

  function openAt(index: number) {
    setCurrentIndex(index);
    resetView();
  }

  function close() {
    setCurrentIndex(null);
    resetView();
  }

  function prev() {
    if (currentIndex === null || images.length === 0) return;
    setCurrentIndex((currentIndex - 1 + images.length) % images.length);
    resetView();
  }

  function next() {
    if (currentIndex === null || images.length === 0) return;
    setCurrentIndex((currentIndex + 1) % images.length);
    resetView();
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    e.stopPropagation();

    const delta = e.deltaY > 0 ? -0.18 : 0.18;

    setScale((prev) => {
      const nextScale = Math.max(1, Math.min(4, Number((prev + delta).toFixed(2))));
      if (nextScale === 1) {
        setOffsetX(0);
        setOffsetY(0);
      }
      return nextScale;
    });
  }

  function handleOverlayWheel(e: React.WheelEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleMouseDown(e: React.MouseEvent<HTMLImageElement>) {
    if (scale <= 1) return;

    e.preventDefault();
    e.stopPropagation();

    setDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: offsetX,
      originY: offsetY,
    };
  }

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!dragging || !dragRef.current) return;

      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;

      setOffsetX(dragRef.current.originX + dx);
      setOffsetY(dragRef.current.originY + dy);
    }

    function handleMouseUp() {
      if (!dragging) return;
      setDragging(false);
      dragRef.current = null;
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging]);

  useEffect(() => {
    if (!isOpen) return;

    const oldOverflow = document.body.style.overflow;
    const oldTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }

    function preventPageScroll(e: WheelEvent) {
      e.preventDefault();
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("wheel", preventPageScroll, { passive: false });

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("wheel", preventPageScroll);
      document.body.style.overflow = oldOverflow;
      document.body.style.touchAction = oldTouchAction;
    };
  }, [isOpen, currentIndex, images.length]);

  const overlay = (
    <AnimatePresence>
      {isOpen && currentIndex !== null && (
        <motion.div
          className="bf-lightbox-overlay lightbox-overlay"
          onClick={close}
          onWheel={handleOverlayWheel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{
            position: "fixed",
            inset: 0,
            width: "100vw",
            height: "100dvh",
            background:
              "radial-gradient(circle at top, rgba(255,255,255,0.08), transparent 26%), rgba(4,5,7,0.94)",
            zIndex: 2147483000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "clamp(18px, 4vw, 52px)",
            overflow: "hidden",
            overscrollBehavior: "contain",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            style={arrowBtnStyle("left")}
            aria-label="上一张"
          >
            ❮
          </button>

          <motion.img
            key={images[currentIndex]}
            className="bf-lightbox-image lightbox-image"
            src={images[currentIndex]}
            alt={`${title} ${currentIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            draggable={false}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              maxWidth: "min(88vw, 1180px)",
              maxHeight: "calc(100dvh - 128px)",
              width: "auto",
              height: "auto",
              objectFit: "contain",
              borderRadius: 18,
              display: "block",
              boxShadow: "0 36px 120px rgba(0,0,0,0.62)",
              transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
              transition: dragging ? "none" : "transform 0.12s ease",
              cursor: scale > 1 ? (dragging ? "grabbing" : "grab") : "zoom-in",
              userSelect: "none",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.16)",
            }}
          />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            style={arrowBtnStyle("right")}
            aria-label="下一张"
          >
            ❯
          </button>

          <div
            style={{
              position: "absolute",
              bottom: 22,
              left: "50%",
              transform: "translateX(-50%)",
              padding: "10px 18px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.18)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 900,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              boxShadow: "0 12px 30px rgba(0,0,0,0.22)",
              pointerEvents: "none",
            }}
          >
            <span>
              {currentIndex + 1} / {images.length}
            </span>

            <span style={{ opacity: 0.6 }}>·</span>

            <span style={{ fontSize: 12, opacity: 0.9 }}>
              滚轮缩放 / 方向键切换 / Esc 关闭
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            style={{
              position: "absolute",
              top: 22,
              right: 22,
              width: 48,
              height: 48,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.10)",
              color: "#fff",
              fontSize: 20,
              cursor: "pointer",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
            }}
            aria-label="关闭预览"
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
          alignItems: "center",
        }}
      >
        {images.map((src, index) => (
          <motion.img
            key={src + index}
            src={src}
            alt={`${title} ${index + 1}`}
            loading="lazy"
            onClick={() => openAt(index)}
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            style={{
              width: "100%",
              maxWidth: 860,
              borderRadius: 24,
              display: "block",
              boxShadow: "var(--bf-shadow-md)",
              cursor: "zoom-in",
              border: "1px solid rgba(255,255,255,0.22)",
            }}
          />
        ))}
      </div>

      {mounted ? createPortal(overlay, document.body) : overlay}
    </>
  );
}

function arrowBtnStyle(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    [side]: 24,
    top: "50%",
    transform: "translateY(-50%)",
    width: 56,
    height: 56,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.10)",
    color: "#fff",
    fontSize: 25,
    cursor: "pointer",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
  };
}
