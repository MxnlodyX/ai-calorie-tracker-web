import { AlertProvider } from "@/components/ui/alert-provider";
import { AnalyzeMeal } from "@/features/analyze/components/AnalyzeMeal";

export default function AnalyzePage() {
  return (
    <AlertProvider>
      <AnalyzeMeal />
    </AlertProvider>
  );
}
