import { NextRequest, NextResponse } from "next/server";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
} from "docx";
import { getCurrentUser } from "@/lib/auth";
import { getTable4Detail, computeSltSummary } from "@/lib/table4-detail";
import { STATUS_LABEL } from "@/lib/courses";
import { taxonomyCode } from "@/lib/taxonomy-data";
import { deriveMqfClusters } from "@/lib/mqf-legend";

const CLASSIFICATION_LABEL: Record<string, string> = {
  WU_CITRA_WAJIB: "Wajib Universiti / Citra Wajib",
  WU_CITRA_RENTAS: "Wajib Universiti / Citra Rentas",
  TERAS: "Teras",
  ELEKTIF: "Elektif",
  AUDIT: "Audit",
};

function metaRow(label: string, value: string) {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({ children: [new TextRun({ text: label, bold: true })] }),
        ],
      }),
      new TableCell({
        width: { size: 70, type: WidthType.PERCENTAGE },
        children: [new Paragraph(value)],
      }),
    ],
  });
}

function heading(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 100 },
    children: [new TextRun(text)],
  });
}

function assessmentTable(
  items: {
    nameMs: string;
    weightagePercent: string | null;
    hours: { f2fPhysical?: number; f2fOnline?: number; independent?: number };
  }[]
) {
  if (items.length === 0) {
    return new Paragraph({
      children: [new TextRun({ text: "Belum ada item.", italics: true })],
    });
  }
  const header = new TableRow({
    children: ["Nama", "Wajaran %", "F2F Fizikal", "F2F Online", "Kendiri"].map(
      (h) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
        })
    ),
  });
  const rows = items.map(
    (item) =>
      new TableRow({
        children: [
          item.nameMs,
          item.weightagePercent ?? "\u2014",
          `L${item.hours.f2fPhysical.l} T${item.hours.f2fPhysical.t} P${item.hours.f2fPhysical.p} O${item.hours.f2fPhysical.o}`,
          `L${item.hours.f2fOnline.l} T${item.hours.f2fOnline.t} P${item.hours.f2fOnline.p} O${item.hours.f2fOnline.o}`,
          String(item.hours.independent),
        ].map((text) => new TableCell({ children: [new Paragraph(text)] })),
      })
  );
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [header, ...rows],
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Sila log masuk." }, { status: 401 });
  }

  const { versionId } = await params;
  const table4 = await getTable4Detail(versionId);
  if (!table4) {
    return NextResponse.json({ error: "Versi tidak dijumpai." }, { status: 404 });
  }

  const slt = computeSltSummary(table4.topics, table4.assessments);
  const continuous = table4.assessments.filter((a) => a.phase === "CONTINUOUS");
  const final = table4.assessments.filter((a) => a.phase === "FINAL");
  const ploByCloId = new Map(table4.programmePlos.map((p) => [p.id, p]));

  const cloRows = table4.clos.map((clo) => {
    const ploRefs = clo.mappedPloIds
      .map((id) => ploByCloId.get(id))
      .filter(Boolean)
      .map((p) => `PLO${p!.orderNumber}`)
      .join(", ");
    const taxonomySuffix =
      clo.taxonomyDomain && clo.taxonomyLevel
        ? ` (${taxonomyCode(clo.taxonomyDomain, clo.taxonomyLevel)}; ${ploRefs})`
        : "";
    const mqfCodes = deriveMqfClusters(
      clo.mappedPloIds
        .map((id) => ploByCloId.get(id)?.orderNumber)
        .filter((n): n is number => n != null)
    );
    const mqfSuffix = mqfCodes.length ? ` [MQF: ${mqfCodes.join(", ")}]` : "";
    return new TableRow({
      children: [
        `CLO${clo.orderIndex}`,
        clo.text + taxonomySuffix + mqfSuffix,
        ploRefs || "\u2014",
        clo.teachingMethods ?? "\u2014",
        clo.assessmentMethods ?? "\u2014",
      ].map((text) => new TableCell({ children: [new Paragraph(text)] })),
    });
  });

  const topicRows = table4.topics.map(
    (t) =>
      new TableRow({
        children: [
          String(t.orderIndex),
          t.topicMs,
          t.cloRef ?? "\u2014",
          `L${t.hours.f2fPhysical.l} T${t.hours.f2fPhysical.t} P${t.hours.f2fPhysical.p} O${t.hours.f2fPhysical.o}`,
          `L${t.hours.f2fOnline.l} T${t.hours.f2fOnline.t} P${t.hours.f2fOnline.p} O${t.hours.f2fOnline.o}`,
          String(t.hours.independent),
        ].map((text) => new TableCell({ children: [new Paragraph(text)] })),
      })
  );

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "UNIVERSITI KEBANGSAAN MALAYSIA", bold: true, size: 20 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "Fakulti Teknologi dan Sains Maklumat", size: 20 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 300 },
            children: [new TextRun("Proforma Kursus (Table 4)")],
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              metaRow("Kod Kursus", table4.course.code),
              metaRow("Nama Kursus", table4.course.nameMs),
              metaRow("Program", table4.course.programmeCode),
              metaRow("Jam Kredit", table4.course.creditHours),
              metaRow(
                "Klasifikasi",
                table4.classification ? CLASSIFICATION_LABEL[table4.classification] : "\u2014"
              ),
              metaRow("Staf Akademik", table4.academicStaffNames.join(", ") || "\u2014"),
              metaRow(
                "Semester / Tahun",
                `Tahun ${table4.yearOffered ?? "\u2014"}, Semester ${table4.semesterOffered ?? "\u2014"}`
              ),
              metaRow("Pra-syarat", table4.prerequisite || "Tiada"),
              metaRow("Versi", `${table4.versionNo} \u2014 ${STATUS_LABEL[table4.status]}`),
              metaRow("Dicipta Oleh", table4.createdByName),
            ],
          }),

          heading("Sinopsis"),
          new Paragraph(table4.synopsis || "Belum diisi."),

          heading("Hasil Pembelajaran Kursus (CLO) & Pemetaan PLO"),
          table4.clos.length > 0
            ? new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: ["CLO", "Penerangan", "PLO", "Penyampaian", "Penilaian"].map(
                      (h) =>
                        new TableCell({
                          children: [
                            new Paragraph({ children: [new TextRun({ text: h, bold: true })] }),
                          ],
                        })
                    ),
                  }),
                  ...cloRows,
                ],
              })
            : new Paragraph({ children: [new TextRun({ text: "Belum ada CLO.", italics: true })] }),

          heading("Topik Mingguan & SLT"),
          table4.topics.length > 0
            ? new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      "Minggu",
                      "Topik",
                      "CLO",
                      "F2F Fizikal",
                      "F2F Online",
                      "Kendiri",
                    ].map(
                      (h) =>
                        new TableCell({
                          children: [
                            new Paragraph({ children: [new TextRun({ text: h, bold: true })] }),
                          ],
                        })
                    ),
                  }),
                  ...topicRows,
                ],
              })
            : new Paragraph({ children: [new TextRun({ text: "Belum ada topik.", italics: true })] }),
          new Paragraph({
            spacing: { before: 100 },
            children: [
              new TextRun({
                text: `Jumlah SLT: ${slt.grandTotal} jam \u2014 F2F Fizikal: ${slt.pctF2fPhysical}% \u2014 Online + Kendiri: ${slt.pctOnlineIndependent}% \u2014 Praktikal (P): ${slt.pctPractical}%`,
                size: 18,
                italics: true,
              }),
            ],
          }),

          heading("Penilaian Berterusan"),
          assessmentTable(continuous),

          heading("Penilaian Akhir"),
          assessmentTable(final),

          ...(table4.transferableSkills.length > 0 || table4.specialRequirements
            ? [
                heading("Kemahiran Boleh Pindah & Keperluan Khas"),
                ...(table4.transferableSkills.length > 0
                  ? [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Kemahiran Boleh Pindah: ", bold: true }),
                          new TextRun(table4.transferableSkills.join(", ")),
                        ],
                      }),
                    ]
                  : []),
                ...(table4.specialRequirements
                  ? [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Keperluan Khas: ", bold: true }),
                          new TextRun(table4.specialRequirements),
                        ],
                      }),
                    ]
                  : []),
              ]
            : []),

          ...(table4.referencesText
            ? [
                heading("Rujukan"),
                ...table4.referencesText
                  .split("\n")
                  .map((line) => new Paragraph({ children: [new TextRun(line || " ")] })),
              ]
            : []),

          new Paragraph({
            spacing: { before: 500 },
            children: [
              new TextRun({
                text: `Dijana pada ${new Date().toLocaleString("ms-MY")} melalui Sistem Pengurusan Proforma Kursus FTSM.`,
                italics: true,
                size: 16,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const filename = `Table4_${table4.course.code}_v${table4.versionNo}.docx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
