import SiteLayout from "@/components/SiteLayout";
import { getCurrentUser } from "@/lib/auth";
import MembershipPanel from "@/components/MembershipPanel";
import { getRoleLabel } from "@/lib/user-display";
import Link from "next/link";

export default async function MembershipPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <SiteLayout title="会员中心" active="profile" hidePageHead>
        <div className="bf-page-shell">
          <section className="bf-section-hero">
            <div className="bf-section-hero-inner">
              <div>
                <div className="bf-hero-kicker-row">
                  <span className="bf-hero-kicker"><span className="bf-hero-kicker-dot" /> Membership</span>
                </div>
                <h1 className="bf-hero-title-xl">会员中心</h1>
                <p className="bf-hero-subtitle-lg">请先登录后进入会员中心。</p>
              </div>
              <aside className="bf-hero-side-card">
                <Link href="/login" className="bf-primary-link">去登录</Link>
              </aside>
            </div>
          </section>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout title="会员中心" active="profile" hidePageHead>
      <div className="bf-page-shell">
        <section className="bf-section-hero">
          <div className="bf-section-hero-inner">
            <div>
              <div className="bf-hero-kicker-row">
                <span className="bf-hero-kicker"><span className="bf-hero-kicker-dot" /> Membership Center</span>
                <span className="bf-hero-kicker">权限状态</span>
              </div>
              <h1 className="bf-hero-title-xl">会员中心</h1>
              <p className="bf-hero-subtitle-lg">
                会员兑换、身份展示和热门作品访问权限都保留原逻辑；这版只把入口做得更清晰、更像高级控制面板。
              </p>
            </div>
            <aside className="bf-hero-side-card">
              <div className="bf-stats-grid" style={{ gridTemplateColumns: "1fr" }}>
                <MiniStat label="当前账号" value={user.nickname} />
                <MiniStat label="当前身份" value={getRoleLabel(user.role)} />
              </div>
            </aside>
          </div>
        </section>

        <section className="bf-page-panel">
          <div className="bf-panel-head">
            <div>
              <h2 className="bf-panel-title">兑换与状态</h2>
              <div className="bf-panel-subtitle">输入会员 CDK 后，仍然由原 MembershipPanel 和接口处理。</div>
            </div>
          </div>
          <MembershipPanel role={user.role} />
        </section>
      </div>
    </SiteLayout>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bf-stat-card">
      <div className="bf-stat-label">{label}</div>
      <div className="bf-stat-value">{value}</div>
    </div>
  );
}
