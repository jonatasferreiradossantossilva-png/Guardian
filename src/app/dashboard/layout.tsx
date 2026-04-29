import { MainSidebar } from "@/components/dashboard/main-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";
import { ClientOnly } from "@/components/shared/client-only";
import { ErrorBoundary } from "@/components/shared/error-boundary";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background w-full overflow-hidden">
        <MainSidebar />
        <div className="relative flex flex-1 flex-col min-w-0 overflow-hidden">
          <ClientOnly>
            <DashboardHeader />
          </ClientOnly>
          
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-[100px] md:pb-8">
            <div className="mx-auto w-full max-w-7xl">
                <ErrorBoundary name="DashboardContent">
                    {children}
                </ErrorBoundary>
            </div>
          </main>
          
          <ClientOnly>
            <MobileBottomNav />
          </ClientOnly>
        </div>
      </div>
    </SidebarProvider>
  );
}
