"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useThemeStore } from "@/store/theme.store";
import { TaskBoard } from "@/components/TaskBoard";
import Link from "next/link";

export default function DashboardPage() {
  const token = useAuthStore((s) => s.token);
  const initialized = useAuthStore((s) => s.initialized);
  const init = useAuthStore((s) => s.init);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  const dark = useThemeStore((s) => s.dark);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const initTheme = useThemeStore((s) => s.init);

  useEffect(() => {
    init();
    initTheme();
  }, [init, initTheme]);

  useEffect(() => {
    if (initialized && token === null) {
      router.push("/login");
    }
  }, [initialized, token, router]);

  if (!initialized || !token) return null;

  return (
    <div className="min-h-full bg-gray-50 dark:bg-slate-900">
      <header className="border-b border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-sm font-bold text-white">O</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-slate-100">OpKit</span>
          </div>

          <div className="flex items-center gap-1">
            <Link
              href="/profile"
              className="rounded-lg px-3 py-1.5 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            >
              Профиль
            </Link>
            <button
              onClick={toggleTheme}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            >
              {dark ? "☀️" : "🌙"}
            </button>
            <button
              onClick={() => { logout(); router.push("/login"); }}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <Suspense fallback={null}>
          <TaskBoard />
        </Suspense>
      </main>
    </div>
  );
}
