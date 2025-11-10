import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Onboarding } from "@/components/auth/onboarding";

export default async function OnboardingPage() {
  const allOrgs = await auth.api.listOrganizations({
    headers: await headers(),
  });

  if (allOrgs.length > 0) {
    await auth.api.setActiveOrganization({
      body: {
        organizationId: allOrgs[0]?.id,
      },
      headers: await headers(),
    });

    redirect("/");
  }

  return (
    <div className="flex flex-col h-full items-center justify-center">
      <Onboarding />
    </div>
  );
}
