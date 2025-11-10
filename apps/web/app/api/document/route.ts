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

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatSDKError(
      "bad_request:api",
      "Parameter id is required."
    ).toResponse();
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return new ChatSDKError("unauthorized:document").toResponse();
  }

  if (!session.session.activeOrganizationId) {
    return new ChatSDKError("unauthorized:document").toResponse();
  }

  const member = await databaseService.getMemberByUserIdAndOrganizationId({
    userId: session.user.id,
    organizationId: session.session.activeOrganizationId,
  });

  if (!member) {
    return new ChatSDKError("unauthorized:document").toResponse();
  }

  const {
    content,
    title,
    kind,
  }: { content: string; title: string; kind: DBArtifactKind } =
    await request.json();

  const documents = await databaseService.getDocumentsById({ id });

  if (documents.length > 0) {
    const [doc] = documents;

    if (doc?.memberId !== member.id) {
      return new ChatSDKError("forbidden:document").toResponse();
    }
  }

  const document = await databaseService.saveDocument({
    id,
    content,
    title,
    kind,
    memberId: member.id,
  });

  return Response.json(document, { status: 200 });
}
