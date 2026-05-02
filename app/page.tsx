import SiteLayout from "@/components/SiteLayout";
import WorksGridSection from "@/components/WorksGridSection";
import ListPageMemory from "@/components/ListPageMemory";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage({
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
  const isAdmin = user?.role === "ADMIN";

  const picksRaw = await prisma.work.findMany({
    where: { type: "FOLDER", ...(!isAdmin ? { isPublic: true } : {}) },
    orderBy: { updatedAt: "desc" },
    take: 18,
    include: {
      author: true,
      files: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });

  const randomPicks = picksRaw
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, 4)
    .map(({ item }) => item);

  return (
    <SiteLayout title="图集专区" active="folders" hidePageHead>
      <ListPageMemory />

      <section className="celestia-hero content-panel celestia-hero-compact">
        <div className="celestia-hero-nav" aria-label="主分区快捷入口">
          <span className="celestia-star">✦</span>
          <a href="/">GALLERY</a>
          <a href="/gifs">ANIME</a>
          <a href="/videos">VIDEO</a>
          <a href="/forum">FORUM</a>
          <a href="/chats">CHAT</a>
        </div>

        <div className="celestia-hero-gridline">
          <aside className="celestia-random-picks" aria-label="随机推荐作品">
            <div className="celestia-random-head">
              <span>Random Picks</span>
              <strong>随机推荐</strong>
            </div>

            <div className="celestia-random-list">
              {randomPicks.length === 0 ? (
                <div className="celestia-random-empty">暂无可推荐作品</div>
              ) : (
                randomPicks.map((work, index) => {
                  const cover = work.coverUrl || work.files[0]?.fileUrl || "";
                  return (
                    <a
                      key={work.id}
                      className="celestia-random-card"
                      href={`/works/${work.id}${show16 ? "?show16=true" : ""}`}
                    >
                      <div className="celestia-random-thumb">
                        {cover ? <img src={cover} alt="" /> : <span>{index + 1}</span>}
                      </div>
                      <div className="celestia-random-meta">
                        <b>{work.title}</b>
                        <span>{work.author.nickname} · {work.files.length || 1}P</span>
                      </div>
                    </a>
                  );
                })
              )}
            </div>
          </aside>

          <div className="celestia-hero-body">
            <div className="celestia-kicker">AI-FIRST COMMUNITY</div>
            <h1 className="celestia-title">
              BeautyFun
              <br />
              Celestial Archive
            </h1>
            <p className="celestia-description">
              黑白电影云海、胶囊导航和高级内容卡片。保留原有图集、动图、视频、论坛、聊天和会员功能，只重塑视觉体验。
            </p>
            <div className="celestia-actions">
              <a href="#latest-gallery" className="celestia-primary-btn">浏览图集 →</a>
              <a href="/chats" className="celestia-secondary-btn">进入消息中心</a>
            </div>
          </div>
        </div>
      </section>

      <div id="latest-gallery" />
      <WorksGridSection
        title="最新图集"
        type="FOLDER"
        basePath="/"
        currentPage={currentPage}
        tag={tag}
        show16={show16}
      />
    </SiteLayout>
  );
}
