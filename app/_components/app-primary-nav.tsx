import Link from "next/link";
import { AccountMenu } from "@/app/_components/account-menu";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentProfile } from "@/lib/profiles";

type AppPrimaryNavProps = {
  currentPath: "/" | "/sessions" | "/collection";
};

const navItems = [
  { href: "/", label: "ホーム" },
  { href: "/sessions", label: "来場日一覧" },
  { href: "/collection", label: "思い出アルバム" },
] as const;

export async function AppPrimaryNav({ currentPath }: AppPrimaryNavProps) {
  const [user, profile] = await Promise.all([getCurrentUser(), getCurrentProfile()]);
  const displayLabel = profile?.display_name ?? user?.email ?? user?.id;
  const profileHref = profile ? "/profile" : "/profile/setup";

  return (
    <div className="rounded-[1.5rem] bg-white p-3 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <nav aria-label="メインナビゲーション" className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => {
            const active = currentPath === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {user ? (
          <AccountMenu
            displayLabel={displayLabel}
            email={user.email}
            profileHref={profileHref}
          />
        ) : null}
      </div>
    </div>
  );
}
