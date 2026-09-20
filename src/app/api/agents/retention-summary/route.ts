import { json, requireApiRole, isNextResponse } from "@/lib/api-helpers";
import { runRetentionAgent } from "@/lib/agents/retention";

export async function GET() {
  const user = await requireApiRole("faculty", "admin");
  if (isNextResponse(user)) return user;

  const summary = await runRetentionAgent();
  return json(summary);
}
