import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sportEmoji } from "@/lib/constants";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const news = await prisma.newsItem.findUnique({ where: { id } });
  if (!news) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
        ← 홈
      </Link>

      <article className="card overflow-hidden">
        {news.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={news.imageUrl} alt={news.title} className="aspect-[16/8] w-full object-cover" />
        ) : (
          <div className="flex aspect-[16/8] items-center justify-center bg-gradient-to-br from-brand-100 to-brand-50 text-6xl">
            {sportEmoji(news.sport)}
          </div>
        )}

        <div className="p-6">
          <span className="chip bg-brand-50 text-brand-700">
            {sportEmoji(news.sport)} {news.sport}
          </span>
          <h1 className="mt-2 text-2xl font-extrabold leading-snug">{news.title}</h1>
          <p className="mt-2 text-xs text-gray-400">
            {news.source ?? "Sportplex"} · {timeAgo(news.createdAt)}
          </p>

          <p className="mt-4 text-[15px] font-medium leading-relaxed text-gray-700">
            {news.summary}
          </p>

          {news.body && (
            <div className="mt-4 whitespace-pre-wrap border-t border-gray-100 pt-4 text-[15px] leading-relaxed text-gray-800">
              {news.body}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
