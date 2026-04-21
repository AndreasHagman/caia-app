"use client";

import type { ChecklistItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { nanoid } from "nanoid";

interface Props {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  readOnly?: boolean;
}

export function ChecklistEditor({ items, onChange, readOnly = false }: Props) {
  const [newLabel, setNewLabel] = useState("");

  function toggle(id: string) {
    onChange(items.map((i) => (i.id === id ? { ...i, completed: !i.completed } : i)));
  }

  function remove(id: string) {
    onChange(items.filter((i) => i.id !== id));
  }

  function add() {
    const label = newLabel.trim();
    if (!label) return;
    onChange([...items, { id: nanoid(), label, completed: false }]);
    setNewLabel("");
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2 group">
          <Checkbox
            id={item.id}
            checked={item.completed}
            onCheckedChange={() => !readOnly && toggle(item.id)}
            disabled={readOnly}
          />
          <label
            htmlFor={item.id}
            className={`flex-1 text-sm cursor-pointer ${item.completed ? "line-through text-muted-foreground" : ""}`}
          >
            {item.label}
          </label>
          {!readOnly && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
              onClick={() => remove(item.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}
      {!readOnly && (
        <div className="flex gap-2 mt-3">
          <Input
            placeholder="Add checklist item…"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
            className="text-sm"
          />
          <Button type="button" variant="outline" size="icon" onClick={add}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
