import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Chat } from "@/components/chat";
import { DEFAULT_CHAT_MODEL } from "@workspace/ai";
import { generateUUID } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { AIChatProvider } from "@/components/provider/ai-chat-provider";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return notFound();
  }

  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get("chat-model");

  return (
    <AIChatProvider>
      <Chat
        autoResume={true}
        id={id}
        initialChatModel={modelIdFromCookie?.value ?? DEFAULT_CHAT_MODEL}
        initialLastContext={undefined}
        initialMessages={[]}
        initialVisibilityType="private"
        isReadonly={false}
      />
    </AIChatProvider>
  );
}
