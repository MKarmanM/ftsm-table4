import { notFound } from "next/navigation";
import Link from "next/link";
import { getTable4Detail, computeSltSummary } from "@/lib/table4-detail";
import { STATUS_LABEL } from "@/lib/courses";
import { taxonomyCode } from "@/lib/taxonomy-data";
import { deriveMqfClusters } from "@/lib/mqf-legend";
import { PrintButton } from "@/components/print-button";

export const dynamic = "force-dynamic";

const CLASSIFICATION_LABEL: Record<string, string> = {
  WU_CITRA_WAJIB: "Wajib Universiti / Citra Wajib",
  WU_CITRA_RENTAS: "Wajib Universiti / Citra Rentas",
  TERAS: "Teras",
  ELEKTIF: "Elektif",
  AUDIT: "Audit",
};

export default async function PrintVersionPage({
  params,
}: {
  params: Promise<{ courseId: string; versionId: string }>;
}) {
  const { versionId } = await params;
  const table4 = await getTable4Detail(versionId);

  if (!table4) {
    notFound();
  }

  const slt = computeSltSummary(table4.topics, table4.assessments);
  const continuous = table4.assessments.filter((a) => a.phase === "CONTINUOUS");
  const final = table4.assessments.filter((a) => a.phase === "FINAL");

  const ploByCloId = new Map(table4.programmePlos.map((p) => [p.id, p]));

  return (
    <div className="mx-auto w-full max-w-3xl px-8 py-10 print:px-0 print:py-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/courses/${table4.course.id}/versions/${table4.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Kembali
        </Link>
        <PrintButton />
      </div>

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
                        {clo.mappedPloIds
                          .map((id) => ploByCloId.get(id))
                          .filter(Boolean)
                          .map((p) => `PLO${p!.orderNumber}`)
                          .join(", ")}
                        )
                      </span>
                    )}
                    {(() => {
                      const mqf = deriveMqfClusters(
                        clo.mappedPloIds
                          .map((id) => ploByCloId.get(id)?.orderNumber)
                          .filter((n): n is number => n != null)
                      );
                      return mqf.length > 0 ? (
                        <div className="text-muted-foreground">
                          MQF: {mqf.join(", ")}
                        </div>
                      ) : null;
                    })()}
                  </td>
                  <td className="py-1.5 pr-2">
                    {clo.mappedPloIds
                      .map((id) => ploByCloId.get(id))
                      .filter(Boolean)
                      .map((p) => `PLO${p!.orderNumber}`)
                      .join(", ") || "\u2014"}
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
    </div>
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
