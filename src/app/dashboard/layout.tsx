import { MainSidebar } from "@/components/dashboard/main-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { FirebaseClientProvider } from "@/firebase";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseClientProvider>
      <SidebarProvider>
        <div className="flex min-h-screen">
          <MainSidebar />
          <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </FirebaseClientProvider>
  );
}
