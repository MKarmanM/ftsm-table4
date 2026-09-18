import { notFound } from "next/navigation";
import Link from "next/link";
import { getTable4Detail, computeSltSummary } from "@/lib/table4-detail";
import { STATUS_LABEL } from "@/lib/courses";
import { taxonomyCode } from "@/lib/taxonomy-data";
import { deriveMqfClusters, MQF_CODE_LABEL } from "@/lib/mqf-legend";
import { PrintButton } from "@/components/print-button";
import { getCurrentUser } from "@/lib/auth";
import { canViewDraft } from "@/lib/permissions";
import { CLASSIFICATION_LABEL } from "@/lib/table4-labels";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function PrintVersionPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string; versionId: string }>;
  searchParams: Promise<{ export?: string }>;
}) {
  const { courseId, versionId } = await params;
  const { export: requestedExport } = await searchParams;
  const exportFormat =
    requestedExport === "word" || requestedExport === "excel"
      ? requestedExport
      : null;
  const [table4, currentUser] = await Promise.all([
    getTable4Detail(versionId),
    getCurrentUser(),
  ]);

  if (
    !table4 ||
    !currentUser ||
    table4.course.id !== courseId ||
    !canViewDraft(currentUser, {
      id: table4.course.id,
      programmeId: table4.course.programmeId,
    })
  ) {
    notFound();
  }

  const slt = computeSltSummary(table4.topics, table4.assessments);
  const continuous = table4.assessments.filter((a) => a.phase === "CONTINUOUS");
  const final = table4.assessments.filter((a) => a.phase === "FINAL");

  const ploByCloId = new Map(table4.programmePlos.map((p) => [p.id, p]));

  return (
    <div className="mx-auto w-full max-w-3xl px-8 py-10 print:px-0 print:py-0">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/courses/${table4.course.id}/versions/${table4.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Kembali
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {exportFormat ? (
            <>
              <span className="text-sm font-medium text-foreground">
                Eksport Dokumen — {exportFormat === "word" ? "Word" : "Excel"}
              </span>
              <a
                href={
                  exportFormat === "word"
                    ? `/api/export/${table4.id}`
                    : `/api/export-excel/${table4.id}`
                }
                className={buttonVariants({ size: "sm" })}
              >
                {exportFormat === "word"
                  ? "Muat Turun Word"
                  : "Muat Turun Excel"}
              </a>
            </>
          ) : (
            <PrintButton />
          )}
        </div>
      </div>

      {exportFormat === "excel" ? (
        <ExcelSpreadsheetPreview table4={table4} />
      ) : (
        <>
      <div className="border-b-2 border-foreground pb-4">
        <p className="text-xs font-semibold tracking-wide uppercase">
          Universiti Kebangsaan Malaysia
        </p>
        <p className="text-xs tracking-wide uppercase">
          Fakulti Teknologi dan Sains Maklumat
        </p>
        <h1 className="mt-3 text-xl font-bold">Proforma Kursus (Table 4)</h1>
      </div>

      <table className="mt-6 w-full border-collapse text-sm">
        <tbody>
          <Row label="Kod Kursus" value={table4.course.code} />
          <Row label="Nama Kursus" value={table4.course.nameMs} />
          <Row label="Program" value={table4.course.programmeCode} />
          <Row label="Jam Kredit" value={table4.course.creditHours} />
          <Row
            label="Klasifikasi"
            value={
              table4.classification
                ? CLASSIFICATION_LABEL[table4.classification]
                : "\u2014"
            }
          />
          <Row
            label="Staf Akademik"
            value={table4.academicStaffNames.join(", ") || "\u2014"}
          />
          <Row
            label="Semester / Tahun"
            value={`Tahun ${table4.yearOffered ?? "\u2014"}, Semester ${table4.semesterOffered ?? "\u2014"}${table4.offeringRemarks ? ` (${table4.offeringRemarks})` : ""}`}
          />
          <Row label="Pra-syarat" value={table4.prerequisite || "Tiada"} />
          <Row label="Versi" value={`${table4.versionNo} \u2014 ${STATUS_LABEL[table4.status]}`} />
          <Row label="Dicipta Oleh" value={table4.createdByName} />
          {table4.publishedAt && (
            <Row
              label="Tarikh Diterbitkan"
              value={table4.publishedAt.toLocaleDateString("ms-MY")}
            />
          )}
        </tbody>
      </table>

      <Section title="Sinopsis">
        {table4.synopsis ? (
          <p className="whitespace-pre-wrap">{table4.synopsis}</p>
        ) : (
          <p className="text-muted-foreground italic">Belum diisi.</p>
        )}
      </Section>

      <Section title="Hasil Pembelajaran Kursus (CLO) & Pemetaan PLO">
        {table4.clos.length === 0 ? (
          <p className="text-muted-foreground italic">Belum ada CLO.</p>
        ) : (
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-foreground text-left uppercase">
                <th className="py-1.5 pr-2">CLO</th>
                <th className="py-1.5 pr-2">Penerangan</th>
                <th className="py-1.5 pr-2">PLO</th>
                <th className="py-1.5 pr-2">Penyampaian</th>
                <th className="py-1.5">Penilaian</th>
              </tr>
            </thead>
            <tbody>
              {table4.clos.map((clo) => (
                <tr key={clo.id} className="border-b border-border align-top">
                  <td className="py-1.5 pr-2 font-medium">
                    CLO{clo.orderIndex}
                  </td>
                  <td className="py-1.5 pr-2">
                    {clo.text}
                    {clo.taxonomyDomain && clo.taxonomyLevel && (
                      <span className="text-muted-foreground">
                        {" "}
                        ({taxonomyCode(clo.taxonomyDomain, clo.taxonomyLevel)};{" "}
                        {(() => {
                          const mappedPlo = clo.mappedPloIds
                            .map((id) => ploByCloId.get(id))
                            .find(Boolean);
                          return mappedPlo ? `PLO${mappedPlo.orderNumber}` : "—";
                        })()}
                        )
                      </span>
                    )}
                    {(() => {
                      const mappedPlo = clo.mappedPloIds
                        .map((id) => ploByCloId.get(id))
                        .find(Boolean);
                      const mqf = deriveMqfClusters(
                        mappedPlo ? [mappedPlo.orderNumber] : []
                      );
                      return mqf.length > 0 ? (
                        <div className="text-muted-foreground">
                          Kluster MQF:{" "}
                          {mqf
                            .map(
                              (code) =>
                                `${code} — ${MQF_CODE_LABEL[code] ?? code}`
                            )
                            .join(", ")}
                        </div>
                      ) : null;
                    })()}
                  </td>
                  <td className="py-1.5 pr-2">
                    {(() => {
                      const mappedPlo = clo.mappedPloIds
                        .map((id) => ploByCloId.get(id))
                        .find(Boolean);
                      return mappedPlo ? `PLO${mappedPlo.orderNumber}` : "\u2014";
                    })()}
                  </td>
                  <td className="py-1.5 pr-2">{clo.teachingMethods ?? "\u2014"}</td>
                  <td className="py-1.5">{clo.assessmentMethods ?? "\u2014"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="Topik Mingguan & SLT">
        {table4.topics.length === 0 ? (
          <p className="text-muted-foreground italic">Belum ada topik.</p>
        ) : (
          <>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-foreground text-left uppercase">
                  <th className="py-1.5 pr-2">Minggu</th>
                  <th className="py-1.5 pr-2">Topik</th>
                  <th className="py-1.5 pr-2">CLO</th>
                  <th className="py-1.5 pr-2">F2F Fizikal</th>
                  <th className="py-1.5 pr-2">F2F Online</th>
                  <th className="py-1.5">Kendiri</th>
                </tr>
              </thead>
              <tbody>
                {table4.topics.map((t) => (
                  <tr key={t.id} className="border-b border-border">
                    <td className="py-1.5 pr-2">{t.orderIndex}</td>
                    <td className="py-1.5 pr-2">{t.topicMs}</td>
                    <td className="py-1.5 pr-2">{t.cloRef ?? "\u2014"}</td>
                    <td className="py-1.5 pr-2">{`L${t.hours.f2fPhysical.l} T${t.hours.f2fPhysical.t} P${t.hours.f2fPhysical.p} O${t.hours.f2fPhysical.o}`}</td>
                    <td className="py-1.5 pr-2">{`L${t.hours.f2fOnline.l} T${t.hours.f2fOnline.t} P${t.hours.f2fOnline.p} O${t.hours.f2fOnline.o}`}</td>
                    <td className="py-1.5">{t.hours.independent ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-muted-foreground">
              Jumlah SLT: {slt.grandTotal} jam &middot; F2F Fizikal:{" "}
              {slt.pctF2fPhysical}% &middot; Online + Kendiri:{" "}
              {slt.pctOnlineIndependent}% &middot; Praktikal (P):{" "}
              {slt.pctPractical}%
            </p>
          </>
        )}
      </Section>

      <Section title="Penilaian Berterusan">
        <AssessmentTable items={continuous} />
      </Section>

      <Section title="Penilaian Akhir">
        <AssessmentTable items={final} />
      </Section>

      {(table4.transferableSkills.length > 0 || table4.specialRequirements) && (
        <Section title="Kemahiran Boleh Pindah & Keperluan Khas">
          {table4.transferableSkills.length > 0 && (
            <p className="mb-1">
              <span className="font-medium">Kemahiran Boleh Pindah:</span>{" "}
              {table4.transferableSkills.join(", ")}
            </p>
          )}
          {table4.specialRequirements && (
            <p>
              <span className="font-medium">Keperluan Khas:</span>{" "}
              {table4.specialRequirements}
            </p>
          )}
        </Section>
      )}

      {table4.referencesText && (
        <Section title="Rujukan">
          <p className="whitespace-pre-wrap">{table4.referencesText}</p>
        </Section>
      )}

      {(table4.futureReadyElements.length > 0 ||
        table4.excelFramework.length > 0 ||
        table4.sdgTags.length > 0) && (
        <Section title="Pemetaan Kurikulum & SDG">
          {table4.futureReadyElements.length > 0 && (
            <p className="mb-1">
              <span className="font-medium">Elemen Kurikulum Masa Depan:</span>{" "}
              {table4.futureReadyElements.join("; ")}
            </p>
          )}
          {table4.excelFramework.length > 0 && (
            <p className="mb-1">
              <span className="font-medium">Kerangka EXCEL:</span>{" "}
              {table4.excelFramework.join("; ")}
            </p>
          )}
          {table4.sdgTags.length > 0 && (
            <p>
              <span className="font-medium">SDG:</span>{" "}
              {table4.sdgTags.join("; ")}
            </p>
          )}
        </Section>
      )}

      <p className="mt-10 text-xs text-muted-foreground print:mt-16">
        Dijana pada {new Date().toLocaleString("ms-MY")} melalui Sistem
        Pengurusan Proforma Kursus FTSM.
      </p>
        </>
      )}
    </div>
  );
}


type Table4Detail = NonNullable<Awaited<ReturnType<typeof getTable4Detail>>>;

function ExcelCell({
  children,
  className = "",
  colSpan,
}: {
  children?: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={`min-w-16 border border-slate-300 bg-white px-2 py-1.5 align-top text-[11px] text-slate-900 ${className}`}
    >
      {children ?? ""}
    </td>
  );
}

function ExcelRowNumber({ value }: { value: number | string }) {
  return (
    <th className="w-10 min-w-10 border border-slate-300 bg-slate-100 px-1.5 py-1 text-center text-[10px] font-medium text-slate-500">
      {value}
    </th>
  );
}

function ExcelSpreadsheetPreview({ table4 }: { table4: Table4Detail }) {
  const ploById = new Map(table4.programmePlos.map((plo) => [plo.id, plo]));
  const continuous = table4.assessments.filter((item) => item.phase === "CONTINUOUS");
  const final = table4.assessments.filter((item) => item.phase === "FINAL");

  const sltRows = table4.topics.slice(0, 20);
  const cloRows = table4.clos.slice(0, 8);

  const mappedPloNumber = (clo: Table4Detail["clos"][number]) =>
    clo.mappedPloIds
      .map((id) => ploById.get(id)?.orderNumber)
      .find((value): value is number => value != null);

  const spreadsheetHeader = (letters: string[]) => (
    <thead>
      <tr>
        <th className="sticky left-0 z-10 w-10 min-w-10 border border-slate-300 bg-slate-200" />
        {letters.map((letter) => (
          <th
            key={letter}
            className="min-w-20 border border-slate-300 bg-slate-200 px-2 py-1 text-center text-[10px] font-semibold text-slate-600"
          >
            {letter}
          </th>
        ))}
      </tr>
    </thead>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-300 bg-slate-50 p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Pratonton Worksheet Excel — FORM
            </p>
            <p className="text-xs text-slate-500">
              Pratonton ini meniru struktur utama template Table 4. Fail .xlsx sebenar kekal menggunakan template rasmi/sample asal.
            </p>
          </div>
          <span className="rounded border border-slate-300 bg-white px-2 py-1 font-mono text-[10px] text-slate-500">
            Sheet: FORM
          </span>
        </div>

        <div className="overflow-x-auto rounded border border-slate-300 bg-white">
          <table className="border-collapse font-sans">
            {spreadsheetHeader(["D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X"])}
            <tbody>
              <tr>
                <ExcelRowNumber value={5} />
                <ExcelCell className="bg-slate-50 font-semibold">1</ExcelCell>
                <ExcelCell className="bg-slate-50 font-semibold">Nama Kursus</ExcelCell>
                <ExcelCell className="min-w-[420px] font-medium" colSpan={19}>
                  {table4.course.nameMs}
                </ExcelCell>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <ExcelSection title="Maklumat Asas — sekitar row 5–14">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="w-12 border border-slate-300 bg-slate-200 px-2 py-1 text-[10px] text-slate-600">Row</th>
              <th className="border border-slate-300 bg-slate-200 px-2 py-1 text-left text-[10px] text-slate-600">Item</th>
              <th className="border border-slate-300 bg-slate-200 px-2 py-1 text-left text-[10px] text-slate-600">Nilai dalam worksheet</th>
            </tr>
          </thead>
          <tbody>
            {[
              [5, "Nama Kursus", table4.course.nameMs],
              [6, "Kod Kursus", table4.course.code],
              [7, "Klasifikasi", table4.classification ?? "—"],
              [8, "Sinopsis", table4.synopsis || "—"],
              [9, "Staf Akademik", table4.academicStaffNames.join(", ") || "—"],
              [12, "Tahun / Semester", `${table4.yearOffered ?? "—"} / ${table4.semesterOffered ?? "—"}`],
              [13, "Nilai Kredit", `${table4.course.creditHours} (formula template)`],
              [14, "Pra-syarat", table4.prerequisite || "Tiada"],
            ].map(([row, label, value]) => (
              <tr key={String(row)}>
                <ExcelRowNumber value={row} />
                <ExcelCell className="font-medium">{label}</ExcelCell>
                <ExcelCell className="min-w-[520px]">{value}</ExcelCell>
              </tr>
            ))}
          </tbody>
        </table>
      </ExcelSection>

      <ExcelSection title="Item 7 — CLO / HPK (row 16–23)">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="w-12 border border-slate-300 bg-slate-200 px-2 py-1 text-[10px] text-slate-600">Row</th>
              <th className="border border-slate-300 bg-slate-200 px-2 py-1 text-[10px] text-slate-600">F</th>
              <th className="min-w-[600px] border border-slate-300 bg-slate-200 px-2 py-1 text-left text-[10px] text-slate-600">H — CLO / HPK</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }, (_, index) => {
              const clo = cloRows[index];
              const ploNo = clo ? mappedPloNumber(clo) : undefined;
              const taxonomy =
                clo?.taxonomyDomain && clo.taxonomyLevel
                  ? taxonomyCode(clo.taxonomyDomain, clo.taxonomyLevel)
                  : "";
              return (
                <tr key={index}>
                  <ExcelRowNumber value={16 + index} />
                  <ExcelCell className="font-medium">CLO{index + 1}/HPK{index + 1}</ExcelCell>
                  <ExcelCell>
                    {clo
                      ? `${clo.text}${taxonomy ? ` (${taxonomy}${ploNo ? `; PLO${ploNo}` : ""})` : ""}`
                      : ""}
                  </ExcelCell>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ExcelSection>

      <ExcelSection title="Item 8 — Pemetaan CLO–PLO, Kaedah Penyampaian & Penilaian (row 29–36)">
        <div className="overflow-x-auto">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="w-12 border border-slate-300 bg-slate-200 px-2 py-1 text-[10px] text-slate-600">Row</th>
                <th className="min-w-20 border border-slate-300 bg-slate-200 px-2 py-1 text-[10px] text-slate-600">CLO</th>
                {Array.from({ length: 11 }, (_, i) => (
                  <th key={i} className="min-w-12 border border-slate-300 bg-slate-200 px-1 py-1 text-[10px] text-slate-600">
                    PLO{i + 1}
                  </th>
                ))}
                <th className="min-w-48 border border-slate-300 bg-slate-200 px-2 py-1 text-left text-[10px] text-slate-600">R — Penyampaian</th>
                <th className="min-w-48 border border-slate-300 bg-slate-200 px-2 py-1 text-left text-[10px] text-slate-600">W — Penilaian</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }, (_, index) => {
                const clo = cloRows[index];
                const ploNo = clo ? mappedPloNumber(clo) : undefined;
                return (
                  <tr key={index}>
                    <ExcelRowNumber value={29 + index} />
                    <ExcelCell className="font-medium">CLO{index + 1}</ExcelCell>
                    {Array.from({ length: 11 }, (_, i) => (
                      <ExcelCell key={i} className="text-center font-semibold">
                        {ploNo === i + 1 ? "√" : ""}
                      </ExcelCell>
                    ))}
                    <ExcelCell>{clo?.teachingMethods ?? ""}</ExcelCell>
                    <ExcelCell>{clo?.assessmentMethods ?? ""}</ExcelCell>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ExcelSection>

      <ExcelSection title="Mapping with MQF Cluster of Learning Outcomes (row 37–39)">
        <div className="overflow-x-auto">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="w-12 border border-slate-300 bg-slate-200 px-2 py-1 text-[10px] text-slate-600">Row</th>
                {Array.from({ length: 11 }, (_, i) => (
                  <th key={i} className="min-w-20 border border-slate-300 bg-slate-200 px-2 py-1 text-[10px] text-slate-600">
                    PLO{i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[37, 38, 39].map((row, rowIndex) => (
                <tr key={row}>
                  <ExcelRowNumber value={row} />
                  {Array.from({ length: 11 }, (_, ploIndex) => {
                    const codes = cloRows
                      .filter((clo) => mappedPloNumber(clo) === ploIndex + 1)
                      .map(() => deriveMqfClusters([ploIndex + 1])[0])
                      .filter(Boolean);
                    return (
                      <ExcelCell key={ploIndex} className="text-center font-medium">
                        {codes[rowIndex] ?? ""}
                      </ExcelCell>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ExcelSection>

      <ExcelSection title="Item 10 — Topik / SLT (row 60–79)">
        <div className="overflow-x-auto">
          <table className="border-collapse">
            <thead>
              <tr>
                {["Row", "Minggu", "Topik", "CLO", "M-L", "N-T", "O-P", "P-O", "Q-L", "R-T", "S-P", "T-O", "U-Kendiri"].map((label) => (
                  <th key={label} className="min-w-16 border border-slate-300 bg-slate-200 px-2 py-1 text-[10px] text-slate-600">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.max(6, sltRows.length) }, (_, index) => {
                const topic = sltRows[index];
                return (
                  <tr key={index}>
                    <ExcelRowNumber value={60 + index} />
                    <ExcelCell className="text-center">{index + 1}</ExcelCell>
                    <ExcelCell className="min-w-[300px]">{topic?.topicMs ?? ""}</ExcelCell>
                    <ExcelCell className="text-center">{topic?.cloRef ?? ""}</ExcelCell>
                    <ExcelCell className="text-center">{topic?.hours.f2fPhysical.l || ""}</ExcelCell>
                    <ExcelCell className="text-center">{topic?.hours.f2fPhysical.t || ""}</ExcelCell>
                    <ExcelCell className="text-center">{topic?.hours.f2fPhysical.p || ""}</ExcelCell>
                    <ExcelCell className="text-center">{topic?.hours.f2fPhysical.o || ""}</ExcelCell>
                    <ExcelCell className="text-center">{topic?.hours.f2fOnline.l || ""}</ExcelCell>
                    <ExcelCell className="text-center">{topic?.hours.f2fOnline.t || ""}</ExcelCell>
                    <ExcelCell className="text-center">{topic?.hours.f2fOnline.p || ""}</ExcelCell>
                    <ExcelCell className="text-center">{topic?.hours.f2fOnline.o || ""}</ExcelCell>
                    <ExcelCell className="text-center">{topic?.hours.independent || ""}</ExcelCell>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ExcelSection>

      <ExcelAssessmentPreview title="Penilaian Berterusan — row 83–87" startRow={83} items={continuous} />
      <ExcelAssessmentPreview title="Penilaian Akhir — row 91–95" startRow={91} items={final} />

      <p className="text-xs text-slate-500">
        Nota: paparan ini ialah pratonton browser bergaya spreadsheet. Fail Excel sebenar masih dijana daripada template rasmi/sample asal dengan formula, merge dan format asal yang dikekalkan.
      </p>
    </div>
  );
}

function ExcelSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-300 bg-slate-50 p-3">
      <p className="mb-2 text-xs font-semibold text-slate-700">{title}</p>
      <div className="overflow-x-auto rounded border border-slate-300 bg-white">
        {children}
      </div>
    </section>
  );
}

function ExcelAssessmentPreview({
  title,
  startRow,
  items,
}: {
  title: string;
  startRow: number;
  items: Table4Detail["assessments"];
}) {
  return (
    <ExcelSection title={title}>
      <table className="border-collapse">
        <thead>
          <tr>
            {["Row", "Nama Penilaian", "Wajaran %", "M-L", "N-T", "O-P", "P-O", "Q-L", "R-T", "S-P", "T-O", "U-Kendiri"].map((label) => (
              <th key={label} className="min-w-16 border border-slate-300 bg-slate-200 px-2 py-1 text-[10px] text-slate-600">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }, (_, index) => {
            const item = items[index];
            return (
              <tr key={index}>
                <ExcelRowNumber value={startRow + index} />
                <ExcelCell className="min-w-[260px]">{item?.nameMs ?? ""}</ExcelCell>
                <ExcelCell className="text-center">{item?.weightagePercent ?? ""}</ExcelCell>
                <ExcelCell className="text-center">{item?.hours.f2fPhysical.l || ""}</ExcelCell>
                <ExcelCell className="text-center">{item?.hours.f2fPhysical.t || ""}</ExcelCell>
                <ExcelCell className="text-center">{item?.hours.f2fPhysical.p || ""}</ExcelCell>
                <ExcelCell className="text-center">{item?.hours.f2fPhysical.o || ""}</ExcelCell>
                <ExcelCell className="text-center">{item?.hours.f2fOnline.l || ""}</ExcelCell>
                <ExcelCell className="text-center">{item?.hours.f2fOnline.t || ""}</ExcelCell>
                <ExcelCell className="text-center">{item?.hours.f2fOnline.p || ""}</ExcelCell>
                <ExcelCell className="text-center">{item?.hours.f2fOnline.o || ""}</ExcelCell>
                <ExcelCell className="text-center">{item?.hours.independent || ""}</ExcelCell>
              </tr>
            );
          })}
        </tbody>
      </table>
    </ExcelSection>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-border">
      <th className="w-40 py-1.5 pr-4 text-left align-top font-medium">
        {label}
      </th>
      <td className="py-1.5 align-top">{value}</td>
    </tr>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="border-b border-foreground pb-1 text-sm font-bold uppercase">
        {title}
      </h2>
      <div className="mt-2 text-sm">{children}</div>
    </section>
  );
}

function AssessmentTable({
  items,
}: {
  items: {
    id: string;
    nameMs: string;
    weightagePercent: string | null;
    hours: {
      f2fPhysical: { l: number; t: number; p: number; o: number };
      f2fOnline: { l: number; t: number; p: number; o: number };
      independent: number;
    };
  }[];
}) {
  if (items.length === 0) {
    return <p className="text-muted-foreground italic">Belum ada item.</p>;
  }
  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="border-b border-foreground text-left uppercase">
          <th className="py-1.5 pr-2">Nama</th>
          <th className="py-1.5 pr-2">Wajaran %</th>
          <th className="py-1.5 pr-2">F2F Fizikal</th>
          <th className="py-1.5 pr-2">F2F Online</th>
          <th className="py-1.5">Kendiri</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id} className="border-b border-border">
            <td className="py-1.5 pr-2">{item.nameMs}</td>
            <td className="py-1.5 pr-2">{item.weightagePercent ?? "\u2014"}</td>
            <td className="py-1.5 pr-2">{`L${item.hours.f2fPhysical.l} T${item.hours.f2fPhysical.t} P${item.hours.f2fPhysical.p} O${item.hours.f2fPhysical.o}`}</td>
            <td className="py-1.5 pr-2">{`L${item.hours.f2fOnline.l} T${item.hours.f2fOnline.t} P${item.hours.f2fOnline.p} O${item.hours.f2fOnline.o}`}</td>
            <td className="py-1.5">{item.hours.independent ?? 0}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
