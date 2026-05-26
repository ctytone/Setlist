import { describe, expect, it, vi } from "vitest";

const fromChain = vi.fn();
const serviceClient = {
  from: fromChain,
  auth: {
    admin: new Proxy({}, {
      get() {
        throw new Error("auth admin should not be used");
      },
    }),
  },
};

vi.mock("@/server/auth", () => ({
  requireUser: vi.fn(async () => ({
    user: { id: "current-user" },
    supabase: {},
  })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceRoleClient: vi.fn(() => serviceClient),
}));

import { searchUsers } from "@/server/actions/friends";

describe("searchUsers", () => {
  it("queries public user rows without auth admin enumeration", async () => {
    const response = {
      data: [
        {
          id: "user-1",
          handle: "alice",
          display_name: "Alice",
          avatar_url: null,
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
        },
      ],
      error: null,
    };

    const limit = vi.fn(async () => response);
    const neq = vi.fn(() => ({ limit }));
    const or = vi.fn(() => ({ neq }));
    const select = vi.fn(() => ({ or }));
    fromChain.mockReturnValue({ select });

    const results = await searchUsers("ali");

    expect(results).toHaveLength(1);
    expect(results[0]?.handle).toBe("alice");
    expect(select).toHaveBeenCalledWith("id, handle, display_name, avatar_url, created_at, updated_at");
    expect(or).toHaveBeenCalled();
    expect(neq).toHaveBeenCalledWith("id", "current-user");
    expect(limit).toHaveBeenCalledWith(10);
  });
});