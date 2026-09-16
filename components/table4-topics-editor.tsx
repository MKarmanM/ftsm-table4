"use client";

import { useActionState, useRef, useState } from "react";
import {
  addTopicAction,
  removeTopicAction,
  updateTopicAction,
  type TopicFormState,
} from "@/app/actions/table4";
import type { HoursBreakdown } from "@/lib/table4-detail";
import { Button } from "@/components/ui/button";
import { BilingualLabel, BilingualTextarea, LtpoInfoIcon } from "@/components/table4-bilingual-label";

type Topic = {
  id: string;
  orderIndex: number;
  topicMs: string;
  topicEn: string | null;
  cloRef: string | null;
  hours: HoursBreakdown;
};
type CloOption = { orderIndex: number };

const initial: TopicFormState = {};

function ltpo(b: { l: number; t: number; p: number; o: number }) {
  return `L${b.l} T${b.t} P${b.p} O${b.o}`;
}

// Reusable 4-input L/T/P/O block, used for both physical and online modes.
function LtpoFields({
  namePrefix,
  defaults,
}: {
  namePrefix: string;
  defaults?: { l: number; t: number; p: number; o: number };
}) {
  return (
    <div className="grid grid-cols-4 gap-1">
      {(["L", "T", "P", "O"] as const).map((label) => (
        <input
          key={label}
          name={`${namePrefix}${label}`}
          type="number"
          step="0.5"
          min="0"
          defaultValue={defaults?.[label.toLowerCase() as "l" | "t" | "p" | "o"] ?? ""}
          placeholder={label}
          title={
            { L: "Lecture/Kuliah", T: "Tutorial/Tutoran", P: "Practical/Amali", O: "Other/Lain-lain" }[
              label
            ]
          }
          className="w-full rounded-md border border-input bg-background px-1 py-1 text-xs text-foreground outline-none"
        />
      ))}
    </div>
  );
}

// CLO reference dropdown — populated from the CLOs actually created in
// this draft, so it's never possible to type a CLO number that doesn't
// exist. Automatically reflects new CLOs as soon as they're added.
function CloRefSelect({
  clos,
  defaultValue,
  className,
}: {
  clos: CloOption[];
  defaultValue?: string;
  className?: string;
}) {
  return (
    <select name="cloRef" defaultValue={defaultValue ?? ""} className={className}>
      <option value="">&mdash; CLO &mdash;</option>
      {clos.map((c) => (
        <option key={c.orderIndex} value={`CLO${c.orderIndex}`}>
          CLO{c.orderIndex}
        </option>
      ))}
    </select>
  );
}

export function TopicsEditor({
  versionId,
  courseId,
  readOnly,
  topics,
  clos,
}: {
  versionId: string;
  courseId: string;
  readOnly: boolean;
  topics: Topic[];
  clos: CloOption[];
}) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [addState, addAction, isAdding] = useActionState(
    async (previousState: TopicFormState, formData: FormData) => {
      const result = await addTopicAction(previousState, formData);
      if (!result.error) {
        formRef.current?.reset();
        setIsAddOpen(false);
      }
      return result;
    },
    initial
  );

  return (
    <div className="space-y-3">
      {topics.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Belum ada topik.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
                <th className="px-3 py-2.5">No.</th>
                <th className="px-3 py-2.5">Topik</th>
                <th className="px-3 py-2.5">CLO</th>
                <th className="px-3 py-2.5">F2F Fizikal (L/T/P/O)<LtpoInfoIcon /></th>
                <th className="px-3 py-2.5">F2F Online (L/T/P/O)<LtpoInfoIcon /></th>
                <th className="px-3 py-2.5">Kendiri</th>
                {!readOnly && <th className="px-3 py-2.5" />}
              </tr>
            </thead>
            <tbody>
              {topics.map((t) => (
                <TopicRow
                  key={t.id}
                  topic={t}
                  versionId={versionId}
                  courseId={courseId}
                  readOnly={readOnly}
                  clos={clos}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!readOnly && !isAddOpen && (
        <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(true)}>
          + Tambah Topik
        </Button>
      )}

      {!readOnly && isAddOpen && (
        <form
          ref={formRef}
          action={addAction}
          className="space-y-3 rounded-md border border-border p-4"
        >
          <input type="hidden" name="versionId" value={versionId} />
          <input type="hidden" name="courseId" value={courseId} />
          <p className="text-sm font-semibold text-foreground">Tambah Topik</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <BilingualTextarea
                labelEn="Course Content Outline and Subtopics"
                labelMs="Kandungan Kursus dan Subtopik"
                nameBm="topicMs"
                nameEn="topicEn"
                required
                rows={2}
              />
            </div>
            <div>
              <BilingualLabel en="CLO" ms="CLO" />
              <CloRefSelect
                clos={clos}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 items-end gap-3">
            <div>
              <span className="inline-flex items-center"><BilingualLabel en="F2F Physical" ms="F2F Fizikal" /><LtpoInfoIcon /></span>
              <LtpoFields namePrefix="topicPhysical" />
            </div>
            <div>
              <span className="inline-flex items-center"><BilingualLabel en="F2F Online" ms="F2F Online" /><LtpoInfoIcon /></span>
              <LtpoFields namePrefix="topicOnline" />
            </div>
            <div>
              <BilingualLabel en="Independent Learning" ms="Pembelajaran Kendiri (jam)" />
              <input
                name="topicIndependent"
                type="number"
                step="0.5"
                min="0"
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={isAdding}>
              {isAdding ? "Menambah..." : "Tambah Topik"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddOpen(false)}>
              Batal
            </Button>
          </div>
          {addState?.error && (
            <span className="text-xs text-destructive">{addState.error}</span>
          )}
        </form>
      )}
    </div>
  );
}

function TopicRow({
  topic,
  versionId,
  courseId,
  readOnly,
  clos,
}: {
  topic: Topic;
  versionId: string;
  courseId: string;
  readOnly: boolean;
  clos: CloOption[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, action] = useActionState(removeTopicAction, initial);
  const [updateState, updateAction, isUpdating] = useActionState(
    async (previousState: TopicFormState, formData: FormData) => {
      const result = await updateTopicAction(previousState, formData);
      if (!result.error) setIsEditing(false);
      return result;
    },
    initial
  );

  if (isEditing) {
    return (
      <tr className="border-b border-border last:border-0">
        <td colSpan={readOnly ? 6 : 7} className="p-2">
          <form
            action={updateAction}
            className="space-y-2 rounded-md border border-border bg-muted/20 p-2"
          >
            <input type="hidden" name="versionId" value={versionId} />
            <input type="hidden" name="courseId" value={courseId} />
            <input type="hidden" name="topicId" value={topic.id} />
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <BilingualTextarea
                  labelEn="Course Content Outline and Subtopics"
                  labelMs="Kandungan Kursus dan Subtopik"
                  nameBm="topicMs"
                  nameEn="topicEn"
                  defaultValueBm={topic.topicMs}
                  defaultValueEn={topic.topicEn ?? ""}
                  required
                  rows={2}
                />
              </div>
              <div>
                <BilingualLabel en="CLO" ms="CLO" />
                <CloRefSelect
                  clos={clos}
                  defaultValue={topic.cloRef ?? ""}
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 items-end gap-2">
              <div>
                <span className="inline-flex items-center"><BilingualLabel en="F2F Physical" ms="F2F Fizikal" /><LtpoInfoIcon /></span>
                <LtpoFields namePrefix="topicPhysical" defaults={topic.hours.f2fPhysical} />
              </div>
              <div>
                <span className="inline-flex items-center"><BilingualLabel en="F2F Online" ms="F2F Online" /><LtpoInfoIcon /></span>
                <LtpoFields namePrefix="topicOnline" defaults={topic.hours.f2fOnline} />
              </div>
              <div>
                <BilingualLabel en="Independent Learning" ms="Pembelajaran Kendiri (jam)" />
                <input
                  name="topicIndependent"
                  type="number"
                  step="0.5"
                  min="0"
                  defaultValue={topic.hours.independent}
                  className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" disabled={isUpdating}>
                {isUpdating ? "..." : "Simpan"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                Batal
              </Button>
              {updateState?.error && (
                <span className="text-xs text-destructive">{updateState.error}</span>
              )}
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-3 py-2.5">{topic.orderIndex}</td>
      <td className="px-3 py-2.5 text-foreground">
        <div>{topic.topicMs}</div>
        {topic.topicEn && (
          <div className="italic text-primary">{topic.topicEn}</div>
        )}
      </td>
      <td className="px-3 py-2.5 text-muted-foreground">{topic.cloRef ?? "\u2014"}</td>
      <td className="px-3 py-2.5 whitespace-nowrap">{ltpo(topic.hours.f2fPhysical)}</td>
      <td className="px-3 py-2.5 whitespace-nowrap">{ltpo(topic.hours.f2fOnline)}</td>
      <td className="px-3 py-2.5">{topic.hours.independent}</td>
      {!readOnly && (
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-md px-2 py-1 text-xs font-medium text-secondary hover:bg-muted hover:text-foreground"
            >
              Edit
            </button>
            <form
              action={action}
              onSubmit={(e) => {
                if (!confirm(`Adakah anda pasti mahu membuang topik minggu ${topic.orderIndex} ini?`)) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="versionId" value={versionId} />
              <input type="hidden" name="courseId" value={courseId} />
              <input type="hidden" name="topicId" value={topic.id} />
              <button
                type="submit"
                className="rounded-md px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
              >
                Buang
              </button>
            </form>
          </div>
          {state?.error && (
            <p role="alert" className="mt-1 text-xs text-destructive">
              {state.error}
            </p>
          )}
        </td>
      )}
    </tr>
  );
}
