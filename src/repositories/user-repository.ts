import type { DatabaseContext } from "./database-context";

export function findUserByLineUserId(
  database: DatabaseContext,
  lineUserId: string,
) {
  return database.user.findUnique({
    where: { lineUserId },
  });
}

export function createUser(database: DatabaseContext, lineUserId: string) {
  return database.user.create({
    data: { lineUserId },
  });
}

export function updateUserProfileByLineUserId(
  database: DatabaseContext,
  lineUserId: string,
  profile: {
    displayName: string;
    pictureUrl: string | null;
  },
) {
  return database.user.update({
    where: { lineUserId },
    data: profile,
  });
}
