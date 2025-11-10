import { auth } from "@/lib/auth";
import { ChatSDKError } from "@/lib/errors";
import { headers } from "next/headers";
import { databaseService } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("documentId");

  if (!documentId) {
    return new ChatSDKError(
      "bad_request:api",
      "Parameter documentId is required."
    ).toResponse();
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || !session.session.activeOrganizationId) {
    return new ChatSDKError("unauthorized:suggestions").toResponse();
  }

  const member = await databaseService.getMemberByUserIdAndOrganizationId({
    userId: session.user.id,
    organizationId: session.session.activeOrganizationId,
  });

  if (!member) {
    return new ChatSDKError("unauthorized:suggestions").toResponse();
  }

  const suggestions = await databaseService.getSuggestionsByDocumentId({
    documentId,
  });

  const [suggestion] = suggestions;

  if (!suggestion) {
    return Response.json([], { status: 200 });
  }

  if (suggestion.memberId !== member.id) {
    return new ChatSDKError("forbidden:api").toResponse();
  }

  return Response.json(suggestions, { status: 200 });
}
