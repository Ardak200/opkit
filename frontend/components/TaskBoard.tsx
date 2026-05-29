"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { io } from "socket.io-client";

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
}

const COLUMNS: { label: string; status: TaskStatus; color: string }[] = [
  { label: "To Do", status: "TODO", color: "bg-slate-100 text-slate-600" },
  {
    label: "In Progress",
    status: "IN_PROGRESS",
    color: "bg-blue-100 text-blue-700",
  },
  { label: "Done", status: "DONE", color: "bg-green-100 text-green-700" },
];

export function TaskBoard() {
  const qc = useQueryClient();
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["tasks", searchQuery],
    queryFn: () =>
      api.get<Task[]>(searchQuery ? `/tasks?q=${searchQuery}` : "/tasks"),
  });

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

    socket.on(
      "task.statusChanged",
      (payload: { id: string; status: TaskStatus }) => {
        qc.setQueryData<Task[]>(["tasks"], (old = []) =>
          old.map((t) =>
            t.id === payload.id ? { ...t, status: payload.status } : t,
          ),
        );
      },
    );

    return () => {
      socket.disconnect();
    };
  }, [qc]);

  function handleCreate() {
    if (newTitle.trim()) createTask.mutate(newTitle.trim());
  }

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "DONE").length;

  return (
    <div>
      {/* Заголовок и прогресс */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Мои задачи</h2>
          {totalTasks > 0 && (
            <p className="mt-0.5 text-sm text-gray-500">
              {doneTasks} из {totalTasks} выполнено
            </p>
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
              className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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
              className="rounded-lg px-3 py-2 text-sm text-gray-500 transition hover:bg-gray-100"
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

      {/* Прогресс-бар */}
      {totalTasks > 0 && (
        <div className="mb-6 h-1.5 w-full rounded-full bg-gray-200">
          <div
            className="h-1.5 rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${(doneTasks / totalTasks) * 100}%` }}
          />
        </div>
      )}

      {/* Поиск */}
      <div className="mb-5">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск задач..."
          className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Канбан колонки */}
      <div className="grid grid-cols-3 gap-5">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.status);
          return (
            <div
              key={col.status}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${col.color}`}
                  >
                    {col.label}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-400">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-3">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    className="group rounded-xl border border-gray-100 bg-gray-50 p-3.5 transition hover:border-gray-200 hover:bg-white hover:shadow-sm"
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="mt-1 text-xs text-gray-500">
                        {task.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {COLUMNS.filter((c) => c.status !== task.status).map(
                        (c) => (
                          <button
                            key={c.status}
                            onClick={() =>
                              updateStatus.mutate({
                                id: task.id,
                                status: c.status,
                              })
                            }
                            className="rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200 transition hover:ring-blue-400 hover:text-blue-600"
                          >
                            → {c.label}
                          </button>
                        ),
                      )}

                      {confirmId === task.id ? (
                        <>
                          <span className="text-xs text-gray-500">
                            Удалить?
                          </span>
                          <button
                            onClick={() => deleteTask.mutate(task.id)}
                            className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600 ring-1 ring-red-200 transition hover:bg-red-100"
                          >
                            Да
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-500 ring-1 ring-gray-200 transition hover:bg-gray-50"
                          >
                            Нет
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmId(task.id)}
                          className="ml-auto rounded-md px-2 py-1 text-xs text-gray-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                        >
                          Удалить
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {colTasks.length === 0 && (
                  <p className="py-6 text-center text-xs text-gray-400">
                    Нет задач
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
