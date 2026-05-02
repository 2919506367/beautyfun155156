import { notFound, redirect } from "next/navigation";
import SiteLayout from "@/components/SiteLayout";
import ForumEditClientForm from "@/components/ForumEditClientForm";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = Promise<{
  id: string;
}>;

export default async function ForumEditPage({
  params,
}: {
  params: Params;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "ADMIN") {
    redirect("/forum");
  }

  const { id } = await params;
  const postId = Number(id);

  if (!postId || Number.isNaN(postId)) {
    notFound();
  }

  const post = await prisma.forumPost.findUnique({
    where: { id: postId },
    include: {
      mediaItems: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  if (!post) {
    notFound();
  }

  return (
    <SiteLayout title="编辑论坛帖子" active="forum">
      <ForumEditClientForm
        postId={post.id}
        initialTitle={post.title}
        initialContent={post.content}
        initialCategory={post.category}
        initialAgeRating={post.ageRating}
        initialPinned={post.isPinned}
        initialMediaItems={post.mediaItems.map((item) => ({
          type: item.type,
          url: item.url,
        }))}
      />
    </SiteLayout>
  );
}