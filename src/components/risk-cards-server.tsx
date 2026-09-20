import { runRetentionAgent } from "@/lib/agents/retention";

export async function retentionForFaculty() {
  return runRetentionAgent();
}
