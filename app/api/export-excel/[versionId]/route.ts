import { NextRequest, NextResponse } from "next/server";
import path from "path";
import ExcelJS from "exceljs";
import { getCurrentUser } from "@/lib/auth";
import { getTable4Detail } from "@/lib/table4-detail";
import { TABLE4_CELLS, CLASSIFICATION_TEXT, MQF_CLUSTER_GRID_ROWS } from "@/lib/table4-excel-map";
import { taxonomyCode } from "@/lib/taxonomy-data";
import { deriveMqfClusters } from "@/lib/mqf-legend";
import { canViewDraft } from "@/lib/permissions";

const TEMPLATE_PATH = path.join(process.cwd(), "resources", "table4-template.xlsx");

function bilingual(ms: string | null, en: string | null): string {
  if (ms && en) return `${ms}\n${en}`;
  return ms ?? en ?? "";
}

function cloNumberFromRef(ref: string | null): number | null {
  if (!ref) return null;
  const match = ref.match(/\d+/);
  return match ? Number(match[0]) : null;
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
  if (
    !canViewDraft(currentUser, {
      id: table4.course.id,
      programmeId: table4.course.programmeId,
    })
  ) {
    return NextResponse.json({ error: "Versi tidak dijumpai." }, { status: 404 });
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(TEMPLATE_PATH);
  // Force Excel to recompute every formula cell (SLT totals, percentages,
  // credit value) when the file is opened, since we only write raw input
  // cells and rely entirely on the template's existing formulas.
  workbook.calcProperties.fullCalcOnLoad = true;

  const sheet = workbook.getWorksheet("FORM");
  if (!sheet) {
    return NextResponse.json({ error: "Templat Excel tidak sah (sheet FORM tiada)." }, { status: 500 });
  }
  const set = (cellRef: string, value: string | number | null) => {
    if (value === null || value === "") return;
    sheet.getCell(cellRef).value = value;
  };

  // ---- Items 1–6: basic info ----
  set(TABLE4_CELLS.courseName, bilingual(table4.course.nameMs, null) || table4.course.code);
  set(TABLE4_CELLS.courseCode, table4.course.code);
  if (table4.classification) {
    set(TABLE4_CELLS.classification, CLASSIFICATION_TEXT[table4.classification] ?? table4.classification);
  }
  set(TABLE4_CELLS.classificationDomain, table4.classificationDomain);
  set(TABLE4_CELLS.synopsis, table4.synopsis);
  table4.academicStaffNames.slice(0, TABLE4_CELLS.staffNameCells.length).forEach((name, i) => {
    set(TABLE4_CELLS.staffNameCells[i], name);
  });
  set(TABLE4_CELLS.yearOffered, table4.yearOffered);
  set(TABLE4_CELLS.semesterOffered, table4.semesterOffered);
  set(TABLE4_CELLS.offeringRemarks, table4.offeringRemarks);
  set(TABLE4_CELLS.prerequisite, table4.prerequisite);

  // ---- Item 7: CLOs ----
  // The template only pre-fills the "CLOn/HPKn" row label (column F) for
  // CLO1-CLO3 (F16-F18) — CLO4 onward has a blank label cell, and the
  // Item 8 mapping table's row label reads FROM that same cell via a
  // formula, so without writing it here CLO4+ effectively "disappears"
  // even though its content (column H) is present.
  const ploIdToOrderNumber = new Map(table4.programmePlos.map((p) => [p.id, p.orderNumber]));
  table4.clos.slice(0, TABLE4_CELLS.cloTextCells.length).forEach((clo, i) => {
    const cloLabelRow = 16 + i;
    set(`F${cloLabelRow}`, `CLO${i + 1}/HPK${i + 1}`);
    // Matches the official sample's own convention: "(C4; PLO2)" —
    // taxonomy code + PLO reference(s), NOT the MQF cluster (that goes
    // in the separate grid below, see the block further down).
    let text = clo.text;
    if (clo.taxonomyDomain && clo.taxonomyLevel) {
      const ploNumber = clo.mappedPloIds
        .map((id) => ploIdToOrderNumber.get(id))
        .find((n): n is number => n != null);
      const ploRef = ploNumber ? `PLO${ploNumber}` : "";
      text += ` (${taxonomyCode(clo.taxonomyDomain, clo.taxonomyLevel)}${ploRef ? `; ${ploRef}` : ""})`;
    }
    set(TABLE4_CELLS.cloTextCells[i], text);
  });

  // ---- Item 8: CLO-PLO mapping, teaching/assessment methods ----
  // Keep the official sample template structure exactly as-is: no row/column,
  // merge, formula, style, or cell-map changes. Only write current system data
  // into the existing designated cells.
  table4.clos.slice(0, TABLE4_CELLS.cloMappingRows.length).forEach((clo, i) => {
    const row = TABLE4_CELLS.cloMappingRows[i];
    const ploNumber = clo.mappedPloIds
      .map((id) => ploIdToOrderNumber.get(id))
      .find((n): n is number => n != null);

    if (
      ploNumber &&
      ploNumber >= 1 &&
      ploNumber <= TABLE4_CELLS.ploTickColumns.length
    ) {
      const col = TABLE4_CELLS.ploTickColumns[ploNumber - 1];
      set(`${col}${row}`, "√");
    }

    set(`${TABLE4_CELLS.teachingMethodColumn}${row}`, clo.teachingMethods);
    set(`${TABLE4_CELLS.assessmentMethodColumn}${row}`, clo.assessmentMethods);
  });

  // ---- "Mapping with MQF Cluster of Learning Outcomes" grid (rows
  // 37-39) — verified against a real filled sample: the MQF code is
  // fully determined by the PLO legend (see lib/mqf-legend.ts), and
  // goes in the SAME PLO column as that CLO's own tick in the grid
  // above. When multiple CLOs map to the same PLO column, each entry
  // still gets its own row, stacking down (row 37 -> 38 -> 39).
  const mqfColumnNextRowIndex: Record<string, number> = {};
  table4.clos.forEach((clo) => {
    const ploNumber = clo.mappedPloIds
      .map((id) => ploIdToOrderNumber.get(id))
      .find((n): n is number => n != null);
    if (
      !ploNumber ||
      ploNumber < 1 ||
      ploNumber > TABLE4_CELLS.ploTickColumns.length
    ) {
      return;
    }

    const [codeText] = deriveMqfClusters([ploNumber]);
    if (!codeText) return;

    const col = TABLE4_CELLS.ploTickColumns[ploNumber - 1];
    const idx = mqfColumnNextRowIndex[col] ?? 0;
    if (idx >= MQF_CLUSTER_GRID_ROWS.length) return; // sample template has 3 rows
    set(`${col}${MQF_CLUSTER_GRID_ROWS[idx]}`, codeText);
    mqfColumnNextRowIndex[col] = idx + 1;
  });

  // ---- Item 9: transferable skills ----
  table4.transferableSkills
    .slice(0, TABLE4_CELLS.transferableSkillCells.length)
    .forEach((skill, i) => set(TABLE4_CELLS.transferableSkillCells[i], skill));

  // ---- Item 10: weekly topics (SLT) ----
  table4.topics.slice(0, TABLE4_CELLS.topicMaxRows).forEach((topic, i) => {
    const row = TABLE4_CELLS.topicFirstRow + i;
    set(`${TABLE4_CELLS.topicTextColumn}${row}`, bilingual(topic.topicMs, topic.topicEn));
    set(`${TABLE4_CELLS.cloRefColumn}${row}`, cloNumberFromRef(topic.cloRef));
    const h = topic.hours;
    set(`${TABLE4_CELLS.hoursColumns.f2fPhysical.l}${row}`, h.f2fPhysical.l || null);
    set(`${TABLE4_CELLS.hoursColumns.f2fPhysical.t}${row}`, h.f2fPhysical.t || null);
    set(`${TABLE4_CELLS.hoursColumns.f2fPhysical.p}${row}`, h.f2fPhysical.p || null);
    set(`${TABLE4_CELLS.hoursColumns.f2fPhysical.o}${row}`, h.f2fPhysical.o || null);
    set(`${TABLE4_CELLS.hoursColumns.f2fOnline.l}${row}`, h.f2fOnline.l || null);
    set(`${TABLE4_CELLS.hoursColumns.f2fOnline.t}${row}`, h.f2fOnline.t || null);
    set(`${TABLE4_CELLS.hoursColumns.f2fOnline.p}${row}`, h.f2fOnline.p || null);
    set(`${TABLE4_CELLS.hoursColumns.f2fOnline.o}${row}`, h.f2fOnline.o || null);
    set(TABLE4_CELLS.hoursColumns.independent + row, h.independent || null);
  });

  // ---- Assessment items (continuous + final) ----
  function writeAssessmentBlock(
    items: NonNullable<typeof table4>["assessments"],
    firstRow: number,
    maxRows: number
  ) {
    items.slice(0, maxRows).forEach((item, i) => {
      const row = firstRow + i;
      set(`${TABLE4_CELLS.assessmentNameColumn}${row}`, bilingual(item.nameMs, item.nameEn));
      set(`${TABLE4_CELLS.assessmentWeightageColumn}${row}`, item.weightagePercent ? Number(item.weightagePercent) : null);
      const h = item.hours;
      set(`${TABLE4_CELLS.hoursColumns.f2fPhysical.l}${row}`, h.f2fPhysical.l || null);
      set(`${TABLE4_CELLS.hoursColumns.f2fPhysical.t}${row}`, h.f2fPhysical.t || null);
      set(`${TABLE4_CELLS.hoursColumns.f2fPhysical.p}${row}`, h.f2fPhysical.p || null);
      set(`${TABLE4_CELLS.hoursColumns.f2fPhysical.o}${row}`, h.f2fPhysical.o || null);
      set(`${TABLE4_CELLS.hoursColumns.f2fOnline.l}${row}`, h.f2fOnline.l || null);
      set(`${TABLE4_CELLS.hoursColumns.f2fOnline.t}${row}`, h.f2fOnline.t || null);
      set(`${TABLE4_CELLS.hoursColumns.f2fOnline.p}${row}`, h.f2fOnline.p || null);
      set(`${TABLE4_CELLS.hoursColumns.f2fOnline.o}${row}`, h.f2fOnline.o || null);
      set(TABLE4_CELLS.hoursColumns.independent + row, h.independent || null);
    });
  }
  writeAssessmentBlock(
    table4.assessments.filter((a) => a.phase === "CONTINUOUS"),
    TABLE4_CELLS.continuousFirstRow,
    TABLE4_CELLS.continuousMaxRows
  );
  writeAssessmentBlock(
    table4.assessments.filter((a) => a.phase === "FINAL"),
    TABLE4_CELLS.finalFirstRow,
    TABLE4_CELLS.finalMaxRows
  );

  // ---- 50% ELT checkbox (drives the F13 credit-value formula) ----
  if (table4.isIndustrialTraining50Elt) {
    set(TABLE4_CELLS.industrialTraining50EltCheckbox, "\u221a");
  }

  // ---- Items 11–15 ----
  set(TABLE4_CELLS.specialRequirements, table4.specialRequirements);
  set(TABLE4_CELLS.references, table4.referencesText);
  set(TABLE4_CELLS.futureReadyElements, table4.futureReadyElements.join("; "));
  set(TABLE4_CELLS.excelFramework, table4.excelFramework.join("; "));
  set(TABLE4_CELLS.sdgTags, table4.sdgTags[0] ?? null);
  set(TABLE4_CELLS.sdgTagsSecondary, table4.sdgTags[1] ?? null);
  if (table4.facultyApprovalDate) {
    set(TABLE4_CELLS.facultyApprovalDate, table4.facultyApprovalDate.toLocaleDateString("en-GB"));
  }
  if (table4.senateApprovalDate) {
    set(TABLE4_CELLS.senateApprovalDate, table4.senateApprovalDate.toLocaleDateString("en-GB"));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `Table4_${table4.course.code}_v${table4.versionNo}.xlsx`;

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
