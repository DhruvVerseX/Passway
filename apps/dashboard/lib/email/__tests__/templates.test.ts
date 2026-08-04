import { afterEach, describe, expect, it, vi } from "vitest";
import { resetPasswordEmail, verificationEmail } from "../templates";

describe("auth email templates", () => {
  afterEach(() => vi.restoreAllMocks());

  it("escapes user-controlled URLs in HTML templates", () => {
    const email = verificationEmail('https://app.passway.co.in/verify?next=<script>');
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).not.toContain("<script>");
    expect(email.text).toContain("expires in 1 hour");
  });

  it("renders reset emails without passwords or raw internal ids", () => {
    const email = resetPasswordEmail("https://app.passway.co.in/reset-password?token=abc123");
    expect(email.subject).toContain("Reset");
    expect(email.html).not.toMatch(/password:/i);
    expect(email.text).toContain("If you did not request this email");
  });
});
