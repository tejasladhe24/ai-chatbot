import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";

import { convertToUIMessages } from "@/lib/utils";
import { databaseService } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Chat } from "@/components/chat";
import { AppUsage, DEFAULT_CHAT_MODEL } from "@workspace/ai";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await databaseService.getChatById({ id });

  if (!chat) {
    notFound();
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.session.activeOrganizationId) {
    return notFound();
  }

  const member = await databaseService.getMemberByUserIdAndOrganizationId({
    userId: session.user.id,
    organizationId: session.session.activeOrganizationId,
  });

  if (!member) {
    return notFound();
  }

  if (chat.visibility === "private") {
    if (!session.user || member.id !== chat.memberId) {
      return notFound();
    }
  }

  const messagesFromDb = await databaseService.getMessagesByChatId({
    id,
  });

  const uiMessages = convertToUIMessages(messagesFromDb);

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get("chat-model");

  return (
    <Chat
      id={chat.id}
      initialChatModel={chatModelFromCookie?.value ?? DEFAULT_CHAT_MODEL}
      initialLastContext={(chat.lastContext as AppUsage) ?? undefined}
      initialVisibilityType={chat.visibility}
      initialMessages={uiMessages}
      isReadonly={member.id !== chat.memberId}
      autoResume={false}
    />
  );
}
