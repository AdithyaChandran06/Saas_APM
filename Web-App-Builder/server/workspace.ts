import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { db } from "./db";
import { workspaces, workspaceMembers } from "@shared/schema-extended";
import { eq, and } from "drizzle-orm";

const router = Router();

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  if (!db) {
    return res.status(503).json({ message: "Database not available" });
  }

  next();
};

function requireSessionUserId(req: Request): string {
  const { userId } = req.session;
  if (!userId) {
    throw Object.assign(new Error("Not authenticated"), { status: 401 });
  }
  return userId;
}

function requireParam(value: string | string[] | undefined, name: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw Object.assign(new Error(`Invalid ${name}`), { status: 400 });
  }
  return value;
}

router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    const { name, slug } = z
      .object({
        name: z.string().min(1),
        slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
      })
      .parse(req.body);

    const existing = await db!.select().from(workspaces).where(eq(workspaces.slug, slug)).limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ message: "Workspace slug already exists" });
    }

    const [workspace] = await db!
      .insert(workspaces)
      .values({
        name,
        slug,
        ownerId: userId,
      })
      .returning();

    await db!.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      userId,
      role: "owner",
    });

    return res.json({ workspace });
  } catch (error) {
    console.error("Create workspace error:", error);
    return res.status(400).json({ message: "Invalid workspace data" });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    const userWorkspaces = await db!
      .select({
        workspace: workspaces,
        role: workspaceMembers.role,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(eq(workspaceMembers.userId, userId));

    return res.json({ workspaces: userWorkspaces });
  } catch (error) {
    console.error("Get workspaces error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:slug", requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    const slug = requireParam(req.params.slug, "workspace slug");

    const [workspace] = await db!.select().from(workspaces).where(eq(workspaces.slug, slug)).limit(1);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const [membership] = await db!
      .select()
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, workspace.id), eq(workspaceMembers.userId, userId)))
      .limit(1);

    if (!membership) {
      return res.status(403).json({ message: "Not a member of this workspace" });
    }

    return res.json({ workspace: { ...workspace, role: membership.role } });
  } catch (error) {
    console.error("Get workspace error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    const workspaceId = Number.parseInt(requireParam(req.params.id, "workspace id"), 10);
    if (!Number.isInteger(workspaceId)) {
      return res.status(400).json({ message: "Invalid workspace id" });
    }

    const { name } = z
      .object({
        name: z.string().min(1),
      })
      .parse(req.body);

    const [workspace] = await db!
      .select()
      .from(workspaces)
      .where(and(eq(workspaces.id, workspaceId), eq(workspaces.ownerId, userId)))
      .limit(1);

    if (!workspace) {
      return res.status(403).json({ message: "Not authorized to update this workspace" });
    }

    const [updated] = await db!
      .update(workspaces)
      .set({ name, updatedAt: new Date() })
      .where(eq(workspaces.id, workspaceId))
      .returning();

    return res.json({ workspace: updated });
  } catch (error) {
    console.error("Update workspace error:", error);
    return res.status(400).json({ message: "Invalid update data" });
  }
});

export { router as workspaceRouter };
