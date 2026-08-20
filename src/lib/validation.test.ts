import { describe, expect, it } from "vitest";
import {
  PASSWORD_MIN_LENGTH,
  isValidEmail,
  validateEmailOnly,
  validateNewPassword,
  validateSignIn,
  validateSignUp,
} from "./validation";

describe("email validation", () => {
  it("accepts a well formed address", () => {
    expect(isValidEmail("elena.vargas@acme.com")).toBe(true);
  });

  it("rejects malformed addresses", () => {
    expect(isValidEmail("elena.vargas")).toBe(false);
    expect(isValidEmail("elena@")).toBe(false);
    expect(isValidEmail("elena @acme.com")).toBe(false);
  });
});

describe("validateSignUp", () => {
  const valid = {
    fullName: "Elena Vargas",
    email: "elena@acme.com",
    password: "correct-horse",
    confirmPassword: "correct-horse",
  };

  it("passes for valid input", () => {
    expect(validateSignUp(valid)).toEqual({});
  });

  it("requires every field", () => {
    const errors = validateSignUp({ fullName: "", email: "", password: "", confirmPassword: "" });
    expect(Object.keys(errors).sort()).toEqual(["confirmPassword", "email", "fullName", "password"]);
  });

  it("rejects an invalid email", () => {
    expect(validateSignUp({ ...valid, email: "nope" }).email).toBeTruthy();
  });

  it(`rejects passwords shorter than ${PASSWORD_MIN_LENGTH} characters`, () => {
    const short = "a".repeat(PASSWORD_MIN_LENGTH - 1);
    const errors = validateSignUp({ ...valid, password: short, confirmPassword: short });
    expect(errors.password).toBeTruthy();
  });

  it("rejects a mismatched confirmation", () => {
    expect(validateSignUp({ ...valid, confirmPassword: "something-else" }).confirmPassword).toBeTruthy();
  });
});

describe("validateSignIn", () => {
  it("passes for valid credentials", () => {
    expect(validateSignIn({ email: "elena@acme.com", password: "correct-horse" })).toEqual({});
  });

  it("flags missing fields", () => {
    const errors = validateSignIn({ email: "", password: "" });
    expect(errors.email).toBeTruthy();
    expect(errors.password).toBeTruthy();
  });
});

describe("password reset validation", () => {
  it("requires an email for the reset request", () => {
    expect(validateEmailOnly("").email).toBeTruthy();
    expect(validateEmailOnly("elena@acme.com")).toEqual({});
  });

  it("validates the new password and its confirmation", () => {
    expect(validateNewPassword({ password: "short", confirmPassword: "short" }).password).toBeTruthy();
    expect(
      validateNewPassword({ password: "long-enough-1", confirmPassword: "different" }).confirmPassword,
    ).toBeTruthy();
    expect(validateNewPassword({ password: "long-enough-1", confirmPassword: "long-enough-1" })).toEqual({});
  });
});
