import SiteLayout from "@/components/SiteLayout";
import WorksGridSection from "@/components/WorksGridSection";
import ListPageMemory from "@/components/ListPageMemory";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";

export default async function GifsPage({
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
    <SiteLayout title="动图区" active="gifs" hidePageHead>
      <ListPageMemory />

      <div className="bf-page-shell">
        <section className="bf-section-hero">
          <div className="bf-section-hero-inner">
            <div>
              <div className="bf-hero-kicker-row">
                <span className="bf-hero-kicker">
                  <span className="bf-hero-kicker-dot" /> Motion Gallery
                </span>
                <span className="bf-hero-kicker">帧序列播放</span>
                <span className="bf-hero-kicker">丝滑动效</span>
              </div>

              <h1 className="bf-hero-title-xl">动图区</h1>

              <p className="bf-hero-subtitle-lg">
                专门收纳 GIF / UGOIRA 风格的帧序列内容。新版布局强化了预览节奏、卡片层次和移动端浏览手感，保留原有分页、标签和 16+ 筛选逻辑。
              </p>
            </div>

            <aside className="bf-hero-side-card">
              <div className="bf-panel-title" style={{ fontSize: 26 }}>当前筛选</div>
              <div className="bf-stats-grid" style={{ gridTemplateColumns: "1fr", marginTop: 16 }}>
                <MiniStat label="分区" value="动图" />
                <MiniStat label="标签" value={tag || "全部"} />
                <MiniStat label="16+" value={show16 ? "显示" : "隐藏"} />
              </div>
            </aside>
          </div>
        </section>

        <WorksGridSection
          title="最新动图帧序列"
          type="GIF"
          basePath="/gifs"
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
