import { MainSidebar } from "@/components/dashboard/main-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <MainSidebar />
        <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 bg-background">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
