import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

afterEach(() => {
  cleanup();
});

describe("Card Components", () => {
  describe("Card", () => {
    test("renders card element", () => {
      const { container } = render(<Card>Card content</Card>);
      const card = container.querySelector('[data-slot="card"]');
      expect(card).toBeTruthy();
    });

    test("applies custom className", () => {
      const { container } = render(<Card className="custom-class">Card</Card>);
      const card = container.querySelector('[data-slot="card"]');
      expect(card?.className).toContain("custom-class");
    });

    test("renders children", () => {
      render(<Card>Test content</Card>);
      const content = screen.getByText("Test content");
      expect(content).toBeTruthy();
    });

    test("applies default styling classes", () => {
      const { container } = render(<Card>Card</Card>);
      const card = container.querySelector('[data-slot="card"]');
      expect(card?.className).toContain("rounded-md");
      expect(card?.className).toContain("border");
    });
  });

  describe("CardHeader", () => {
    test("renders card header", () => {
      const { container } = render(<CardHeader>Header content</CardHeader>);
      const header = container.querySelector('[data-slot="card-header"]');
      expect(header).toBeTruthy();
    });

    test("applies custom className", () => {
      const { container } = render(
        <CardHeader className="custom-header">Header</CardHeader>
      );
      const header = container.querySelector('[data-slot="card-header"]');
      expect(header?.className).toContain("custom-header");
    });

    test("renders children", () => {
      render(<CardHeader>Header text</CardHeader>);
      const text = screen.getByText("Header text");
      expect(text).toBeTruthy();
    });
  });

  describe("CardTitle", () => {
    test("renders card title", () => {
      const { container } = render(<CardTitle>Title text</CardTitle>);
      const title = container.querySelector('[data-slot="card-title"]');
      expect(title).toBeTruthy();
    });

    test("applies custom className", () => {
      const { container } = render(
        <CardTitle className="custom-title">Title</CardTitle>
      );
      const title = container.querySelector('[data-slot="card-title"]');
      expect(title?.className).toContain("custom-title");
    });

    test("renders children", () => {
      render(<CardTitle>My Title</CardTitle>);
      const title = screen.getByText("My Title");
      expect(title).toBeTruthy();
    });

    test("applies font-semibold class", () => {
      const { container } = render(<CardTitle>Title</CardTitle>);
      const title = container.querySelector('[data-slot="card-title"]');
      expect(title?.className).toContain("font-semibold");
    });
  });

  describe("CardDescription", () => {
    test("renders card description", () => {
      const { container } = render(
        <CardDescription>Description text</CardDescription>
      );
      const description = container.querySelector(
        '[data-slot="card-description"]'
      );
      expect(description).toBeTruthy();
    });

    test("applies custom className", () => {
      const { container } = render(
        <CardDescription className="custom-description">
          Description
        </CardDescription>
      );
      const description = container.querySelector(
        '[data-slot="card-description"]'
      );
      expect(description?.className).toContain("custom-description");
    });

    test("renders children", () => {
      render(<CardDescription>Description content</CardDescription>);
      const content = screen.getByText("Description content");
      expect(content).toBeTruthy();
    });
  });

  describe("CardAction", () => {
    test("renders card action", () => {
      const { container } = render(<CardAction>Action button</CardAction>);
      const action = container.querySelector('[data-slot="card-action"]');
      expect(action).toBeTruthy();
    });

    test("applies custom className", () => {
      const { container } = render(
        <CardAction className="custom-action">Action</CardAction>
      );
      const action = container.querySelector('[data-slot="card-action"]');
      expect(action?.className).toContain("custom-action");
    });

    test("renders children", () => {
      render(<CardAction>Action</CardAction>);
      const action = screen.getByText("Action");
      expect(action).toBeTruthy();
    });
  });

  describe("CardContent", () => {
    test("renders card content", () => {
      const { container } = render(<CardContent>Content text</CardContent>);
      const content = container.querySelector('[data-slot="card-content"]');
      expect(content).toBeTruthy();
    });

    test("applies custom className", () => {
      const { container } = render(
        <CardContent className="custom-content">Content</CardContent>
      );
      const content = container.querySelector('[data-slot="card-content"]');
      expect(content?.className).toContain("custom-content");
    });

    test("renders children", () => {
      render(<CardContent>Main content</CardContent>);
      const content = screen.getByText("Main content");
      expect(content).toBeTruthy();
    });
  });

  describe("CardFooter", () => {
    test("renders card footer", () => {
      const { container } = render(<CardFooter>Footer content</CardFooter>);
      const footer = container.querySelector('[data-slot="card-footer"]');
      expect(footer).toBeTruthy();
    });

    test("applies custom className", () => {
      const { container } = render(
        <CardFooter className="custom-footer">Footer</CardFooter>
      );
      const footer = container.querySelector('[data-slot="card-footer"]');
      expect(footer?.className).toContain("custom-footer");
    });

    test("renders children", () => {
      render(<CardFooter>Footer text</CardFooter>);
      const footer = screen.getByText("Footer text");
      expect(footer).toBeTruthy();
    });
  });

  describe("Integration", () => {
    test("renders complete card with all components", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
            <CardAction>Action</CardAction>
          </CardHeader>
          <CardContent>Main content goes here</CardContent>
          <CardFooter>Footer content</CardFooter>
        </Card>
      );

      expect(screen.getByText("Card Title")).toBeTruthy();
      expect(screen.getByText("Card Description")).toBeTruthy();
      expect(screen.getByText("Action")).toBeTruthy();
      expect(screen.getByText("Main content goes here")).toBeTruthy();
      expect(screen.getByText("Footer content")).toBeTruthy();
    });

    test("renders card with custom styling", () => {
      const { container } = render(
        <Card className="w-full">
          <CardHeader className="border-b">
            <CardTitle>Title</CardTitle>
          </CardHeader>
          <CardContent className="p-8">Content</CardContent>
        </Card>
      );

      const card = container.querySelector('[data-slot="card"]');
      const header = container.querySelector('[data-slot="card-header"]');
      const content = container.querySelector('[data-slot="card-content"]');

      expect(card?.className).toContain("w-full");
      expect(header?.className).toContain("border-b");
      expect(content?.className).toContain("p-8");
    });
  });
});
