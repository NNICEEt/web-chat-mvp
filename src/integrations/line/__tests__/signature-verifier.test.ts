import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { verifyLineSignature } from "../signature-verifier";

const officialFixture = {
  rawBody:
    '{"destination":"U8e742f61d673b39c7fff3cecb7536ef0","events":[]}',
  channelSecret: "8c570fa6dd201bb328f1c1eac23a96d8",
  signature: "GhRKmvmHys4Pi8DxkF4+EayaH0OqtJtaZxgTD9fMDLs=",
};

describe("verifyLineSignature", () => {
  beforeEach(() => {
    vi.stubEnv("LINE_CHANNEL_SECRET", officialFixture.channelSecret);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts the signature generated for the exact raw request body", () => {
    expect(
      verifyLineSignature(officialFixture.rawBody, officialFixture.signature),
    ).toBe(true);
  });

  it("rejects a signature when the request body has been modified", () => {
    const formattedBody = JSON.stringify(
      JSON.parse(officialFixture.rawBody),
      null,
      2,
    );

    expect(
      verifyLineSignature(formattedBody, officialFixture.signature),
    ).toBe(false);
  });

  it("rejects a signature generated with a different channel secret", () => {
    vi.stubEnv("LINE_CHANNEL_SECRET", "different-channel-secret");

    expect(
      verifyLineSignature(officialFixture.rawBody, officialFixture.signature),
    ).toBe(false);
  });

  it("rejects a missing signature", () => {
    expect(verifyLineSignature(officialFixture.rawBody, null)).toBe(false);
  });

  it("throws when the channel secret is not configured", () => {
    vi.stubEnv("LINE_CHANNEL_SECRET", "");

    expect(
      () =>
        verifyLineSignature(
          officialFixture.rawBody,
          officialFixture.signature,
        ),
    ).toThrowError(
      "LINE_CHANNEL_SECRET is required to verify LINE signatures",
    );
  });

  it("rejects a malformed signature without throwing", () => {
    expect(
      verifyLineSignature(officialFixture.rawBody, "not-a-valid-signature"),
    ).toBe(false);
  });
});
