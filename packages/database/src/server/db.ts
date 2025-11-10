import {
  $chat,
  $message,
  $user,
  schema,
  $vote,
  $document,
  $suggestion,
  $stream,
  $member,
} from "./schema";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  SQL,
  sql,
} from "drizzle-orm";
import { injectable } from "@workspace/di";
import { PaginatedHistory } from "../common/pagination";
import {
  DBArtifactKind,
  DBChat,
  DBDocument,
  DBMember,
  DBMessage,
  DBSuggestion,
  DBUser,
  DBVisibility,
  DBVote,
} from "@/types";

@injectable()
export class DatabaseService {
  constructor(private readonly db: ReturnType<typeof drizzle<typeof schema>>) {}

  async getUser(email: string): Promise<DBUser | null> {
    try {
      const user = await this.db.query.user.findFirst({
        where: eq($user.email, email),
      });
      return user ?? null;
    } catch (_error) {
      throw new Error("Failed to get user");
    }
  }

  async saveChat({
    id,
    memberId,
    title,
    visibility,
  }: {
    id: string;
    memberId: string;
    title: string;
    visibility: DBVisibility;
  }): Promise<DBChat> {
    try {
      const result = await this.db
        .insert($chat)
        .values({
          id,
          memberId,
          title,
          visibility,
        })
        .returning();

      const [chat] = result;

      if (!chat) {
        throw new Error("Failed to save chat");
      }

      return chat;
    } catch (_error) {
      throw new Error("Failed to save chat");
    }
  }

  async deleteChatById({ id }: { id: string }): Promise<DBChat | null> {
    const [chat] = await this.db
      .delete($chat)
      .where(eq($chat.id, id))
      .returning();

    if (!chat) {
      throw new Error("Failed to delete chat");
    }

    return chat;
  }

  async deleteAllChatsByMemberId({
    memberId,
  }: {
    memberId: string;
  }): Promise<{ deletedCount: number }> {
    try {
      const memberChats = await this.db
        .select({ id: $chat.id })
        .from($chat)
        .where(eq($chat.memberId, memberId));

      if (memberChats.length === 0) {
        return { deletedCount: 0 };
      }

      const deletedChats = await this.db
        .delete($chat)
        .where(eq($chat.memberId, memberId))
        .returning();

      return { deletedCount: deletedChats.length };
    } catch (_error) {
      throw new Error("Failed to delete all chats by member id");
    }
  }

  async getChatsByMemberId({
    memberId,
    limit,
    startingAfter,
    endingBefore,
  }: {
    memberId: string;
    limit: number;
    startingAfter: string | null;
    endingBefore: string | null;
  }): Promise<PaginatedHistory<DBChat> | null> {
    try {
      const extendedLimit = limit + 1;

      const query = (whereCondition?: SQL<any>) =>
        this.db
          .select()
          .from($chat)
          .where(
            whereCondition
              ? and(whereCondition, eq($chat.memberId, memberId))
              : eq($chat.memberId, memberId)
          )
          .orderBy(desc($chat.createdAt))
          .limit(extendedLimit);

      let filteredChats: DBChat[] = [];

      if (startingAfter) {
        const [selectedChat] = await this.db
          .select()
          .from($chat)
          .where(eq($chat.id, startingAfter))
          .limit(1);

        if (!selectedChat) {
          throw new Error(`Chat with id ${startingAfter} not found`);
        }

        filteredChats = await query(
          gt($chat.createdAt, selectedChat.createdAt)
        );
      } else if (endingBefore) {
        const [selectedChat] = await this.db
          .select()
          .from($chat)
          .where(eq($chat.id, endingBefore))
          .limit(1);

        if (!selectedChat) {
          throw new Error(`Chat with id ${endingBefore} not found`);
        }
        filteredChats = await query(
          lt($chat.createdAt, selectedChat.createdAt)
        );
      } else {
        filteredChats = await query();
      }

      const hasMore = filteredChats.length > limit;

      return {
        items: hasMore ? filteredChats.slice(0, limit) : filteredChats,
        hasMore,
      };
    } catch (_error) {
      throw new Error("Failed to get chats by member id");
    }
  }

  async getChatById({ id }: { id: string }): Promise<DBChat | null> {
    try {
      const [selectedChat] = await this.db
        .select()
        .from($chat)
        .where(eq($chat.id, id));
      if (!selectedChat) {
        return null;
      }

      return selectedChat;
    } catch (_error) {
      throw new Error("Failed to get chat by id");
    }
  }

  async saveMessages({
    messages,
  }: {
    messages: DBMessage[];
  }): Promise<DBMessage[]> {
    try {
      return await this.db.insert($message).values(messages).returning();
    } catch (_error) {
      throw new Error("Failed to save messages");
    }
  }

  async getMessagesByChatId({ id }: { id: string }): Promise<DBMessage[]> {
    try {
      return await this.db
        .select()
        .from($message)
        .where(eq($message.chatId, id))
        .orderBy(asc($message.createdAt));
    } catch (_error) {
      throw new Error("Failed to get messages by chat id");
    }
  }

  async voteMessage({
    chatId,
    messageId,
    type,
  }: {
    chatId: string;
    messageId: string;
    type: "up" | "down";
  }): Promise<DBVote | null> {
    try {
      const [existingVote] = await this.db
        .select()
        .from($vote)
        .where(and(eq($vote.messageId, messageId)));

      if (existingVote) {
        const [updatedVote] = await this.db
          .update($vote)
          .set({ isUpvoted: type === "up" })
          .where(and(eq($vote.messageId, messageId), eq($vote.chatId, chatId)))
          .returning();

        if (!updatedVote) {
          throw new Error("Failed to update vote");
        }

        return updatedVote;
      }
      const [newVote] = await this.db
        .insert($vote)
        .values({
          chatId,
          messageId,
          isUpvoted: type === "up",
        })
        .returning();

      if (!newVote) {
        throw new Error("Failed to create vote");
      }

      return newVote;
    } catch (_error) {
      throw new Error("Failed to vote message");
    }
  }

  async getVotesByChatId({ id }: { id: string }): Promise<DBVote[]> {
    try {
      return await this.db.select().from($vote).where(eq($vote.chatId, id));
    } catch (_error) {
      throw new Error("Failed to get votes by chat id");
    }
  }

  async saveDocument({
    id,
    title,
    kind,
    content,
    memberId,
  }: {
    id: string;
    title: string;
    kind: DBArtifactKind;
    content: string;
    memberId: string;
  }): Promise<DBDocument | null> {
    try {
      const [document] = await this.db
        .insert($document)
        .values({
          id,
          title,
          kind,
          content,
          memberId,
          createdAt: new Date(),
        })
        .returning();

      if (!document) {
        throw new Error("Failed to save document");
      }

      return document;
    } catch (_error) {
      throw new Error("Failed to save document");
    }
  }

  async getInfiniteDocumentsByMemberId({
    memberId,
    limit,
    startingAfter,
    endingBefore,
  }: {
    memberId: string;
    limit: number;
    startingAfter: string | null;
    endingBefore: string | null;
  }): Promise<PaginatedHistory<DBDocument> | null> {
    try {
      const extendedLimit = limit + 1;

      const query = (whereCondition?: SQL<any>) =>
        this.db
          .select()
          .from($document)
          .where(
            whereCondition
              ? and(whereCondition, eq($document.memberId, memberId))
              : eq($document.memberId, memberId)
          )
          .orderBy(desc($document.createdAt))
          .limit(extendedLimit);

      let filteredDocuments: DBDocument[] = [];

      if (startingAfter) {
        const [selectedDocument] = await this.db
          .select()
          .from($document)
          .where(eq($document.id, startingAfter))
          .limit(1);

        if (!selectedDocument) {
          throw new Error(`Document with id ${startingAfter} not found`);
        }

        filteredDocuments = await query(
          gt($document.createdAt, selectedDocument.createdAt)
        );
      } else if (endingBefore) {
        const [selectedDocument] = await this.db
          .select()
          .from($document)
          .where(eq($document.id, endingBefore))
          .limit(1);

        if (!selectedDocument) {
          throw new Error(`Document with id ${endingBefore} not found`);
        }
        filteredDocuments = await query(
          lt($document.createdAt, selectedDocument.createdAt)
        );
      } else {
        filteredDocuments = await query();
      }

      const hasMore = filteredDocuments.length > limit;

      return {
        items: hasMore ? filteredDocuments.slice(0, limit) : filteredDocuments,
        hasMore,
      };
    } catch (_error) {
      throw new Error("Failed to get documents by member id");
    }
  }

  async getDocumentsById({ id }: { id: string }): Promise<DBDocument[]> {
    try {
      const documents = await this.db
        .select()
        .from($document)
        .where(eq($document.id, id))
        .orderBy(asc($document.createdAt));

      return documents;
    } catch (_error) {
      throw new Error("Failed to get documents by id");
    }
  }

  async getDocumentById({ id }: { id: string }): Promise<DBDocument | null> {
    const selectedDocument = await this.db.query.document.findFirst({
      where: eq($document.id, id),
    });

    return selectedDocument ?? null;
  }

  async deleteDocumentsByIdAfterTimestamp({
    id,
    timestamp,
  }: {
    id: string;
    timestamp: Date;
  }): Promise<{ deletedCount: number }> {
    try {
      await this.db
        .delete($suggestion)
        .where(
          and(
            eq($suggestion.documentId, id),
            gt($suggestion.documentCreatedAt, timestamp)
          )
        );

      const deletedDocuments = await this.db
        .delete($document)
        .where(and(eq($document.id, id), gt($document.createdAt, timestamp)))
        .returning();

      return { deletedCount: deletedDocuments.length };
    } catch (_error) {
      throw new Error("Failed to delete documents by id after timestamp");
    }
  }

  async saveSuggestions({
    suggestions,
  }: {
    suggestions: DBSuggestion[];
  }): Promise<DBSuggestion[]> {
    return await this.db.insert($suggestion).values(suggestions).returning();
  }

  async getSuggestionsByDocumentId({
    documentId,
  }: {
    documentId: string;
  }): Promise<DBSuggestion[]> {
    return await this.db.query.suggestion.findMany({
      where: eq($suggestion.documentId, documentId),
    });
  }

  async getMessageById({ id }: { id: string }): Promise<DBMessage | null> {
    const message = await this.db.query.message.findFirst({
      where: eq($message.id, id),
    });

    return message ?? null;
  }

  async deleteMessagesByChatIdAfterTimestamp({
    chatId,
    timestamp,
  }: {
    chatId: string;
    timestamp: Date;
  }): Promise<{ deletedCount: number }> {
    try {
      const messagesToDelete = await this.db
        .select({ id: $message.id })
        .from($message)
        .where(
          and(eq($message.chatId, chatId), gte($message.createdAt, timestamp))
        );

      const messageIds = messagesToDelete.map(
        (currentMessage) => currentMessage.id
      );

      if (messageIds.length > 0) {
        await this.db
          .delete($vote)
          .where(
            and(eq($vote.chatId, chatId), inArray($vote.messageId, messageIds))
          );

        const deletedMessages = await this.db
          .delete($message)
          .where(
            and(eq($message.chatId, chatId), inArray($message.id, messageIds))
          )
          .returning();

        return { deletedCount: deletedMessages.length };
      }

      return { deletedCount: 0 };
    } catch (_error) {
      throw new Error("Failed to delete messages by chat id after timestamp");
    }
  }

  async updateChatVisibilityById({
    chatId,
    visibility,
  }: {
    chatId: string;
    visibility: "private" | "public";
  }): Promise<DBChat | null> {
    try {
      const [updatedChat] = await this.db
        .update($chat)
        .set({ visibility })
        .where(eq($chat.id, chatId))
        .returning();

      return updatedChat ?? null;
    } catch (_error) {
      throw new Error("Failed to update chat visibility by id");
    }
  }

  async getMessageCountByMemberId({
    memberId,
    differenceInHours,
  }: {
    memberId: string;
    differenceInHours: number;
  }): Promise<number> {
    try {
      const twentyFourHoursAgo = new Date(
        Date.now() - differenceInHours * 60 * 60 * 1000
      );

      const [stats] = await this.db
        .select({ count: sql<number>`count(${$message.id})` })
        .from($message)
        .innerJoin($chat, eq($message.chatId, $chat.id))
        .where(
          and(
            eq($chat.memberId, memberId),
            gte($message.createdAt, twentyFourHoursAgo),
            eq($message.role, "user")
          )
        )
        .execute();

      return stats?.count ?? 0;
    } catch (_error) {
      throw new Error("Failed to get message count by user id");
    }
  }

  async createStreamId({
    streamId,
    chatId,
  }: {
    streamId: string;
    chatId: string;
  }): Promise<void> {
    try {
      await this.db
        .insert($stream)
        .values({ id: streamId, chatId, createdAt: new Date() });
    } catch (_error) {
      throw new Error("Failed to create stream id");
    }
  }

  async getStreamIdsByChatId({
    chatId,
  }: {
    chatId: string;
  }): Promise<string[]> {
    try {
      const streamIds = await this.db.query.stream.findMany({
        where: eq($stream.chatId, chatId),
      });

      return streamIds.map(({ id }) => id);
    } catch (_error) {
      throw new Error("Failed to get stream ids by chat id");
    }
  }

  async getMemberByUserIdAndOrganizationId({
    userId,
    organizationId,
  }: {
    userId: string;
    organizationId: string;
  }): Promise<DBMember | null> {
    try {
      const member = await this.db.query.member.findFirst({
        where: and(
          eq($member.userId, userId),
          eq($member.organizationId, organizationId)
        ),
        with: {
          user: true,
        },
      });

      return member ?? null;
    } catch (_error) {
      throw new Error("Failed to get member by user id and organization id");
    }
  }
}
