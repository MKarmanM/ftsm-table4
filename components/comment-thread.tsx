"use client";

import { useActionState, useRef, useEffect } from "react";
import {
  createCommentAction,
  type CreateCommentState,
} from "@/app/actions/proforma";
import { Button } from "@/components/ui/button";
import {
  REVIEW_COMMENT_SECTIONS,
  getReviewCommentSectionLabel,
} from "@/lib/review-comment-sections";

type Comment = {
  id: string;
  body: string;
  sectionKey: string | null;
  createdAt: Date;
  authorName: string;
};

const initialState: CreateCommentState = {};

export function CommentThread({
  versionId,
  courseId,
  comments,
}: {
  versionId: string;
  courseId: string;
  comments: Comment[];
}) {
  const [state, formAction, isPending] = useActionState(
    createCommentAction,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state?.error) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <div className="space-y-4">
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          Belum ada komen.
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li
              key={c.id}
              className="rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-foreground">
                  {c.authorName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {c.createdAt.toLocaleString("ms-MY")}
                </span>
              </div>
              <p className="mt-1 inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {getReviewCommentSectionLabel(c.sectionKey)}
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-foreground">
                {c.body}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form ref={formRef} action={formAction} className="space-y-2">
        <input type="hidden" name="versionId" value={versionId} />
        <input type="hidden" name="courseId" value={courseId} />
        <label className="block text-xs font-medium text-foreground">
          Bahagian komen
          <select
            name="sectionKey"
            defaultValue=""
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {REVIEW_COMMENT_SECTIONS.map((option) => (
              <option key={option.value || "general"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <textarea
          name="body"
          rows={3}
          required
          placeholder="Tulis komen untuk bahagian yang dipilih..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Menghantar..." : "Hantar Komen"}
          </Button>
          {state?.error && (
            <p role="alert" className="text-xs text-destructive">
              {state.error}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
