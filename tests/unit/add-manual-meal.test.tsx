import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AlertProvider } from "@/components/ui/alert-provider";
import { AddManualMeal } from "@/features/dashboard/components/AddManualMeal";

async function fillRequiredFields() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Meal name"), "Chicken salad");
  await user.type(screen.getByLabelText("Calories"), "380");
  return user;
}

describe("AddManualMeal", () => {
  it("validates required fields before calling APIs", async () => {
    const onAddMeal = vi.fn();
    render(
      <AlertProvider>
        <AddManualMeal
          isOpen
          isSaving={false}
          isLoggingMeal={false}
          onAddMeal={onAddMeal}
          onSaveExistingMeal={vi.fn()}
          onClose={vi.fn()}
        />
      </AlertProvider>,
    );

    const dialog = screen.getByRole("dialog");
    const form = dialog.querySelector("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    expect(await screen.findByText("Meal name is required.")).toBeVisible();
    expect(screen.getByText("Calories are required.")).toBeVisible();
    expect(onAddMeal).not.toHaveBeenCalled();
  });

  it("logs the meal before saving it for reuse", async () => {
    const calls: string[] = [];
    const onAddMeal = vi.fn(async () => {
      calls.push("log");
      return true;
    });
    const onSaveExistingMeal = vi.fn(async () => {
      calls.push("save");
      return true;
    });
    render(
      <AlertProvider>
        <AddManualMeal
          isOpen
          isSaving={false}
          isLoggingMeal={false}
          onAddMeal={onAddMeal}
          onSaveExistingMeal={onSaveExistingMeal}
          onClose={vi.fn()}
        />
      </AlertProvider>,
    );

    const user = await fillRequiredFields();
    await user.click(screen.getByRole("button", { name: /add meal/i }));

    expect(calls).toEqual(["log", "save"]);
    expect(await screen.findByText("Meal saved and logged")).toBeVisible();
  });

  it("reports a partial save without attempting another daily log", async () => {
    const onAddMeal = vi.fn().mockResolvedValue(true);
    const onSaveExistingMeal = vi.fn().mockResolvedValue(false);
    const onClose = vi.fn();
    render(
      <AlertProvider>
        <AddManualMeal
          isOpen
          isSaving={false}
          isLoggingMeal={false}
          onAddMeal={onAddMeal}
          onSaveExistingMeal={onSaveExistingMeal}
          onClose={onClose}
        />
      </AlertProvider>,
    );

    const user = await fillRequiredFields();
    await user.click(screen.getByRole("button", { name: /add meal/i }));

    expect(onAddMeal).toHaveBeenCalledTimes(1);
    expect(onSaveExistingMeal).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/logged, but could not be saved for reuse/i)).toBeVisible();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
