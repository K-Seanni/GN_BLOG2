"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { signInWithGoogle } from "@/app/auth/actions";

const IN_APP_BROWSER = /KAKAOTALK|Instagram|FBAN|FBAV|Line\/|NAVER\(inapp|MicroMessenger/i;

function isInAppBrowser() {
  return typeof navigator !== "undefined" && IN_APP_BROWSER.test(navigator.userAgent);
}

function SubmitButton({ compact }: { compact: boolean }) {
  const { pending } = useFormStatus();
  const size = compact ? "h-9 gap-2 px-4 text-sm" : "h-12 gap-3 px-6";
  const label = compact ? "로그인" : "Google로 시작하기";

  return (
    <button
      type="submit"
      disabled={pending}
      className={`flex items-center justify-center rounded-full border border-black/10 bg-white font-medium text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-60 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800 ${size}`}
    >
      <svg aria-hidden viewBox="0 0 48 48" className={compact ? "h-4 w-4" : "h-5 w-5"}>
        <path
          fill="#FFC107"
          d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
        />
        <path
          fill="#FF3D00"
          d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
        />
        <path
          fill="#4CAF50"
          d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
        />
        <path
          fill="#1976D2"
          d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
        />
      </svg>
      {pending ? "이동 중..." : label}
    </button>
  );
}

export function GoogleSignInButton({ compact = false }: { compact?: boolean }) {
  const [blocked, setBlocked] = useState(false);

  return (
    <div className="flex flex-col items-center gap-3">
      <form
        action={signInWithGoogle}
        onSubmit={(event) => {
          if (isInAppBrowser()) {
            event.preventDefault();
            setBlocked(true);
          }
        }}
      >
        <SubmitButton compact={compact} />
      </form>
      {blocked && (
        <p role="alert" className="max-w-xs text-center text-sm leading-6 text-amber-700 dark:text-amber-400">
          카카오톡 안에서는 Google 로그인이 막혀 있어요. 오른쪽 위 메뉴에서 &quot;다른
          브라우저로 열기&quot;를 눌러 Safari나 Chrome으로 연 다음 로그인해 주세요.
        </p>
      )}
    </div>
  );
}
