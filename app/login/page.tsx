"use client";

import { FormEvent, useEffect, useState } from "react";

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

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [nickname, setNickname] = useState("");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
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
  }, [mode]);

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

    setLoading(true);
    setErrorText("");
    setMessageText(mode === "login" ? "正在登录…" : "正在注册…");

    try {
      const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login"
          ? { account: currentAccount, password: currentPassword }
          : {
              nickname: currentNickname,
              account: currentAccount,
              password: currentPassword,
              inviteCode: currentInviteCode,
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
