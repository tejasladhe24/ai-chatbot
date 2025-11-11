import { auth } from "@/lib/auth";
import { ChatSDKError } from "@/lib/errors";
import { headers } from "next/headers";
import { databaseService } from "@/lib/db";
import { DBArtifactKind } from "@workspace/database/types";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return new ChatSDKError(
      "bad_request:api",
      "Parameter id is missing"
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

  const documents = await databaseService.getDocumentsById({ id });

  const [document] = documents;

  if (!document) {
    return new ChatSDKError("not_found:document").toResponse();
  }

  if (document.memberId !== member.id) {
    return new ChatSDKError("forbidden:document").toResponse();
  }

  return Response.json(documents, { status: 200 });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return new ChatSDKError(
      "bad_request:api",
      "Parameter id is missing"
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const searchParams = new URL(request.url).searchParams;

  const timestamp = searchParams.get("timestamp");

  if (!id) {
    return new ChatSDKError(
      "bad_request:api",
      "Parameter id is required."
    ).toResponse();
  }

  if (!timestamp) {
    return new ChatSDKError(
      "bad_request:api",
      "Parameter timestamp is required."
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

  const documents = await databaseService.getDocumentsById({ id });

  const [document] = documents;

  if (document?.memberId !== member.id) {
    return new ChatSDKError("forbidden:document").toResponse();
  }

  const documentsDeleted =
    await databaseService.deleteDocumentsByIdAfterTimestamp({
      id,
      timestamp: new Date(timestamp),
    });

  return Response.json(documentsDeleted, { status: 200 });
}
