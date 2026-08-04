import { IconCamera } from "./icons";

import type { DashboardMeal } from "@/features/dashboard/types";

type MenuAddedCardProps = {
  meals: DashboardMeal[];
};

export function MenuAddedCard({ meals }: MenuAddedCardProps) {
  if (meals.length === 0) {
    return (
      <div className="mt-4 rounded-[18px] border border-dashed border-[#b8d4aa] bg-white/70 p-4 text-center">
        <p className="text-sm font-bold text-[#172019]">No meals yet</p>
        <p className="mt-1 text-xs text-[#687566]">
          Add an existing meal from your list.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {meals.map((meal) => (
        <div
          key={meal.id}
          className="app-card flex items-center justify-between gap-4 rounded-[18px] p-3"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={`grid size-11 shrink-0 place-items-center rounded-xl text-[#235b30] ${meal.color}`}
            >
              <IconCamera className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#172019]">
                {meal.name}
              </p>
              <p className="truncate text-sm text-[#687566]">
                {meal.mealType} - {meal.description}
              </p>
            </div>
          </div>
          <p className="shrink-0 text-sm font-bold text-[#235b30]">
            {meal.calories.toLocaleString()} kcal
          </p>
        </div>
      ))}
    </div>
  );
}
