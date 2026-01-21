import express from "express";
import cors from "cors";
import { config } from "./config";
import { requireAuth } from "./middleware/auth";
import authRouter from "./routes/auth";
import tasksRouter from "./routes/tasks";

const app = express();

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRouter);
app.use("/tasks", requireAuth, tasksRouter);

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ error: "Server error", message: err?.message });
});

app.listen(config.port, () => {});
