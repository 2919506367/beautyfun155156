import Link from "next/link";

function buildPages(currentPage: number, totalPages: number) {
  const pages: (number | "...")[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }

  pages.push(1);

  if (currentPage > 3) pages.push("...");

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) pages.push("...");

  pages.push(totalPages);

  return pages;
}

function buildPageHref(basePath: string, page: number) {
  return `${basePath}${basePath.includes("?") ? "&" : "?"}page=${page}`;
}

export default function PaginationBar({
  basePath,
  currentPage,
  totalPages,
}: {
  basePath: string;
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const pages = buildPages(currentPage, totalPages);

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "wrap",
        margin: "20px 0",
      }}
    >
      <Link
        href={buildPageHref(basePath, Math.max(1, currentPage - 1))}
        className="bf-page-btn"
        style={{
          pointerEvents: currentPage <= 1 ? "none" : "auto",
          opacity: currentPage <= 1 ? 0.4 : 1,
        }}
      >
        上一页
      </Link>

      {pages.map((item, index) =>
        item === "..." ? (
          <span key={`ellipsis-${index}`} className="bf-page-ellipsis">
            ...
          </span>
        ) : (
          <Link
            key={item}
            href={buildPageHref(basePath, item)}
            className={`bf-page-btn${item === currentPage ? " bf-page-btn-active" : ""}`}
            style={{ minWidth: 42, textAlign: "center" }}
          >
            {item}
          </Link>
        )
      )}

      <Link
        href={buildPageHref(basePath, Math.min(totalPages, currentPage + 1))}
        className="bf-page-btn"
        style={{
          pointerEvents: currentPage >= totalPages ? "none" : "auto",
          opacity: currentPage >= totalPages ? 0.4 : 1,
        }}
      >
        下一页
      </Link>
    </div>
  );
}
