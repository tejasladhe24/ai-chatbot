import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { cookies, headers } from "next/headers";
import { Chat } from "@/components/chat";
import { DEFAULT_CHAT_MODEL } from "@workspace/ai";
import { generateUUID } from "@/lib/utils";

export default async function Page() {
  const sessionPromise = await auth.api.getSession({
    headers: await headers(),
  });

  const chatModelFromCookiePromise = cookies().then((cookies) =>
    cookies.get("chat-model")
  );

  const [session, chatModelFromCookie] = await Promise.all([
    sessionPromise,
    chatModelFromCookiePromise,
  ]);

  if (!session) {
    return notFound();
  }

  return (
    <Chat
      id={generateUUID()}
      initialMessages={[]}
      initialChatModel={chatModelFromCookie?.value ?? DEFAULT_CHAT_MODEL}
      initialVisibilityType="private"
      isReadonly={false}
      autoResume={false}
      initialLastContext={undefined}
    />
  );
}
