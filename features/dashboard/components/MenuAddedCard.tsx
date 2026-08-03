import { IconCamera } from "./icons";

import type { DashboardMeal } from "@/features/dashboard/types";

type MenuAddedCardProps = {
  meals: DashboardMeal[];
};

export function MenuAddedCard({ meals }: MenuAddedCardProps) {
  if (meals.length === 0) {
    return (
      <div className="mt-4 rounded-[1rem] border-2 border-dashed border-[#20342d] bg-white p-4 text-center">
        <p className="text-sm font-black text-[#20342d]">No meals yet</p>
        <p className="mt-1 text-xs font-bold text-[#65746d]">
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
          className="flex items-center justify-between gap-4 rounded-[1rem] border-2 border-[#20342d] bg-white p-3"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={`grid size-11 shrink-0 place-items-center rounded-full border-2 border-[#20342d] ${meal.color}`}
            >
              <IconCamera className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[#20342d]">
                {meal.name}
              </p>
              <p className="truncate text-sm font-medium text-[#65746d]">
                {meal.mealType} - {meal.description}
              </p>
            </div>
          </div>
          <p className="shrink-0 text-sm font-black text-[#20342d]">
            {meal.calories.toLocaleString()} kcal
          </p>
        </div>
      ))}
    </div>
  );
}
