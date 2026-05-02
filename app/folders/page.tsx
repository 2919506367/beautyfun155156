import SiteLayout from "@/components/SiteLayout";
import WorksGridSection from "@/components/WorksGridSection";
import ListPageMemory from "@/components/ListPageMemory";
import { cookies } from "next/headers";

export default async function FoldersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string; show16?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();

  const currentPage = Math.max(1, Number(params.page || "1") || 1);
  const tag = String(params.tag || "").trim();

  const cookieShow16 = cookieStore.get("bf_show16")?.value === "true";
  const show16 =
    typeof params.show16 === "string"
      ? params.show16 === "true"
      : cookieShow16;

  return (
    <SiteLayout title="图集区" active="folders" hidePageHead>
      <ListPageMemory />
      <div className="bf-page-shell celestia-detail-page">
        <section className="bf-section-hero celestia-subhero">
          <div className="bf-section-hero-inner">
            <div>
              <div className="bf-hero-kicker-row">
                <span className="bf-hero-kicker"><span className="bf-hero-kicker-dot" /> Gallery Archive</span>
                <span className="bf-hero-kicker">图集区</span>
                <span className="bf-hero-kicker">Celestia Collection</span>
              </div>
              <h1 className="bf-hero-title-xl">图集区</h1>
              <p className="bf-hero-subtitle-lg">
                云海电影感的图集陈列室。筛选、分页、16+ 逻辑保持不变，只把页面内部视觉整理得更高级。
              </p>
            </div>
            <aside className="bf-hero-side-card celestia-index-card">
              <div className="bf-quick-tips">
                <div className="bf-quick-tip">当前页：{currentPage}</div>
                <div className="bf-quick-tip">作品标签：{tag || "全部"}</div>
                <div className="bf-quick-tip">16+：{show16 ? "显示" : "隐藏"}</div>
              </div>
            </aside>
          </div>
        </section>

        <section className="bf-page-panel celestia-content-panel">
          <WorksGridSection
            title="图集列表"
            type="FOLDER"
            basePath="/folders"
            currentPage={currentPage}
            tag={tag}
            show16={show16}
          />
        </section>
      </div>
    </SiteLayout>
  );
}
