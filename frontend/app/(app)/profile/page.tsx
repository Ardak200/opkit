"use client";

import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface UserProfile {
  id: string;
  email: string;
  createdAt: string;
}

export default function ProfilePage() {
  const token = useAuthStore((s) => s.token);
  const initialized = useAuthStore((s) => s.initialized);
  const init = useAuthStore((s) => s.init);
  const logout = useAuthStore((s) => s.logout);

  const router = useRouter();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (initialized && token === null) router.push("/login");
  }, [initialized, token, router]);

  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<UserProfile>("/users/me"),
    enabled: !!token,
  });

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
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="rounded-lg px-3 py-1.5 text-sm text-gray-500 transition
  hover:bg-gray-100 hover:text-gray-900"
            >
              Задачи
            </Link>
            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-500 transition hover:bg-gray-100
  hover:text-gray-900"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-slate-100">Профиль</h2>

        {isLoading ? (
          <p className="text-sm text-gray-400 dark:text-slate-500">Загрузка...</p>
        ) : (
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-slate-800 dark:ring-slate-700">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/40">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {user?.email[0].toUpperCase()}
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-slate-500">Email</p>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-slate-100">{user?.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-slate-500">Дата регистрации</p>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-slate-100">
                  {user && new Date(user.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  ID
                </p>
                <p className="mt-1 font-mono text-xs text-gray-500">
                  {user?.id}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
