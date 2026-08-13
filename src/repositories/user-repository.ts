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
