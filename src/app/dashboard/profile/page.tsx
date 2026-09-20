import { requireUser } from "@/lib/permissions";
import { Card } from "@/components/ui";
import { ProfileForm } from "@/components/profile-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="font-display text-2xl font-bold text-ink-900">Profile</h1>
      <Card className="p-6">
        <ProfileForm
          user={{
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department ?? "",
            year: user.year ?? undefined,
            skills: user.skills ?? "[]",
            preferredStack: user.preferredStack ?? "",
          }}
        />
      </Card>
    </div>
  );
}
