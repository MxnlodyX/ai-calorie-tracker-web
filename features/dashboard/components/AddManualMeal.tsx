"use client";

import { type FormEvent, useState } from "react";
import {
  IconBowl,
  IconDeviceFloppy,
  IconFlame,
  IconListDetails,
  IconX,
} from "./icons";

import { useAlert } from "@/components/ui/alert-provider";
import type { DashboardMeal, MealType } from "@/features/dashboard/types";

type AddManualMealProps = {
  isOpen: boolean;
  isSaving: boolean;
  isLoggingMeal: boolean;
  onAddMeal: (meal: DashboardMeal) => Promise<boolean>;
  onSaveExistingMeal: (meal: DashboardMeal) => Promise<boolean>;
  onClose: () => void;
};

const mealTypes: MealType[] = ["Breakfast", "Lunch", "Dinner", "Additional"];

const defaultFormValues = {
  name: "",
  description: "",
  mealType: "Lunch" as MealType,
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
};

type FormErrors = Partial<Record<keyof typeof defaultFormValues, string>>;

const nutritionFields = ["calories", "protein", "carbs", "fat"] as const;

const validateFormValues = (
  formValues: typeof defaultFormValues,
): FormErrors => {
  const errors: FormErrors = {};

  if (!formValues.name.trim()) {
    errors.name = "Meal name is required.";
  }

  for (const field of nutritionFields) {
    const value = formValues[field].trim();

    if (field === "calories" && !value) {
      errors.calories = "Calories are required.";
      continue;
    }

    if (!value) {
      continue;
    }

    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) {
      errors[field] = "Enter a valid number.";
      continue;
    }

    if (numberValue < 0) {
      errors[field] = "Use 0 or more.";
    }
  }

  return errors;
};

export function AddManualMeal({
  isOpen,
  isSaving,
  isLoggingMeal,
  onAddMeal,
  onSaveExistingMeal,
  onClose,
}: AddManualMealProps) {
  const [formValues, setFormValues] = useState(defaultFormValues);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saveToExistingList, setSaveToExistingList] = useState(true);
  const { showAlert } = useAlert();

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSaving || isLoggingMeal) {
      return;
    }

    const nextErrors = validateFormValues(formValues);

    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const meal: DashboardMeal = {
      id: `manual-meal-${Date.now()}`,
      name: formValues.name.trim(),
      mealType: formValues.mealType,
      description: formValues.description.trim() || "Manual entry",
      calories: Number(formValues.calories),
      protein: Number(formValues.protein || 0),
      carbs: Number(formValues.carbs || 0),
      fat: Number(formValues.fat || 0),
      color: "bg-[#ffdf5d]",
    };

    if (saveToExistingList) {
      const wasSavedToBackend = await onSaveExistingMeal({
        ...meal,
        id: `saved-${meal.id}`,
      });

      if (!wasSavedToBackend) {
        return;
      }
    }

    const wasLogged = await onAddMeal(meal);

    if (!wasLogged) {
      return;
    }

    showAlert({
      title: saveToExistingList ? "Meal saved and logged" : "Meal logged",
      message: saveToExistingList
        ? `${meal.name} was added to today and saved for reuse.`
        : `${meal.name} was added to today's log.`,
    });
    setFormValues(defaultFormValues);
    setFormErrors({});
    setSaveToExistingList(true);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end bg-[#20342d]/45 p-3 sm:items-center sm:justify-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-manual-meal-title"
    >
      <form
        onSubmit={handleSubmit}
        className="max-h-[calc(100vh-1.5rem)] w-full overflow-y-auto rounded-[1.5rem] border-2 border-[#20342d] bg-white p-4 text-[#20342d] shadow-[0_8px_0_#20342d] sm:max-w-lg sm:p-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#b6532d]">
              Manual entry
            </p>
            <h2
              id="add-manual-meal-title"
              className="mt-1 text-2xl font-black leading-tight"
            >
              Add meal details
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-[#20342d] bg-white text-[#20342d] shadow-[2px_2px_0_#20342d] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20342d]"
            aria-label="Close manual meal form"
          >
            <IconX className="size-5" aria-hidden="true" />
          </button>
        </div>

        <label className="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-[1rem] border-2 border-[#20342d] bg-[#f3fbf1] p-3 shadow-[2px_2px_0_#20342d]">
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-[#20342d] bg-white">
              <IconListDetails className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black">
                Save to existing list
              </span>
              <span className="mt-0.5 block text-xs font-bold text-[#66766f]">
                Reuse this meal next time.
              </span>
            </span>
          </span>
          <input
            type="checkbox"
            checked={saveToExistingList}
            disabled={isSaving || isLoggingMeal}
            onChange={(event) => setSaveToExistingList(event.target.checked)}
            className="size-5 shrink-0 accent-[#20342d]"
          />
        </label>


        <fieldset className="mt-5">
          <legend className="text-xs font-black uppercase tracking-[0.14em] text-[#66766f]">
            Meal type
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {mealTypes.map((mealType) => (
              <label
                key={mealType}
                className={[
                  "flex min-h-11 cursor-pointer items-center justify-center rounded-full border-2 border-[#20342d] px-3 text-xs font-black shadow-[2px_2px_0_#20342d] transition hover:-translate-y-0.5",
                  formValues.mealType === mealType
                    ? "bg-[#ffdf5d]"
                    : "bg-white text-[#66766f]",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="manual-meal-type"
                  value={mealType}
                  checked={formValues.mealType === mealType}
                  onChange={() =>
                    setFormValues((current) => ({
                      ...current,
                      mealType,
                    }))
                  }
                  className="sr-only"
                />
                {mealType}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-5 space-y-4">
          {Object.keys(formErrors).length > 0 ? (
            <div
              className="rounded-[0.9rem] border-2 border-[#b6532d] bg-[#fff0df] px-3 py-2 text-sm font-black text-[#b6532d]"
              role="alert"
            >
              Check the highlighted fields before saving.
            </div>
          ) : null}

          <label className="block">
            <span className="flex items-center gap-2 text-sm font-black">
              <IconBowl className="size-4" aria-hidden="true" />
              Meal name
            </span>
            <input
              id="manual-meal-name"
              type="text"
              value={formValues.name}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              aria-invalid={Boolean(formErrors.name)}
              aria-describedby={
                formErrors.name ? "manual-meal-name-error" : undefined
              }
              className="mt-2 h-12 w-full rounded-[0.9rem] border-2 border-[#20342d] bg-[#f3fbf1] px-3 text-sm font-bold outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20342d]"
              required
            />
            {formErrors.name ? (
              <span
                id="manual-meal-name-error"
                className="mt-1 block text-xs font-bold text-[#b6532d]"
              >
                {formErrors.name}
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className="text-sm font-black">Description</span>
            <input
              type="text"
              value={formValues.description}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className="mt-2 h-12 w-full rounded-[0.9rem] border-2 border-[#20342d] bg-white px-3 text-sm font-bold outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20342d]"
            />
          </label>

          <label className="block">
            <span className="flex items-center gap-2 text-sm font-black">
              <IconFlame className="size-4" aria-hidden="true" />
              Calories
            </span>
            <input
              id="manual-meal-calories"
              type="number"
              min="0"
              value={formValues.calories}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  calories: event.target.value,
                }))
              }
              aria-invalid={Boolean(formErrors.calories)}
              aria-describedby={
                formErrors.calories ? "manual-meal-calories-error" : undefined
              }
              className="mt-2 h-12 w-full rounded-[0.9rem] border-2 border-[#20342d] bg-[#fff7df] px-3 text-sm font-bold outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20342d]"
              required
            />
            {formErrors.calories ? (
              <span
                id="manual-meal-calories-error"
                className="mt-1 block text-xs font-bold text-[#b6532d]"
              >
                {formErrors.calories}
              </span>
            ) : null}
          </label>

          <div className="grid grid-cols-3 gap-2">
            {(["protein", "carbs", "fat"] as const).map((macro) => (
              <label key={macro} className="block">
                <span className="text-xs font-black capitalize text-[#66766f]">
                  {macro} (g)
                </span>
                <input
                  id={`manual-meal-${macro}`}
                  type="number"
                  min="0"
                  value={formValues[macro]}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      [macro]: event.target.value,
                    }))
                  }
                  aria-invalid={Boolean(formErrors[macro])}
                  aria-describedby={
                    formErrors[macro]
                      ? `manual-meal-${macro}-error`
                      : undefined
                  }
                  className="mt-1 h-11 w-full rounded-[0.8rem] border-2 border-[#20342d] bg-white px-2 text-sm font-bold outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20342d]"
                />
                {formErrors[macro] ? (
                  <span
                    id={`manual-meal-${macro}-error`}
                    className="mt-1 block text-[10px] font-bold text-[#b6532d]"
                  >
                    {formErrors[macro]}
                  </span>
                ) : null}
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving || isLoggingMeal}
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-[#20342d] bg-[#ffdf5d] px-4 py-2 text-sm font-black shadow-[0_4px_0_#20342d] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20342d] disabled:cursor-not-allowed disabled:bg-white disabled:text-[#66766f]"
        >
          <IconDeviceFloppy className="size-5" aria-hidden="true" />
          {isSaving || isLoggingMeal
            ? "Saving..."
            : saveToExistingList
              ? "Save and add meal"
              : "Add meal"}
        </button>
      </form>
    </div>
  );
}
