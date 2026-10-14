import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">로그인에 실패했어요</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        잠시 후 다시 시도해 주세요.
      </p>
      <Link href="/" className="underline">
        홈으로 돌아가기
      </Link>
    </main>
  );
}
