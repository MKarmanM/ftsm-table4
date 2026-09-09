// Renders labels the same way the official Table 4 form does — e.g.
// "Synopsis/Sinopsis" — with the English part italicized and in the
// primary navy colour so it doesn't get visually confused with the
// black text a user types into the field below it.
export function BilingualLabel({
  en,
  ms,
  required,
}: {
  en: string;
  ms: string;
  required?: boolean;
}) {
  return (
    <span className="text-sm font-medium text-foreground">
      <span className="italic text-primary">{en}</span>
      <span>/{ms}</span>
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </span>
  );
}

// Small hover-info icon explaining the L/T/P/O abbreviations used
// throughout the SLT tables — avoids repeating the full legend as
// visible text everywhere it's needed.
export function LtpoInfoIcon() {
  return (
    <span
      title="L = Lecture/Kuliah &middot; T = Tutorial/Tutoran &middot; P = Practical/Amali &middot; O = Other/Lain-lain"
      className="ml-1 inline-flex size-4 shrink-0 cursor-help items-center justify-center rounded-full bg-muted align-middle text-[10px] font-semibold text-secondary"
      aria-label="Penerangan L/T/P/O: Lecture/Kuliah, Tutorial/Tutoran, Practical/Amali, Other/Lain-lain"
    >
      !
    </span>
  );
}
// Malaysia on top, English below, each with its own explicit "Bahasa
// Malaysia" / "English" tag (not just a bare "ENG" marker) so it reads
// clearly for any user, not just ones already familiar with the
// shorthand. Combined into one string (joined by a newline) when the
// form is submitted, matching how the database stores this content.
export function BilingualTextarea({
  labelEn,
  labelMs,
  nameBm,
  nameEn,
  defaultValueBm,
  defaultValueEn,
  readOnly,
  rows = 3,
  required,
  hint,
  onBlurCapture,
}: {
  labelEn: string;
  labelMs: string;
  nameBm: string;
  nameEn: string;
  defaultValueBm?: string | null;
  defaultValueEn?: string | null;
  readOnly?: boolean;
  rows?: number;
  required?: boolean;
  hint?: string;
  onBlurCapture?: React.FocusEventHandler<HTMLDivElement>;
}) {
  return (
    <div>
      <BilingualLabel en={labelEn} ms={labelMs} required={required} />
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      <div
        onBlurCapture={onBlurCapture}
        className="mt-1.5 overflow-hidden rounded-md border border-input focus-within:border-primary"
      >
        <div className="flex items-center gap-1.5 border-b border-input bg-muted/30 px-3 py-1.5">
          <span className="text-xs font-semibold text-foreground">Bahasa Malaysia</span>
          {required && <span className="text-destructive">*</span>}
        </div>
        <textarea
          name={nameBm}
          defaultValue={defaultValueBm ?? ""}
          readOnly={readOnly}
          required={required}
          rows={rows}
          className="w-full border-0 bg-background px-3 py-2.5 text-sm leading-relaxed text-foreground outline-none disabled:opacity-60"
        />
        <div className="flex items-center gap-1.5 border-y border-input bg-muted/30 px-3 py-1.5">
          <span className="text-xs font-semibold text-foreground">English</span>
          {required && <span className="text-destructive">*</span>}
        </div>
        <textarea
          name={nameEn}
          defaultValue={defaultValueEn ?? ""}
          readOnly={readOnly}
          required={required}
          rows={rows}
          className="w-full border-0 bg-background px-3 py-2.5 text-sm leading-relaxed text-foreground italic outline-none disabled:opacity-60"
        />
      </div>
    </div>
  );
}
