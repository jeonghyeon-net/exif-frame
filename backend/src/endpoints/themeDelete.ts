import { Bool, Num, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "../types";
import { queryOne, run } from "../utils/db";
import { verifyJWT } from "../utils/jwt";

export class ThemeDelete extends OpenAPIRoute {
  schema = {
    tags: ["Themes"],
    summary: "Delete theme",
    request: { params: z.object({ id: Num() }) },
    responses: {
      "200": {
        description: "Deleted",
        content: {
          "application/json": { schema: z.object({ success: Bool() }) },
        },
      },
      "401": { description: "Unauthorized" },
      "403": { description: "Forbidden" },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { id } = data.params;
    const auth = c.req.header("authorization");
    if (!auth || !auth.toLowerCase().startsWith("bearer "))
      return new Response("Unauthorized", { status: 401 });
    const token = auth.split(" ")[1] || "";
    let payload: any;
    try {
      payload = await verifyJWT(token, c.env.JWT_SECRET);
    } catch {
      return new Response("Unauthorized", { status: 401 });
    }
    const userId = Number(payload.sub);
    // Ensure ownership
    const existing = await queryOne<{ ownerMemberId: number }>(
      c.env.DB,
      `SELECT owner_member_id as ownerMemberId FROM themes WHERE id = ?`,
      id
    );
    if (!existing || existing.ownerMemberId !== userId)
      return c.json({ success: false, error: "Forbidden" }, 403);
    // Best-effort: delete preview image from R2 if exists
    try {
      const key = `themes/${id}/preview.jpg`;
      // @ts-ignore - R2 binding is available at runtime
      await c.env.R2.delete(key);
    } catch (e) {
      // ignore storage deletion errors
    }
    await run(c.env.DB, `DELETE FROM themes WHERE id = ?`, id);
    return { success: true };
  }
}
