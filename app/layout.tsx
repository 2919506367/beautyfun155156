import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BeautyFun",
  description: "BeautyFun community",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('beautyfun-theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark-mode');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="bf-root-body" id="bf-root-body">
        <div className="bf-celestia-video-layer" aria-hidden="true">
          <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
            <source src="https://res.cloudinary.com/dfonotyfb/video/upload/v1775585556/dds3_1_rqhg7x.mp4" type="video/mp4" />
          </video>
          <div className="bf-celestia-video-vignette" />
        </div>
        <div className="bf-app-bg-layer" aria-hidden="true" />
        <div className="bf-app-mesh" aria-hidden="true" />
        <div className="bf-app-noise" aria-hidden="true" />
        <div className="bf-app-orb bf-orb-1" aria-hidden="true" />
        <div className="bf-app-orb bf-orb-2" aria-hidden="true" />
        <div className="bf-app-orb bf-orb-3" aria-hidden="true" />
        <canvas className="bf-particles-canvas" aria-hidden="true" id="bf-particle-canvas" />
        {children}
      </body>
    </html>
  );
}
