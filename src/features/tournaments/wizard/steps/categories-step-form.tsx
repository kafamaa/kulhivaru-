"use client";

import { useState, useCallback } from "react";
import type { WizardCategory, WizardDraft } from "../types";
import { getDefaultCategory } from "../lib/wizard-defaults";
import { CategoryCard } from "../components/category-card";
import { CategoryEditorDialog } from "../components/category-editor-dialog";
import type { CategorySchemaInput } from "../schemas/category-schema";
import { StepSectionCard } from "../components/step-section-card";

interface CategoriesStepFormProps {
  draft: WizardDraft;
  onChange: (categories: WizardCategory[]) => void;
}

export function CategoriesStepForm({ draft, onChange }: CategoriesStepFormProps) {
  const [editingCategory, setEditingCategory] = useState<WizardCategory | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const addCategory = useCallback(() => {
    const next = getDefaultCategory(draft.categories.length, draft.basics.sport);
    setEditingCategory(next);
    setDialogOpen(true);
  }, [draft.categories.length, draft.basics.sport]);

  const saveCategory = useCallback(
    (data: CategorySchemaInput) => {
      const existing = draft.categories.find((c) => c.id === data.id);
      let next: WizardCategory[];
      if (existing) {
        next = draft.categories.map((c) =>
          c.id === data.id ? { ...c, ...data } : c
        );
      } else {
        next = [...draft.categories, { ...data, id: data.id }];
      }
      onChange(next);
      setDialogOpen(false);
      setEditingCategory(null);
    },
    [draft.categories, onChange]
  );

  const duplicate = useCallback(
    (cat: WizardCategory) => {
      const copy: WizardCategory = {
        ...cat,
        id: crypto.randomUUID(),
        name: `${cat.name} (copy)`,
        sortOrder: draft.categories.length,
      };
      onChange([...draft.categories, copy]);
    },
    [draft.categories, onChange]
  );

  const remove = useCallback(
    (id: string) => {
      onChange(draft.categories.filter((c) => c.id !== id));
    },
    [draft.categories, onChange]
  );

  const move = useCallback(
    (id: string, dir: "up" | "down") => {
      const idx = draft.categories.findIndex((c) => c.id === id);
      if (idx === -1) return;
      const next = [...draft.categories];
      const swap = dir === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= next.length) return;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      next.forEach((c, i) => (c.sortOrder = i));
      onChange(next);
    },
    [draft.categories, onChange]
  );

  return (
    <div className="space-y-6">
      <StepSectionCard
        title="Categories"
        description="Add at least one category (e.g. Open Men, U18 Women). Each has its own format and limits."
      >
        {draft.categories.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 p-8 text-center">
            <p className="text-slate-400">No categories yet.</p>
            <button
              type="button"
              onClick={addCategory}
              className="mt-3 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
            >
              Add category
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {draft.categories.map((cat, i) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                onEdit={() => {
                  setEditingCategory(cat);
                  setDialogOpen(true);
                }}
                onDuplicate={() => duplicate(cat)}
                onRemove={() => remove(cat.id)}
                onMoveUp={move.bind(null, cat.id, "up")}
                onMoveDown={move.bind(null, cat.id, "down")}
                canMoveUp={i > 0}
                canMoveDown={i < draft.categories.length - 1}
              />
            ))}
            <button
              type="button"
              onClick={addCategory}
              className="rounded-lg border border-dashed border-slate-600 py-2 text-sm font-medium text-slate-400 hover:border-slate-500 hover:bg-slate-800/50 hover:text-slate-300"
            >
              + Add another category
            </button>
          </div>
        )}
      </StepSectionCard>
      <CategoryEditorDialog
        category={editingCategory}
        sport={draft.basics.sport}
        open={dialogOpen}
        onSave={saveCategory}
        onCancel={() => {
          setDialogOpen(false);
          setEditingCategory(null);
        }}
      />
    </div>
  );
}
