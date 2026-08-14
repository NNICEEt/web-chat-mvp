import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  database: { database: true },
  getLineUserProfile: vi.fn(),
  updateUserProfileByLineUserId: vi.fn(),
}));

vi.mock("@/db/client", () => ({
  db: mocks.database,
}));

vi.mock("@/integrations/line/client", () => ({
  getLineUserProfile: mocks.getLineUserProfile,
}));

vi.mock("@/repositories/user-repository", () => ({
  updateUserProfileByLineUserId: mocks.updateUserProfileByLineUserId,
}));

import { syncLineUserProfile } from "./sync-line-user-profile";

describe("syncLineUserProfile", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("gets the LINE profile before updating the user", async () => {
    const profile = {
      displayName: "Brown",
      pictureUrl: "https://example.com/brown.jpg",
    };
    const order: string[] = [];

    mocks.getLineUserProfile.mockImplementation(async () => {
      order.push("profile-fetched");
      return profile;
    });
    mocks.updateUserProfileByLineUserId.mockImplementation(async () => {
      order.push("profile-updated");
    });

    await expect(syncLineUserProfile("line-user-id")).resolves.toBeUndefined();

    expect(order).toEqual(["profile-fetched", "profile-updated"]);
    expect(mocks.updateUserProfileByLineUserId).toHaveBeenCalledWith(
      mocks.database,
      "line-user-id",
      profile,
    );
  });

  it("does not update the user when LINE profile retrieval fails", async () => {
    const error = new Error("LINE request failed");
    mocks.getLineUserProfile.mockRejectedValue(error);

    await expect(syncLineUserProfile("line-user-id")).rejects.toBe(error);

    expect(mocks.updateUserProfileByLineUserId).not.toHaveBeenCalled();
  });
});
