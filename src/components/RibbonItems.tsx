import { TYPES } from "../domain/bundleTypes";
import type { Element } from "../domain/model";
import { FALLBACK_ICON } from "../state/defaultIcons";
import { dragSourceProps, dropTargetProps, useIsDragging, useIsDragOver } from "../state/drag";
import { useStore } from "../state/store";
import { useIcons } from "./IconsContext";
import { EditableLabel } from "./inputs";

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

function Icon({ element }: { element: Element }) {
  const defaults = useIcons();
  return (
    <div className="button-icon">
      <img src={element.iconData || defaults.light || FALLBACK_ICON} alt="Icon" />
    </div>
  );
}

export function DeleteButton({
  className,
  title,
  onDelete,
}: {
  className: string;
  title: string;
  onDelete: () => void;
}) {
  return (
    <button
      type="button"
      className={className}
      title={title}
      aria-label={title}
      onClick={(e) => {
        e.stopPropagation();
        onDelete();
      }}
    />
  );
}

function ElementDelete({ elementId, element }: { elementId: string; element: Element }) {
  const def = TYPES[element.type];
  const title = `Remove this ${def.label.toLowerCase()}${element.name ? ` "${element.name}"` : ""}`;
  return (
    <DeleteButton
      className="element-delete-button"
      title={title}
      onDelete={() => {
        const count = element.children?.length ?? 0;
        if (
          def.container &&
          count &&
          !window.confirm(
            `This ${def.label.toLowerCase()} contains ${count} command(s). Delete them too?`,
          )
        ) {
          return;
        }
        useStore.getState().deleteElement(elementId);
      }}
    />
  );
}

function openEditor(elementId: string) {
  useStore.getState().openModal({ mode: "edit", elementId });
}

export function RibbonElement({ elementId }: { elementId: string }) {
  const element = useStore((s) => s.elements[elementId]);
  if (!element) return null;
  if (element.type === "stack") return <StackItem elementId={elementId} element={element} />;
  if (TYPES[element.type].container) return <GroupItem elementId={elementId} element={element} />;
  return <CommandItem elementId={elementId} element={element} />;
}

function CommandItem({ elementId, element }: { elementId: string; element: Element }) {
  const def = TYPES[element.type];
  const dragging = useIsDragging(elementId);
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: ribbon items are drag handles
    <div
      className={cx("button", def.postfix.slice(1), dragging && "dragging no-select")}
      data-type={element.type}
      data-button-id={elementId}
      title={`${def.label} - ${def.postfix}`}
      onDoubleClick={(e) => {
        e.stopPropagation();
        openEditor(elementId);
      }}
      {...dragSourceProps(elementId)}
    >
      <Icon element={element} />
      <EditableLabel
        className="button-name"
        value={element.name}
        onCommit={(next) => useStore.getState().renameElement(elementId, next)}
      />
      <ElementDelete elementId={elementId} element={element} />
    </div>
  );
}

function GroupItem({ elementId, element }: { elementId: string; element: Element }) {
  const def = TYPES[element.type];
  const dragging = useIsDragging(elementId);
  const target = { kind: "element", elementId } as const;
  const over = useIsDragOver(target);
  const count = element.children?.length ?? 0;

  const open = (anchor: HTMLElement) => {
    const rect = anchor.getBoundingClientRect();
    useStore.getState().openGroupEditor({
      elementId,
      top: rect.bottom + window.scrollY + 5,
      left: Math.max(8, rect.left + window.scrollX),
    });
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: ribbon items are drag handles
    <div
      className={cx(
        "group",
        def.postfix.slice(1),
        dragging && "dragging no-select",
        over && "drag-over",
      )}
      data-type={element.type}
      data-button-id={elementId}
      title={`${def.label} - ${def.postfix} "${element.name}" with ${count} command(s). Click the icon to open them.`}
      onClick={(e) => open(e.currentTarget)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        openEditor(elementId);
      }}
      {...dragSourceProps(elementId)}
      {...dropTargetProps(target)}
    >
      <div className="group-header">
        <Icon element={element} />
        <EditableLabel
          className="button-name"
          value={element.name}
          onCommit={(next) => useStore.getState().renameElement(elementId, next)}
        />
        <div className="group-caret" aria-hidden="true" />
      </div>
      <ElementDelete elementId={elementId} element={element} />
    </div>
  );
}

function StackItem({ elementId, element }: { elementId: string; element: Element }) {
  const def = TYPES.stack;
  const children = element.children ?? [];
  const dragging = useIsDragging(elementId);
  const target = { kind: "element", elementId } as const;
  const over = useIsDragOver(target);
  const remaining = (def.maxChildren ?? 3) - children.length;
  const add = () => useStore.getState().openModal({ mode: "create", kind: "command", target });

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: ribbon items are drag handles
    <div
      className={cx(
        "stack",
        dragging && "dragging no-select",
        over && "drag-over",
        children.length < (def.minChildren ?? 2) && "stack-invalid",
      )}
      data-type="stack"
      data-button-id={elementId}
      title={`Stack - ${def.postfix} "${element.name}" with ${children.length} command(s). Double-click to edit.`}
      onDoubleClick={(e) => {
        e.stopPropagation();
        openEditor(elementId);
      }}
      {...dragSourceProps(elementId)}
      {...dropTargetProps(target)}
    >
      <div className="stack-items">
        {children.map((childId) => (
          <RibbonElement key={childId} elementId={childId} />
        ))}
      </div>
      {remaining > 0 && (
        // biome-ignore lint/a11y/useSemanticElements: styled as a stack row, not a button
        <div
          className="stack-add-button"
          role="button"
          tabIndex={0}
          title={`${remaining} slot${remaining === 1 ? "" : "s"} free - click to add a command`}
          aria-label={`Add a command to stack ${element.name}`}
          onClick={(e) => {
            e.stopPropagation();
            add();
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            e.stopPropagation();
            add();
          }}
        />
      )}
      <ElementDelete elementId={elementId} element={element} />
    </div>
  );
}

/** The floating list of a pulldown / split button's commands. */
export function GroupEditor() {
  const openGroup = useStore((s) => s.openGroup);
  const group = useStore((s) => (s.openGroup ? s.elements[s.openGroup.elementId] : undefined));
  if (!openGroup || !group) return null;
  const target = { kind: "element", elementId: openGroup.elementId } as const;

  return (
    <div
      className="pulldown-content-container"
      style={{
        display: "block",
        position: "absolute",
        top: openGroup.top,
        left: openGroup.left,
        zIndex: 1000,
      }}
    >
      <div className="pulldown-content">
        <div className="pulldown-label">{group.name.toUpperCase()}</div>
        {(group.children ?? []).map((childId) => (
          <RibbonElement key={childId} elementId={childId} />
        ))}
        <button
          type="button"
          className="add-button group-editor-add"
          onClick={(e) => {
            e.stopPropagation();
            useStore.getState().openModal({ mode: "create", kind: "command", target });
          }}
        >
          <span className="plus">+</span> ADD COMMAND
        </button>
        <button
          type="button"
          className="add-button"
          style={{ marginTop: 10 }}
          onClick={(e) => {
            e.stopPropagation();
            useStore.getState().closeGroupEditor();
          }}
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}
