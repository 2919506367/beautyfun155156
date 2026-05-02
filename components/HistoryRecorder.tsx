"use client";

import { useEffect, useRef } from "react";

export default function HistoryRecorder({
  workId,
}: {
  workId: number;
}) {
  const sentRef = useRef(false);

  useEffect(() => {
    if (!workId) return;
    if (sentRef.current) return;

    sentRef.current = true;

    console.log("HistoryRecorder send workId:", workId);

    fetch("/api/history/record", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ workId }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        console.log("history record response:", res.status, data);
      })
      .catch((err) => {
        console.error("history record fetch error:", err);
      });
  }, [workId]);

  return null;
}