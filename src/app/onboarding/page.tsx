import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import OnboardingForm from "./OnboardingForm";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-md py-8">
      <h1 className="text-2xl font-extrabold">환영해요! 🎉</h1>
      <p className="mt-1 text-sm text-gray-500">
        관심사를 알려주시면 홈을 맞춤으로 채워드릴게요. 나중에 프로필에서 언제든 바꿀 수 있어요.
      </p>

      <div className="mt-6">
        <OnboardingForm
          defaultRole={user.role}
          defaultSport={user.sport}
          defaultRegion={user.region}
        />
      </div>

      <div className="mt-3 text-center">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">건너뛰기</Link>
      </div>
    </div>
  );
}
