import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { TaskEditor, type TaskEditorValues } from "@/components/admin/task-editor";
import { getAdminMoment, getAdminTask } from "@/lib/admin/data";
import { strings } from "@/lib/strings";
import type { TaskAnswer, TaskType } from "@/lib/tasks/answers";

const t = strings.admin;

/** Turns a stored answer key back into what the editor shows. */
function draftFrom(answer: TaskAnswer, choices: string[] | null): TaskEditorValues["draft"] {
  switch (answer.kind) {
    case "choice":
      return { choices: choices ?? [], correctIndex: answer.index };
    case "boolean":
      return { correctBoolean: answer.value };
    case "text":
      return { accepted: answer.accepted, keywords: answer.keywords };
    case "number":
      return { value: answer.source, requireSimplified: answer.requireSimplified };
    default:
      return { value: answer.source };
  }
}

export default async function AdminTaskPage({
  params,
}: PageProps<"/admin/innehall/[subjectId]/[areaId]/[momentId]/uppgift/[taskId]">) {
  const { subjectId, areaId, momentId, taskId } = await params;
  const moment = await getAdminMoment(momentId);
  if (!moment || moment.area.id !== areaId || moment.subject.id !== subjectId) notFound();

  const isNew = taskId === "ny";
  const task = isNew ? null : await getAdminTask(taskId);
  if (!isNew && (!task || task.moment_id !== momentId)) notFound();

  const momentHref = `/admin/innehall/${subjectId}/${areaId}/${momentId}`;
  const initial: TaskEditorValues = task
    ? {
        id: task.id,
        level: task.level,
        type: task.type as TaskType,
        promptMd: task.prompt_md,
        solutionMd: task.solution_md ?? "",
        published: task.status === "published",
        draft: draftFrom(task.answer as unknown as TaskAnswer, task.choices as string[] | null),
      }
    : { level: 1, type: "numeric", promptMd: "", solutionMd: "", published: true, draft: {} };

  return (
    <main>
      <AdminHeader
        crumbs={[
          { href: "/admin/innehall", label: t.nav.content },
          { href: `/admin/innehall/${subjectId}`, label: moment.subject.name },
          { href: `/admin/innehall/${subjectId}/${areaId}`, label: moment.area.name },
          { href: momentHref, label: moment.name },
        ]}
        kicker={moment.name}
        title={isNew ? t.task.newTitle : t.task.editTitle}
      />
      <div className="mx-auto max-w-4xl px-4 pt-10 sm:px-8">
        {/* key: a fresh editor per task, so "spara och ny" and navigation reset the form */}
        <TaskEditor key={task?.id ?? "new"} momentId={moment.id} momentHref={momentHref} initial={initial} />
      </div>
    </main>
  );
}
