import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sportEmoji } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import { deleteNewsAction } from "@/app/actions/news";
import NewsForm from "@/components/NewsForm";
import AdminNav from "@/components/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminNewsPage() {
  const me = await getCurrentUser();
  if (!me?.isAdmin) notFound();

  const newsList = await prisma.newsItem.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div className="space-y-5">
      <AdminNav active="news" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 font-bold">📝 뉴스 올리기</h2>
          <NewsForm />
        </section>

        <section className="card p-5">
          <h2 className="mb-3 font-bold">📰 등록된 뉴스 {newsList.length}</h2>
          <div className="space-y-2">
            {newsList.length === 0 && (
              <p className="text-sm text-gray-400">등록된 뉴스가 없습니다.</p>
            )}
            {newsList.map((n) => (
              <div key={n.id} className="flex items-center gap-2 rounded-xl border border-gray-100 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    <span className="mr-1">{sportEmoji(n.sport)}</span>
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-400">
                    {n.sport} · {n.body ? "본문 있음" : "요약만"} · {timeAgo(n.createdAt)}
                  </p>
                </div>
                <form action={deleteNewsAction}>
                  <input type="hidden" name="newsId" value={n.id} />
                  <button className="text-sm text-red-500 hover:underline">삭제</button>
                </form>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
