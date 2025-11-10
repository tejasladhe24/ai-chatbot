"use server";

import { auth } from "@/lib/auth";
import { eq, inArray, not } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { $member, $organization, $user } from "@workspace/database/server";
import { db } from "@/lib/db";
import { DBRole } from "@workspace/database/types";

export const addMember = async (
  organizationId: string,
  userId: string,
  role: DBRole
) => {
  try {
    await auth.api.addMember({
      body: {
        userId,
        organizationId,
        role,
      },
    });
  } catch (error) {
    console.error(error);
    throw new Error("Failed to add member.");
  }
};

export const removeMember = async (memberId: string) => {
  const admin = await isAdmin();

  if (!admin) {
    return {
      success: false,
      error: "You are not authorized to remove members.",
    };
  }

  try {
    await db.delete($member).where(eq($member.id, memberId));

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "Failed to remove member.",
    };
  }
};

export async function getOrganizations() {
  const { currentUser } = await getCurrentUser();

  const members = await db.query.member.findMany({
    where: eq($member.userId, currentUser.id),
  });

  const organizations = await db.query.organization.findMany({
    where: inArray(
      $organization.id,
      members.map((member) => member.organizationId)
    ),
  });

  return organizations;
}

export async function getActiveOrganization(userId: string) {
  const memberUser = await db.query.member.findFirst({
    where: eq($member.userId, userId),
  });

  if (!memberUser) {
    return null;
  }

  const activeOrganization = await db.query.organization.findFirst({
    where: eq($organization.id, memberUser.organizationId),
  });

  return activeOrganization;
}

export async function getOrganizationBySlug(slug: string) {
  try {
    const organizationBySlug = await db.query.organization.findFirst({
      where: eq($organization.slug, slug),
      with: {
        members: {
          with: {
            user: true,
          },
        },
      },
    });

    return organizationBySlug;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export const isAdmin = async () => {
  try {
    const { success, error } = await auth.api.hasPermission({
      headers: await headers(),
      body: {
        permissions: {
          organization: ["update", "delete"],
        },
      },
    });

    if (error) {
      return {
        success: false,
        error: error || "Failed to check permissions",
      };
    }

    return success;
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error || "Failed to check permissions",
    };
  }
};

export const getCurrentUser = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const currentUser = await db.query.user.findFirst({
    where: eq($user.id, session.user.id),
  });

  if (!currentUser) {
    redirect("/login");
  }

  return {
    ...session,
    currentUser,
  };
};

export const signIn = async (email: string, password: string) => {
  try {
    await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    return {
      success: true,
      message: "Signed in successfully.",
    };
  } catch (error) {
    const e = error as Error;

    return {
      success: false,
      message: e.message || "An unknown error occurred.",
    };
  }
};

export const signUp = async (
  email: string,
  password: string,
  username: string
) => {
  try {
    await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: username,
      },
    });

    return {
      success: true,
      message: "Signed up successfully.",
    };
  } catch (error) {
    const e = error as Error;

    return {
      success: false,
      message: e.message || "An unknown error occurred.",
    };
  }
};

export const getUsers = async (organizationId: string) => {
  try {
    const members = await db.query.member.findMany({
      where: eq($member.organizationId, organizationId),
    });

    const users = await db.query.user.findMany({
      where: not(
        inArray(
          $user.id,
          members.map((member) => member.userId)
        )
      ),
    });

    return users;
  } catch (error) {
    console.error(error);
    return [];
  }
};
