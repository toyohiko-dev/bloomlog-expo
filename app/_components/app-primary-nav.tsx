import Link from "next/link";

type AppPrimaryNavProps = {
  currentPath: "/" | "/sessions" | "/collection";
};

const navItems = [
  { href: "/", label: "ホーム" },
  { href: "/sessions", label: "来場日一覧" },
  { href: "/collection", label: "思い出アルバム" },
] as const;

export function AppPrimaryNav({ currentPath }: AppPrimaryNavProps) {
  return (
    <nav
      aria-label="主要ナビゲーション"
      className="flex flex-wrap items-center gap-2 rounded-[1.5rem] bg-white p-2 shadow-sm ring-1 ring-slate-200"
    >
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
  );
}
