"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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

import { AddExistMeal } from "./AddExistMeal";
import { AddManualMeal } from "./AddManualMeal";
import { TodayLog } from "./TodayLog";
import {
  createMenulist,
  deleteMenulist,
  getMenulists,
  updateMenulist,
  createFood,
  getFoods,
} from "@/features/dashboard/api";
import {
  dashboardMealToFoodPayload,
  dashboardMealToMenulistPayload,
  foodToDashboardMeal,
  isTodayFoodItem,
  menulistToDashboardMeal,
} from "@/features/dashboard/mappers";
import type { DashboardMeal } from "@/features/dashboard/types";
import { useGetMeQuery } from "@/store/api";

const quickActions = [
  {
    label: "Scan meal",
    href: "/analyze",
    Icon: IconCamera,
    color: "bg-[#20342d] text-white",
  },
  {
    label: "View history",
    href: "/meal_history",
    Icon: IconCalendarStats,
    color: "bg-white text-[#20342d]",
  },
];

const getTodayDashboardMeals = async (userId: string) => {
  const foodItems = await getFoods(userId);

  return foodItems.filter(isTodayFoodItem).map(foodToDashboardMeal);
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Please try again.";

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
  const [meals, setMeals] = useState<DashboardMeal[]>([]);
  const [existingMeals, setExistingMeals] = useState<DashboardMeal[]>([]);
  const [isLoadingTodayMeals, setIsLoadingTodayMeals] = useState(true);
  const [todayMealsError, setTodayMealsError] = useState<string | null>(null);
  const [isSavingTodayMeal, setIsSavingTodayMeal] = useState(false);
  const [isLoadingExistingMeals, setIsLoadingExistingMeals] = useState(true);
  const [existingMealsError, setExistingMealsError] = useState<string | null>(
    null,
  );
  const [isSavingExistingMeal, setIsSavingExistingMeal] = useState(false);
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const [isManualMealOpen, setIsManualMealOpen] = useState(false);
  const { showAlert } = useAlert();
  const activeUserId = user?.id ?? "";
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
  const loadTodayMeals = useCallback(async () => {
    if (!activeUserId) {
      setIsLoadingTodayMeals(false);
      setTodayMealsError("Your user session is missing an id.");
      return;
    }

    setIsLoadingTodayMeals(true);
    setTodayMealsError(null);

    try {
      const nextMeals = await getTodayDashboardMeals(activeUserId);

      setMeals(nextMeals);
    } catch {
      setMeals([]);
      setTodayMealsError("Today's meals could not sync. Please try again later.");
    } finally {
      setIsLoadingTodayMeals(false);
    }
  }, [activeUserId]);

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

    async function loadTodayMealsForEffect() {
      if (!activeUserId) {
        setIsLoadingTodayMeals(false);
        setTodayMealsError("Your user session is missing an id.");
        return;
      }

      setIsLoadingTodayMeals(true);
      setTodayMealsError(null);

      try {
        const nextMeals = await getTodayDashboardMeals(activeUserId);

        if (!isMounted) {
          return;
        }

        setMeals(nextMeals);
      } catch {
        if (!isMounted) {
          return;
        }

        setMeals([]);
        setTodayMealsError(
          "Today's meals could not sync. Please try again later.",
        );
      } finally {
        if (isMounted) {
          setIsLoadingTodayMeals(false);
        }
      }
    }

    void loadTodayMealsForEffect();
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

    setIsSavingTodayMeal(true);

    try {
      await createFood(dashboardMealToFoodPayload(meal, activeUserId));
      await loadTodayMeals();
      return true;
    } catch (error) {
      showAlert({
        type: "error",
        title: "Meal not logged",
        message: getErrorMessage(error),
      });
      return false;
    } finally {
      setIsSavingTodayMeal(false);
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
      <main className="grid min-h-screen place-items-center bg-[#fff7df] px-4 text-[#20342d]">
        <p className="text-sm font-black" role="status">
          Loading your dashboard...
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fff7df] px-4 text-[#20342d]">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-black">We could not load your profile.</h1>
          <p className="mt-2 text-sm font-bold text-[#66766f]">
            Your session may have expired. Sign in again to continue.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full border-2 border-[#20342d] bg-[#ffdf5d] px-5 text-sm font-black shadow-[0_4px_0_#20342d]"
          >
            Back to sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fff7df] px-4 pb-28 pt-5 text-[#20342d] sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b6532d]">
              {todayLabel}
            </p>
            <h1 className="mt-2 truncate text-3xl font-black leading-tight sm:text-4xl">
              Hi, {firstName}
            </h1>
            <p className="mt-1 truncate text-sm font-bold text-[#66766f]">
              {user.name ?? user.email}
            </p>
          </div>
          <div className="shrink-0">
            <ProfileMenu user={user} />
          </div>
        </header>

        <section className="mt-5 overflow-hidden rounded-[1.5rem] border-2 border-[#20342d] bg-white shadow-[0_8px_0_#20342d] sm:rounded-[1.75rem] lg:grid lg:grid-cols-[1.2fr_0.8fr]">
          <div className="bg-[#dbe8a7] p-5 sm:p-7">
            <div className="flex size-12 items-center justify-center rounded-full border-2 border-[#20342d] bg-white shadow-[0_4px_0_#20342d]">
              <IconFlame className="size-6" aria-hidden="true" />
            </div>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-[#b6532d]">
              Daily balance
            </p>
            <h2 className="mt-2 max-w-xl text-3xl font-black leading-tight sm:text-5xl">
              {isLoadingNutritionProfile
                ? "Loading calorie goal..."
                : remainingCalories === null
                  ? "Set your calorie goal."
                  : `${remainingCalories.toLocaleString()} kcal left for today.`}
            </h2>
            <p className="mt-3 max-w-lg text-sm font-bold leading-6 text-[#52635c] sm:text-base">
              {meals.length > 0
                ? "Add the next meal when you are ready, then review the estimate before saving it."
                : "Start today's log by scanning a meal or adding one manually."}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {quickActions.map((action) => {
                const Icon = action.Icon;

                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-[#20342d] px-5 py-3 text-sm font-black shadow-[0_4px_0_#20342d] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20342d] ${action.color}`}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                    {action.label}
                    <IconArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="p-5 sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b6532d]">
              Your profile
            </p>
            <h2 className="mt-2 truncate text-xl font-black">{displayName}</h2>
            <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 text-sm">
              <div>
                <dt className="font-bold text-[#66766f]">Height</dt>
                <dd className="mt-1 font-black">{formatProfileValue(user.heightCm, "cm")}</dd>
              </div>
              <div>
                <dt className="font-bold text-[#66766f]">Weight</dt>
                <dd className="mt-1 font-black">{formatProfileValue(user.weightKg, "kg")}</dd>
              </div>
              <div className="col-span-2">
                <dt className="font-bold text-[#66766f]">Diet mode</dt>
                <dd className="mt-1 font-black">
                  {user.dietMode ? dietModeLabels[user.dietMode] : "Not set"}
                </dd>
              </div>
              <div>
                <dt className="font-bold text-[#66766f]">Calories</dt>
                <dd className="mt-1 font-black">{formatProfileValue(user.kcalGoal, "kcal")}</dd>
              </div>
              <div>
                <dt className="font-bold text-[#66766f]">Protein</dt>
                <dd className="mt-1 font-black">{formatProfileValue(user.proteinGoal, "g")}</dd>
              </div>
              <div>
                <dt className="font-bold text-[#66766f]">Fat</dt>
                <dd className="mt-1 font-black">{formatProfileValue(user.fatGoal, "g")}</dd>
              </div>
              <div>
                <dt className="font-bold text-[#66766f]">Carbs</dt>
                <dd className="mt-1 font-black">{formatProfileValue(user.carbGoal, "g")}</dd>
              </div>
            </dl>
          </div>
        </section>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)] lg:items-start">
          <section className="rounded-[1.5rem] border-2 border-[#20342d] bg-white p-4 shadow-[0_8px_0_#20342d] sm:p-6">
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
            <section className="rounded-[1.5rem] border-2 border-[#20342d] bg-white p-4 shadow-[0_8px_0_#20342d] sm:p-5">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#b6532d]">
                Next step
              </p>
              <h2 className="mt-2 text-xl font-black leading-tight">
                Keep dinner balanced.
              </h2>
              <p className="mt-2 text-sm font-bold leading-6 text-[#66766f]">
                You have room for a protein-forward meal with moderate carbs.
              </p>
              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMealOpen(true)}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border-2 border-[#20342d] bg-[#ffdf5d] px-4 py-2 text-sm font-black shadow-[0_4px_0_#20342d] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20342d]"
                >
                  <IconListDetails className="size-5" aria-hidden="true" />
                  Add from list
                </button>
                <button
                  type="button"
                  onClick={() => setIsManualMealOpen(true)}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border-2 border-[#20342d] bg-white px-4 py-2 text-sm font-black shadow-[0_4px_0_#20342d] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20342d]"
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
        userId={activeUserId}
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
