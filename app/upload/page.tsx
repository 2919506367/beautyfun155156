import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import UploadForm from "@/components/UploadForm";
import SiteLayout from "@/components/SiteLayout";

export default async function UploadPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <SiteLayout title="上传作品" active="upload" hidePageHead>
        <div className="bf-page-shell">
          <section className="bf-section-hero">
            <div className="bf-section-hero-inner">
              <div>
                <div className="bf-hero-kicker-row">
                  <span className="bf-hero-kicker"><span className="bf-hero-kicker-dot" /> Creator Studio</span>
                </div>
                <h1 className="bf-hero-title-xl">上传作品</h1>
                <p className="bf-hero-subtitle-lg">请先登录后再上传。</p>
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
    <SiteLayout title="上传作品" active="upload" hidePageHead>
      <div className="bf-page-shell">
        <section className="bf-section-hero">
          <div className="bf-section-hero-inner">
            <div>
              <div className="bf-hero-kicker-row">
                <span className="bf-hero-kicker"><span className="bf-hero-kicker-dot" /> Creator Studio</span>
                <span className="bf-hero-kicker">图集 / 动图 / 视频</span>
                <span className="bf-hero-kicker">自动分区</span>
              </div>
              <h1 className="bf-hero-title-xl">上传作品</h1>
              <p className="bf-hero-subtitle-lg">
                上传流程保持原样，只重新整理了页面入口、提示信息和表单承载区域，让后台操作更像一个创作者工作台。
              </p>
            </div>
            <aside className="bf-hero-side-card">
              <div className="bf-quick-tips">
                <div className="bf-quick-tip">图集支持多图上传，并按原顺序展示。</div>
                <div className="bf-quick-tip">动图区域适合帧序列内容。</div>
                <div className="bf-quick-tip">视频上传后会进入视频区。</div>
              </div>
            </aside>
          </div>
        </section>

        <section className="bf-page-panel">
          <div className="bf-panel-head">
            <div>
              <h2 className="bf-panel-title">作品信息</h2>
              <div className="bf-panel-subtitle">填写标题、分区、年龄限制和标签。原上传接口与业务逻辑不变。</div>
            </div>
          </div>
          <UploadForm />
        </section>
      </div>
    </SiteLayout>
  );
}
