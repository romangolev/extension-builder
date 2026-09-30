import { useState } from "react";
import { parseLayout, snapshot } from "../domain/layoutFile";
import { sanitizeFileName } from "../domain/templates";
import { validate } from "../domain/tree";
import { buildZip, downloadBlob } from "../domain/zip";
import { loadDefaultIcons } from "../state/defaultIcons";
import { showAlert, showConfirm } from "../state/dialogs";
import { clearDraft } from "../state/persistence";
import { layoutOf, useStore } from "../state/store";

const base = import.meta.env.BASE_URL;

function reportProblems(problems: string[]) {
  const shown = problems.slice(0, 12);
  const hidden = problems.length - shown.length;
  void showAlert(`Fix these and try again.${hidden ? ` ...and ${hidden} more.` : ""}`, {
    title: "This extension will not work as built",
    details: shown,
  });
}

function saveLayout() {
  const layout = layoutOf(useStore.getState());
  const blob = new Blob([JSON.stringify(snapshot(layout), null, 2)], { type: "application/json" });
  downloadBlob(blob, `${sanitizeFileName(layout.extensionName)}_layout.json`);
}

function loadLayout() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      useStore.getState().loadLayout(parseLayout(await file.text()));
      void showAlert("Your layout replaced the current ribbon.", { title: "Layout loaded" });
    } catch (error) {
      void showAlert((error as Error).message, { title: "Could not load that layout" });
    }
  });
  input.click();
}

async function resetLayout() {
  const { elements, panels } = useStore.getState();
  const ok = await showConfirm(
    `${Object.keys(panels).length} panel(s) and ${Object.keys(elements).length} command(s) will be removed, and the saved draft deleted.\n\nThis cannot be undone. Save a layout first if you want to keep it.`,
    { title: "Discard the whole toolbar?", confirmLabel: "Reset", danger: true },
  );
  if (!ok) return;
  clearDraft();
  useStore.getState().reset();
}

export function Header() {
  const [zipping, setZipping] = useState(false);

  const download = async () => {
    const layout = layoutOf(useStore.getState());
    const problems = validate(layout);
    if (problems.length) {
      reportProblems(problems);
      return;
    }
    setZipping(true);
    try {
      const { blob, name } = await buildZip(layout, await loadDefaultIcons());
      downloadBlob(blob, name);
    } catch (error) {
      console.error("Error creating ZIP:", error);
      void showAlert((error as Error).message, { title: "Failed to create the ZIP file" });
    } finally {
      setZipping(false);
    }
  };

  return (
    <header>
      <div className="logo">
        <img src={`${base}logo.svg`} alt="pyRevit Logo" width="198" height="218" />
        <div className="logo-text">
          <h1 className="glowing-text-title">pyRevit</h1>
          <span className="glowing-text-title">extension builder</span>
        </div>
      </div>
      <div className="download-button">
        <button type="button" id="loadConfig" className="toolbar-action" onClick={loadLayout}>
          <span className="toolbar-action-label">Load layout</span>
        </button>
        <button type="button" id="saveConfig" className="toolbar-action" onClick={saveLayout}>
          <span className="toolbar-action-label">Save layout</span>
        </button>
        <button
          type="button"
          id="resetToolbar"
          className="toolbar-action toolbar-action-danger"
          onClick={() => void resetLayout()}
        >
          <span className="toolbar-action-label">Reset</span>
        </button>
        <button
          type="button"
          id="downloadZip"
          className="toolbar-action toolbar-action-primary"
          disabled={zipping}
          onClick={() => void download()}
        >
          <span className="toolbar-action-label">
            {zipping ? "Creating ZIP file..." : "Download"}
          </span>
        </button>
      </div>
    </header>
  );
}
