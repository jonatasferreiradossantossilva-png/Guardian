import { MainSidebar } from "@/components/dashboard/main-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-screen bg-background">
        <MainSidebar />
        <div className="relative flex flex-1 flex-col">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
