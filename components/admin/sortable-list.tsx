"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowRight, Eye, EyeOff, GripVertical } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { readable } from "@/components/study/visuals";
import { reorder, setHidden, type NodeKind } from "@/lib/admin/content-actions";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

const t = strings.admin.content;

export type SortableItem = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  hidden: boolean;
  icon?: string;
  color?: string;
};

function Row({ kind, item, disabled }: { kind: NodeKind; item: SortableItem; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const [pending, startTransition] = useTransition();

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 border-b border-border bg-background last:border-b-0",
        isDragging && "relative z-10 bg-card shadow-2xl",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        disabled={disabled}
        aria-label={t.dragHandle}
        className="grid h-14 w-10 shrink-0 cursor-grab touch-none place-items-center text-muted-foreground hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>
      {item.icon && item.color && (
        <span style={{ color: readable(item.color) }}>
          <Icon name={item.icon} className="size-4 shrink-0" />
        </span>
      )}
      <Link href={item.href} className={cn("group flex min-w-0 flex-1 items-center gap-3 py-3", item.hidden && "opacity-50")}>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold" style={item.color ? { color: readable(item.color) } : undefined}>
            {item.title}
          </span>
          {item.subtitle && <span className="block truncate font-mono text-[11px] text-muted-foreground">{item.subtitle}</span>}
        </span>
        {item.hidden && (
          <span className="border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground uppercase">
            {t.hidden}
          </span>
        )}
        <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
      </Link>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => void (await setHidden(kind, item.id, !item.hidden)))}
        title={item.hidden ? t.show : t.hide}
        aria-label={`${item.hidden ? t.show : t.hide}: ${item.title}`}
        className="grid h-14 w-12 shrink-0 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-40"
      >
        {item.hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </li>
  );
}

export function SortableList({ kind, items: initial }: { kind: NodeKind; items: SortableItem[] }) {
  const [items, setItems] = useState(initial);
  const [pending, startTransition] = useTransition();
  // Take fresh server data (after create/hide/refresh) without an effect.
  const [lastInitial, setLastInitial] = useState(initial);
  if (initial !== lastInitial) {
    setLastInitial(initial);
    setItems(initial);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    const next = arrayMove(items, from, to);
    setItems(next);
    startTransition(async () => void (await reorder(kind, next.map((i) => i.id))));
  }

  if (items.length === 0) {
    return <p className="border border-dashed border-border p-5 text-sm text-muted-foreground">{t.empty}</p>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul className={cn("border border-border", pending && "opacity-80")}>
          {items.map((item) => (
            <Row key={item.id} kind={kind} item={item} disabled={pending} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
