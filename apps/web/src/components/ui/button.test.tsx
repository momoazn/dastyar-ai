import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { Button } from "./button";

describe("Button Component", () => {
  it("should render button with text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });

  it("should apply default variant", () => {
    render(<Button>Default</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-primary");
  });

  it("should apply destructive variant", () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-destructive");
  });

  it("should apply outline variant", () => {
    render(<Button variant="outline">Outline</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("border");
  });

  it("should apply secondary variant", () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-secondary");
  });

  it("should apply ghost variant", () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("hover:bg-accent");
  });

  it("should apply link variant", () => {
    render(<Button variant="link">Link</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("underline");
  });

  it("should apply small size", () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("h-8");
  });

  it("should apply large size", () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("h-10");
  });

  it("should apply icon size", () => {
    render(<Button size="icon">🔍</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("size-9");
  });

  it("should be disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("should handle onClick event", async () => {
    let clicked = false;
    render(<Button onClick={() => (clicked = true)}>Click</Button>);
    const button = screen.getByRole("button");
    button.click();
    expect(clicked).toBe(true);
  });

  it("should apply custom className", () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("custom-class");
  });

  it("should have cursor-pointer class", () => {
    render(<Button>Clickable</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("cursor-pointer");
  });

  it("should have data-slot attribute", () => {
    render(<Button>Test</Button>);
    const button = screen.getByRole("button");
    expect(button.getAttribute("data-slot")).toBe("button");
  });
});
