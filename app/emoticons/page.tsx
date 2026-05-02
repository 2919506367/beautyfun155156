import Link from "next/link";
import { redirect } from "next/navigation";
import SiteLayout from "@/components/SiteLayout";
import EmoticonManager from "@/components/EmoticonManager";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function EmoticonsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const items = await prisma.emoticon.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      label: true,
      imageUrl: true,
      createdAt: true,
    },
  });

  return (
    <SiteLayout title="我的表情包" active="profile" hidePageHead>
      <div className="bf-page-shell">
        <section className="bf-section-hero">
          <div className="bf-section-hero-inner">
            <div>
              <div className="bf-hero-kicker-row">
                <span className="bf-hero-kicker"><span className="bf-hero-kicker-dot" /> Emoticon Studio</span>
                <span className="bf-hero-kicker">评论 / 私信 / 群聊</span>
              </div>
              <h1 className="bf-hero-title-xl">我的表情包</h1>
              <p className="bf-hero-subtitle-lg">
                管理你上传和收藏的表情素材。新版页面只重构视觉容器，上传、选择、发送表情包的接口逻辑不变。
              </p>
            </div>
            <aside className="bf-hero-side-card">
              <div className="bf-stats-grid" style={{ gridTemplateColumns: "1fr" }}>
                <MiniStat label="我的表情" value={String(items.length)} />
                <MiniStat label="使用场景" value="评论 / 聊天" />
              </div>
            </aside>
          </div>
        </section>

        <section className="bf-page-panel">
          <div className="bf-panel-head">
            <div>
              <h2 className="bf-panel-title">表情包管理</h2>
              <div className="bf-panel-subtitle">上传新表情、查看已有表情，并继续用于评论区、私信和群聊。</div>
            </div>
            <Link href="/profile" className="bf-secondary-link">← 返回个人资料</Link>
          </div>

          <EmoticonManager
            initialItems={items.map((item) => ({
              id: item.id,
              label: item.label,
              imageUrl: item.imageUrl,
              createdAt: item.createdAt.toISOString(),
            }))}
          />
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
