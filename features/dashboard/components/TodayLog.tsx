import {
  IconBowl,
  IconCircleCheck,
  IconPlus,
} from "./icons";

import { MenuAddedCard } from "./MenuAddedCard";
import { InlineLoadingCard } from "@/components/ui/loading";
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
    <div className="space-y-3 sm:space-y-5">
      <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#fff8d9] to-[#eef8e8] p-4 ring-1 ring-[#e1edd8] sm:rounded-[24px] sm:p-5">
        <div
          className="absolute -right-8 -top-8 size-28 rounded-full bg-[#c9f087]/70 blur-sm"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-10 right-16 size-20 rounded-full bg-[#ffcf8b]/60 blur-sm"
          aria-hidden="true"
        />

        <div className="relative flex items-start justify-between gap-2 sm:gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#22945f]">
              Today&apos;s log
            </p>
            <h2 className="mt-2 text-4xl font-bold leading-none text-[#172019] sm:mt-3 sm:text-5xl">
              {totalCalories.toLocaleString()}
              <span className="ml-2 text-base font-medium text-[#687566]">
                kcal
              </span>
            </h2>
            <p className="mt-2 max-w-xs text-xs leading-5 text-[#687566] sm:text-sm sm:leading-6">
              {isLoading
                ? "Syncing today's meals from your account."
                : isGoalLoading
                  ? "Syncing your nutrition goal from your account."
                  : remainingCalories === null
                    ? "Set your nutrition profile to see your daily goal."
                    : `${remainingCalories.toLocaleString()} kcal remaining from your daily goal.`}
            </p>
          </div>

          <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/90 px-2.5 py-1.5 text-[0.65rem] font-bold text-[#235b30] shadow-[0_8px_18px_rgba(56,103,43,0.12)] ring-1 ring-[#dce9d4] sm:gap-1.5 sm:px-3 sm:text-xs">
            <IconCircleCheck className="size-4" aria-hidden="true" />
            Good
          </span>
        </div>

        <div className="relative mt-4 sm:mt-6">
          <div className="flex items-center justify-between text-xs font-bold text-[#253025]">
            <span>Goal progress</span>
            <span>
              {isGoalLoading
                ? "Loading goal..."
                : hasDailyGoal
                  ? `${dailyGoalCalories.toLocaleString()} kcal goal`
                  : "No goal set"}
            </span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/80 ring-1 ring-[#dce9d4]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#65b741] to-[#22945f]"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
          <p className="mt-2 text-right text-xs font-bold text-[#235b30]">
            {goalProgress}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {macroTotals.map((macro) => (
          <div
            key={macro.label}
            className="app-card rounded-2xl p-2.5 sm:rounded-[18px] sm:p-3"
          >
            <span
              className={`block size-6 rounded-lg sm:size-8 sm:rounded-xl ${macro.color}`}
            />
            <p className="mt-2 truncate text-[0.65rem] text-[#687566] sm:mt-3 sm:text-xs">
              {macro.label}
            </p>
            <p className="text-base font-bold text-[#172019] sm:text-lg">{macro.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[20px] bg-[#f5faF1]/80 p-3 ring-1 ring-[#e1edd8] sm:rounded-[24px] sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-white text-[#22945f] shadow-[0_8px_18px_rgba(56,103,43,0.1)] ring-1 ring-[#e1edd8]">
              <IconBowl className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#172019]">
                Recent meals
              </h3>
              <p className="text-xs text-[#687566]">
                {formatMealCount(meals.length)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onAddMeal}
            className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#65b741] to-[#22945f] text-white shadow-[0_10px_20px_rgba(34,148,95,0.24)] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#65b741]"
            aria-label="Add meal"
          >
            <IconPlus className="size-5" aria-hidden="true" />
          </button>
        </div>

        {errorMessage ? (
          <div
            className="mt-4 rounded-2xl bg-[#fff5ee] p-4 text-center ring-1 ring-[#f2d8ca]"
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
          <InlineLoadingCard
            className="mt-4"
            title="Loading meals"
            message="Syncing your food log."
          />
        ) : (
          <MenuAddedCard meals={meals} />
        )}
      </div>
    </div>
  );
}
