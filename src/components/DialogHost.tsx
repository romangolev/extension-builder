import { useEffect, useRef } from "react";
import { useDialogs } from "../state/dialogs";

/**
 * Renders the oldest pending alert or confirm. Replaces window.alert and
 * window.confirm, which block the page, cannot be styled and are suppressed
 * outright by some embedded browsers.
 */
export function DialogHost() {
  const dialog = useDialogs((s) => s.queue[0]);
  const primaryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    primaryRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        dialog.resolve(false);
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      previous?.focus?.();
    };
  }, [dialog]);

  if (!dialog) return null;
  const isConfirm = dialog.kind === "confirm";
  const title = dialog.title ?? (isConfirm ? "Are you sure?" : "Notice");

  return (
    <div className="dialog-backdrop">
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`dialog-title-${dialog.id}`}
        aria-describedby={`dialog-message-${dialog.id}`}
        data-testid="app-dialog"
      >
        <h2 className="dialog-title" id={`dialog-title-${dialog.id}`}>
          {title}
        </h2>
        <p className="dialog-message" id={`dialog-message-${dialog.id}`}>
          {dialog.message}
        </p>
        {dialog.details && dialog.details.length > 0 && (
          <ol className="dialog-details">
            {dialog.details.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        )}
        <div className="dialog-actions">
          {isConfirm && (
            <button type="button" className="dialog-button" onClick={() => dialog.resolve(false)}>
              {dialog.cancelLabel ?? "Cancel"}
            </button>
          )}
          <button
            type="button"
            ref={primaryRef}
            className={
              dialog.danger
                ? "dialog-button dialog-button-danger"
                : "dialog-button dialog-button-primary"
            }
            onClick={() => dialog.resolve(true)}
          >
            {dialog.confirmLabel ?? "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}
