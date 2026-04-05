"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOutAction } from "@/app/login/actions";

type AccountMenuProps = {
  displayLabel: string;
  email?: string | null;
  profileHref: "/profile" | "/profile/setup";
};

export function AccountMenu({
  displayLabel,
  email,
  profileHref,
}: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:border-slate-900 hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-100"
      >
        {displayLabel}
      </button>

      {isOpen ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-20 w-64 rounded-3xl border border-slate-200 bg-white p-3 shadow-lg"
        >
          <div className="px-2 py-1">
            <p className="text-sm font-semibold text-slate-900">{displayLabel}</p>
            {email ? (
              <p className="mt-1 text-xs text-slate-500 break-all">{email}</p>
            ) : null}
          </div>

          <div className="my-3 border-t border-slate-100" />

          <div className="space-y-1">
            <Link
              href={profileHref}
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center rounded-2xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-100"
            >
              プロフィール
            </Link>

            <form action={signOutAction}>
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center rounded-2xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-100"
              >
                ログアウト
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
