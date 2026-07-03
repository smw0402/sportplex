import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import PostForm from "./PostForm";

export const dynamic = "force-dynamic";

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ sport?: string; category?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { sport, category } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-extrabold">💬 글쓰기</h1>
      <PostForm
        defaultSport={sport ?? user.sport ?? undefined}
        defaultCategory={category ?? "FREE"}
      />
    </div>
  );
}
