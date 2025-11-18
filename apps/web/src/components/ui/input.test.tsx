import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { Input } from "./input";

// Clean up after each test
afterEach(() => {
  cleanup();
});

describe("Input Component", () => {
  test("renders input element", () => {
    render(<Input />);
    const input = screen.getByRole("textbox");
    expect(input).toBeTruthy();
  });

  test("applies custom className", () => {
    render(<Input className="custom-class" />);
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("custom-class");
  });

  test("accepts type prop", () => {
    render(<Input type="email" />);
    const input = screen.getByRole("textbox");
    expect(input.getAttribute("type")).toBe("email");
  });

  test("accepts placeholder prop", () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByRole("textbox");
    expect(input.getAttribute("placeholder")).toBe("Enter text");
  });

  test("accepts value prop", () => {
    render(<Input readOnly value="test value" />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("test value");
  });

  test("handles disabled state", () => {
    render(<Input disabled />);
    const input = screen.getByRole("textbox");
    expect(input.hasAttribute("disabled")).toBe(true);
  });

  test("handles required attribute", () => {
    render(<Input required />);
    const input = screen.getByRole("textbox");
    expect(input.hasAttribute("required")).toBe(true);
  });

  test("handles aria-invalid attribute", () => {
    render(<Input aria-invalid="true" />);
    const input = screen.getByRole("textbox");
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  test("includes data-slot attribute", () => {
    render(<Input />);
    const input = screen.getByRole("textbox");
    expect(input.getAttribute("data-slot")).toBe("input");
  });

  test("renders password input", () => {
    const { container } = render(<Input type="password" />);
    const input = container.querySelector('input[type="password"]');
    expect(input).toBeTruthy();
  });

  test("renders number input", () => {
    const { container } = render(<Input type="number" />);
    const input = container.querySelector('input[type="number"]');
    expect(input).toBeTruthy();
  });

  test("accepts id prop", () => {
    render(<Input id="test-input" />);
    const input = screen.getByRole("textbox");
    expect(input.id).toBe("test-input");
  });

  test("accepts name prop", () => {
    render(<Input name="test-name" />);
    const input = screen.getByRole("textbox");
    expect(input.getAttribute("name")).toBe("test-name");
  });

  test("accepts maxLength prop", () => {
    render(<Input maxLength={100} />);
    const input = screen.getByRole("textbox");
    expect(input.getAttribute("maxLength")).toBe("100");
  });

  test("accepts autoComplete prop", () => {
    render(<Input autoComplete="email" />);
    const input = screen.getByRole("textbox");
    expect(input.getAttribute("autocomplete")).toBe("email");
  });

  test("applies default styling classes", () => {
    render(<Input />);
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("rounded-md");
    expect(input.className).toContain("border");
    expect(input.className).toContain("px-3");
  });

  test("accepts readOnly prop", () => {
    render(<Input readOnly />);
    const input = screen.getByRole("textbox");
    expect(input.hasAttribute("readonly")).toBe(true);
  });

  test("accepts min and max for number input", () => {
    render(<Input max={100} min={0} type="number" />);
    const input = screen.getByRole("spinbutton");
    expect(input.getAttribute("min")).toBe("0");
    expect(input.getAttribute("max")).toBe("100");
  });

  test("accepts pattern prop", () => {
    render(<Input pattern="[0-9]*" />);
    const input = screen.getByRole("textbox");
    expect(input.getAttribute("pattern")).toBe("[0-9]*");
  });
});
