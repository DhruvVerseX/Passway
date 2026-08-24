import { describe, expect, it } from "vitest";
import { childEnvironment, executableForPlatform } from "../runtime.js";

describe("runtime child environment", () => {
  it("injects vault secrets without passing the bearer token onward", () => {
    const environment = childEnvironment(
      {
        PATH: "/usr/bin",
        PASSWAY_TOKEN: "ps_live_token",
        EXISTING_VALUE: "kept",
      },
      { DB_URL: "postgres://private", EXISTING_VALUE: "from-vault" },
    );

    expect(environment).toMatchObject({
      PATH: "/usr/bin",
      EXISTING_VALUE: "from-vault",
      DB_URL: "postgres://private",
    });
    expect(environment.PASSWAY_TOKEN).toBeUndefined();
  });

  it("uses Windows command shims for package managers", () => {
    expect(executableForPlatform("npm", "win32")).toBe("npm.cmd");
    expect(executableForPlatform("node", "win32")).toBe("node");
    expect(executableForPlatform("npm", "linux")).toBe("npm");
  });
});
