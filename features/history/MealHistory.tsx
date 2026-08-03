"use client";

import { type FormEvent, useMemo, useState } from "react";
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

import { useAlert } from "@/components/ui/alert-provider";
import { BottomNavbar } from "@/components/layout/BottomNavbar";
import type { FoodItem } from "@/features/dashboard/types";
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
const today = new Date();
const currentMonth = today.getMonth() + 1;
const currentYear = today.getFullYear();
const currentDay = today.getDate();
const yearWindow = 5;

const stats: Stat[] = [
  {
    key: "totalCalories",
    label: "Total",
    Icon: IconFlame,
    color: "bg-[#ffdf5d]",
    getValue: (day) => day.totalCalories.toLocaleString(),
    suffix: "kcal",
  },
  {
    key: "averageCalories",
    label: "Average",
    Icon: IconTrendingUp,
    color: "bg-[#dbe8a7]",
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
    color: "bg-[#bff4ff]",
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
  const weekday = new Date(date).toLocaleDateString("en-US", {
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

function formatDateKey(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return formatLocalDate(new Date());
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
    .sort((firstDay, secondDay) =>
      firstDay.date.localeCompare(secondDay.date),
    );
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
  const { data: user, isLoading: isLoadingUser } = useGetMeQuery();
  const activeUserId = user?.id ?? "";
  const dailyGoalCalories = user?.kcalGoal ?? null;
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedDayNumber, setSelectedDayNumber] = useState(currentDay);
  const [editingMeal, setEditingMeal] = useState<EditingMeal | null>(null);
  const [mealFormValues, setMealFormValues] = useState<MealFormValues | null>(
    null,
  );
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(
    null,
  );
  const {
    data: foodItems = [],
    isLoading: isLoadingHistory,
    isFetching: isFetchingHistory,
    isError: hasHistoryError,
  } = useGetMealCalendarHistoryQuery(
    {
      month: selectedMonth,
      year: selectedYear,
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
          eatenAt: `${originalMeal.date}T${updatedMeal.time}:00`,
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
    <main className="min-h-screen bg-[#fff7df] px-4 pb-28 pt-5 text-[#20342d] sm:px-6 lg:px-10">
      <section className="mx-auto w-full max-w-3xl">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b6532d]">
              Meal diary
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
              {selectedMonthLabel}
            </h1>
            <p className="mt-1 text-sm font-bold text-[#66766f]">
              Pick a day to review meals and calories.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="diary-month">
              Select month
            </label>
            <select
              id="diary-month"
              value={selectedMonth}
              onChange={(event) => handleMonthChange(Number(event.target.value))}
              className="h-11 rounded-full border-2 border-[#20342d] bg-white px-3 text-sm font-black shadow-[0_4px_0_#20342d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20342d]"
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
              className="h-11 rounded-full border-2 border-[#20342d] bg-white px-3 text-sm font-black shadow-[0_4px_0_#20342d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20342d]"
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
            className="mt-5 rounded-[1rem] border-2 border-[#20342d] bg-[#fff0df] p-4 text-center shadow-[0_4px_0_#20342d]"
            role="status"
          >
            <p className="text-sm font-black">History could not load</p>
            <p className="mt-1 text-xs font-bold text-[#66766f]">
              {entriesError}
            </p>
          </div>
        ) : isLoadingEntries ? (
          <div
            className="mt-5 rounded-[1rem] border-2 border-[#20342d] bg-white p-4 text-center shadow-[0_4px_0_#20342d]"
            role="status"
          >
            <p className="text-sm font-black">Loading meal history...</p>
            <p className="mt-1 text-xs font-bold text-[#66766f]">
              Syncing your logged meals.
            </p>
          </div>
        ) : null}

        <section className="mt-5 rounded-[1.5rem] border-2 border-[#20342d] bg-white p-3 shadow-[0_8px_0_#20342d] sm:p-5">
          <div className="flex items-center gap-3 px-1">
            <span className="grid size-10 place-items-center rounded-full border-2 border-[#20342d] bg-[#dbe8a7]">
              <IconCalendarMonth className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-black">{selectedMonthLabel}</h2>
              <p className="text-xs font-bold text-[#66766f]">
                Daily calorie diary
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1.5">
            {weekdays.map((weekday) => (
              <p
                key={weekday}
                className="text-center text-[10px] font-black uppercase text-[#66766f]"
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
                    "relative aspect-square rounded-[0.85rem] border-2 border-[#20342d] text-sm font-black transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20342d]",
                    isSelected
                      ? "bg-[#ffdf5d] shadow-[0_3px_0_#20342d]"
                      : "bg-[#f3fbf1] hover:-translate-y-0.5",
                  ].join(" ")}
                >
                  <span>{day}</span>
                  {hasMeals ? (
                    <span className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#b6532d]" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-5 rounded-[1.5rem] border-2 border-[#20342d] bg-white p-4 shadow-[0_10px_0_#20342d] sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#b6532d]">
                {selectedDay.weekday}
              </p>
              <h2 className="mt-1 text-2xl font-black leading-none">
                {monthLabel} {selectedDay.day}
              </h2>
            </div>
            <span className="rounded-full border-2 border-[#20342d] bg-[#fff7df] px-3 py-1 text-xs font-black">
              {hasDailyGoal ? `${goalProgress}% goal` : "No goal set"}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-[1rem] border-2 border-[#20342d] bg-[#fbfff9] shadow-[3px_3px_0_#20342d]">
            {stats.map((stat) => {
              const Icon = stat.Icon;

              return (
                <div
                  key={stat.key}
                  className="border-r-2 border-[#20342d] p-3 last:border-r-0"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-full border-2 border-[#20342d] ${stat.color}`}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[10px] font-black uppercase tracking-[0.1em] text-[#66766f]">
                        {stat.label}
                      </p>
                      <p className="mt-1 truncate text-xl font-black leading-none text-[#20342d]">
                        {stat.getValue(selectedDay)}
                      </p>
                    </div>
                  </div>

                  <p className="mt-2 truncate text-[10px] font-black uppercase text-[#66766f]">
                    {stat.suffix}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-[1.25rem] border-2 border-[#20342d] bg-[#20342d] p-4 text-white">
            <div className="flex items-center justify-between text-xs font-black">
              <span>Daily goal</span>
              <span>
                {selectedDay.totalCalories.toLocaleString()} /{" "}
                {hasDailyGoal
                  ? `${selectedDay.goalCalories.toLocaleString()} kcal`
                  : "No goal set"}
              </span>
            </div>
            <div className="mt-2 h-4 overflow-hidden rounded-full border-2 border-white bg-white/10">
              <div
                className="h-full rounded-r-full bg-[#52c79f]"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            <p className="mt-3 text-xs font-bold text-white/70">
              {selectedDay.note}
            </p>
          </div>

          <section className="mt-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full border-2 border-[#20342d] bg-[#bff4ff]">
                <IconHistory className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-black">Diary meals</h2>
                <p className="text-xs font-bold text-[#66766f]">
                  {selectedDay.meals.length} entries for this day
                </p>
              </div>
            </div>

            {selectedDay.meals.length > 0 ? (
              <div className="mt-4 space-y-3">
                {selectedDay.meals.map((meal) => (
                  <article
                    key={meal.id}
                    className="rounded-[1.1rem] border-2 border-[#20342d] bg-white p-3 shadow-[3px_3px_0_#20342d]"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`grid size-12 shrink-0 place-items-center rounded-full border-2 border-[#20342d] ${meal.accentColor}`}
                      >
                        <IconSalad className="size-6" aria-hidden="true" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-black">
                              {meal.title}
                            </h3>
                            <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#66766f]">
                              <IconClock className="size-4" aria-hidden="true" />
                              {meal.mealType} - {meal.time}
                            </p>
                          </div>
                          <p className="shrink-0 text-right text-lg font-black">
                            {meal.calories}
                            <span className="block text-xs font-bold text-[#66766f]">
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
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border-2 border-[#20342d] bg-[#ffdf5d] px-3 text-xs font-black text-[#20342d] shadow-[2px_2px_0_#20342d] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20342d]"
                          >
                            <IconEdit className="size-4" aria-hidden="true" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenDeleteMeal(selectedDay.date, meal)
                            }
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border-2 border-[#20342d] bg-white px-3 text-xs font-black text-[#20342d] shadow-[2px_2px_0_#20342d] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20342d]"
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
              <div className="mt-4 rounded-[1.1rem] border-2 border-dashed border-[#20342d] bg-[#fff7df] p-4 text-center">
                <p className="text-sm font-black">No meals logged</p>
                <p className="mt-1 text-xs font-bold text-[#66766f]">
                  Choose another day or add a meal from the Analyze screen.
                </p>
              </div>
            )}
          </section>
        </section>
      </section>

      {editingMeal && mealFormValues ? (
        <div
          className="fixed inset-0 z-[100] flex items-end bg-[#20342d]/45 p-3 sm:items-center sm:justify-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-history-meal-title"
        >
          <form
            onSubmit={handleEditMealSubmit}
            className="max-h-[calc(100vh-1.5rem)] w-full overflow-y-auto rounded-[1.5rem] border-2 border-[#20342d] bg-white p-4 text-[#20342d] shadow-[0_8px_0_#20342d] sm:max-w-lg sm:p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#b6532d]">
                  Edit history
                </p>
                <h2
                  id="edit-history-meal-title"
                  className="mt-1 text-2xl font-black leading-tight"
                >
                  Update meal
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCloseEditMeal}
                className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-[#20342d] bg-white text-[#20342d] shadow-[2px_2px_0_#20342d] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20342d]"
                aria-label="Close meal editor"
              >
                <IconX className="size-5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-black">Meal name</span>
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
                  className="mt-2 h-12 w-full rounded-[0.9rem] border-2 border-[#20342d] bg-[#f3fbf1] px-3 text-sm font-bold outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20342d]"
                  required
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-black">Meal type</span>
                  <select
                    value={mealFormValues.mealType}
                    onChange={(event) =>
                      setMealFormValues((current) =>
                        current
                          ? { ...current, mealType: event.target.value }
                          : current,
                      )
                    }
                    className="mt-2 h-12 w-full rounded-[0.9rem] border-2 border-[#20342d] bg-white px-3 text-sm font-bold outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20342d]"
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
                  <span className="text-sm font-black">Time</span>
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
                    className="mt-2 h-12 w-full rounded-[0.9rem] border-2 border-[#20342d] bg-white px-3 text-sm font-bold outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20342d]"
                    required
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-black">Calories</span>
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
                  className="mt-2 h-12 w-full rounded-[0.9rem] border-2 border-[#20342d] bg-[#fff7df] px-3 text-sm font-bold outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20342d]"
                  required
                />
              </label>

              <div className="grid grid-cols-3 gap-2">
                {(["protein", "carbs", "fat"] as const).map((macro) => (
                  <label key={macro} className="block">
                    <span className="text-xs font-black capitalize text-[#66766f]">
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
                      className="mt-1 h-11 w-full rounded-[0.8rem] border-2 border-[#20342d] bg-white px-2 text-sm font-bold outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20342d]"
                    />
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingMeal}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-[#20342d] bg-[#ffdf5d] px-4 py-2 text-sm font-black shadow-[0_4px_0_#20342d] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20342d] disabled:cursor-not-allowed disabled:bg-white disabled:text-[#66766f]"
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
      className="fixed inset-0 z-[120] flex items-end bg-[#20342d]/55 p-3 sm:items-center sm:justify-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-history-action-title"
    >
      <section className="w-full rounded-[1.5rem] border-2 border-[#20342d] bg-white p-4 text-[#20342d] shadow-[0_8px_0_#20342d] sm:max-w-md sm:p-5">
        <div className="flex items-start gap-3">
          <span
            className={[
              "grid size-11 shrink-0 place-items-center rounded-full border-2 border-[#20342d]",
              isDelete ? "bg-[#fff0df]" : "bg-[#ffdf5d]",
            ].join(" ")}
          >
            <IconAlertTriangle className="size-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#b6532d]">
              Confirm action
            </p>
            <h2
              id="confirm-history-action-title"
              className="mt-1 text-xl font-black leading-tight"
            >
              {isDelete ? "Delete this meal?" : "Save these changes?"}
            </h2>
            <p className="mt-2 text-sm font-bold leading-6 text-[#66766f]">
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
            className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-[#20342d] bg-white px-4 text-sm font-black shadow-[0_4px_0_#20342d] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20342d]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className={[
              "inline-flex min-h-11 items-center justify-center rounded-full border-2 border-[#20342d] px-4 text-sm font-black shadow-[0_4px_0_#20342d] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20342d] disabled:cursor-not-allowed disabled:bg-white disabled:text-[#66766f]",
              isDelete ? "bg-[#fff0df]" : "bg-[#ffdf5d]",
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
    <div className="rounded-full border-2 border-[#20342d] bg-[#fff7df] px-2 py-1 text-center">
      <p className="truncate text-[10px] font-black uppercase text-[#66766f]">
        {label}
      </p>
      <p className="text-xs font-black">{value}g</p>
    </div>
  );
}
