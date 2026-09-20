import { apiUser, json } from "@/lib/api-helpers";

export async function GET() {
  const user = await apiUser();
  return json({ user });
}
