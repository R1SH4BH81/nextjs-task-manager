import { Router } from "express";
import { prisma } from "../prisma";
import { AuthedRequest } from "../middleware/auth";
import { createTaskSchema, updateTaskSchema, listTasksQuerySchema } from "../validation/schemas";

const router = Router();

router.get("/", async (req: AuthedRequest, res) => {
  const parsed = listTasksQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }
  try {
    const q = parsed.data.q || "";
    const status = parsed.data.status;
    const page = parseInt(parsed.data.page || "1", 10);
    const limit = parseInt(parsed.data.limit || "10", 10);
    const skip = (page - 1) * limit;
    const where: any = {
      userId: req.user!.id,
      status,
      title: q ? { contains: q, mode: "insensitive" } : undefined
    };
    const [items, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      prisma.task.count({ where })
    ]);
    res.json({ items, total, page, pageSize: limit });
  } catch (e: any) {
    res.status(500).json({ error: "Server error", message: e?.message });
  }
});

router.post("/", async (req: AuthedRequest, res) => {
  const parsed = createTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }
  const task = await prisma.task.create({
    data: {
      userId: req.user!.id,
      title: parsed.data.title,
      description: parsed.data.description || ""
    }
  });
  res.status(201).json(task);
});

router.get("/:id", async (req: AuthedRequest, res) => {
  const id = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task || task.userId !== req.user!.id) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(task);
});

router.patch("/:id", async (req: AuthedRequest, res) => {
  const id = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const parsed = updateTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing || existing.userId !== req.user!.id) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const task = await prisma.task.update({
    where: { id },
    data: {
      title: parsed.data.title ?? existing.title,
      description: parsed.data.description ?? existing.description,
      status: (parsed.data.status ?? existing.status) as any
    }
  });
  res.json(task);
});

router.delete("/:id", async (req: AuthedRequest, res) => {
  const id = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing || existing.userId !== req.user!.id) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await prisma.task.delete({ where: { id } });
  res.json({ success: true });
});

router.post("/:id/toggle", async (req: AuthedRequest, res) => {
  const id = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing || existing.userId !== req.user!.id) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const nextStatus = existing.status === "COMPLETED" ? "PENDING" : "COMPLETED";
  const task = await prisma.task.update({
    where: { id },
    data: { status: nextStatus as any }
  });
  res.json(task);
});

export default router;
