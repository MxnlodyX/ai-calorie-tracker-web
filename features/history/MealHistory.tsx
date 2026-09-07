"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  IconCalendarStats as IconCalendarMonth,
  IconClock,
  IconDeviceFloppy,
  IconEdit,
  IconFlame,
  IconListDetails as IconHistory,
  IconBowl as IconSalad,
  IconAlertTriangle,
  IconTrash,
  IconTrendingUp,
  IconX,
} from "@/features/dashboard/components/icons";
import { useRedirectOnUnauthorized } from "@/features/authentication/hooks/use-redirect-on-unauthorized";
import { useAlert } from "@/components/ui/alert-provider";
import { InlineLoadingCard } from "@/components/ui/loading";
import { BottomNavbar } from "@/components/layout/BottomNavbar";
import type { FoodItem } from "@/features/dashboard/types";
import { getLocalMonthUtcRange } from "@/lib/local-date-range";
import {
  useDeleteFoodMutation,
  useGetMeQuery,
  useGetMealCalendarHistoryQuery,
  useUpdateFoodMutation,
} from "@/store/api";

type MealEntry = {
  id: string;
  title: string;
  mealType: string;
  time: string;
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  accentColor: string;
};

type DiaryDay = {
  date: string;
  day: number;
  weekday: string;
  totalCalories: number;
  goalCalories: number;
  note: string;
  meals: MealEntry[];
};

type Stat = {
  key: string;
  label: string;
  Icon: typeof IconFlame;
  color: string;
  getValue: (day: DiaryDay) => string;
  suffix: string;
};

type EditingMeal = {
  date: string;
  meal: MealEntry;
};

type MealFormValues = {
  title: string;
  mealType: string;
  time: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
};

type DeleteMealTarget = {
  date: string;
  meal: MealEntry;
};

type ConfirmDialogState =
  | {
      type: "delete";
      target: DeleteMealTarget;
    }
  | {
      type: "edit";
      updatedMeal: MealEntry;
      originalMeal: EditingMeal;
    };

const monthOptions = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const yearWindow = 5;

const stats: Stat[] = [
  {
    key: "totalCalories",
    label: "Total",
    Icon: IconFlame,
    color: "bg-[#fff4c7]",
    getValue: (day) => day.totalCalories.toLocaleString(),
    suffix: "kcal",
  },
  {
    key: "averageCalories",
    label: "Average",
    Icon: IconTrendingUp,
    color: "bg-[#e8f7df]",
    getValue: (day) => {
      if (day.meals.length === 0) {
        return "0";
      }

      return Math.round(day.totalCalories / day.meals.length).toLocaleString();
    },
    suffix: "kcal/meal",
  },
  {
    key: "mealsLogged",
    label: "Meals",
    Icon: IconSalad,
    color: "bg-[#e3f5dc]",
    getValue: (day) => day.meals.length.toString(),
    suffix: "logged",
  },
];

function getMonthOptionLabel(month: number) {
  return (
    monthOptions.find((monthOption) => monthOption.value === month)?.label ??
    "Month"
  );
}

function getYearOptions(selectedYear: number) {
  const currentYear = new Date().getFullYear();
  const minYear = Math.min(currentYear - yearWindow, selectedYear);
  const maxYear = Math.max(currentYear + yearWindow, selectedYear);

  return Array.from(
    { length: maxYear - minYear + 1 },
    (_, index) => minYear + index,
  );
}

function createEmptyDiaryDay(
  day: number,
  month: number,
  year: number,
  goalCalories: number,
): DiaryDay {
  const date = `${year}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;
  const weekday = new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "long",
  });

  return {
    date,
    day,
    weekday,
    totalCalories: 0,
    goalCalories,
    note: "No meals logged for this day yet.",
    meals: [],
  };
}

function formatDateKey(value: string): string | null {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return formatLocalDate(date);
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "12:00";
  }

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function normalizeMealType(mealType: string | null) {
  const normalizedMealType = mealType?.toLowerCase();

  if (normalizedMealType === "breakfast") {
    return "Breakfast";
  }

  if (normalizedMealType === "lunch") {
    return "Lunch";
  }

  if (normalizedMealType === "dinner") {
    return "Dinner";
  }

  return "Additional";
}

function foodToMealEntry(item: FoodItem): MealEntry {
  return {
    id: item.id,
    title: item.name,
    mealType: normalizeMealType(item.mealType),
    time: formatTime(item.eatenAt),
    calories: item.kcal,
    macros: {
      protein: item.proteinG,
      carbs: item.carbG,
      fat: item.fatG,
    },
    accentColor: "bg-[#dbe8a7]",
  };
}

function foodListToDiaryDays(
  items: FoodItem[],
  goalCalories: number,
): DiaryDay[] {
  const entriesByDate = items.reduce<Record<string, MealEntry[]>>(
    (entries, item) => {
      const dateKey = formatDateKey(item.eatenAt);

      if (!dateKey) {
        return entries;
      }

      entries[dateKey] = entries[dateKey] ?? [];
      entries[dateKey].push(foodToMealEntry(item));

      return entries;
    },
    {},
  );

  return Object.entries(entriesByDate)
    .map(([date, meals]) => {
      const entryDate = new Date(`${date}T00:00:00`);

      return getUpdatedDiaryDay(
        {
          date,
          day: entryDate.getDate(),
          weekday: entryDate.toLocaleDateString("en-US", {
            weekday: "long",
          }),
          totalCalories: 0,
          goalCalories,
          note: "",
          meals: [],
        },
        meals.sort((firstMeal, secondMeal) =>
          firstMeal.time.localeCompare(secondMeal.time),
        ),
      );
    })
    .sort((firstDay, secondDay) => firstDay.date.localeCompare(secondDay.date));
}

function createMealFormValues(meal: MealEntry): MealFormValues {
  return {
    title: meal.title,
    mealType: meal.mealType,
    time: meal.time,
    calories: String(meal.calories),
    protein: String(meal.macros.protein),
    carbs: String(meal.macros.carbs),
    fat: String(meal.macros.fat),
  };
}

function getUpdatedDiaryDay(day: DiaryDay, meals: MealEntry[]): DiaryDay {
  return {
    ...day,
    totalCalories: meals.reduce((total, meal) => total + meal.calories, 0),
    note:
      meals.length > 0
        ? `${meals.length} ${meals.length === 1 ? "meal" : "meals"} logged for this day.`
        : "No meals logged for this day yet.",
    meals,
  };
}

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Please try again.";

export function MealHistory() {
  const { showAlert } = useAlert();
  const {
    data: user,
    error: userError,
    isLoading: isLoadingUser,
  } = useGetMeQuery();

  useRedirectOnUnauthorized(userError);
  const activeUserId = user?.id ?? "";
  const dailyGoalCalories = user?.kcalGoal ?? null;
  const [selectedMonth, setSelectedMonth] = useState(
    () => new Date().getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState(() =>
    new Date().getFullYear(),
  );
  const [selectedDayNumber, setSelectedDayNumber] = useState(() =>
    new Date().getDate(),
  );
  const [editingMeal, setEditingMeal] = useState<EditingMeal | null>(null);
  const [mealFormValues, setMealFormValues] = useState<MealFormValues | null>(
    null,
  );
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(
    null,
  );
  const historyRange = useMemo(
    () => getLocalMonthUtcRange(selectedYear, selectedMonth),
    [selectedMonth, selectedYear],
  );

  useEffect(() => {
    let previousDate = formatLocalDate(new Date());
    const timer = window.setInterval(() => {
      const now = new Date();
      const nextDate = formatLocalDate(now);

      if (nextDate !== previousDate) {
        previousDate = nextDate;
        setSelectedMonth(now.getMonth() + 1);
        setSelectedYear(now.getFullYear());
        setSelectedDayNumber(now.getDate());
      }
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);
  const {
    data: foodItems = [],
    isLoading: isLoadingHistory,
    isFetching: isFetchingHistory,
    isError: hasHistoryError,
  } = useGetMealCalendarHistoryQuery(
    {
      month: selectedMonth,
      year: selectedYear,
      ...historyRange,
    },
    {
      skip: isLoadingUser || !activeUserId,
    },
  );
  const [deleteFoodMutation, { isLoading: isDeletingMeal }] =
    useDeleteFoodMutation();
  const [updateFoodMutation, { isLoading: isUpdatingMeal }] =
    useUpdateFoodMutation();
  const diaryEntries = useMemo(
    () => foodListToDiaryDays(foodItems, dailyGoalCalories ?? 0),
    [dailyGoalCalories, foodItems],
  );
  const isLoadingEntries =
    isLoadingUser || isLoadingHistory || isFetchingHistory;
  const entriesError =
    !isLoadingUser && !activeUserId
      ? "Your user session is missing an id."
      : hasHistoryError
        ? "Meal history could not sync. Please try again later."
        : null;
  const isSavingMeal = isDeletingMeal || isUpdatingMeal;
  const monthLabel = getMonthOptionLabel(selectedMonth);
  const selectedMonthLabel = `${monthLabel} ${selectedYear}`;
  const yearOptions = useMemo(
    () => getYearOptions(selectedYear),
    [selectedYear],
  );
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const firstWeekday = new Date(selectedYear, selectedMonth - 1, 1).getDay();
  const diaryByDay = useMemo(
    () =>
      diaryEntries.reduce<Record<number, DiaryDay>>((days, day) => {
        const entryDate = new Date(`${day.date}T00:00:00`);
        const entryMonth = entryDate.getMonth() + 1;
        const entryYear = entryDate.getFullYear();

        if (entryMonth === selectedMonth && entryYear === selectedYear) {
          days[day.day] = day;
        }

        return days;
      }, {}),
    [diaryEntries, selectedMonth, selectedYear],
  );
  const selectedDay =
    diaryByDay[selectedDayNumber] ??
    createEmptyDiaryDay(
      selectedDayNumber,
      selectedMonth,
      selectedYear,
      dailyGoalCalories ?? 0,
    );
  const hasDailyGoal = selectedDay.goalCalories > 0;
  const goalProgress = hasDailyGoal
    ? Math.min(
        100,
        Math.round(
          (selectedDay.totalCalories / selectedDay.goalCalories) * 100,
        ),
      )
    : 0;
  const calendarCells = useMemo(
    () => [
      ...Array.from({ length: firstWeekday }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ],
    [daysInMonth, firstWeekday],
  );

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    setSelectedDayNumber((day) =>
      Math.min(day, new Date(selectedYear, month, 0).getDate()),
    );
  };
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setSelectedDayNumber((day) =>
      Math.min(day, new Date(year, selectedMonth, 0).getDate()),
    );
  };
  const handleOpenDeleteMeal = (dayDate: string, meal: MealEntry) => {
    setConfirmDialog({
      type: "delete",
      target: {
        date: dayDate,
        meal,
      },
    });
  };
  const handleConfirmDeleteMeal = async (target: DeleteMealTarget) => {
    const { date, meal } = target;

    try {
      await deleteFoodMutation({ id: meal.id, date }).unwrap();
    } catch (error) {
      showAlert({
        type: "error",
        title: "Meal not deleted",
        message: getErrorMessage(error),
      });
      return;
    }

    setConfirmDialog(null);
    showAlert({
      title: "Meal deleted",
      message: `${meal.title} was removed from this day.`,
    });
  };
  const handleOpenEditMeal = (dayDate: string, meal: MealEntry) => {
    setEditingMeal({ date: dayDate, meal });
    setMealFormValues(createMealFormValues(meal));
  };
  const handleCloseEditMeal = () => {
    setEditingMeal(null);
    setMealFormValues(null);
  };
  const handleEditMealSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingMeal || !mealFormValues) {
      return;
    }

    const updatedMeal: MealEntry = {
      ...editingMeal.meal,
      title: mealFormValues.title.trim(),
      mealType: mealFormValues.mealType.trim(),
      time: mealFormValues.time,
      calories: Number(mealFormValues.calories),
      macros: {
        protein: Number(mealFormValues.protein || 0),
        carbs: Number(mealFormValues.carbs || 0),
        fat: Number(mealFormValues.fat || 0),
      },
    };

    setConfirmDialog({
      type: "edit",
      updatedMeal,
      originalMeal: editingMeal,
    });
  };
  const handleConfirmEditMeal = async (
    updatedMeal: MealEntry,
    originalMeal: EditingMeal,
  ) => {
    let savedMeal: MealEntry;

    try {
      const updatedItem = await updateFoodMutation({
        id: originalMeal.meal.id,
        date: originalMeal.date,
        payload: {
          name: updatedMeal.title,
          mealType: updatedMeal.mealType,
          kcal: updatedMeal.calories,
          proteinG: updatedMeal.macros.protein,
          carbG: updatedMeal.macros.carbs,
          fatG: updatedMeal.macros.fat,
          eatenAt: new Date(
            `${originalMeal.date}T${updatedMeal.time}:00`,
          ).toISOString(),
        },
      }).unwrap();
      savedMeal = foodToMealEntry(updatedItem);
    } catch (error) {
      showAlert({
        type: "error",
        title: "Meal not updated",
        message: getErrorMessage(error),
      });
      return;
    }

    setConfirmDialog(null);
    showAlert({
      title: "Meal updated",
      message: `${savedMeal.title} was updated in history.`,
    });
    handleCloseEditMeal();
  };

  return (
    <main className="app-page min-h-screen px-3.5 pt-4 text-[#172019] sm:px-6 sm:pt-5 lg:px-10 lg:pt-8">
      <section className="mx-auto w-full max-w-3xl">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#22945f]">
              Meal diary
            </p>
            <h1 className="mt-1 text-2xl font-bold leading-tight sm:mt-2 sm:text-4xl">
              {selectedMonthLabel}
            </h1>
            <p className="mt-0.5 text-xs text-[#687566] sm:mt-1 sm:text-sm">
              Pick a day to review meals and calories.
            </p>
          </div>

          <div className="grid w-full shrink-0 grid-cols-[minmax(0,1fr)_7rem] gap-2 sm:flex sm:w-auto sm:flex-row">
            <label className="sr-only" htmlFor="diary-month">
              Select month
            </label>
            <select
              id="diary-month"
              value={selectedMonth}
              onChange={(event) =>
                handleMonthChange(Number(event.target.value))
              }
              className="app-field h-12 w-full rounded-xl px-3 text-sm font-bold outline-none sm:h-11 sm:w-auto"
            >
              {monthOptions.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="diary-year">
              Select year
            </label>
            <select
              id="diary-year"
              value={selectedYear}
              onChange={(event) => handleYearChange(Number(event.target.value))}
              className="app-field h-12 w-full rounded-xl px-3 text-sm font-bold outline-none sm:h-11 sm:w-auto"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </header>

        {entriesError ? (
          <div
            className="mt-5 rounded-2xl bg-[#fff5ee] p-4 text-center shadow-[0_12px_26px_rgba(160,79,53,0.08)] ring-1 ring-[#f2d8ca]"
            role="status"
          >
            <p className="text-sm font-bold">History could not load</p>
            <p className="mt-1 text-xs text-[#687566]">{entriesError}</p>
          </div>
        ) : isLoadingEntries ? (
          <InlineLoadingCard
            className="mt-5"
            title="Loading meal history"
            message="Syncing your logged meals."
          />
        ) : null}

        <section className="app-panel mt-4 rounded-[24px] p-2.5 sm:mt-6 sm:rounded-[30px] sm:p-5">
          <div className="flex items-center gap-2 px-1 sm:gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#65b741] to-[#22945f] text-white shadow-[0_10px_22px_rgba(34,148,95,0.22)] sm:size-10 sm:rounded-2xl">
              <IconCalendarMonth className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-bold">{selectedMonthLabel}</h2>
              <p className="text-xs text-[#687566]">Daily calorie diary</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 sm:mt-4 sm:gap-1.5">
            {weekdays.map((weekday) => (
              <p
                key={weekday}
                className="text-center text-[10px] font-bold uppercase text-[#687566]"
              >
                {weekday}
              </p>
            ))}

            {calendarCells.map((day, index) => {
              if (day === null) {
                return <div key={`blank-${index}`} className="aspect-square" />;
              }

              const diaryDay = diaryByDay[day];
              const isSelected = selectedDayNumber === day;
              const hasMeals = Boolean(diaryDay?.meals.length);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDayNumber(day)}
                  aria-pressed={isSelected}
                  className={[
                    "relative aspect-square min-h-10 rounded-[10px] text-xs font-bold ring-1 ring-[#dce9d4] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#65b741] sm:min-h-0 sm:rounded-xl sm:text-sm",
                    isSelected
                      ? "bg-gradient-to-br from-[#65b741] to-[#22945f] text-white shadow-[0_8px_16px_rgba(34,148,95,0.22)]"
                      : "bg-white/75 hover:-translate-y-0.5 hover:bg-[#eef8e7]",
                  ].join(" ")}
                >
                  <span>{day}</span>
                  {hasMeals ? (
                    <span
                      className={`absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${isSelected ? "bg-white" : "bg-[#f29d38]"}`}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        <section className="app-panel mt-4 rounded-[24px] p-3 sm:mt-5 sm:rounded-[30px] sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#22945f]">
                {selectedDay.weekday}
              </p>
              <h2 className="mt-1 text-xl font-bold leading-none sm:text-2xl">
                {monthLabel} {selectedDay.day}
              </h2>
            </div>
            <span className="rounded-full bg-[#eef8e7] px-3 py-1 text-xs font-bold text-[#235b30] ring-1 ring-[#dce9d4]">
              {hasDailyGoal ? `${goalProgress}% goal` : "No goal set"}
            </span>
          </div>

          <div className="app-card mt-3 grid grid-cols-3 overflow-hidden rounded-[18px] sm:mt-4 sm:rounded-[20px]">
            {stats.map((stat) => {
              const Icon = stat.Icon;

              return (
                <div
                  key={stat.key}
                  className="border-r border-[#e1edd8] p-2 last:border-r-0 sm:p-3"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`hidden size-8 shrink-0 place-items-center rounded-xl text-[#235b30] sm:grid ${stat.color}`}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[10px] font-bold uppercase tracking-[0.1em] text-[#687566]">
                        {stat.label}
                      </p>
                      <p className="mt-1 truncate text-base font-bold leading-none text-[#172019] sm:text-xl">
                        {stat.getValue(selectedDay)}
                      </p>
                    </div>
                  </div>

                  <p className="mt-2 truncate text-[10px] font-bold uppercase text-[#687566]">
                    {stat.suffix}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-[18px] bg-gradient-to-br from-[#235b30] via-[#22945f] to-[#65b741] p-3 text-white shadow-[0_16px_34px_rgba(34,148,95,0.2)] sm:mt-5 sm:rounded-[22px] sm:p-4">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>Daily goal</span>
              <span>
                {selectedDay.totalCalories.toLocaleString()} /{" "}
                {hasDailyGoal
                  ? `${selectedDay.goalCalories.toLocaleString()} kcal`
                  : "No goal set"}
              </span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/20 ring-1 ring-white/25">
              <div
                className="h-full rounded-full bg-[#c9f087]"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-white/70">{selectedDay.note}</p>
          </div>

          <section className="mt-4 sm:mt-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-[#e8f7df] text-[#22945f] ring-1 ring-[#dce9d4]">
                <IconHistory className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-bold">Diary meals</h2>
                <p className="text-xs text-[#687566]">
                  {selectedDay.meals.length} entries for this day
                </p>
              </div>
            </div>

            {selectedDay.meals.length > 0 ? (
              <div className="mt-4 space-y-3">
                {selectedDay.meals.map((meal) => (
                  <article
                    key={meal.id}
                    className="app-card rounded-[18px] p-3 sm:rounded-[20px]"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`grid size-10 shrink-0 place-items-center rounded-xl text-[#235b30] sm:size-12 sm:rounded-2xl ${meal.accentColor}`}
                      >
                        <IconSalad className="size-6" aria-hidden="true" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-bold">
                              {meal.title}
                            </h3>
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-[#687566]">
                              <IconClock
                                className="size-4"
                                aria-hidden="true"
                              />
                              {meal.mealType} - {meal.time}
                            </p>
                          </div>
                          <p className="shrink-0 text-right text-lg font-bold text-[#235b30]">
                            {meal.calories}
                            <span className="block text-xs text-[#687566]">
                              kcal
                            </span>
                          </p>
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <MacroPill
                            label="Protein"
                            value={meal.macros.protein}
                          />
                          <MacroPill label="Carbs" value={meal.macros.carbs} />
                          <MacroPill label="Fat" value={meal.macros.fat} />
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenEditMeal(selectedDay.date, meal)
                            }
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#eef8e7] px-3 text-xs font-bold text-[#235b30] ring-1 ring-[#dce9d4] transition hover:-translate-y-0.5 hover:bg-[#e3f3da] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#65b741]"
                          >
                            <IconEdit className="size-4" aria-hidden="true" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenDeleteMeal(selectedDay.date, meal)
                            }
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-white px-3 text-xs font-bold text-[#a94f35] ring-1 ring-[#f2d8ca] transition hover:-translate-y-0.5 hover:bg-[#fff5ee] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e77755]"
                          >
                            <IconTrash className="size-4" aria-hidden="true" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-[20px] border border-dashed border-[#b8d4aa] bg-white/60 p-4 text-center">
                <p className="text-sm font-bold">No meals logged</p>
                <p className="mt-1 text-xs text-[#687566]">
                  Choose another day or add a meal from the Analyze screen.
                </p>
              </div>
            )}
          </section>
        </section>
      </section>

      {editingMeal && mealFormValues ? (
        <div
          className="fixed inset-0 z-[100] flex items-end bg-[#172019]/35 p-3 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-history-meal-title"
        >
          <form
            onSubmit={handleEditMealSubmit}
            className="app-panel max-h-[calc(100vh-1.5rem)] w-full overflow-y-auto rounded-[28px] p-4 text-[#172019] sm:max-w-lg sm:p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#22945f]">
                  Edit history
                </p>
                <h2
                  id="edit-history-meal-title"
                  className="mt-1 text-2xl font-bold leading-tight"
                >
                  Update meal
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCloseEditMeal}
                className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#235b30] shadow-[0_8px_18px_rgba(56,103,43,0.1)] ring-1 ring-[#e1edd8] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#65b741]"
                aria-label="Close meal editor"
              >
                <IconX className="size-5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-bold">Meal name</span>
                <input
                  type="text"
                  value={mealFormValues.title}
                  onChange={(event) =>
                    setMealFormValues((current) =>
                      current
                        ? { ...current, title: event.target.value }
                        : current,
                    )
                  }
                  className="app-field mt-2 h-12 w-full rounded-xl px-3 text-sm font-bold outline-none"
                  required
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold">Meal type</span>
                  <select
                    value={mealFormValues.mealType}
                    onChange={(event) =>
                      setMealFormValues((current) =>
                        current
                          ? { ...current, mealType: event.target.value }
                          : current,
                      )
                    }
                    className="app-field mt-2 h-12 w-full rounded-xl px-3 text-sm font-bold outline-none"
                  >
                    {["Breakfast", "Lunch", "Dinner", "Additional"].map(
                      (mealType) => (
                        <option key={mealType} value={mealType}>
                          {mealType}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-bold">Time</span>
                  <input
                    type="time"
                    value={mealFormValues.time}
                    onChange={(event) =>
                      setMealFormValues((current) =>
                        current
                          ? { ...current, time: event.target.value }
                          : current,
                      )
                    }
                    className="app-field mt-2 h-12 w-full rounded-xl px-3 text-sm font-bold outline-none"
                    required
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-bold">Calories</span>
                <input
                  type="number"
                  min="1"
                  value={mealFormValues.calories}
                  onChange={(event) =>
                    setMealFormValues((current) =>
                      current
                        ? { ...current, calories: event.target.value }
                        : current,
                    )
                  }
                  className="app-field mt-2 h-12 w-full rounded-xl px-3 text-sm font-bold outline-none"
                  required
                />
              </label>

              <div className="grid grid-cols-3 gap-2">
                {(["protein", "carbs", "fat"] as const).map((macro) => (
                  <label key={macro} className="block">
                    <span className="text-xs font-bold capitalize text-[#687566]">
                      {macro} (g)
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={mealFormValues[macro]}
                      onChange={(event) =>
                        setMealFormValues((current) =>
                          current
                            ? { ...current, [macro]: event.target.value }
                            : current,
                        )
                      }
                      className="app-field mt-1 h-11 w-full rounded-xl px-2 text-sm font-bold outline-none"
                    />
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingMeal}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#65b741] to-[#22945f] px-4 py-2 text-sm font-bold text-white shadow-[0_14px_28px_rgba(34,148,95,0.25)] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#65b741] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <IconDeviceFloppy className="size-5" aria-hidden="true" />
              {isSavingMeal ? "Saving..." : "Save changes"}
            </button>
          </form>
        </div>
      ) : null}

      {confirmDialog ? (
        <ConfirmActionDialog
          confirmDialog={confirmDialog}
          isSaving={isSavingMeal}
          onCancel={() => setConfirmDialog(null)}
          onConfirm={async () => {
            if (confirmDialog.type === "delete") {
              await handleConfirmDeleteMeal(confirmDialog.target);
              return;
            }

            await handleConfirmEditMeal(
              confirmDialog.updatedMeal,
              confirmDialog.originalMeal,
            );
          }}
        />
      ) : null}

      <BottomNavbar />
    </main>
  );
}

function ConfirmActionDialog({
  confirmDialog,
  isSaving,
  onCancel,
  onConfirm,
}: {
  confirmDialog: ConfirmDialogState;
  isSaving: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  const isDelete = confirmDialog.type === "delete";
  const mealTitle = isDelete
    ? confirmDialog.target.meal.title
    : confirmDialog.updatedMeal.title;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end bg-[#172019]/35 p-3 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-history-action-title"
    >
      <section className="app-panel w-full rounded-[28px] p-4 text-[#172019] sm:max-w-md sm:p-5">
        <div className="flex items-start gap-3">
          <span
            className={[
              "grid size-11 shrink-0 place-items-center rounded-2xl",
              isDelete
                ? "bg-[#fff0df] text-[#a94f35]"
                : "bg-[#e8f7df] text-[#22945f]",
            ].join(" ")}
          >
            <IconAlertTriangle className="size-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#22945f]">
              Confirm action
            </p>
            <h2
              id="confirm-history-action-title"
              className="mt-1 text-xl font-bold leading-tight"
            >
              {isDelete ? "Delete this meal?" : "Save these changes?"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#687566]">
              {isDelete
                ? `${mealTitle} will be removed from this day.`
                : `${mealTitle} will be updated in your meal history.`}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-bold text-[#253025] shadow-[0_10px_22px_rgba(56,103,43,0.1)] ring-1 ring-[#e1edd8] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#65b741]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className={[
              "inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-bold transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
              isDelete
                ? "bg-[#fff0df] text-[#a94f35] ring-1 ring-[#f2d8ca] focus-visible:outline-[#e77755]"
                : "bg-gradient-to-br from-[#65b741] to-[#22945f] text-white shadow-[0_12px_24px_rgba(34,148,95,0.24)] focus-visible:outline-[#65b741]",
            ].join(" ")}
          >
            {isSaving ? "Saving..." : isDelete ? "Delete meal" : "Save changes"}
          </button>
        </div>
      </section>
    </div>
  );
}

function MacroPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-[#f1f8ec] px-2 py-1 text-center ring-1 ring-[#e1edd8]">
      <p className="truncate text-[10px] font-bold uppercase text-[#687566]">
        {label}
      </p>
      <p className="text-xs font-bold text-[#235b30]">{value}g</p>
    </div>
  );
}
