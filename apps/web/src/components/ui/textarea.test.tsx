import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { Textarea } from "./textarea";

// Clean up after each test
afterEach(() => {
  cleanup();
});

describe("Textarea Component", () => {
  test("renders textarea element", () => {
    const { container } = render(<Textarea />);
    const textarea = container.querySelector("textarea");
    expect(textarea).toBeTruthy();
    expect(textarea?.tagName).toBe("TEXTAREA");
  });

  test("applies custom className", () => {
    const { container } = render(<Textarea className="custom-class" />);
    const textarea = container.querySelector("textarea");
    expect(textarea?.className).toContain("custom-class");
  });

  test("accepts placeholder prop", () => {
    const { container } = render(<Textarea placeholder="Enter text" />);
    const textarea = container.querySelector("textarea");
    expect(textarea?.getAttribute("placeholder")).toBe("Enter text");
  });

  test("accepts value prop", () => {
    const { container } = render(<Textarea readOnly value="test value" />);
    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea?.value).toBe("test value");
  });

  test("handles disabled state", () => {
    const { container } = render(<Textarea disabled />);
    const textarea = container.querySelector("textarea");
    expect(textarea?.hasAttribute("disabled")).toBe(true);
  });

  test("handles required attribute", () => {
    const { container } = render(<Textarea required />);
    const textarea = container.querySelector("textarea");
    expect(textarea?.hasAttribute("required")).toBe(true);
  });

  test("handles aria-invalid attribute", () => {
    const { container } = render(<Textarea aria-invalid="true" />);
    const textarea = container.querySelector("textarea");
    expect(textarea?.getAttribute("aria-invalid")).toBe("true");
  });

  test("includes data-slot attribute", () => {
    const { container } = render(<Textarea />);
    const textarea = container.querySelector("textarea");
    expect(textarea?.getAttribute("data-slot")).toBe("textarea");
  });

  test("accepts id prop", () => {
    const { container } = render(<Textarea id="test-textarea" />);
    const textarea = container.querySelector("textarea");
    expect(textarea?.id).toBe("test-textarea");
  });

  test("accepts name prop", () => {
    const { container } = render(<Textarea name="test-name" />);
    const textarea = container.querySelector("textarea");
    expect(textarea?.getAttribute("name")).toBe("test-name");
  });

  test("accepts maxLength prop", () => {
    const { container } = render(<Textarea maxLength={500} />);
    const textarea = container.querySelector("textarea");
    expect(textarea?.getAttribute("maxLength")).toBe("500");
  });

  test("accepts rows prop", () => {
    const { container } = render(<Textarea rows={5} />);
    const textarea = container.querySelector("textarea");
    expect(textarea?.getAttribute("rows")).toBe("5");
  });

  test("accepts cols prop", () => {
    const { container } = render(<Textarea cols={50} />);
    const textarea = container.querySelector("textarea");
    expect(textarea?.getAttribute("cols")).toBe("50");
  });

  test("applies default styling classes", () => {
    const { container } = render(<Textarea />);
    const textarea = container.querySelector("textarea");
    expect(textarea?.className).toContain("rounded-md");
    expect(textarea?.className).toContain("border");
    expect(textarea?.className).toContain("px-3");
    expect(textarea?.className).toContain("min-h-16");
  });

  test("accepts readOnly prop", () => {
    const { container } = render(<Textarea readOnly />);
    const textarea = container.querySelector("textarea");
    expect(textarea?.hasAttribute("readonly")).toBe(true);
  });

  test("accepts wrap prop", () => {
    const { container } = render(<Textarea wrap="soft" />);
    const textarea = container.querySelector("textarea");
    expect(textarea?.getAttribute("wrap")).toBe("soft");
  });

  test("handles multiline text", () => {
    const multilineText = "Line 1\nLine 2\nLine 3";
    const { container } = render(<Textarea readOnly value={multilineText} />);
    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea?.value).toBe(multilineText);
  });

  test("accepts aria-label prop", () => {
    const { container } = render(<Textarea aria-label="Description" />);
    const textarea = container.querySelector("textarea");
    expect(textarea?.getAttribute("aria-label")).toBe("Description");
  });

  test("accepts aria-describedby prop", () => {
    const { container } = render(<Textarea aria-describedby="helper-text" />);
    const textarea = container.querySelector("textarea");
    expect(textarea?.getAttribute("aria-describedby")).toBe("helper-text");
  });
});
