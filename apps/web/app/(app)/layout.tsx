import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  SidebarProvider,
  SidebarInset,
} from "@workspace/ui/components/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { auth } from "@/lib/auth";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionPromise = auth.api.getSession({
    headers: await headers(),
  });

  const isCollapsedPromise = cookies().then(
    (cookieStore) => cookieStore.get("sidebar_state")?.value !== "true"
  );

  const [session, isCollapsed] = await Promise.all([
    sessionPromise,
    isCollapsedPromise,
  ]);

  if (!session) {
    redirect("/login");
  }

  if (!session.session.activeOrganizationId) {
    redirect("/onboarding");
  }

  return (
    <div className="h-svh overflow-hidden">
      <SidebarProvider defaultOpen={!isCollapsed}>
        <AppSidebar />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </div>
  );
}
