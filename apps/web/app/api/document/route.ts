import { auth } from "@/lib/auth";
import type { DBArtifactKind } from "@workspace/database/types";
import { ChatSDKError } from "@/lib/errors";
import { headers } from "next/headers";
import { databaseService } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const limit = Number.parseInt(searchParams.get("limit") || "10", 10);
  const startingAfter = searchParams.get("starting_after");
  const endingBefore = searchParams.get("ending_before");

  if (startingAfter && endingBefore) {
    return new ChatSDKError(
      "bad_request:api",
      "Only one of starting_after or ending_before can be provided."
    ).toResponse();
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || !session.session.activeOrganizationId) {
    return new ChatSDKError("unauthorized:document").toResponse();
  }

  const member = await databaseService.getMemberByUserIdAndOrganizationId({
    userId: session.user.id,
    organizationId: session.session.activeOrganizationId,
  });

  if (!member) {
    return new ChatSDKError("unauthorized:document").toResponse();
  }

  const docs = await databaseService.getInfiniteDocumentsByMemberId({
    memberId: member.id,
    limit,
    startingAfter,
    endingBefore,
  });

  return Response.json(docs);
}
