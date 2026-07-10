import { Router } from "express";
import { requireAdmin } from "../middleware/adminAuth.js";
import { store } from "../store/db.js";

export const auditRouter = Router();

auditRouter.get("/admin/audit", requireAdmin, (req, res) => {
  const limit = Number(req.query.limit ?? 100);
  return res.json({ events: store.listAudit(limit) });
});
