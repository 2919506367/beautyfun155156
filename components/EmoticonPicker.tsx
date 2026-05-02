"use client";

import { useEffect, useMemo, useState } from "react";

type EmoticonItem = {
  id: number;
  label: string | null;
  imageUrl: string;
};

type PickerTab = "emoji" | "stickers" | "gif";

const EMOJI_GROUPS = [
  {
    key: "recent",
    label: "最近常用",
    icon: "🕘",
    items: "😂 😘 ❤️ 😍 😊 😁 👍 😌 😔 😭 😡 😳 😜 🙈 😉 😀 😢 😱 😠 😏 😞 😅 😗 😐 😕 😇 😎 🥳 🤔 🤓 😴".split(" "),
  },
  {
    key: "people",
    label: "Emoji 和人物",
    icon: "🙂",
    items: "😀 😃 😄 😁 😆 🥹 😅 😂 🤣 🥲 ☺️ 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😝 😜 🤪 🤨 🧐 🤓 😎 🥸 🤩 🥳 😏 😒 😞 😔 😟 😕 🙁 ☹️ 😣 😖 😫 😩 🥺 😢 😭 😤 😠 😡 🤬 🤯 😳 🥵 🥶 😶‍🌫️ 😱 😨 😰 😥 😓 🤗 🤔 🫣 🤭 🫢 🫡 🤫 🫠 🤥 😶 🫥 😐 🫤 😑 😬 🙄 😯 😦 😧 😮 😲 🥱 😴 🤤 😪 😮‍💨 😵 😵‍💫 🤐 🥴 🤢 🤮 🤧 😷 🤒 🤕".split(" "),
  },
  {
    key: "hands",
    label: "手势",
    icon: "👍",
    items: "👋 🤚 🖐️ ✋ 🖖 🫱 🫲 🫳 🫴 👌 🤌 🤏 ✌️ 🤞 🫰 🤟 🤘 🤙 👈 👉 👆 🖕 👇 ☝️ 🫵 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 🫶 👐 🤲 🤝 🙏 ✍️ 💅 🤳 💪 🦾".split(" "),
  },
  {
    key: "symbols",
    label: "符号",
    icon: "❤️",
    items: "❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❤️‍🔥 ❤️‍🩹 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 🔥 ✨ ⭐ 🌟 💫 💥 💢 💦 💨 🕳️ 💬 👁️‍🗨️ 🗨️ 🗯️ 💭 💤".split(" "),
  },
  {
    key: "objects",
    label: "物品和趣味",
    icon: "🎁",
    items: "🎉 🎊 🎈 🎁 🏆 🥇 🥈 🥉 🎮 🕹️ 🎲 🧩 🎯 🎧 🎤 🎬 📷 📸 💻 🖥️ 📱 ⌚ 💎 💰 💸 🧠 👑 🛡️ ⚔️ 🧨 🚀 🌙 ☀️ ⚡ ❄️ ☁️ 🌈".split(" "),
  },
];

export default function EmoticonPicker({
  selectedId,
  onSelect,
  onEmojiSelect,
  onClose,
}: {
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  onEmojiSelect?: (emoji: string) => void;
  onClose?: () => void;
}) {
  const [items, setItems] = useState<EmoticonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<PickerTab>("emoji");
  const [query, setQuery] = useState("");
  const [emojiGroupKey, setEmojiGroupKey] = useState(EMOJI_GROUPS[0].key);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/emoticons/list", {
          credentials: "include",
        });
        const data = await res.json();

        if (!active) return;

        if (!res.ok) {
          setItems([]);
          return;
        }

        setItems(Array.isArray(data.items) ? data.items : []);
      } catch {
        if (active) setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const activeEmojiGroup =
    EMOJI_GROUPS.find((group) => group.key === emojiGroupKey) || EMOJI_GROUPS[0];

  const filteredStickers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return items;

    return items.filter((item) => {
      const label = (item.label || `表情包 ${item.id}`).toLowerCase();
      return label.includes(keyword) || String(item.id).includes(keyword);
    });
  }, [items, query]);

  return (
    <div className="tg-emoji-panel" role="dialog" aria-label="表情和贴纸面板">
      <div className="tg-emoji-tabs">
        <button
          type="button"
          onClick={() => setTab("emoji")}
          className={`tg-emoji-tab ${tab === "emoji" ? "tg-emoji-tab-active" : ""}`}
        >
          Emoji
        </button>
        <button
          type="button"
          onClick={() => setTab("stickers")}
          className={`tg-emoji-tab ${tab === "stickers" ? "tg-emoji-tab-active" : ""}`}
        >
          贴纸
        </button>
        <button
          type="button"
          onClick={() => setTab("gif")}
          className={`tg-emoji-tab ${tab === "gif" ? "tg-emoji-tab-active" : ""}`}
        >
          GIF
        </button>

        <button type="button" onClick={onClose} className="tg-emoji-close" aria-label="关闭">
          ×
        </button>
      </div>

      <div className="tg-emoji-searchbar">
        <span className="tg-emoji-search-icon">⌕</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tab === "stickers" ? "搜索你的表情包" : "搜索"}
        />
        <div className="tg-emoji-quick-icons" aria-hidden="true">
          <span>♡</span>
          <span>👍</span>
          <span>👎</span>
          <span>🎉</span>
          <span>🙂</span>
        </div>
      </div>

      <div className="tg-emoji-body">
        {tab === "emoji" && (
          <>
            <div className="tg-emoji-section-title">{activeEmojiGroup.label}</div>
            <div className="tg-emoji-grid">
              {activeEmojiGroup.items.map((emoji, index) => (
                <button
                  key={`${emoji}-${index}`}
                  type="button"
                  onClick={() => onEmojiSelect?.(emoji)}
                  className="tg-emoji-char-btn"
                  aria-label={`插入 ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}

        {tab === "stickers" && (
          <>
            {loading ? (
              <div className="tg-emoji-empty">正在加载你的表情包…</div>
            ) : items.length === 0 ? (
              <div className="tg-emoji-empty">
                <div className="tg-emoji-empty-icon">🗂️</div>
                <div>你还没有上传或收藏表情包。</div>
                <div className="tg-emoji-empty-small">去“我的表情包”页面添加后，这里会像 Telegram 贴纸面板一样显示。</div>
              </div>
            ) : filteredStickers.length === 0 ? (
              <div className="tg-emoji-empty">没有找到匹配的表情包。</div>
            ) : (
              <div className="tg-sticker-grid">
                {filteredStickers.map((item) => {
                  const active = selectedId === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelect(active ? null : item.id)}
                      className={`tg-sticker-btn ${active ? "tg-sticker-btn-active" : ""}`}
                      title={item.label || `表情包 ${item.id}`}
                    >
                      <img src={item.imageUrl} alt={item.label || "表情包"} />
                      {active && <span className="tg-sticker-check">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "gif" && (
          <div className="tg-emoji-empty">
            <div className="tg-emoji-empty-icon">GIF</div>
            <div>GIF 面板先保留入口。</div>
            <div className="tg-emoji-empty-small">你当前项目没有 GIF 搜索接口，所以这里不乱接业务逻辑。</div>
          </div>
        )}
      </div>

      <div className="tg-emoji-category-bar">
        {EMOJI_GROUPS.map((group) => (
          <button
            key={group.key}
            type="button"
            onClick={() => {
              setTab("emoji");
              setEmojiGroupKey(group.key);
            }}
            className={`tg-emoji-category ${tab === "emoji" && emojiGroupKey === group.key ? "tg-emoji-category-active" : ""}`}
            title={group.label}
          >
            {group.icon}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setTab("stickers")}
          className={`tg-emoji-category ${tab === "stickers" ? "tg-emoji-category-active" : ""}`}
          title="我的贴纸"
        >
          🖼️
        </button>
      </div>
    </div>
  );
}
