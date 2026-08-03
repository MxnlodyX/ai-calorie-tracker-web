import { AlertProvider } from "@/components/ui/alert-provider";
import { Dashboard } from "@/features/dashboard/components/Dashboard";

export default function DashboardPage() {
  return (
    <AlertProvider>
      <Dashboard />
    </AlertProvider>
  );
}
