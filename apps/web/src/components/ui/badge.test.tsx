import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { Badge } from "./badge";

afterEach(() => {
  cleanup();
});

describe("Badge Component", () => {
  test("renders badge element", () => {
    const { container } = render(<Badge>Badge text</Badge>);
    const badge = container.querySelector('[data-slot="badge"]');
    expect(badge).toBeTruthy();
  });

  test("renders children", () => {
    render(<Badge>Test badge</Badge>);
    const badge = screen.getByText("Test badge");
    expect(badge).toBeTruthy();
  });

  test("applies custom className", () => {
    const { container } = render(<Badge className="custom-badge">Badge</Badge>);
    const badge = container.querySelector('[data-slot="badge"]');
    expect(badge?.className).toContain("custom-badge");
  });

  test("renders with default variant", () => {
    const { container } = render(<Badge>Default</Badge>);
    const badge = container.querySelector('[data-slot="badge"]');
    // Check for default variant classes
    expect(badge?.className).toContain("bg-primary");
  });

  test("renders with secondary variant", () => {
    const { container } = render(<Badge variant="secondary">Secondary</Badge>);
    const badge = container.querySelector('[data-slot="badge"]');
    expect(badge?.className).toContain("bg-secondary");
  });

  test("renders with destructive variant", () => {
    const { container } = render(
      <Badge variant="destructive">Destructive</Badge>
    );
    const badge = container.querySelector('[data-slot="badge"]');
    expect(badge?.className).toContain("bg-destructive");
  });

  test("renders with outline variant", () => {
    const { container } = render(<Badge variant="outline">Outline</Badge>);
    const badge = container.querySelector('[data-slot="badge"]');
    expect(badge?.className).toContain("text-foreground");
  });

  test("renders as span by default", () => {
    const { container } = render(<Badge>Badge</Badge>);
    const badge = container.querySelector("span[data-slot='badge']");
    expect(badge).toBeTruthy();
  });

  test("renders as child component when asChild is true", () => {
    const { container } = render(
      <Badge asChild>
        <a href="/test">Link Badge</a>
      </Badge>
    );
    const link = container.querySelector("a");
    expect(link).toBeTruthy();
    expect(link?.textContent).toBe("Link Badge");
  });

  test("applies default styling classes", () => {
    const { container } = render(<Badge>Badge</Badge>);
    const badge = container.querySelector('[data-slot="badge"]');
    expect(badge?.className).toContain("inline-flex");
    expect(badge?.className).toContain("rounded-md");
    expect(badge?.className).toContain("border");
    expect(badge?.className).toContain("px-2");
  });

  test("accepts and renders multiple variants", () => {
    const { container: container1 } = render(
      <Badge variant="default">Default</Badge>
    );
    const { container: container2 } = render(
      <Badge variant="secondary">Secondary</Badge>
    );
    const { container: container3 } = render(
      <Badge variant="destructive">Destructive</Badge>
    );
    const { container: container4 } = render(
      <Badge variant="outline">Outline</Badge>
    );

    expect(
      container1.querySelector('[data-slot="badge"]')?.className
    ).toContain("bg-primary");
    expect(
      container2.querySelector('[data-slot="badge"]')?.className
    ).toContain("bg-secondary");
    expect(
      container3.querySelector('[data-slot="badge"]')?.className
    ).toContain("bg-destructive");
    expect(
      container4.querySelector('[data-slot="badge"]')?.className
    ).toContain("text-foreground");
  });

  test("renders with icon", () => {
    const { container } = render(
      <Badge>
        <svg aria-label="badge icon" role="img">
          <circle />
        </svg>
        With Icon
      </Badge>
    );
    const badge = container.querySelector('[data-slot="badge"]');
    const svg = badge?.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(badge?.textContent).toContain("With Icon");
  });
});
