import {
  IconBowl,
  IconCircleCheck,
  IconPlus,
} from "./icons";

import { MenuAddedCard } from "./MenuAddedCard";
import type { DashboardMeal } from "@/features/dashboard/types";

type TodayLogProps = {
  meals: DashboardMeal[];
  dailyGoalCalories: number | null;
  errorMessage?: string | null;
  isLoading: boolean;
  isGoalLoading: boolean;
  onAddMeal: () => void;
};

function sumMeals(
  meals: DashboardMeal[],
  key: "calories" | "protein" | "carbs" | "fat",
) {
  return meals.reduce((total, meal) => total + meal[key], 0);
}

function formatMealCount(count: number) {
  return `${count} ${count === 1 ? "meal" : "meals"} saved today`;
}

export function TodayLog({
  meals,
  dailyGoalCalories,
  errorMessage,
  isLoading,
  isGoalLoading,
  onAddMeal,
}: TodayLogProps) {
  const hasDailyGoal = dailyGoalCalories !== null && dailyGoalCalories > 0;
  const totalCalories = sumMeals(meals, "calories");
  const remainingCalories = hasDailyGoal
    ? Math.max(dailyGoalCalories - totalCalories, 0)
    : null;
  const goalProgress = hasDailyGoal
    ? Math.min(100, Math.round((totalCalories / dailyGoalCalories) * 100))
    : 0;
  const macroTotals = [
    {
      label: "Protein",
      value: `${sumMeals(meals, "protein")}g`,
      color: "bg-[#52c79f]",
    },
    {
      label: "Carbs",
      value: `${sumMeals(meals, "carbs")}g`,
      color: "bg-[#f6d65b]",
    },
    {
      label: "Fat",
      value: `${sumMeals(meals, "fat")}g`,
      color: "bg-[#ff9b72]",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-[1.25rem] border-2 border-[#20342d] bg-[#fff2bd] p-5">
        <div
          className="absolute -right-8 -top-8 size-28 rounded-full border-2 border-[#20342d] bg-[#bfefff]"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-10 right-16 size-20 rounded-full border-2 border-[#20342d] bg-[#ffd7c7]"
          aria-hidden="true"
        />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#d56a3d]">
              Today&apos;s log
            </p>
            <h2 className="mt-3 text-5xl font-black leading-none text-[#20342d]">
              {totalCalories.toLocaleString()}
              <span className="ml-2 text-base font-bold text-[#65746d]">
                kcal
              </span>
            </h2>
            <p className="mt-2 max-w-xs text-sm font-medium leading-6 text-[#65746d]">
              {isLoading
                ? "Syncing today's meals from your account."
                : isGoalLoading
                  ? "Syncing your nutrition goal from your account."
                  : remainingCalories === null
                    ? "Set your nutrition profile to see your daily goal."
                    : `${remainingCalories.toLocaleString()} kcal remaining from your daily goal.`}
            </p>
          </div>

          <span className="flex shrink-0 items-center gap-1.5 rounded-full border-2 border-[#20342d] bg-white px-3 py-1.5 text-xs font-black text-[#20342d] shadow-[2px_2px_0_#20342d]">
            <IconCircleCheck className="size-4" aria-hidden="true" />
            Good
          </span>
        </div>

        <div className="relative mt-6">
          <div className="flex items-center justify-between text-xs font-black text-[#20342d]">
            <span>Goal progress</span>
            <span>
              {isGoalLoading
                ? "Loading goal..."
                : hasDailyGoal
                  ? `${dailyGoalCalories.toLocaleString()} kcal goal`
                  : "No goal set"}
            </span>
          </div>
          <div className="mt-2 h-4 overflow-hidden rounded-full border-2 border-[#20342d] bg-white">
            <div
              className="h-full rounded-r-full bg-[#52c79f]"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
          <p className="mt-2 text-right text-xs font-black text-[#20342d]">
            {goalProgress}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {macroTotals.map((macro) => (
          <div
            key={macro.label}
            className="rounded-[1rem] border-2 border-[#20342d] bg-white p-3 shadow-[3px_3px_0_#20342d]"
          >
            <span
              className={`block size-8 rounded-full border-2 border-[#20342d] ${macro.color}`}
            />
            <p className="mt-3 truncate text-xs font-bold text-[#65746d]">
              {macro.label}
            </p>
            <p className="text-lg font-black text-[#20342d]">{macro.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[1.25rem] border-2 border-[#20342d] bg-[#f3fbf1] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full border-2 border-[#20342d] bg-white">
              <IconBowl className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-sm font-black text-[#20342d]">
                Recent meals
              </h3>
              <p className="text-xs font-medium text-[#65746d]">
                {formatMealCount(meals.length)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onAddMeal}
            className="grid size-10 place-items-center rounded-full border-2 border-[#20342d] bg-[#f6d65b] text-[#20342d] shadow-[2px_2px_0_#20342d] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20342d]"
            aria-label="Add meal"
          >
            <IconPlus className="size-5" aria-hidden="true" />
          </button>
        </div>

        {errorMessage ? (
          <div
            className="mt-4 rounded-[1rem] border-2 border-[#20342d] bg-[#fff0df] p-4 text-center"
            role="status"
          >
            <p className="text-sm font-black text-[#20342d]">
              Meals could not load
            </p>
            <p className="mt-1 text-xs font-bold text-[#65746d]">
              {errorMessage}
            </p>
          </div>
        ) : isLoading ? (
          <div
            className="mt-4 rounded-[1rem] border-2 border-[#20342d] bg-white p-4 text-center"
            role="status"
          >
            <p className="text-sm font-black text-[#20342d]">
              Loading meals...
            </p>
            <p className="mt-1 text-xs font-bold text-[#65746d]">
              Syncing your food log.
            </p>
          </div>
        ) : (
          <MenuAddedCard meals={meals} />
        )}
      </div>
    </div>
  );
}
