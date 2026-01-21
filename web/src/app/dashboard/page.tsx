"use client";
import { useEffect, useMemo, useState } from "react";
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleTask,
  Task,
} from "@/lib/api";
import { logout } from "@/lib/api";
import { useRouter } from "next/navigation";
import { hasTokens } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"PENDING" | "COMPLETED" | "">("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"board" | "list">("board");
  const [hoverPending, setHoverPending] = useState(false);
  const [hoverCompleted, setHoverCompleted] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await listTasks({
        page,
        limit: pageSize,
        q: q || undefined,
        status: status === "" ? undefined : status,
      });
      setTasks(res.items);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!hasTokens()) {
      router.replace("/login");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, q, status]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await createTask({ title, description });
      setTitle("");
      setDescription("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    }
  }

  async function onToggle(id: number) {
    await toggleTask(id);
    await load();
  }

  async function onDelete(id: number) {
    await deleteTask(id);
    await load();
  }

  async function onUpdate(id: number, t: Partial<Task>) {
    await updateTask(id, t);
    await load();
  }

  const pages = useMemo(() => Math.ceil(total / pageSize), [total, pageSize]);
  const pending = useMemo(
    () => tasks.filter((t) => t.status === "PENDING"),
    [tasks],
  );
  const completed = useMemo(
    () => tasks.filter((t) => t.status === "COMPLETED"),
    [tasks],
  );
  function onDragStart(e: React.DragEvent<HTMLLIElement>, id: number) {
    e.dataTransfer.setData("text/plain", String(id));
    e.dataTransfer.effectAllowed = "move";
  }
  async function onDropTo(
    status: "PENDING" | "COMPLETED",
    e: React.DragEvent<HTMLDivElement>,
  ) {
    e.preventDefault();
    const idStr = e.dataTransfer.getData("text/plain");
    const id = parseInt(idStr, 10);
    if (Number.isFinite(id)) {
      await onUpdate(id, { status });
    }
    setHoverPending(false);
    setHoverCompleted(false);
  }
  function allowDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  return (
    <div className="grid">
      <div
        className="row"
        style={{ justifyContent: "space-between", alignItems: "center" }}
      >
        <h1 style={{ fontSize: 24 }}>My Tasks</h1>
        <div className="row">
          <button className="btn" onClick={() => router.push("/")}>
            Home
          </button>
          <button
            className="btn"
            onClick={async () => {
              await logout();
              router.push("/login");
            }}
          >
            Logout
          </button>
        </div>
      </div>
      <div className="row" style={{ gap: 8 }}>
        <button
          className={`btn ${view === "board" ? "primary" : ""}`}
          onClick={() => setView("board")}
        >
          Board
        </button>
        <button
          className={`btn ${view === "list" ? "primary" : ""}`}
          onClick={() => setView("list")}
        >
          List
        </button>
      </div>
      {error && (
        <div className="tag" style={{ marginTop: 8 }}>
          {error}
        </div>
      )}
      <section className="card">
        <div className="controls">
          <input
            className="input"
            placeholder="Search by title"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="select"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as "PENDING" | "COMPLETED" | "")
            }
          >
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <select
            className="select"
            value={pageSize}
            onChange={(e) => setPageSize(parseInt(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
      </section>
      <section className="card">
        <form onSubmit={onCreate} className="grid" style={{ maxWidth: 520 }}>
          <input
            className="input"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="input"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button className="btn primary" type="submit">
            Add Task
          </button>
        </form>
      </section>
      {view === "board" ? (
        <section className="kanban">
          <div
            className={`column ${hoverPending ? "column-hover" : ""}`}
            onDragOver={(e) => {
              allowDrop(e);
              setHoverPending(true);
            }}
            onDragLeave={() => setHoverPending(false)}
            onDrop={(e) => onDropTo("PENDING", e)}
          >
            <div className="column-header">
              <strong>Pending</strong>
              <span className="tag pending">{pending.length}</span>
            </div>
            <ul className="list grid">
              {pending.map((t) => (
                <li
                  key={t.id}
                  className="item draggable"
                  draggable
                  onDragStart={(e) => onDragStart(e, t.id)}
                >
                  <div className="item-head">
                    <strong>{t.title}</strong>
                    <span className="tag pending">{t.status}</span>
                  </div>
                  <div>{t.description}</div>
                </li>
              ))}
            </ul>
          </div>
          <div
            className={`column ${hoverCompleted ? "column-hover" : ""}`}
            onDragOver={(e) => {
              allowDrop(e);
              setHoverCompleted(true);
            }}
            onDragLeave={() => setHoverCompleted(false)}
            onDrop={(e) => onDropTo("COMPLETED", e)}
          >
            <div className="column-header">
              <strong>Completed</strong>
              <span className="tag success">{completed.length}</span>
            </div>
            <ul className="list grid">
              {completed.map((t) => (
                <li
                  key={t.id}
                  className="item draggable"
                  draggable
                  onDragStart={(e) => onDragStart(e, t.id)}
                >
                  <div className="item-head">
                    <strong>{t.title}</strong>
                    <span className="tag success">{t.status}</span>
                  </div>
                  <div>{t.description}</div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : (
        <section>
          {loading ? (
            <div className="card">Loading...</div>
          ) : (
            <ul className="list grid">
              {tasks.map((t) => (
                <li key={t.id} className="item">
                  <div className="item-head">
                    <strong>{t.title}</strong>
                    <span
                      className={`tag ${t.status === "COMPLETED" ? "success" : "pending"}`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <div>{t.description}</div>
                  <div className="item-actions">
                    <button className="btn" onClick={() => onToggle(t.id)}>
                      {t.status === "COMPLETED"
                        ? "Mark Pending"
                        : "Mark Completed"}
                    </button>
                    <button
                      className="btn danger"
                      onClick={() => onDelete(t.id)}
                    >
                      Delete
                    </button>
                  </div>
                  <details>
                    <summary>Edit</summary>
                    <div className="edit-grid" style={{ marginTop: 8 }}>
                      <input
                        className="input"
                        defaultValue={t.title}
                        onBlur={(e) =>
                          onUpdate(t.id, { title: e.target.value })
                        }
                      />
                      <input
                        className="input"
                        defaultValue={t.description}
                        onBlur={(e) =>
                          onUpdate(t.id, { description: e.target.value })
                        }
                      />
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      <section className="row" style={{ alignItems: "center" }}>
        <button
          className="btn"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </button>
        <span className="muted">
          Page {page} / {pages || 1}
        </span>
        <button
          className="btn"
          disabled={page >= pages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </section>
    </div>
  );
}
