import { afterEach, describe, expect, it } from "bun:test";
import "../../../test-setup";
import { cleanup, render } from "@testing-library/react";
import { PromptInputSubmit } from "./prompt-input";

afterEach(() => {
  cleanup();
});

describe("PromptInputSubmit", () => {
  it("has an accessible label when rendered as an icon-only submit button", () => {
    const { getByRole } = render(<PromptInputSubmit />);

    expect(getByRole("button", { name: "ارسال پیام" })).toBeTruthy();
  });

  it("updates its accessible label while streaming", () => {
    const { getByRole } = render(<PromptInputSubmit status="streaming" />);

    expect(getByRole("button", { name: "توقف پاسخ" })).toBeTruthy();
  });
});
