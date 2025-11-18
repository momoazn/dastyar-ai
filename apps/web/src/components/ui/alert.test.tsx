import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { Alert, AlertDescription, AlertTitle } from "./alert";

afterEach(() => {
  cleanup();
});

describe("Alert Components", () => {
  describe("Alert", () => {
    test("renders alert element", () => {
      const { container } = render(<Alert>Alert content</Alert>);
      const alert = container.querySelector('[data-slot="alert"]');
      expect(alert).toBeTruthy();
    });

    test("has role='alert' attribute", () => {
      const { container } = render(<Alert>Alert</Alert>);
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeTruthy();
    });

    test("applies custom className", () => {
      const { container } = render(
        <Alert className="custom-alert">Alert</Alert>
      );
      const alert = container.querySelector('[data-slot="alert"]');
      expect(alert?.className).toContain("custom-alert");
    });

    test("renders children", () => {
      render(<Alert>Test alert</Alert>);
      const alert = screen.getByText("Test alert");
      expect(alert).toBeTruthy();
    });

    test("renders with default variant", () => {
      const { container } = render(<Alert>Default alert</Alert>);
      const alert = container.querySelector('[data-slot="alert"]');
      expect(alert?.className).toContain("bg-card");
    });

    test("renders with destructive variant", () => {
      const { container } = render(
        <Alert variant="destructive">Destructive alert</Alert>
      );
      const alert = container.querySelector('[data-slot="alert"]');
      expect(alert?.className).toContain("text-destructive");
    });

    test("applies default styling classes", () => {
      const { container } = render(<Alert>Alert</Alert>);
      const alert = container.querySelector('[data-slot="alert"]');
      expect(alert?.className).toContain("rounded-lg");
      expect(alert?.className).toContain("border");
      expect(alert?.className).toContain("grid");
    });
  });

  describe("AlertTitle", () => {
    test("renders alert title", () => {
      const { container } = render(<AlertTitle>Alert Title</AlertTitle>);
      const title = container.querySelector('[data-slot="alert-title"]');
      expect(title).toBeTruthy();
    });

    test("applies custom className", () => {
      const { container } = render(
        <AlertTitle className="custom-title">Title</AlertTitle>
      );
      const title = container.querySelector('[data-slot="alert-title"]');
      expect(title?.className).toContain("custom-title");
    });

    test("renders children", () => {
      render(<AlertTitle>Important Title</AlertTitle>);
      const title = screen.getByText("Important Title");
      expect(title).toBeTruthy();
    });

    test("applies font-medium class", () => {
      const { container } = render(<AlertTitle>Title</AlertTitle>);
      const title = container.querySelector('[data-slot="alert-title"]');
      expect(title?.className).toContain("font-medium");
    });
  });

  describe("AlertDescription", () => {
    test("renders alert description", () => {
      const { container } = render(
        <AlertDescription>Description text</AlertDescription>
      );
      const description = container.querySelector(
        '[data-slot="alert-description"]'
      );
      expect(description).toBeTruthy();
    });

    test("applies custom className", () => {
      const { container } = render(
        <AlertDescription className="custom-description">
          Description
        </AlertDescription>
      );
      const description = container.querySelector(
        '[data-slot="alert-description"]'
      );
      expect(description?.className).toContain("custom-description");
    });

    test("renders children", () => {
      render(<AlertDescription>Alert details go here</AlertDescription>);
      const description = screen.getByText("Alert details go here");
      expect(description).toBeTruthy();
    });

    test("applies text-muted-foreground class", () => {
      const { container } = render(
        <AlertDescription>Description</AlertDescription>
      );
      const description = container.querySelector(
        '[data-slot="alert-description"]'
      );
      expect(description?.className).toContain("text-muted-foreground");
    });
  });

  describe("Integration", () => {
    test("renders complete alert with title and description", () => {
      render(
        <Alert>
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>An error occurred</AlertDescription>
        </Alert>
      );

      expect(screen.getByText("Error")).toBeTruthy();
      expect(screen.getByText("An error occurred")).toBeTruthy();
    });

    test("renders destructive alert with all components", () => {
      const { container } = render(
        <Alert variant="destructive">
          <AlertTitle>Critical Error</AlertTitle>
          <AlertDescription>This is a critical error message</AlertDescription>
        </Alert>
      );

      const alert = container.querySelector('[data-slot="alert"]');
      expect(alert?.className).toContain("text-destructive");
      expect(screen.getByText("Critical Error")).toBeTruthy();
      expect(screen.getByText("This is a critical error message")).toBeTruthy();
    });

    test("renders alert with icon", () => {
      const { container } = render(
        <Alert>
          <svg aria-label="alert icon" role="img">
            <circle />
          </svg>
          <AlertTitle>With Icon</AlertTitle>
          <AlertDescription>Alert with an icon</AlertDescription>
        </Alert>
      );

      const svg = container.querySelector("svg");
      expect(svg).toBeTruthy();
      expect(screen.getByText("With Icon")).toBeTruthy();
      expect(screen.getByText("Alert with an icon")).toBeTruthy();
    });

    test("renders alert with custom styling", () => {
      const { container } = render(
        <Alert className="custom-alert">
          <AlertTitle className="custom-title">Custom</AlertTitle>
          <AlertDescription className="custom-description">
            Custom styled alert
          </AlertDescription>
        </Alert>
      );

      const alert = container.querySelector('[data-slot="alert"]');
      const title = container.querySelector('[data-slot="alert-title"]');
      const description = container.querySelector(
        '[data-slot="alert-description"]'
      );

      expect(alert?.className).toContain("custom-alert");
      expect(title?.className).toContain("custom-title");
      expect(description?.className).toContain("custom-description");
    });
  });
});
