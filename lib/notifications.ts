import { prisma } from "./prisma";
import { sendEmail } from "./email";
import type { ReviewActionType } from "./generated/prisma/enums";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

async function getProgrammeCoordinatorEmails(
  programmeId: string
): Promise<string[]> {
  const roles = await prisma.userRole.findMany({
    where: { role: "PROGRAMME_COORDINATOR", programmeId },
    include: { user: { select: { email: true, isActive: true } } },
  });
  return roles.filter((r) => r.user.isActive).map((r) => r.user.email);
}

async function getCourseCoordinatorEmails(courseId: string): Promise<string[]> {
  const assignments = await prisma.courseAssignment.findMany({
    where: { courseId, isCoordinator: true },
    include: { user: { select: { email: true, isActive: true } } },
  });
  return assignments.filter((a) => a.user.isActive).map((a) => a.user.email);
}

async function getFacultyOfficerEmails(): Promise<string[]> {
  const roles = await prisma.userRole.findMany({
    where: { role: "FACULTY_OFFICER", programmeId: null },
    include: { user: { select: { email: true, isActive: true } } },
  });
  return roles.filter((r) => r.user.isActive).map((r) => r.user.email);
}

function emailShell(bodyHtml: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; color: #111;">
      ${bodyHtml}
      <hr style="margin-top: 24px; border: none; border-top: 1px solid #ddd;" />
      <p style="font-size: 12px; color: #777;">
        Emel automatik daripada Sistem Pengurusan Proforma Kursus (Table 4), FTSM UKM.
      </p>
    </div>
  `;
}

export async function notifyReviewAction(params: {
  type: ReviewActionType;
  actorName: string;
  note?: string;
  version: {
    id: string;
    versionNo: number;
    course: { id: string; code: string; nameMs: string; programmeId: string };
  };
}) {
  const { type, actorName, note, version } = params;
  const link = `${APP_URL}/courses/${version.course.id}/versions/${version.id}`;
  const courseLabel = `${version.course.code} — ${version.course.nameMs} (Versi ${version.versionNo})`;

  let recipients: string[] = [];
  let subject = "";
  let bodyHtml = "";

  switch (type) {
    case "SUBMIT":
      recipients = await getProgrammeCoordinatorEmails(version.course.programmeId);
      subject = `Draf Table 4 menunggu semakan — ${version.course.code}`;
      bodyHtml = `
        <p><strong>${actorName}</strong> telah menghantar draf Table 4 untuk semakan.</p>
        <p><strong>Kursus:</strong> ${courseLabel}</p>
        <p><a href="${link}">Buka draf untuk semak</a></p>
      `;
      break;

    case "REQUEST_CHANGES":
      recipients = await getCourseCoordinatorEmails(version.course.id);
      subject = `Table 4 memerlukan pembetulan — ${version.course.code}`;
      bodyHtml = `
        <p><strong>${actorName}</strong> meminta pembetulan pada draf Table 4.</p>
        <p><strong>Kursus:</strong> ${courseLabel}</p>
        ${note ? `<p><strong>Catatan:</strong> ${note}</p>` : ""}
        <p><a href="${link}">Buka draf untuk semak catatan</a></p>
      `;
      break;

    case "APPROVE":
      recipients = await getFacultyOfficerEmails();
      subject = `Table 4 telah diluluskan, sedia untuk diterbitkan — ${version.course.code}`;
      bodyHtml = `
        <p><strong>${actorName}</strong> telah meluluskan draf Table 4 ini.</p>
        <p><strong>Kursus:</strong> ${courseLabel}</p>
        <p><a href="${link}">Buka untuk terbitkan</a></p>
      `;
      break;

    case "PUBLISH":
      recipients = await getCourseCoordinatorEmails(version.course.id);
      subject = `Table 4 telah diterbitkan — ${version.course.code}`;
      bodyHtml = `
        <p>Draf Table 4 anda telah diterbitkan secara rasmi oleh <strong>${actorName}</strong>.</p>
        <p><strong>Kursus:</strong> ${courseLabel}</p>
        <p><a href="${link}">Lihat versi yang diterbitkan</a></p>
      `;
      break;

    default:
      // ARCHIVE / REOPEN_DRAFT — no notification for these (low priority).
      return;
  }

  if (recipients.length === 0) return;

  await sendEmail({ to: recipients, subject, html: emailShell(bodyHtml) });
}
