"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { io } from "socket.io-client";
import { useRouter, useSearchParams } from "next/navigation";

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
}

interface TasksResponse {
  data: Task[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

const COLUMNS: { label: string; status: TaskStatus; color: string }[] = [
  { label: "To Do", status: "TODO", color: "bg-slate-100 text-slate-600" },
  { label: "In Progress", status: "IN_PROGRESS", color: "bg-blue-100 text-blue-700" },
  { label: "Done", status: "DONE", color: "bg-green-100 text-green-700" },
];

export function TaskBoard() {
  const qc = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Читаем page и limit из URL, с дефолтами если параметров нет
  // useSearchParams().get() возвращает null когда параметра нет в URL
  const currentPage = Number(searchParams.get("page") ?? 1);
  const currentLimit = Number(searchParams.get("limit") ?? 10);

  const { data: tasksResponse } = useQuery<TasksResponse>({
    queryKey: ["tasks", searchQuery, currentPage, currentLimit],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(currentLimit),
        ...(searchQuery ? { q: searchQuery } : {}),
      });
      return api.get<TasksResponse>(`/tasks?${params}`);
    },
  });

  const tasks = tasksResponse?.data ?? [];
  const total = tasksResponse?.total ?? 0;
  const pages = tasksResponse?.pages ?? 1;

  const createTask = useMutation({
    mutationFn: (title: string) => api.post("/tasks", { title }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      setNewTitle("");
      setAdding(false);
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      api.patch(`/tasks/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const deleteTask = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      setConfirmId(null);
    },
  });

  useEffect(() => {
    const socket = io("http://localhost:3001", { transports: ["websocket"] });

    socket.on("task.statusChanged", (payload: { id: string; status: TaskStatus }) => {
      qc.setQueryData<TasksResponse>(["tasks", searchQuery, currentPage, currentLimit], (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((t) =>
            t.id === payload.id ? { ...t, status: payload.status } : t
          ),
        };
      });
    });

    return () => { socket.disconnect(); };
  }, [qc, searchQuery, currentPage, currentLimit]);

  // Меняем страницу — обновляем URL, сохраняя остальные параметры
  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`?${params}`);
  }

  // Меняем лимит — сбрасываем на первую страницу
  function changeLimit(limit: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", String(limit));
    params.set("page", "1");
    router.push(`?${params}`);
  }

  function handleCreate() {
    if (newTitle.trim()) createTask.mutate(newTitle.trim());
  }

  const doneTasks = tasks.filter((t) => t.status === "DONE").length;

  return (
    <div>
      {/* Заголовок */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Мои задачи</h2>
          {total > 0 && (
            <p className="mt-0.5 text-sm text-gray-500 dark:text-slate-400">{total} задач всего</p>
          )}
        </div>

        {adding ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") setAdding(false);
              }}
              placeholder="Название задачи..."
              className="w-64 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
            />
            <button
              onClick={handleCreate}
              disabled={createTask.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {createTask.isPending ? "..." : "Добавить"}
            </button>
            <button
              onClick={() => setAdding(false)}
              className="rounded-lg px-3 py-2 text-sm text-gray-500 transition hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              Отмена
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <span className="text-lg leading-none">+</span>
            Новая задача
          </button>
        )}
      </div>

      {/* Поиск + пагинация + лимит */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <input
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); goToPage(1); }}
          placeholder="Поиск задач..."
          className="w-full max-w-sm rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
        />

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            ←
          </button>
          <span className="text-sm text-gray-500 dark:text-slate-400">{currentPage} / {pages}</span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= pages}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            →
          </button>
          <select
            value={currentLimit}
            onChange={(e) => changeLimit(Number(e.target.value))}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Канбан колонки */}
      <div className="mb-5 grid grid-cols-3 gap-5">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.status);
          return (
            <div key={col.status} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 dark:bg-slate-800 dark:ring-slate-700">
              <div className="mb-4 flex items-center justify-between">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${col.color}`}>
                  {col.label}
                </span>
                <span className="text-sm font-medium text-gray-400 dark:text-slate-500">{colTasks.length}</span>
              </div>

              <div className="space-y-3">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    className="group rounded-xl border border-gray-100 bg-gray-50 p-3.5 transition hover:border-gray-200 hover:bg-white hover:shadow-sm dark:border-slate-700 dark:bg-slate-700/50 dark:hover:border-slate-600 dark:hover:bg-slate-700"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{task.title}</p>
                    {task.description && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{task.description}</p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {COLUMNS.filter((c) => c.status !== task.status).map((c) => (
                        <button
                          key={c.status}
                          onClick={() => updateStatus.mutate({ id: task.id, status: c.status })}
                          className="rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200 transition hover:text-blue-600 hover:ring-blue-400 dark:bg-slate-600 dark:text-slate-300 dark:ring-slate-500 dark:hover:text-blue-400"
                        >
                          → {c.label}
                        </button>
                      ))}

                      {confirmId === task.id ? (
                        <>
                          <span className="text-xs text-gray-500 dark:text-slate-400">Удалить?</span>
                          <button
                            onClick={() => deleteTask.mutate(task.id)}
                            className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600 ring-1 ring-red-200 transition hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800"
                          >
                            Да
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-500 ring-1 ring-gray-200 transition hover:bg-gray-50 dark:bg-slate-600 dark:text-slate-300 dark:ring-slate-500"
                          >
                            Нет
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmId(task.id)}
                          className="ml-auto rounded-md px-2 py-1 text-xs text-gray-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:text-slate-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                        >
                          Удалить
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {colTasks.length === 0 && (
                  <p className="py-6 text-center text-xs text-gray-400 dark:text-slate-500">Нет задач</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
