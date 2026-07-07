import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { schoolCategoryLabel, SCHOOL_CATEGORIES } from "@/lib/constants";
import { deleteSchoolAction } from "@/app/actions/adminExtra";
import AdminNav from "@/components/AdminNav";
import SchoolForm from "@/components/SchoolForm";

export const dynamic = "force-dynamic";

export default async function AdminSchoolsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string }>;
}) {
  const me = await getCurrentUser();
  if (!me?.isAdmin) notFound();
  const { q = "", cat = "" } = await searchParams;
  const keyword = q.trim();

  const [schools, total] = await Promise.all([
    prisma.school.findMany({
      where: {
        ...(cat ? { category: cat } : {}),
        ...(keyword
          ? {
              OR: [
                { name: { contains: keyword } },
                { region: { contains: keyword } },
                { sports: { contains: keyword } },
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" },
      take: 300,
    }),
    prisma.school.count(),
  ]);

  return (
    <div className="space-y-5">
      <AdminNav active="schools" />

      <SchoolForm />

      <div className="flex items-center justify-between">
        <h2 className="font-bold">🏫 학교 {total}곳</h2>
      </div>

      <form action="/admin/schools" className="flex flex-wrap gap-2">
        <input name="q" defaultValue={keyword} className="input flex-1" placeholder="학교명·지역·종목 검색" />
        <select name="cat" defaultValue={cat} className="input w-32">
          <option value="">전체 구분</option>
          {SCHOOL_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>
        <button className="btn-primary shrink-0">검색</button>
      </form>

      <div className="card divide-y divide-gray-100">
        {schools.length === 0 && (
          <p className="p-8 text-center text-sm text-gray-400">
            등록된 학교가 없습니다. 위에서 추가해보세요.
          </p>
        )}
        {schools.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 font-semibold">
                {s.name}
                <span className="chip bg-gray-100 text-gray-600">{schoolCategoryLabel(s.category)}</span>
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                {[s.region, s.sports].filter(Boolean).join(" · ") || "정보 없음"}
                {s.note && ` · ${s.note}`}
              </p>
              {s.homepage && (
                <a href={s.homepage} target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:underline">
                  {s.homepage}
                </a>
              )}
            </div>
            <form action={deleteSchoolAction}>
              <input type="hidden" name="schoolId" value={s.id} />
              <button className="btn-outline !px-2.5 !py-1.5 text-xs text-red-500">삭제</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
