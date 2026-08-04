import { describe, expect, it } from "vitest";
import { DEFAULT_AUTH_REDIRECT, FORGOT_PASSWORD_SUCCESS, isProtectedPath, normalizeEmail, protectedCallback, safeCallbackURL, signInURL } from "../redirects";
import { forgotPasswordSchema, resetPasswordSchema, signInSchema, signUpSchema } from "../validation";

describe("auth validation", () => {
  it("normalizes sign-up email and requires a strong matching password", () => {
    const valid = signUpSchema.safeParse({
      name: "Ada Lovelace",
      email: " ADA@Example.COM ",
      password: "StrongPass1!",
      confirmPassword: "StrongPass1!",
    });
    expect(valid.success && valid.data.email).toBe("ada@example.com");

    const invalid = signUpSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "weak",
      confirmPassword: "different",
    });
    expect(invalid.success).toBe(false);
  });

  it("validates email/password sign-in without exposing credential details", () => {
    expect(signInSchema.safeParse({ email: "USER@EXAMPLE.COM", password: "x" }).success).toBe(true);
    expect(signInSchema.safeParse({ email: "nope", password: "" }).success).toBe(false);
  });

  it("keeps forgot-password response generic", () => {
    expect(forgotPasswordSchema.parse({ email: "Person@Example.com" }).email).toBe("person@example.com");
    expect(FORGOT_PASSWORD_SUCCESS).toContain("If an account exists");
  });

  it("rejects missing or short reset tokens", () => {
    expect(resetPasswordSchema.safeParse({ password: "StrongPass1!", confirmPassword: "StrongPass1!", token: "short" }).success).toBe(false);
  });
});

describe("auth redirects", () => {
  it("rejects external and protocol-relative callback URLs", () => {
    expect(safeCallbackURL("https://evil.test")).toBe(DEFAULT_AUTH_REDIRECT);
    expect(safeCallbackURL("//evil.test/path")).toBe(DEFAULT_AUTH_REDIRECT);
    expect(safeCallbackURL("/projects?tab=secrets")).toBe("/projects?tab=secrets");
  });

  it("builds protected route sign-in redirects", () => {
    expect(isProtectedPath("/dashboard")).toBe(true);
    expect(isProtectedPath("/projects/proj_1/secrets")).toBe(true);
    expect(isProtectedPath("/sign-in")).toBe(false);
    expect(protectedCallback("/dashboard", "?a=1")).toBe("/dashboard?a=1");
    expect(signInURL("/dashboard")).toBe("/sign-in?callbackURL=%2Fdashboard");
  });

  it("normalizes emails predictably", () => {
    expect(normalizeEmail(" Person@Example.COM ")).toBe("person@example.com");
  });
});
