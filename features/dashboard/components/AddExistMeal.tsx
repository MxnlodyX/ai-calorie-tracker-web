"use client";

import {
  IconBowl,
  IconDeviceFloppy,
  IconEdit,
  IconFlame,
  IconPlus,
  IconSearch,
  IconTrash,
  IconX,
} from "./icons";
import { useState } from "react";

import { useAlert } from "@/components/ui/alert-provider";
import type { DashboardMeal, MealType } from "@/features/dashboard/types";

type AddExistMealProps = {
  isOpen: boolean;
  existingMeals: DashboardMeal[];
  errorMessage?: string | null;
  isLoading: boolean;
  isSavingMeal: boolean;
  onAddMeal: (meal: DashboardMeal) => Promise<boolean>;
  onDeleteMeal: (meal: DashboardMeal) => Promise<void>;
  onUpdateMeal: (meal: DashboardMeal) => Promise<boolean>;
  onClose: () => void;
};

const mealTypes: MealType[] = ["Breakfast", "Lunch", "Dinner", "Additional"];

const createMealFormValues = (meal: DashboardMeal) => ({
  name: meal.name,
  description: meal.description,
  mealType: meal.mealType,
  calories: String(meal.calories),
  protein: String(meal.protein),
  carbs: String(meal.carbs),
  fat: String(meal.fat),
});

export function AddExistMeal({
  isOpen,
  existingMeals,
  errorMessage,
  isLoading,
  isSavingMeal,
  onAddMeal,
  onDeleteMeal,
  onUpdateMeal,
  onClose,
}: AddExistMealProps) {
  const [query, setQuery] = useState("");
  const [selectedMealType, setSelectedMealType] = useState<MealType>("Lunch");
  const [deletingMealId, setDeletingMealId] = useState<string | null>(null);
  const [editingMeal, setEditingMeal] = useState<DashboardMeal | null>(null);
  const [editValues, setEditValues] = useState<ReturnType<
    typeof createMealFormValues
  > | null>(null);
  const [isUpdatingMeal, setIsUpdatingMeal] = useState(false);
  const { showAlert } = useAlert();
  const filteredMeals = existingMeals.filter((meal) => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return true;
    }

    return `${meal.name} ${meal.description}`
      .toLowerCase()
      .includes(normalizedQuery);
  });

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end bg-[#172019]/35 p-3 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-existing-meal-title"
    >
      <section className="app-panel max-h-[calc(100vh-1.5rem)] w-full overflow-hidden rounded-[28px] text-[#172019] sm:max-w-2xl">
        <div className="border-b border-[#dce9d4] bg-gradient-to-br from-[#eef8e7] to-white/70 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#b6532d]">
                Saved meals
              </p>
              <h2
                id="add-existing-meal-title"
                className="mt-1 text-2xl font-black leading-tight"
              >
                Add from existing list
              </h2>
              <p className="mt-1 text-sm font-bold text-[#52635c]">
                Pick the meal time first, then add a saved meal.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#235b30] shadow-[0_8px_18px_rgba(56,103,43,0.1)] ring-1 ring-[#e1edd8] transition hover:-translate-y-0.5"
              aria-label="Close existing meal list"
            >
              <IconX className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto p-4 sm:p-5">
          <fieldset>
            <legend className="text-xs font-black uppercase tracking-[0.14em] text-[#66766f]">
              Track as
            </legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {mealTypes.map((mealType) => (
                <label
                  key={mealType}
                  className={[
                    "flex min-h-11 cursor-pointer items-center justify-center rounded-xl px-3 text-xs font-bold ring-1 ring-[#dce9d4] transition hover:-translate-y-0.5",
                    selectedMealType === mealType
                      ? "bg-[#e8f7df] text-[#235b30] ring-[#65b741]"
                      : "bg-white text-[#687566]",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="meal-type"
                    value={mealType}
                    checked={selectedMealType === mealType}
                    onChange={() => setSelectedMealType(mealType)}
                    className="sr-only"
                  />
                  {mealType}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="mt-5 block">
            <span className="sr-only">Search saved meals</span>
            <span className="app-field flex min-h-12 items-center gap-2 rounded-xl px-4">
              <IconSearch className="size-5 shrink-0" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search meals"
                className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-[#66766f]"
              />
            </span>
          </label>

          {errorMessage ? (
            <div
              className="mt-4 rounded-2xl bg-[#fff5ee] p-3 text-sm font-bold text-[#a94f35] ring-1 ring-[#f2d8ca]"
              role="status"
            >
              {errorMessage}
            </div>
          ) : null}

          {editingMeal && editValues ? (
            <form
              onSubmit={async (event) => {
                event.preventDefault();

                if (isUpdatingMeal) {
                  return;
                }

                setIsUpdatingMeal(true);

                try {
                  const wasUpdated = await onUpdateMeal({
                    ...editingMeal,
                    name: editValues.name.trim(),
                    description: editValues.description.trim(),
                    mealType: editValues.mealType,
                    calories: Number(editValues.calories),
                    protein: Number(editValues.protein || 0),
                    carbs: Number(editValues.carbs || 0),
                    fat: Number(editValues.fat || 0),
                  });

                  if (wasUpdated) {
                    setEditingMeal(null);
                    setEditValues(null);
                  }
                } finally {
                  setIsUpdatingMeal(false);
                }
              }}
              className="mt-5 rounded-[20px] bg-[#f1f8ec] p-4 ring-1 ring-[#dce9d4]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#b6532d]">
                    Edit saved menu
                  </p>
                  <h3 className="mt-1 text-lg font-black">
                    {editingMeal.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingMeal(null);
                    setEditValues(null);
                  }}
                  className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-[#235b30] shadow-sm ring-1 ring-[#e1edd8] transition hover:-translate-y-0.5"
                  aria-label="Close menu editor"
                >
                  <IconX className="size-4" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                <label className="block">
                  <span className="text-sm font-black">Menu name</span>
                  <input
                    type="text"
                    value={editValues.name}
                    onChange={(event) =>
                      setEditValues((current) =>
                        current ? { ...current, name: event.target.value } : current,
                      )
                    }
                    className="app-field mt-1 h-11 w-full rounded-xl px-3 text-sm font-bold outline-none"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-black">Description</span>
                  <input
                    type="text"
                    value={editValues.description}
                    onChange={(event) =>
                      setEditValues((current) =>
                        current
                          ? { ...current, description: event.target.value }
                          : current,
                      )
                    }
                    className="app-field mt-1 h-11 w-full rounded-xl px-3 text-sm font-bold outline-none"
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-black">Meal type</span>
                    <select
                      value={editValues.mealType}
                      onChange={(event) =>
                        setEditValues((current) =>
                          current
                            ? {
                                ...current,
                                mealType: event.target.value as MealType,
                              }
                            : current,
                        )
                      }
                      className="app-field mt-1 h-11 w-full rounded-xl px-3 text-sm font-bold outline-none"
                    >
                      {mealTypes.map((mealType) => (
                        <option key={mealType} value={mealType}>
                          {mealType}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-black">Calories</span>
                    <input
                      type="number"
                      min="0"
                      value={editValues.calories}
                      onChange={(event) =>
                        setEditValues((current) =>
                          current
                            ? { ...current, calories: event.target.value }
                            : current,
                        )
                      }
                      className="app-field mt-1 h-11 w-full rounded-xl px-3 text-sm font-bold outline-none"
                      required
                    />
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(["protein", "carbs", "fat"] as const).map((macro) => (
                    <label key={macro} className="block">
                      <span className="text-xs font-black capitalize text-[#66766f]">
                        {macro} (g)
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={editValues[macro]}
                        onChange={(event) =>
                          setEditValues((current) =>
                            current
                              ? { ...current, [macro]: event.target.value }
                              : current,
                          )
                        }
                        className="app-field mt-1 h-10 w-full rounded-xl px-2 text-sm font-bold outline-none"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdatingMeal}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#65b741] to-[#22945f] px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(34,148,95,0.22)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <IconDeviceFloppy className="size-4" aria-hidden="true" />
                {isUpdatingMeal ? "Saving..." : "Save changes"}
              </button>
            </form>
          ) : null}

          {isLoading ? (
            <div
              className="mt-5 rounded-2xl bg-[#eef8e7] p-4 text-center ring-1 ring-[#dce9d4]"
              role="status"
            >
              <p className="text-sm font-black">Loading saved meals...</p>
              <p className="mt-1 text-xs font-bold text-[#66766f]">
                Syncing your menu list from the backend.
              </p>
            </div>
          ) : filteredMeals.length > 0 ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {filteredMeals.map((meal) => (
                <article
                  key={meal.id}
                  className="app-card flex flex-col rounded-[20px] p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className={`grid size-12 shrink-0 place-items-center rounded-2xl text-[#235b30] ${meal.color}`}
                      >
                        <IconBowl className="size-6" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-black">
                          {meal.name}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-[#66766f]">
                          {meal.description}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#f1f8ec] px-2 py-1 text-xs font-bold text-[#235b30] ring-1 ring-[#dce9d4]">
                      <IconFlame className="size-4" aria-hidden="true" />
                      {meal.calories}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <MacroValue label="Protein" value={meal.protein} />
                    <MacroValue label="Carbs" value={meal.carbs} />
                    <MacroValue label="Fat" value={meal.fat} />
                  </div>

                  <div className="mt-4 grid grid-cols-[minmax(0,1fr)_2.5rem_2.5rem] gap-2">
                    <button
                      type="button"
                      disabled={isSavingMeal}
                      onClick={async () => {
                        const wasAdded = await onAddMeal({
                          ...meal,
                          mealType: selectedMealType,
                        });

                        if (wasAdded) {
                          showAlert({
                            title: "Meal added",
                            message: `${meal.name} was added to ${selectedMealType.toLowerCase()}.`,
                          });
                        }
                      }}
                      className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-[#65b741] to-[#22945f] px-3 text-xs font-bold text-white shadow-[0_10px_20px_rgba(34,148,95,0.2)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <IconPlus className="size-4" aria-hidden="true" />
                      {isSavingMeal ? "Adding..." : `Add to ${selectedMealType}`}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMeal(meal);
                        setEditValues(createMealFormValues(meal));
                      }}
                      className="grid size-10 place-items-center rounded-xl bg-white text-[#235b30] ring-1 ring-[#dce9d4] transition hover:-translate-y-0.5"
                      aria-label={`Edit ${meal.name}`}
                    >
                      <IconEdit className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      disabled={deletingMealId === meal.id}
                      onClick={async () => {
                        setDeletingMealId(meal.id);

                        try {
                          await onDeleteMeal(meal);
                        } finally {
                          setDeletingMealId(null);
                        }
                      }}
                      className="grid size-10 place-items-center rounded-xl bg-white text-[#a94f35] ring-1 ring-[#f2d8ca] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label={`Remove ${meal.name} from saved meals`}
                    >
                      <IconTrash className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-[#b8d4aa] bg-white/60 p-4 text-center">
              <p className="text-sm font-black">
                {existingMeals.length === 0
                  ? "No saved meals yet"
                  : "No matching meals"}
              </p>
              <p className="mt-1 text-xs font-bold text-[#66766f]">
                {existingMeals.length === 0
                  ? "Use Manual add to create a reusable meal."
                  : "Try another meal name or ingredient."}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function MacroValue({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-[#f1f8ec] px-2 py-2 text-center ring-1 ring-[#e1edd8]">
      <p className="truncate text-[10px] font-black uppercase text-[#66766f]">
        {label}
      </p>
      <p className="text-xs font-black">{value}g</p>
    </div>
  );
}
