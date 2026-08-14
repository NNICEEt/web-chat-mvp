import { db } from "@/db/client";
import { getLineUserProfile } from "@/integrations/line/client";
import { updateUserProfileByLineUserId } from "@/repositories/user-repository";

export async function syncLineUserProfile(lineUserId: string): Promise<void> {
  const profile = await getLineUserProfile(lineUserId);

  await updateUserProfileByLineUserId(db, lineUserId, profile);
}
