import { MetricCard } from "@/components/dashboard/MetricCard";
import { getAdminWidgets, getCoachWidgets } from "@/lib/mock-data";
import { UserRole } from "@/types";

interface IndexProps {
  currentRole: UserRole;
}

const Index = ({ currentRole }: IndexProps) => {
  const widgets = currentRole === "admin" 
    ? getAdminWidgets() 
    : currentRole === "coach" 
    ? getCoachWidgets("coach1")
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {currentRole === "admin" ? "Admin Overview" : "Your Dashboard"}
        </h1>
        <p className="text-muted-foreground">
          {currentRole === "admin" 
            ? "Monitor system health, user metrics, and business performance"
            : "Review your clients, priorities, and today's action items"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {widgets.map((widget) => (
          <MetricCard key={widget.id} widget={widget} />
        ))}
      </div>

      {currentRole === "client" && (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <h2 className="text-2xl font-semibold mb-2">Client View Coming Soon</h2>
          <p className="text-muted-foreground">
            Your personalized plan, routine calendar, and feedback history will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default Index;
