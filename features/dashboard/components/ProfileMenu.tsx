"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { useAlert } from "@/components/ui/alert-provider";
import { logout } from "@/features/authentication/api";
import {
  type DietMode,
  type UpdateProfileInput,
  type UserProfile,
  useGetProfileQuery,
  useUpdateProfileMutation,
} from "@/store/api";

import { Check, Ruler, Scale, UserCog, X } from "./icons";

type ProfileMenuProps = {
  user: UserProfile;
};

type ProfileFormValues = {
  name: string;
  heightCm: string;
  weightKg: string;
  dietMode: DietMode | "";
  kcalGoal: string;
  proteinGoal: string;
  fatGoal: string;
  carbGoal: string;
};

const dietModes: Array<{ value: DietMode; label: string }> = [
  { value: "lose", label: "Lose weight" },
  { value: "maintain", label: "Maintain weight" },
  { value: "gain", label: "Gain weight" },
];

const emptyForm: ProfileFormValues = {
  name: "",
  heightCm: "",
  weightKg: "",
  dietMode: "",
  kcalGoal: "",
  proteinGoal: "",
  fatGoal: "",
  carbGoal: "",
};

function toInputValue(value: number | null) {
  return value === null ? "" : String(value);
}

function profileToFormValues(profile: UserProfile): ProfileFormValues {
  return {
    name: profile.name ?? "",
    heightCm: toInputValue(profile.heightCm),
    weightKg: toInputValue(profile.weightKg),
    dietMode: profile.dietMode ?? "",
    kcalGoal: toInputValue(profile.kcalGoal),
    proteinGoal: toInputValue(profile.proteinGoal),
    fatGoal: toInputValue(profile.fatGoal),
    carbGoal: toInputValue(profile.carbGoal),
  };
}

function optionalNumber(value: string) {
  return value.trim() === "" ? null : Number(value);
}

function createUpdatePayload(values: ProfileFormValues): UpdateProfileInput {
  return {
    name: values.name.trim() || null,
    heightCm: optionalNumber(values.heightCm),
    weightKg: optionalNumber(values.weightKg),
    dietMode: values.dietMode || null,
    kcalGoal: optionalNumber(values.kcalGoal),
    proteinGoal: optionalNumber(values.proteinGoal),
    fatGoal: optionalNumber(values.fatGoal),
    carbGoal: optionalNumber(values.carbGoal),
  };
}

function getErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return "Please try again.";
  }

  if ("data" in error) {
    const data = error.data;
    if (typeof data === "string") {
      return data;
    }
    if (data && typeof data === "object" && "message" in data) {
      const message = data.message;
      if (typeof message === "string") {
        return message;
      }
      if (Array.isArray(message)) {
        return message.join(" ");
      }
    }
  }

  if ("message" in error && typeof error.message === "string") {
    return error.message;
  }

  return "Please try again.";
}

function isValidOptionalNumber(value: string, minimum: number) {
  if (value.trim() === "") {
    return true;
  }

  const number = Number(value);
  return Number.isFinite(number) && number >= minimum;
}

function roundToStep(value: number, step: number) {
  return Math.round(value / step) * step;
}

function calculateGoalEstimate(values: ProfileFormValues) {
  const weightKg = Number(values.weightKg);
  const heightCm = Number(values.heightCm);

  if (!Number.isFinite(weightKg) || !Number.isFinite(heightCm)) {
    return null;
  }

  if (weightKg < 1 || heightCm < 1) {
    return null;
  }

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const bmiAdjustment = bmi >= 30 ? 0.95 : bmi < 18.5 ? 1.05 : 1;
  const modeMultiplier =
    values.dietMode === "lose" ? 0.85 : values.dietMode === "gain" ? 1.1 : 1;

  const maintenanceCalories = weightKg * 30 * bmiAdjustment;
  const kcalGoal = Math.max(
    1200,
    roundToStep(maintenanceCalories * modeMultiplier, 25),
  );
  const proteinPerKg =
    values.dietMode === "gain" ? 1.8 : values.dietMode === "lose" ? 1.9 : 1.6;
  const proteinGoal = roundToStep(weightKg * proteinPerKg, 5);
  const fatGoal = roundToStep((kcalGoal * 0.25) / 9, 5);
  const carbGoal = Math.max(
    0,
    roundToStep((kcalGoal - proteinGoal * 4 - fatGoal * 9) / 4, 5),
  );

  return {
    kcalGoal: String(kcalGoal),
    proteinGoal: String(proteinGoal),
    fatGoal: String(fatGoal),
    carbGoal: String(carbGoal),
  };
}

export function ProfileMenu({ user }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileFormValues, setProfileFormValues] =
    useState<ProfileFormValues>(emptyForm);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState("");
  const { data: profile } = useGetProfileQuery();
  const [updateProfile, { isLoading: isUpdatingProfile }] =
    useUpdateProfileMutation();
  const { showAlert } = useAlert();

  const latestProfile = profile ?? user;
  const formIsValid =
    isValidOptionalNumber(profileFormValues.heightCm, 1) &&
    isValidOptionalNumber(profileFormValues.weightKg, 1) &&
    isValidOptionalNumber(profileFormValues.kcalGoal, 0) &&
    isValidOptionalNumber(profileFormValues.proteinGoal, 0) &&
    isValidOptionalNumber(profileFormValues.fatGoal, 0) &&
    isValidOptionalNumber(profileFormValues.carbGoal, 0);

  const handleChange = <Field extends keyof ProfileFormValues>(
    field: Field,
    value: ProfileFormValues[Field],
  ) => {
    setSavedMessage("");
    setProfileError(null);
    setProfileFormValues((current) => ({ ...current, [field]: value }));
  };

  const handleCalculateGoals = () => {
    setSavedMessage("");
    setProfileError(null);

    const estimate = calculateGoalEstimate(profileFormValues);

    if (!estimate) {
      setProfileError("Add valid height and weight before calculating daily goals.");
      return;
    }

    setProfileFormValues((current) => ({ ...current, ...estimate }));
  };

  const openProfileModal = () => {
    setIsOpen(false);
    setProfileError(null);
    setSavedMessage("");
    setProfileFormValues(profileToFormValues(latestProfile));
    setIsProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setProfileError(null);
    setSavedMessage("");
    setIsProfileModalOpen(false);
  };

  useEffect(() => {
    if (!isProfileModalOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeProfileModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isProfileModalOpen]);

  const handleProfileSave = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formIsValid) {
      setProfileError("Enter valid positive values for profile measurements.");
      return;
    }

    try {
      const savedProfile = await updateProfile(
        createUpdatePayload(profileFormValues),
      ).unwrap();

      setProfileFormValues(profileToFormValues(savedProfile));
      setSavedMessage("Profile saved.");
      showAlert({
        title: "Profile saved",
        message: "Your dashboard goals are now up to date.",
      });
      setIsProfileModalOpen(false);
    } catch (error) {
      const message = getErrorMessage(error);
      setProfileError(message);
      showAlert({
        type: "error",
        title: "Profile not saved",
        message,
      });
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex rounded-2xl shadow-[0_10px_24px_rgba(56,103,43,0.14)] ring-1 ring-white focus:outline-none focus:ring-2 focus:ring-[#65b741] focus:ring-offset-2"
        aria-label="Open profile menu"
        aria-expanded={isOpen}
      >
        {latestProfile.image ? (
          <Image
            src={latestProfile.image}
            alt=""
            width={50}
            height={50}
            className="size-12 rounded-2xl object-cover"
          />
        ) : (
          <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#65b741] to-[#22945f] text-sm font-bold text-white">
            {(latestProfile.name ?? latestProfile.email).charAt(0).toUpperCase()}
          </span>
        )}
      </button>

      {isOpen ? (
        <div className="app-panel absolute right-0 top-14 z-50 w-60 rounded-[20px] p-3">
          <p className="truncate text-sm font-semibold text-zinc-950">
            {latestProfile.name ?? latestProfile.email}
          </p>
          {latestProfile.name ? (
            <p className="mt-1 truncate text-xs text-zinc-600">
              {latestProfile.email}
            </p>
          ) : null}

          <button
            type="button"
            onClick={openProfileModal}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#65b741] to-[#22945f] px-3 py-2.5 text-sm font-bold text-white shadow-[0_10px_20px_rgba(34,148,95,0.2)] transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#65b741] focus:ring-offset-2"
          >
            <UserCog className="size-4" aria-hidden="true" />
            Edit profile
          </button>

          <button
            type="button"
            onClick={async () => {
              showAlert({
                type: "info",
                title: "Signing out",
                message: "Your session is closing.",
              });
              try {
                await logout();
                window.location.href = "/";
              } catch (error) {
                showAlert({
                  type: "error",
                  title: "Could not sign out",
                  message: getErrorMessage(error),
                });
              }
            }}
            className="mt-2 w-full rounded-xl bg-white px-3 py-2.5 text-sm font-bold text-[#235b30] ring-1 ring-[#dce9d4] transition hover:bg-[#f1f8ec] focus:outline-none focus:ring-2 focus:ring-[#65b741] focus:ring-offset-2"
          >
            Sign out
          </button>
        </div>
      ) : null}

      {isProfileModalOpen ? (
        <div
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeProfileModal();
            }
          }}
          className="fixed inset-0 z-[100] flex items-end bg-black/50 p-3 sm:items-center sm:justify-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-modal-title"
        >
          <form
            onSubmit={handleProfileSave}
            className="max-h-[calc(100vh-1.5rem)] w-full overflow-y-auto rounded-lg bg-white p-4 text-[#20342d] shadow-xl sm:max-w-lg sm:p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase text-[#b6532d]">
                  Account settings
                </p>
                <h2 id="profile-modal-title" className="mt-1 text-xl font-black">
                  Edit profile
                </h2>
              </div>
              <button
                type="button"
                onClick={closeProfileModal}
                className="grid size-9 place-items-center rounded-full border border-zinc-200 text-zinc-700 transition hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#153d35] disabled:opacity-50"
                aria-label="Close profile settings"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            {profileError ? (
              <div className="mt-4 rounded-md bg-[#fff0df] px-3 py-3 text-sm font-semibold text-[#8a321c]" role="alert">
                {profileError}
              </div>
            ) : null}

            {savedMessage ? (
              <div className="mt-4 rounded-md bg-[#f3fbf1] px-3 py-3 text-sm font-semibold text-[#153d35]" role="status">
                {savedMessage}
              </div>
            ) : null}

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold">Name</span>
                <input
                  type="text"
                  value={profileFormValues.name}
                  onChange={(event) => handleChange("name", event.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 focus:outline-none focus:ring-2 focus:ring-[#153d35]"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Ruler className="size-4" aria-hidden="true" /> Height (cm)
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    value={profileFormValues.heightCm}
                    onChange={(event) => handleChange("heightCm", event.target.value)}
                    className="mt-2 h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 focus:outline-none focus:ring-2 focus:ring-[#153d35]"
                  />
                </label>

                <label className="block">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Scale className="size-4" aria-hidden="true" /> Weight (kg)
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    value={profileFormValues.weightKg}
                    onChange={(event) => handleChange("weightKg", event.target.value)}
                    className="mt-2 h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 focus:outline-none focus:ring-2 focus:ring-[#153d35]"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-semibold">Diet mode</span>
                <select
                  value={profileFormValues.dietMode}
                  onChange={(event) => handleChange("dietMode", event.target.value as ProfileFormValues["dietMode"])}
                  className="mt-2 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 focus:outline-none focus:ring-2 focus:ring-[#153d35]"
                >
                  <option value="">Not set</option>
                  {dietModes.map((mode) => (
                    <option key={mode.value} value={mode.value}>{mode.label}</option>
                  ))}
                </select>
              </label>

              <fieldset>
                <legend className="text-sm font-black">Daily goals</legend>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="max-w-[18rem] text-xs font-medium text-zinc-600">
                    Estimated from height, weight, and diet mode. You can adjust
                    the numbers after calculating.
                  </p>
                  <button
                    type="button"
                    onClick={handleCalculateGoals}
                    disabled={
                      isUpdatingProfile ||
                      !isValidOptionalNumber(profileFormValues.heightCm, 1) ||
                      !isValidOptionalNumber(profileFormValues.weightKg, 1) ||
                      profileFormValues.heightCm.trim() === "" ||
                      profileFormValues.weightKg.trim() === ""
                    }
                    className="inline-flex min-h-9 items-center justify-center rounded-md border border-[#153d35] px-3 py-1.5 text-xs font-black text-[#153d35] transition hover:bg-[#f3fbf1] focus:outline-none focus:ring-2 focus:ring-[#153d35] focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:text-zinc-400"
                  >
                    Calculate from profile
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {([
                    ["kcalGoal", "Calories", "kcal"],
                    ["proteinGoal", "Protein", "g"],
                    ["fatGoal", "Fat", "g"],
                    ["carbGoal", "Carbs", "g"],
                  ] as const).map(([field, label, unit]) => (
                    <label key={field} className="block">
                      <span className="text-xs font-semibold text-zinc-600">{label} ({unit})</span>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={profileFormValues[field]}
                        onChange={(event) => handleChange(field, event.target.value)}
                        className="mt-1 h-11 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-950 focus:outline-none focus:ring-2 focus:ring-[#153d35]"
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile || !formIsValid}
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#ffdf5d] px-3 py-2 text-sm font-black text-[#20342d] transition hover:bg-[#f4cf43] focus:outline-none focus:ring-2 focus:ring-[#153d35] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600"
            >
              <Check className="size-4" aria-hidden="true" />
              {isUpdatingProfile ? "Saving..." : "Save profile"}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
