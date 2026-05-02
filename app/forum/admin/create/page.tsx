import { redirect } from "next/navigation";
import SiteLayout from "@/components/SiteLayout";
import ForumCreateClientForm from "@/components/ForumCreateClientForm";
import { getCurrentUser } from "@/lib/auth";

export default async function ForumCreatePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "ADMIN") {
    redirect("/forum");
  }

  return (
    <SiteLayout title="发布论坛帖子" active="forum">
      <ForumCreateClientForm />
    </SiteLayout>
  );
}