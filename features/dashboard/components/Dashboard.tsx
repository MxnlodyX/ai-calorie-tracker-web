"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  IconArrowRight,
  IconCalendarStats,
  IconCamera,
  IconListDetails,
  IconPencilPlus,
  IconFlame,
} from "./icons";

import { BottomNavbar } from "@/components/layout/BottomNavbar";
import { ProfileMenu } from "@/features/dashboard/components/ProfileMenu";
import { useAlert } from "@/components/ui/alert-provider";
import { AppLoadingShell } from "@/components/ui/loading";

import { AddExistMeal } from "./AddExistMeal";
import { AddManualMeal } from "./AddManualMeal";
import { TodayLog } from "./TodayLog";
import {
  createMenulist,
  deleteMenulist,
  getMenulists,
  updateMenulist,
} from "@/features/dashboard/api";
import {
  dashboardMealToFoodPayload,
  dashboardMealToMenulistPayload,
  foodToDashboardMeal,
  menulistToDashboardMeal,
} from "@/features/dashboard/mappers";
import type { DashboardMeal } from "@/features/dashboard/types";
import {
  useCreateFoodMutation,
  useGetFoodsByDateQuery,
  useGetMeQuery,
} from "@/store/api";

const quickActions = [
  {
    label: "Scan meal",
    href: "/analyze",
    Icon: IconCamera,
    color: "bg-white text-[#235b30] shadow-[0_14px_28px_rgba(18,73,43,0.18)]",
  },
  {
    label: "View history",
    href: "/history",
    Icon: IconCalendarStats,
    color: "bg-white/15 text-white ring-1 ring-white/35",
  },
];

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Please try again.";

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const formatProfileValue = (value: number | null, unit: string) =>
  value === null ? "Not set" : `${value.toLocaleString()} ${unit}`;

const dietModeLabels = {
  lose: "Lose weight",
  maintain: "Maintain weight",
  gain: "Gain weight",
} as const;

export function Dashboard() {
  const {
    data: user,
    isLoading: isLoadingUser,
  } = useGetMeQuery();
  const [createFoodMutation, createFoodMutationResult] =
    useCreateFoodMutation();
  const [existingMeals, setExistingMeals] = useState<DashboardMeal[]>([]);
  const [isLoadingExistingMeals, setIsLoadingExistingMeals] = useState(true);
  const [existingMealsError, setExistingMealsError] = useState<string | null>(
    null,
  );
  const [isSavingExistingMeal, setIsSavingExistingMeal] = useState(false);
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const [isManualMealOpen, setIsManualMealOpen] = useState(false);
  const { showAlert } = useAlert();
  const activeUserId = user?.id ?? "";
  const todayDate = formatLocalDate(new Date());
  const {
    data: todayFoodItems = [],
    isLoading: isLoadingTodayFoods,
    isError: hasTodayFoodsError,
  } = useGetFoodsByDateQuery(todayDate, {
    skip: isLoadingUser || !activeUserId,
  });
  const meals = useMemo(
    () => todayFoodItems.map(foodToDashboardMeal),
    [todayFoodItems],
  );
  const todayMealsError =
    !isLoadingUser && !activeUserId
      ? "Your user session is missing an id."
      : hasTodayFoodsError
        ? "Today's meals could not sync. Please try again later."
        : null;
  const isLoadingTodayMeals = isLoadingUser || isLoadingTodayFoods;
  const isSavingTodayMeal = createFoodMutationResult.isLoading;
  const displayName = user?.name ?? user?.email ?? "Your profile";
  const firstName =
    user?.name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";
  const dailyGoalCalories = user?.kcalGoal ?? null;
  const isLoadingNutritionProfile = isLoadingUser && !user;
  const totalCalories = meals.reduce((total, meal) => total + meal.calories, 0);
  const remainingCalories =
    dailyGoalCalories === null
      ? null
      : Math.max(dailyGoalCalories - totalCalories, 0);
  const todayLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date());

  useEffect(() => {
    let isMounted = true;

    if (!activeUserId) {
      return;
    }

    async function loadExistingMeals() {
      setIsLoadingExistingMeals(true);
      setExistingMealsError(null);

      try {
        const menulists = await getMenulists(activeUserId);
        const nextMeals = menulists.map(menulistToDashboardMeal);

        if (!isMounted) {
          return;
        }

        setExistingMeals(nextMeals);
      } catch {
        if (!isMounted) {
          return;
        }

        setExistingMeals([]);
        setExistingMealsError(
          "Saved meals could not sync. Please try again later.",
        );
      } finally {
        if (isMounted) {
          setIsLoadingExistingMeals(false);
        }
      }
    }

    void loadExistingMeals();

    return () => {
      isMounted = false;
    };
  }, [activeUserId]);

  const handleAddMeal = async (meal: DashboardMeal) => {
    if (!activeUserId) {
      showAlert({
        type: "error",
        title: "Meal not logged",
        message: "Your user session is missing an id. Please sign in again.",
      });
      return false;
    }

    try {
      await createFoodMutation(
        dashboardMealToFoodPayload(meal, activeUserId),
      ).unwrap();
      return true;
    } catch (error) {
      showAlert({
        type: "error",
        title: "Meal not logged",
        message: getErrorMessage(error),
      });
      return false;
    }
  };
  const handleSaveExistingMeal = async (meal: DashboardMeal) => {
    if (!activeUserId) {
      showAlert({
        type: "error",
        title: "Menu not saved",
        message: "Your user session is missing an id. Please sign in again.",
      });
      return false;
    }

    setIsSavingExistingMeal(true);

    try {
      const savedMeal = await createMenulist(
        dashboardMealToMenulistPayload(meal, activeUserId),
      );
      const nextMeal = menulistToDashboardMeal(savedMeal);

      setExistingMeals((currentMeals) => {
        return [nextMeal, ...currentMeals];
      });
    } catch (error) {
      showAlert({
        type: "error",
        title: "Menu not saved",
        message: getErrorMessage(error),
      });
      return false;
    } finally {
      setIsSavingExistingMeal(false);
    }

    return true;
  };
  const handleUpdateExistingMeal = async (meal: DashboardMeal) => {
    try {
      const updatedMeal = await updateMenulist(meal.id, {
        name: meal.name,
        mealType: meal.mealType,
        description: meal.description || undefined,
        kcal: meal.calories,
        proteinG: meal.protein,
        carbG: meal.carbs,
        fatG: meal.fat,
      });
      const nextMeal = menulistToDashboardMeal(updatedMeal);

      setExistingMeals((currentMeals) =>
        currentMeals.map((currentMeal) =>
          currentMeal.id === nextMeal.id ? nextMeal : currentMeal,
        ),
      );
      showAlert({
        title: "Menu updated",
        message: `${nextMeal.name} was updated in your saved list.`,
      });
      return true;
    } catch (error) {
      showAlert({
        type: "error",
        title: "Menu not updated",
        message: getErrorMessage(error),
      });
      return false;
    }
  };
  const handleDeleteExistingMeal = async (meal: DashboardMeal) => {
    try {
      await deleteMenulist(meal.id);
      showAlert({
        type: "info",
        title: "Menu removed",
        message: `${meal.name} was removed from your saved list.`,
      });
    } catch (error) {
      showAlert({
        type: "error",
        title: "Menu not removed",
        message: getErrorMessage(error),
      });
      return;
    }

    setExistingMeals((currentMeals) =>
      currentMeals.filter((currentMeal) => currentMeal.id !== meal.id),
    );
  };

  if (!user && isLoadingUser) {
    return (
      <AppLoadingShell
        title="Loading your dashboard"
        message="Syncing your profile, daily goal, and today's meal log."
      />
    );
  }

  if (!user) {
    return (
      <main className="app-page grid min-h-screen place-items-center px-4 text-[#172019]">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-black">We could not load your profile.</h1>
          <p className="mt-2 text-sm font-bold text-[#66766f]">
            Your session may have expired. Sign in again to continue.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#65b741] to-[#22945f] px-5 text-sm font-bold text-white shadow-[0_14px_28px_rgba(34,148,95,0.25)]"
          >
            Back to sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="app-page min-h-screen px-3.5 pt-4 text-[#172019] sm:px-6 sm:pt-5 lg:px-10 lg:pt-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#22945f]">
              {todayLabel}
            </p>
            <h1 className="mt-1 truncate text-2xl font-bold leading-tight sm:mt-2 sm:text-4xl">
              Hi, {firstName}
            </h1>
            <p className="mt-0.5 max-w-[15rem] truncate text-xs text-[#687566] sm:mt-1 sm:max-w-none sm:text-sm">
              {user.name ?? user.email}
            </p>
          </div>
          <div className="shrink-0">
            <ProfileMenu user={user} />
          </div>
        </header>

        <section className="app-panel mt-4 overflow-hidden rounded-[24px] sm:mt-6 sm:rounded-[30px] lg:grid lg:grid-cols-[1.25fr_0.75fr]">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#235b30] via-[#22945f] to-[#65b741] p-4 text-white sm:p-8">
            <div className="absolute -right-20 -top-20 size-64 rounded-full bg-[#c9f087]/20" aria-hidden="true" />
            <div className="relative flex size-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/35 backdrop-blur-sm sm:size-12 sm:rounded-2xl">
              <IconFlame className="size-6" aria-hidden="true" />
            </div>
            <p className="relative mt-3 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#d7f7c3] sm:mt-5 sm:text-xs">
              Daily balance
            </p>
            <h2 className="relative mt-1.5 max-w-xl text-2xl font-bold leading-tight sm:mt-2 sm:text-5xl">
              {isLoadingNutritionProfile
                ? "Loading calorie goal..."
                : remainingCalories === null
                  ? "Set your calorie goal."
                  : `${remainingCalories.toLocaleString()} kcal left for today.`}
            </h2>
            <p className="relative mt-2 max-w-lg text-xs leading-5 text-white/75 sm:mt-3 sm:text-base sm:leading-6">
              {meals.length > 0
                ? "Add the next meal when you are ready, then review the estimate before saving it."
                : "Start today's log by scanning a meal or adding one manually."}
            </p>

            <div className="relative mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:flex sm:gap-3">
              {quickActions.map((action) => {
                const Icon = action.Icon;

                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={`inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-bold transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:gap-2 sm:px-5 sm:py-3 sm:text-sm ${action.color}`}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                    {action.label}
                    <IconArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="bg-white/80 p-4 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#22945f]">
              Your profile
            </p>
            <h2 className="mt-2 truncate text-xl font-bold">{displayName}</h2>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-xs sm:mt-5 sm:gap-x-5 sm:gap-y-4 sm:text-sm">
              <div>
                <dt className="text-[#687566]">Height</dt>
                <dd className="mt-1 font-bold">{formatProfileValue(user.heightCm, "cm")}</dd>
              </div>
              <div>
                <dt className="text-[#687566]">Weight</dt>
                <dd className="mt-1 font-bold">{formatProfileValue(user.weightKg, "kg")}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[#687566]">Diet mode</dt>
                <dd className="mt-1 font-bold">
                  {user.dietMode ? dietModeLabels[user.dietMode] : "Not set"}
                </dd>
              </div>
              <div>
                <dt className="text-[#687566]">Calories</dt>
                <dd className="mt-1 font-bold">{formatProfileValue(user.kcalGoal, "kcal")}</dd>
              </div>
              <div>
                <dt className="text-[#687566]">Protein</dt>
                <dd className="mt-1 font-bold">{formatProfileValue(user.proteinGoal, "g")}</dd>
              </div>
              <div>
                <dt className="text-[#687566]">Fat</dt>
                <dd className="mt-1 font-bold">{formatProfileValue(user.fatGoal, "g")}</dd>
              </div>
              <div>
                <dt className="text-[#687566]">Carbs</dt>
                <dd className="mt-1 font-bold">{formatProfileValue(user.carbGoal, "g")}</dd>
              </div>
            </dl>
          </div>
        </section>

        <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)] lg:items-start">
          <section className="app-panel rounded-[24px] p-3 sm:rounded-[30px] sm:p-6">
            <TodayLog
              meals={meals}
              dailyGoalCalories={dailyGoalCalories}
              isGoalLoading={isLoadingNutritionProfile}
              errorMessage={todayMealsError}
              isLoading={isLoadingTodayMeals}
              onAddMeal={() => setIsAddMealOpen(true)}
            />
          </section>

          <aside className="space-y-5">
            <section className="app-card rounded-[20px] p-4 sm:rounded-[24px] sm:p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#22945f]">
                Next step
              </p>
              <h2 className="mt-2 text-xl font-bold leading-tight">
                Keep dinner balanced.
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#687566]">
                You have room for a protein-forward meal with moderate carbs.
              </p>
              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMealOpen(true)}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#65b741] to-[#22945f] px-4 py-2 text-sm font-bold text-white shadow-[0_12px_24px_rgba(34,148,95,0.24)] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#65b741]"
                >
                  <IconListDetails className="size-5" aria-hidden="true" />
                  Add from list
                </button>
                <button
                  type="button"
                  onClick={() => setIsManualMealOpen(true)}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#253025] shadow-[0_10px_22px_rgba(56,103,43,0.1)] ring-1 ring-[#e1edd8] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#65b741]"
                >
                  <IconPencilPlus className="size-5" aria-hidden="true" />
                  Manual add
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>

      <AddExistMeal
        isOpen={isAddMealOpen}
        existingMeals={existingMeals}
        errorMessage={existingMealsError}
        isLoading={isLoadingExistingMeals}
        isSavingMeal={isSavingTodayMeal}
        onAddMeal={handleAddMeal}
        onDeleteMeal={handleDeleteExistingMeal}
        onUpdateMeal={handleUpdateExistingMeal}
        onClose={() => setIsAddMealOpen(false)}
      />
      <AddManualMeal
        isOpen={isManualMealOpen}
        isSaving={isSavingExistingMeal}
        isLoggingMeal={isSavingTodayMeal}
        onAddMeal={handleAddMeal}
        onSaveExistingMeal={handleSaveExistingMeal}
        onClose={() => setIsManualMealOpen(false)}
      />

      <BottomNavbar />
    </main>
  );
}
