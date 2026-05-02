import ForumJpegSequencePlayer from "@/components/ForumJpegSequencePlayer";
import ForumSafeReveal from "@/components/ForumSafeReveal";

export default function ForumMediaBlock({
  items,
  blocked,
  compact = false,
}: {
  items: {
    id: number;
    type: "IMAGE" | "VIDEO" | "JPEG_SEQUENCE";
    url: string;
  }[];
  blocked: boolean;
  compact?: boolean;
}) {
  if (items.length === 0) return null;

  const jpegSequenceFrames = items.filter((item) => item.type === "JPEG_SEQUENCE");
  const normalItems: {
    id: number;
    type: "IMAGE" | "VIDEO";
    url: string;
  }[] = items.filter(
    (item): item is { id: number; type: "IMAGE" | "VIDEO"; url: string } =>
      item.type === "IMAGE" || item.type === "VIDEO"
  );

  if (compact) {
    const previewItems = normalItems.slice(0, 4);

    return (
      <ForumSafeReveal
        blocked={blocked}
        message="该帖子包含受限制媒体内容。你可以仅查看这条内容，或者关闭论坛安全模式后持续浏览。"
      >
        <div style={{ marginTop: 0 }}>
          {renderCompactGrid(
            previewItems.filter(
              (item): item is { id: number; type: "IMAGE" | "VIDEO"; url: string } =>
                item.type === "IMAGE" || item.type === "VIDEO"
            )
          )}

          {jpegSequenceFrames.length > 0 && previewItems.length === 0 && (
            <div style={{ marginTop: 10 }}>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "4 / 5",
                  maxHeight: 520,
                  borderRadius: 16,
                  overflow: "hidden",
                  border: "1px solid #e5e7eb",
                  background: "#f8fafc",
                }}
              >
                <img
                  src={jpegSequenceFrames[0].url}
                  alt="jpeg sequence preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    left: 12,
                    bottom: 12,
                    padding: "4px 8px",
                    borderRadius: 999,
                    background: "rgba(17,24,39,0.82)",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  JPG序列
                </div>
              </div>
            </div>
          )}
        </div>
      </ForumSafeReveal>
    );
  }

  return (
    <ForumSafeReveal
      blocked={blocked}
      message="该帖子包含受限制媒体内容。你可以仅查看这条内容，或者关闭论坛安全模式后持续浏览。"
    >
      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {renderDetailGrid(normalItems)}

        {jpegSequenceFrames.length > 0 && (
          <ForumJpegSequencePlayer frames={jpegSequenceFrames} />
        )}
      </div>
    </ForumSafeReveal>
  );
}

function renderCompactGrid(
  items: {
    id: number;
    type: "IMAGE" | "VIDEO";
    url: string;
  }[]
) {
  if (items.length === 0) return null;

  if (items.length === 1) {
    const item = items[0];
    return (
      <div
        style={{
          display: "grid",
        }}
      >
        <MediaCard item={item} height={340} />
      </div>
    );
  }

  if (items.length === 2) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 10,
        }}
      >
        {items.map((item) => (
          <MediaCard key={item.id} item={item} height={240} />
        ))}
      </div>
    );
  }

  if (items.length === 3) {
    const [first, second, third] = items;
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: 10,
        }}
      >
        <MediaCard item={first} height={340} />

        <div
          style={{
            display: "grid",
            gridTemplateRows: "repeat(2, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          <MediaCard item={second} height={165} />
          <MediaCard item={third} height={165} />
        </div>
      </div>
    );
  }

  const [first, second, third, fourth] = items;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 10,
      }}
    >
      {[first, second, third, fourth].map((item) => (
        <MediaCard key={item.id} item={item} height={210} />
      ))}
    </div>
  );
}

function renderDetailGrid(
  items: {
    id: number;
    type: "IMAGE" | "VIDEO";
    url: string;
  }[]
) {
  if (items.length === 0) return null;

  if (items.length === 1) {
    return <MediaCard item={items[0]} height={620} containImage />;
  }

  if (items.length === 2) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        {items.map((item) => (
          <MediaCard key={item.id} item={item} height={420} containImage />
        ))}
      </div>
    );
  }

  if (items.length === 3) {
    const [first, second, third] = items;
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.15fr 0.85fr",
          gap: 12,
        }}
      >
        <MediaCard item={first} height={620} containImage />

        <div
          style={{
            display: "grid",
            gridTemplateRows: "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <MediaCard item={second} height={304} containImage />
          <MediaCard item={third} height={304} containImage />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 12,
      }}
    >
      {items.map((item) => (
        <MediaCard key={item.id} item={item} height={320} containImage />
      ))}
    </div>
  );}

function MediaCard({
  item,
  height,
  containImage = false,
}: {
  item: {
    id: number;
    type: "IMAGE" | "VIDEO";
    url: string;
  };
  height: number;
  containImage?: boolean;
}) {
  if (item.type === "VIDEO") {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          height,
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid #e5e7eb",
          background: "#000",
        }}
      >
        <video
          src={item.url}
          muted
          preload="metadata"
          controls
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            background: "#000",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: 12,
            bottom: 12,
            padding: "4px 8px",
            borderRadius: 999,
            background: "rgba(17,24,39,0.82)",
            color: "#fff",
            fontSize: 12,
            fontWeight: 800,
            pointerEvents: "none",
          }}
        >
          视频
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height,
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid #e5e7eb",
        background: "#f8fafc",
      }}
    >
      <img
        src={item.url}
        alt="forum media"
        style={{
          width: "100%",
          height: "100%",
          objectFit: containImage ? "contain" : "cover",
          display: "block",
          background: "#f8fafc",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 12,
          bottom: 12,
          padding: "4px 8px",
          borderRadius: 999,
          background: "rgba(17,24,39,0.78)",
          color: "#fff",
          fontSize: 12,
          fontWeight: 800,
        }}
      >
        图片
      </div>
    </div>
  );
}