import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { notFound } from "next/navigation";
import { Workspace } from "@/components/workspace";

export const dynamic = "force-dynamic";

export default async function TeamWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      challenge: true,
      track: { include: { milestones: { orderBy: { orderIndex: "asc" } } } },
      members: { include: { user: { select: { id: true, name: true, email: true, avatar: true, department: true, year: true, skills: true } } } },
      mentor: { select: { id: true, name: true, email: true } },
      artefacts: { include: { uploader: { select: { name: true } }, milestone: { select: { title: true } } }, orderBy: { createdAt: "desc" } },
      feedbacks: { include: { faculty: { select: { name: true } }, milestone: { select: { title: true } } }, orderBy: { createdAt: "desc" } },
      externalApis: { include: { testCases: { orderBy: { createdAt: "desc" } } }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!team) notFound();

  const isMember = team.members.some((m) => m.userId === user.id);
  const isFaculty = user.role === "faculty" || user.role === "admin";
  const isReviewer = isMember || isFaculty || team.mentorId === user.id || team.challenge.ownerId === user.id;

  if (!isReviewer) notFound();

  return (
    <Workspace
      user={{ id: user.id, name: user.name, role: user.role }}
      team={{
        id: team.id,
        name: team.name,
        notes: team.notes,
        pitchDocs: team.pitchDocs,
        challenge: {
          id: team.challenge.id,
          title: team.challenge.title,
          expectedImpact: team.challenge.expectedImpact,
          domainTags: team.challenge.domainTags,
          rawDescription: team.challenge.rawDescription,
          structuredBrief: team.challenge.structuredBrief,
        },
        track: team.track
          ? {
              id: team.track.id,
              level: team.track.level,
              milestones: team.track.milestones.map((m) => ({
                id: m.id,
                orderIndex: m.orderIndex,
                title: m.title,
                description: m.description,
                checklistItems: m.checklistItems,
                status: m.status,
                notes: m.notes,
                aiSuggestions: m.aiSuggestions,
                dueDate: m.dueDate?.toISOString() ?? null,
              })),
            }
          : null,
        members: team.members.map((m) => ({
          id: m.id,
          role: m.role,
          user: {
            id: m.user.id,
            name: m.user.name,
            avatar: m.user.avatar,
            department: m.user.department,
            year: m.user.year,
            skills: m.user.skills,
          },
        })),
        mentor: team.mentor ? { id: team.mentor.id, name: team.mentor.name } : null,
        artefacts: team.artefacts.map((a) => ({
          id: a.id,
          type: a.type,
          url: a.url,
          shortDescription: a.shortDescription,
          createdAt: a.createdAt.toISOString(),
          uploader: { name: a.uploader.name },
          milestone: a.milestone ? { title: a.milestone.title } : null,
        })),
        feedbacks: team.feedbacks.map((f) => ({
          id: f.id,
          finalised: f.finalised,
          comments: f.comments,
          rubricScores: f.rubricScores,
          aiDraft: f.aiDraft,
          createdAt: f.createdAt.toISOString(),
          faculty: { name: f.faculty.name },
          milestone: f.milestone ? { title: f.milestone.title } : null,
        })),
        externalApis: team.externalApis.map((api) => ({
          id: api.id,
          name: api.name,
          baseUrl: api.baseUrl,
          description: api.description,
          authType: api.authType,
          authConfig: api.authConfig,
          exampleEndpoints: api.exampleEndpoints,
          category: api.category,
          tags: api.tags,
          registryStatus: api.registryStatus,
          docsUrl: api.docsUrl,
          repoUrl: api.repoUrl,
          usageCount: api.usageCount,
          testCases: api.testCases.map((t) => ({
            id: t.id,
            name: t.name,
            method: t.method,
            path: t.path,
            expectedStatus: t.expectedStatus,
            lastStatus: t.lastStatus,
            lastDurationMs: t.lastDurationMs,
            lastRunAt: t.lastRunAt?.toISOString() ?? null,
            consecutiveFailures: t.consecutiveFailures,
            milestoneId: t.milestoneId,
          })),
        })),
      }}
    />
  );
}
