import { initialLayout } from "../domain/model";
import { useStore } from "./store";

beforeEach(() => useStore.getState().reset());

describe("store", () => {
  it("adds a tab with a panel and a button, and activates it", () => {
    useStore.getState().addTab();
    const s = useStore.getState();
    expect(s.activeTabId).toBe("tab2");
    expect(s.tabs.tab2?.name).toBe("NEW TAB");
    expect(s.tabs.tab2?.panels).toHaveLength(1);
  });

  it("refuses to delete the last tab or panel", () => {
    expect(useStore.getState().deleteTab("tab1")).toMatch(/last tab/);
    expect(useStore.getState().deletePanel("panel1")).toMatch(/last panel/);
  });

  it("creates a stack with the two commands pyRevit needs", () => {
    useStore.getState().addStack("panel1");
    const s = useStore.getState();
    const stackId = s.panels.panel1?.elements.at(-1) ?? "";
    expect(s.elements[stackId]?.type).toBe("stack");
    expect(s.elements[stackId]?.children).toHaveLength(2);
  });

  it("rejects illegal moves with a reason", () => {
    useStore.getState().addStack("panel1");
    const stackId = useStore.getState().panels.panel1?.elements.at(-1) ?? "";
    expect(
      useStore.getState().moveElement("element1", { kind: "element", elementId: stackId }),
    ).toMatch(/already exists/);
    useStore.getState().renameElement("element1", "Mover");
    expect(
      useStore.getState().moveElement(stackId, { kind: "element", elementId: stackId }),
    ).toMatch(/cannot contain itself/);
    expect(
      useStore.getState().moveElement("element1", { kind: "element", elementId: stackId }),
    ).toBeNull();
    expect(useStore.getState().elements[stackId]?.children).toHaveLength(3);
    expect(useStore.getState().elements.element1?.parentId).toBe(stackId);
  });

  it("deletes a container with its children", () => {
    useStore.getState().addStack("panel1");
    const s = useStore.getState();
    const stackId = s.panels.panel1?.elements.at(-1) ?? "";
    const children = s.elements[stackId]?.children ?? [];
    useStore.getState().deleteElement(stackId);
    const after = useStore.getState();
    expect(after.elements[stackId]).toBeUndefined();
    for (const id of children) expect(after.elements[id]).toBeUndefined();
  });

  it("drops children when a container becomes a leaf", () => {
    useStore.getState().addStack("panel1");
    const stackId = useStore.getState().panels.panel1?.elements.at(-1) ?? "";
    useStore.getState().updateElement(stackId, { type: "pushbutton", name: "Now a button" });
    const s = useStore.getState();
    expect(s.elements[stackId]?.children).toBeUndefined();
    expect(Object.keys(s.elements)).toHaveLength(2);
  });

  it("reset returns to the initial layout", () => {
    useStore.getState().addTab();
    useStore.getState().reset();
    expect(useStore.getState().tabs).toEqual(initialLayout().tabs);
  });
});
