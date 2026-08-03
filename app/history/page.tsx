import { AlertProvider } from "@/components/ui/alert-provider";
import { MealHistory } from "@/features/history/MealHistory";

export default function MealHistoryPage() {
  return (
    <AlertProvider>
      <MealHistory />
    </AlertProvider>
  );
}
