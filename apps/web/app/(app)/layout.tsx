import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DataStreamProvider } from "@/components/provider/data-stream-provider";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  if (session && !session.session.activeOrganizationId) {
    redirect("/onboarding");
  }

  return (
    <div className="h-svh overflow-hidden">
      <DataStreamProvider>{children}</DataStreamProvider>
    </div>
  );
}
