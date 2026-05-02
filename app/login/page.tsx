"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

const AUTH_COOKIE_NAME = "beautyfun_token";
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

type AuthMode = "login" | "register";

function writeBrowserAuthCookie(token: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; Max-Age=${AUTH_COOKIE_MAX_AGE}; Path=/; SameSite=Lax`;
}

async function readJsonSafely(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function pseudoRandom(seed: number) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function CaptchaPreview({
  value,
  onRefresh,
  refreshing,
}: {
  value: string;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const seed = useMemo(() => {
    return value.split("").reduce((acc, char, index) => acc + char.charCodeAt(0) * (index + 11), 97);
  }, [value]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const width = 196;
    const height = 64;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const rand = pseudoRandom(seed || 97);

    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, `hsl(${210 + Math.floor(rand() * 20)}, 30%, 94%)`);
    bg.addColorStop(0.5, `hsl(${220 + Math.floor(rand() * 18)}, 26%, 97%)`);
    bg.addColorStop(1, `hsl(${190 + Math.floor(rand() * 35)}, 38%, 93%)`);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 120; i += 1) {
      ctx.beginPath();
      ctx.fillStyle = `hsla(${180 + Math.floor(rand() * 100)}, ${18 + Math.floor(rand() * 40)}%, ${50 + Math.floor(rand() * 38)}%, ${0.08 + rand() * 0.2})`;
      ctx.arc(rand() * width, rand() * height, 0.5 + rand() * 1.9, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < 9; i += 1) {
      ctx.beginPath();
      ctx.lineWidth = 0.9 + rand() * 1.8;
      ctx.strokeStyle = `hsla(${180 + Math.floor(rand() * 100)}, ${35 + Math.floor(rand() * 30)}%, ${30 + Math.floor(rand() * 25)}%, ${0.18 + rand() * 0.24})`;
      const startY = rand() * height;
      ctx.moveTo(-16, startY);
      const cp1x = width * (0.12 + rand() * 0.2);
      const cp1y = rand() * height;
      const cp2x = width * (0.52 + rand() * 0.2);
      const cp2y = rand() * height;
      const endY = rand() * height;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, width + 16, endY);
      ctx.stroke();
    }

    for (let i = 0; i < 5; i += 1) {
      ctx.save();
      ctx.translate(rand() * width, rand() * height);
      ctx.rotate((rand() - 0.5) * 1.2);
      ctx.fillStyle = `hsla(${180 + Math.floor(rand() * 120)}, ${18 + Math.floor(rand() * 20)}%, ${70 + Math.floor(rand() * 15)}%, ${0.12 + rand() * 0.08})`;
      ctx.fillRect(-30 - rand() * 20, -2, 60 + rand() * 40, 4 + rand() * 4);
      ctx.restore();
    }

    if (!value) {
      ctx.fillStyle = "rgba(15,23,42,0.4)";
      ctx.font = "700 18px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("-----", width / 2, height / 2);
      return;
    }

    const chars = value.split("");
    const leftPadding = 18;
    const usableWidth = width - leftPadding * 2;
    const gap = usableWidth / Math.max(chars.length, 1);

    chars.forEach((char, index) => {
      const x = leftPadding + gap * index + gap / 2;
      const y = height / 2 + (rand() * 16 - 8);
      const rotate = (rand() * 0.72) - 0.36;
      const fontSize = 31 + Math.floor(rand() * 7);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotate);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.font = `900 ${fontSize}px Arial, Helvetica, sans-serif`;

      const stroke = ctx.createLinearGradient(-18, -14, 18, 18);
      stroke.addColorStop(0, `rgba(255,255,255,${0.42 + rand() * 0.18})`);
      stroke.addColorStop(1, `rgba(255,255,255,${0.08 + rand() * 0.1})`);
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2.6;
      ctx.strokeText(char, 0, 0);

      const fill = ctx.createLinearGradient(-16, -16, 16, 16);
      fill.addColorStop(0, `hsl(${215 + Math.floor(rand() * 25)}, ${40 + Math.floor(rand() * 16)}%, ${24 + Math.floor(rand() * 10)}%)`);
      fill.addColorStop(1, `hsl(${185 + Math.floor(rand() * 40)}, ${38 + Math.floor(rand() * 18)}%, ${30 + Math.floor(rand() * 12)}%)`);
      ctx.fillStyle = fill;
      ctx.fillText(char, 0, 0);

      ctx.restore();
    });

    for (let i = 0; i < 7; i += 1) {
      ctx.beginPath();
      ctx.lineWidth = 1.2 + rand() * 2.1;
      ctx.strokeStyle = `hsla(${180 + Math.floor(rand() * 120)}, ${30 + Math.floor(rand() * 40)}%, ${48 + Math.floor(rand() * 18)}%, ${0.18 + rand() * 0.18})`;
      ctx.moveTo(rand() * 20, rand() * height);
      ctx.lineTo(width - rand() * 20, rand() * height);
      ctx.stroke();
    }

    for (let i = 0; i < 4; i += 1) {
      const bandY = 10 + rand() * (height - 20);
      ctx.fillStyle = `rgba(255,255,255,${0.08 + rand() * 0.06})`;
      ctx.fillRect(0, bandY, width, 1.4 + rand() * 1.8);
    }

    ctx.strokeStyle = "rgba(255,255,255,0.44)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
  }, [seed, value]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: 196,
        minWidth: 196,
      }}
    >
      <div
        style={{
          position: "relative",
          width: 196,
          height: 64,
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid rgba(148,163,184,0.18)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.52), 0 10px 28px rgba(15,23,42,0.12)",
          background: "linear-gradient(135deg, rgba(241,245,249,0.98), rgba(226,232,240,0.94))",
        }}
      >
        <canvas ref={canvasRef} />
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        style={{
          alignSelf: "flex-end",
          minWidth: 76,
          height: 30,
          padding: "0 12px",
          borderRadius: 999,
          border: "1px solid rgba(148,163,184,0.22)",
          background: "rgba(255,255,255,0.84)",
          boxShadow: "0 6px 14px rgba(15,23,42,0.08)",
          color: "#0f172a",
          fontSize: 12,
          fontWeight: 800,
          cursor: refreshing ? "not-allowed" : "pointer",
        }}
      >
        {refreshing ? "刷新中..." : "换一张"}
      </button>
    </div>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [nickname, setNickname] = useState("");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [captchaNeeded, setCaptchaNeeded] = useState(false);
  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [errorText, setErrorText] = useState("");
  const [showBannedModal, setShowBannedModal] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setMode(query.get("mode") === "register" ? "register" : "login");
  }, []);

  useEffect(() => {
    document.body.classList.add("bf-login-active");
    return () => {
      document.body.classList.remove("bf-login-active");
    };
  }, []);

  useEffect(() => {
    setErrorText("");
    setMessageText("");
    setCaptchaInput("");
    loadCaptchaState();
  }, [mode]);

  async function loadCaptchaState() {
    setCaptchaLoading(true);

    try {
      const res = await fetch(`/api/auth/captcha?mode=${mode}&t=${Date.now()}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await readJsonSafely(res);

      setCaptchaNeeded(Boolean(data?.needCaptcha));
      setCaptchaCode(String(data?.captchaCode || ""));
      setCaptchaInput("");
    } catch (error) {
      console.error("load captcha error:", error);
      setCaptchaNeeded(true);
      setCaptchaCode("");
    } finally {
      setCaptchaLoading(false);
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    const nextUrl = nextMode === "register" ? "/login?mode=register" : "/login?mode=login";
    window.history.replaceState(null, "", nextUrl);
  }

  async function submitAuth(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    event?.stopPropagation();

    if (loading) return;

    const currentAccount = account.trim();
    const currentPassword = password.trim();
    const currentNickname = nickname.trim();
    const currentInviteCode = inviteCode.trim();
    const currentCaptchaInput = captchaInput.trim();

    if (!currentAccount || !currentPassword) {
      setErrorText("账号和密码不能为空");
      setMessageText("");
      return;
    }

    if (mode === "register" && !currentNickname) {
      setErrorText("昵称不能为空");
      setMessageText("");
      return;
    }

    if (mode === "register" && !currentInviteCode) {
      setErrorText("邀请码不能为空");
      setMessageText("");
      return;
    }

    if (captchaNeeded && !/^\d{5}$/.test(currentCaptchaInput)) {
      setErrorText("请输入 5 位数字验证码");
      setMessageText("");
      return;
    }

    setLoading(true);
    setErrorText("");
    setMessageText(mode === "login" ? "正在登录…" : "正在注册…");

    try {
      const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login"
          ? {
              account: currentAccount,
              password: currentPassword,
              captchaCode: currentCaptchaInput,
            }
          : {
              nickname: currentNickname,
              account: currentAccount,
              password: currentPassword,
              inviteCode: currentInviteCode,
              captchaCode: currentCaptchaInput,
            };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(body),
      });

      const data = await readJsonSafely(res);

      if (!res.ok) {
        const msg = data?.error || (mode === "login" ? "登录失败" : "注册失败");
        if (mode === "login" && String(msg).includes("封禁")) {
          setShowBannedModal(true);
          setErrorText("");
          setMessageText("");
          return;
        }

        setErrorText(String(msg));
        setMessageText("");

        if (data?.needCaptcha || String(msg).includes("验证码")) {
          await loadCaptchaState();
        }

        return;
      }

      if (data?.token) {
        writeBrowserAuthCookie(String(data.token));
      }

      const verifyRes = await fetch("/api/auth/session-status", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      const verifyData = await readJsonSafely(verifyRes);

      if (!verifyData?.loggedIn) {
        setErrorText(
          "账号密码已经通过，但浏览器没有保存登录状态。请确认手机访问的是电脑局域网 IP，并且 next.config.ts 已加入 allowedDevOrigins 后重启了服务。"
        );
        setMessageText("");
        return;
      }

      setMessageText(mode === "login" ? "登录成功，正在进入首页…" : "注册成功，正在进入首页…");
      window.setTimeout(() => {
        window.location.href = "/";
      }, 150);
    } catch (error) {
      console.error("auth submit error:", error);
      setErrorText("请求失败，请检查手机和电脑是否在同一个网络，或者服务是否还在运行。");
      setMessageText("");
    } finally {
      setLoading(false);
    }
  }

  const isRegister = mode === "register";

  return (
    <>
      <main
        className="login-page-content"
        style={{
          minHeight: "100vh",
          padding: 12,
          background: "var(--bf-panel-bg-soft)",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          position: "relative",
          zIndex: 999,
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 460,
            marginTop: 16,
            background: "var(--bf-panel-bg)",
            border: "1px solid var(--bf-panel-border)",
            borderRadius: 20,
            padding: 18,
            boxShadow: "0 24px 80px rgba(15,23,42,0.12)",
          }}
        >
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "var(--bf-panel-text)", marginBottom: 8 }}>
              BeautyFun
            </div>
            <div style={{ fontSize: 14, color: "var(--bf-panel-text-soft)", lineHeight: 1.7 }}>
              {isRegister ? "注册需要昵称、账号、密码和邀请码" : "使用账号和密码登录"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            <button
              type="button"
              onClick={() => switchMode("login")}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "10px 12px",
                borderRadius: 999,
                border: !isRegister ? "1px solid transparent" : "1px solid var(--bf-panel-border)",
                background: !isRegister ? "var(--bf-panel-text)" : "var(--bf-panel-bg-soft)",
                color: !isRegister ? "#fff" : "var(--bf-panel-text)",
                fontWeight: 800,
                fontSize: 14,
                cursor: "pointer",
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              登录
            </button>

            <button
              type="button"
              onClick={() => switchMode("register")}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "10px 12px",
                borderRadius: 999,
                border: isRegister ? "1px solid transparent" : "1px solid var(--bf-panel-border)",
                background: isRegister ? "var(--bf-panel-text)" : "var(--bf-panel-bg-soft)",
                color: isRegister ? "#fff" : "var(--bf-panel-text)",
                fontWeight: 800,
                fontSize: 14,
                cursor: "pointer",
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              注册
            </button>
          </div>

          {errorText && (
            <div
              style={{
                marginBottom: 14,
                padding: "12px 14px",
                borderRadius: 14,
                background: "rgba(244,63,94,0.08)",
                border: "1px solid rgba(244,63,94,0.2)",
                color: "#be123c",
                fontSize: 14,
                fontWeight: 700,
                lineHeight: 1.7,
              }}
            >
              {errorText}
            </div>
          )}

          {messageText && (
            <div
              style={{
                marginBottom: 14,
                padding: "12px 14px",
                borderRadius: 14,
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.2)",
                color: "#15803d",
                fontSize: 14,
                fontWeight: 700,
                lineHeight: 1.7,
              }}
            >
              {messageText}
            </div>
          )}

          <form onSubmit={submitAuth} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {isRegister && (
              <>
                <Field
                  name="nickname"
                  label="昵称"
                  value={nickname}
                  onChange={setNickname}
                  placeholder="请输入昵称"
                  autoComplete="nickname"
                />
                <Field
                  name="inviteCode"
                  label="邀请码"
                  value={inviteCode}
                  onChange={setInviteCode}
                  placeholder="请输入邀请码"
                  autoComplete="off"
                />
              </>
            )}

            <Field
              name="account"
              label="账号"
              value={account}
              onChange={setAccount}
              placeholder="请输入账号"
              autoComplete="username"
            />
            <Field
              name="password"
              label="密码"
              value={password}
              onChange={setPassword}
              placeholder="请输入密码"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
            />

            {captchaNeeded && (
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  padding: 14,
                  borderRadius: 18,
                  background: "linear-gradient(180deg, rgba(15,23,42,0.03), rgba(15,23,42,0.05))",
                  border: "1px solid var(--bf-panel-border)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "var(--bf-panel-text)" }}>
                    图形数字验证码
                  </div>
                  <div style={{ fontSize: 12, color: "var(--bf-panel-text-soft)", lineHeight: 1.6 }}>
                    第一次或短时间频繁登录 / 注册时需要输入，点击下方按钮可刷新。
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "196px minmax(0, 1fr)",
                    gap: 12,
                    alignItems: "start",
                  }}
                >
                  <CaptchaPreview
                    value={captchaCode}
                    onRefresh={loadCaptchaState}
                    refreshing={captchaLoading}
                  />

                  <input
                    value={captchaInput}
                    onChange={(e) => {
                      const next = e.target.value.replace(/\D/g, "").slice(0, 5);
                      setCaptchaInput(next);
                    }}
                    placeholder="请输入图中 5 位数字"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={5}
                    style={{
                      width: "100%",
                      height: 52,
                      padding: "0 14px",
                      borderRadius: 14,
                      border: "1px solid var(--bf-input-border)",
                      background: "var(--bf-input-bg)",
                      color: "var(--bf-panel-text)",
                      fontSize: 18,
                      fontWeight: 900,
                      letterSpacing: 2,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 14,
                border: "none",
                background: "var(--bf-panel-text)",
                color: "#fff",
                fontWeight: 900,
                fontSize: 14,
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: 4,
                opacity: loading ? 0.7 : 1,
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {loading ? "处理中..." : isRegister ? "立即注册" : "立即登录"}
            </button>
          </form>
        </div>
      </main>

      {showBannedModal && (
        <div
          onClick={() => setShowBannedModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 460,
              background: "var(--bf-panel-bg)",
              borderRadius: 22,
              padding: 24,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 900, color: "var(--bf-panel-text)", marginBottom: 12 }}>
              账号已被封禁
            </div>
            <div style={{ fontSize: 14, color: "var(--bf-panel-text-soft)", lineHeight: 1.8, marginBottom: 22 }}>
              管理员已封禁该账号，当前无法登录。若你认为这是误封，请联系管理员处理。
            </div>
            <button
              type="button"
              onClick={() => setShowBannedModal(false)}
              style={{
                background: "var(--bf-panel-text)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "10px 20px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              知道了
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Field({
  name,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--bf-panel-text-soft)" }}>{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 14,
          border: "1px solid var(--bf-input-border)",
          background: "var(--bf-input-bg)",
          color: "var(--bf-panel-text)",
          fontSize: 16,
          outline: "none",
          boxSizing: "border-box",
        }}
      />
    </label>
  );
}
