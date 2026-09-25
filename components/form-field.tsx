"use client";

import {
  useId,
  type ChangeEventHandler,
  type ReactNode,
} from "react";

function joinDescribedBy(
  hintId: string | undefined,
  describedBy: string | undefined
) {
  const ids = [hintId, describedBy].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

export function FormField({
  label,
  name,
  hint,
  placeholder,
  required,
  type = "text",
  step,
  min,
  defaultValue,
  autoComplete,
  describedBy,
  className,
}: {
  label: string;
  name: string;
  hint?: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
  step?: string;
  min?: string;
  defaultValue?: string;
  autoComplete?: string;
  describedBy?: string;
  className?: string;
}) {
  const reactId = useId();
  const fieldId = `${name}-${reactId}`;
  const hintId = `${fieldId}-hint`;

  return (
    <div className={className}>
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-foreground"
      >
        {label}
        {required && (
          <>
            <span aria-hidden="true" className="ml-0.5 text-destructive">
              *
            </span>
            <span className="sr-only"> (wajib)</span>
          </>
        )}
      </label>
      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      <input
        id={fieldId}
        name={name}
        type={type}
        step={step}
        min={min}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        aria-describedby={joinDescribedBy(
          hint ? hintId : undefined,
          describedBy
        )}
        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </div>
  );
}

export function FormSelect({
  label,
  name,
  hint,
  required,
  defaultValue,
  value,
  onChange,
  describedBy,
  className,
  children,
}: {
  label: string;
  name: string;
  hint?: string;
  required?: boolean;
  defaultValue?: string;
  value?: string;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
  describedBy?: string;
  className?: string;
  children: ReactNode;
}) {
  const reactId = useId();
  const fieldId = `${name}-${reactId}`;
  const hintId = `${fieldId}-hint`;

  return (
    <div className={className}>
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-foreground"
      >
        {label}
        {required && (
          <>
            <span aria-hidden="true" className="ml-0.5 text-destructive">
              *
            </span>
            <span className="sr-only"> (wajib)</span>
          </>
        )}
      </label>
      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      <select
        id={fieldId}
        name={name}
        required={required}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        aria-describedby={joinDescribedBy(
          hint ? hintId : undefined,
          describedBy
        )}
        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {children}
      </select>
    </div>
  );
}

export function FormTextarea({
  label,
  name,
  hint,
  placeholder,
  required,
  rows = 3,
  defaultValue,
  autoComplete,
  describedBy,
  className,
}: {
  label: string;
  name: string;
  hint?: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  defaultValue?: string;
  autoComplete?: string;
  describedBy?: string;
  className?: string;
}) {
  const reactId = useId();
  const fieldId = `${name}-${reactId}`;
  const hintId = `${fieldId}-hint`;

  return (
    <div className={className}>
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-foreground"
      >
        {label}
        {required && (
          <>
            <span aria-hidden="true" className="ml-0.5 text-destructive">
              *
            </span>
            <span className="sr-only"> (wajib)</span>
          </>
        )}
      </label>
      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      <textarea
        id={fieldId}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        aria-describedby={joinDescribedBy(
          hint ? hintId : undefined,
          describedBy
        )}
        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </div>
  );
}
