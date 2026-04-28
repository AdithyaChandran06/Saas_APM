import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { workspaces, workspaceMembers } from "@shared/schema-extended";
import { users } from "@shared/models/auth";
import { eq, and } from "drizzle-orm";

const router = Router();

// Middleware to check authentication
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
};

// Create workspace
router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, slug } = z.object({
      name: z.string().min(1),
      slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
    }).parse(req.body);

    // Check if slug is unique
    const existing = await db.select().from(workspaces).where(eq(workspaces.slug, slug)).limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ message: "Workspace slug already exists" });
    }

    // Create workspace
    const [workspace] = await db.insert(workspaces).values({
      name,
      slug,
      ownerId: req.session.userId,
    }).returning();

    // Add owner as member
    await db.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      userId: req.session.userId,
      role: "owner",
    });

    res.json({ workspace });
  } catch (error) {
    console.error("Create workspace error:", error);
    res.status(400).json({ message: "Invalid workspace data" });
  }
});

// Get user's workspaces
router.get("/", requireAuth, async (req, res) => {
  try {
    const userWorkspaces = await db
      .select({
        workspace: workspaces,
        role: workspaceMembers.role,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(eq(workspaceMembers.userId, req.session.userId));

    res.json({ workspaces: userWorkspaces });
  } catch (error) {
    console.error("Get workspaces error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get workspace by slug
router.get("/:slug", requireAuth, async (req, res) => {
  try {
    const { slug } = req.params;

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.slug, slug))
      .limit(1);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // Check if user is member
    const [membership] = await db
      .select()
      .from(workspaceMembers)
      .where(and(
        eq(workspaceMembers.workspaceId, workspace.id),
        eq(workspaceMembers.userId, req.session.userId)
      ))
      .limit(1);

    if (!membership) {
      return res.status(403).json({ message: "Not a member of this workspace" });
    }

    res.json({ workspace: { ...workspace, role: membership.role } });
  } catch (error) {
    console.error("Get workspace error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update workspace
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = z.object({
      name: z.string().min(1),
    }).parse(req.body);

    // Check ownership
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(and(
        eq(workspaces.id, parseInt(id)),
        eq(workspaces.ownerId, req.session.userId)
      ))
      .limit(1);

    if (!workspace) {
      return res.status(403).json({ message: "Not authorized to update this workspace" });
    }

    const [updated] = await db
      .update(workspaces)
      .set({ name, updatedAt: new Date() })
      .where(eq(workspaces.id, parseInt(id)))
      .returning();

    res.json({ workspace: updated });
  } catch (error) {
    console.error("Update workspace error:", error);
    res.status(400).json({ message: "Invalid update data" });
  }
});

export { router as workspaceRouter };
