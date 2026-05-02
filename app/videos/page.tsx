import SiteLayout from "@/components/SiteLayout";
import WorksGridSection from "@/components/WorksGridSection";
import ListPageMemory from "@/components/ListPageMemory";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string; show16?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const cookieStore = await cookies();

  const currentPage = Math.max(1, Number(params.page || "1") || 1);
  const tag = String(params.tag || "").trim();

  const cookieShow16 = cookieStore.get("bf_show16")?.value === "true";
  const requestedShow16 =
    typeof params.show16 === "string"
      ? params.show16 === "true"
      : cookieShow16;
  const canUseShow16 = user?.role === "GOLD" || user?.role === "ADMIN";
  const show16 = requestedShow16 && canUseShow16;

  return (
    <SiteLayout title="视频区" active="videos" hidePageHead>
      <ListPageMemory />

      <div className="bf-page-shell">
        <section className="bf-section-hero">
          <div className="bf-section-hero-inner">
            <div>
              <div className="bf-hero-kicker-row">
                <span className="bf-hero-kicker">
                  <span className="bf-hero-kicker-dot" /> Cinema Deck
                </span>
                <span className="bf-hero-kicker">视频预览</span>
                <span className="bf-hero-kicker">沉浸观看</span>
              </div>

              <h1 className="bf-hero-title-xl">视频区</h1>

              <p className="bf-hero-subtitle-lg">
                视频卡片现在使用更强的影院感层级、玻璃工具栏和柔和进入动画。只调整展示体验，不改变原本的视频上传、分页、权限和热门锁定规则。
              </p>
            </div>

            <aside className="bf-hero-side-card">
              <div className="bf-panel-title" style={{ fontSize: 26 }}>浏览状态</div>
              <div className="bf-stats-grid" style={{ gridTemplateColumns: "1fr", marginTop: 16 }}>
                <MiniStat label="分区" value="视频" />
                <MiniStat label="标签" value={tag || "全部"} />
                <MiniStat label="16+" value={show16 ? "显示" : "隐藏"} />
              </div>
            </aside>
          </div>
        </section>

        <WorksGridSection
          title="最新视频"
          type="VIDEO"
          basePath="/videos"
          currentPage={currentPage}
          tag={tag}
          show16={show16}
        />
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
