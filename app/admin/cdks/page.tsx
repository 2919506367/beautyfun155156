import SiteLayout from "@/components/SiteLayout";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminGenerateCdkButton from "@/components/AdminGenerateCdkButton";
import AdminGenerateRegisterInviteButton from "@/components/AdminGenerateRegisterInviteButton";

export default async function AdminCdksPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <SiteLayout title="CDK管理" active="admin">
        <EmptyState title="请先登录" description="登录管理员账号后才能进入 CDK 控制台。" />
      </SiteLayout>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <SiteLayout title="CDK管理" active="admin">
        <EmptyState title="权限不足" description="只有管理员可以访问这个页面。" />
      </SiteLayout>
    );
  }

  const cdks = await prisma.membershipCdk.findMany({ orderBy: { createdAt: "desc" } });
  const registerInvites = await prisma.registerInviteCode.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <SiteLayout title="CDK管理" active="admin" hidePageHead>
      <div className="cel-admin-shell">
        <section className="cel-cinema-panel cel-hero-strip">
          <div>
            <div className="cel-eyebrow">Admin Console · Access Keys</div>
            <h1 className="cel-title-xl">Key Chamber</h1>
            <p className="cel-subtitle">
              黄金会员 CDK 与注册邀请码统一放进电影感密钥舱。生成按钮和使用记录逻辑保持不变。
            </p>
          </div>
        </section>

        <KeySection
          title="黄金会员 CDK 管理"
          count={cdks.length}
          action={<AdminGenerateCdkButton />}
        >
          {cdks.length === 0 ? (
            <div className="cel-muted">还没有生成过 CDK。</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {cdks.map((item) => (
                <div key={item.id} className="cel-list-card">
                  <div className="cel-pill-row">
                    <span className="cel-pill cel-pill-gold">CDK {item.code}</span>
                    <span className={item.isUsed ? "cel-pill" : "cel-pill cel-pill-gold"}>{item.isUsed ? "已使用" : "未使用"}</span>
                    <span className="cel-pill">目标 黄金会员</span>
                    <span className="cel-pill">使用者ID {item.usedById ?? "未使用"}</span>
                  </div>
                  <div className="cel-meta">创建时间：{new Date(item.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </KeySection>

        <KeySection
          title="注册邀请码管理"
          count={registerInvites.length}
          action={<AdminGenerateRegisterInviteButton />}
        >
          {registerInvites.length === 0 ? (
            <div className="cel-muted">还没有生成过注册邀请码。</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {registerInvites.map((item) => (
                <div key={item.id} className="cel-list-card">
                  <div className="cel-pill-row">
                    <span className="cel-pill cel-pill-gold">邀请码 {item.code}</span>
                    <span className={item.isUsed ? "cel-pill" : "cel-pill cel-pill-gold"}>{item.isUsed ? "已使用" : "未使用"}</span>
                    <span className="cel-pill">使用者ID {item.usedById ?? "未使用"}</span>
                  </div>
                  <div className="cel-meta">
                    创建时间：{new Date(item.createdAt).toLocaleString()}　/　使用时间：{item.usedAt ? new Date(item.usedAt).toLocaleString() : "未使用"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </KeySection>
      </div>
    </SiteLayout>
  );
}

function KeySection({ title, count, action, children }: { title: string; count: number; action: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="cel-cinema-panel" style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
        <div>
          <h2 className="cel-title-md">{title}</h2>
          <div className="cel-meta" style={{ marginTop: 8 }}>当前记录：{count} 条</div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="cel-cinema-panel" style={{ padding: 28 }}>
      <h2 className="cel-title-md">{title}</h2>
      <p className="cel-subtitle">{description}</p>
    </div>
  );
}
