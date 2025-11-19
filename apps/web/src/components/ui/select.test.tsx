import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./select";

// Clean up after each test to prevent DOM pollution
afterEach(() => {
  cleanup();
});

describe("Select Components", () => {
  describe("Select Root & Trigger", () => {
    test("renders select trigger", () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
        </Select>
      );
      const trigger = screen.getByRole("combobox");
      expect(trigger).toBeTruthy();
    });

    test("accepts defaultValue prop", () => {
      render(
        <Select defaultValue="option1">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
        </Select>
      );
      const trigger = screen.getByRole("combobox");
      expect(trigger).toBeTruthy();
    });

    test("accepts disabled prop", () => {
      render(
        <Select disabled>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
        </Select>
      );
      const trigger = screen.getByRole("combobox");
      expect(trigger.hasAttribute("disabled")).toBe(true);
    });

    test("renders trigger with default size", () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
        </Select>
      );
      const trigger = screen.getByRole("combobox");
      expect(trigger.getAttribute("data-size")).toBe("default");
    });

    test("renders trigger with small size", () => {
      render(
        <Select>
          <SelectTrigger size="sm">
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
        </Select>
      );
      const trigger = screen.getByRole("combobox");
      expect(trigger.getAttribute("data-size")).toBe("sm");
    });

    test("applies custom className to trigger", () => {
      render(
        <Select>
          <SelectTrigger className="custom-trigger">
            <SelectValue />
          </SelectTrigger>
        </Select>
      );
      const trigger = screen.getByRole("combobox");
      expect(trigger.className).toContain("custom-trigger");
    });

    test("includes data-slot attribute on trigger", () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
        </Select>
      );
      const trigger = screen.getByRole("combobox");
      expect(trigger.getAttribute("data-slot")).toBe("select-trigger");
    });
  });

  describe("SelectValue", () => {
    test("renders with placeholder", () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose an option" />
          </SelectTrigger>
        </Select>
      );
      const placeholder = screen.getByText("Choose an option");
      expect(placeholder).toBeTruthy();
    });
  });

  describe("Integration", () => {
    test("renders complete select with multiple items", () => {
      render(
        <Select defaultValue="1">
          <SelectTrigger>
            <SelectValue placeholder="Select item" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Options</SelectLabel>
              <SelectItem value="1">Option 1</SelectItem>
              <SelectItem value="2">Option 2</SelectItem>
              <SelectItem value="3">Option 3</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByRole("combobox");
      expect(trigger).toBeTruthy();
    });

    test("renders select with custom styling", () => {
      render(
        <Select>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Custom styled" />
          </SelectTrigger>
          <SelectContent className="custom-content">
            <SelectItem className="custom-item" value="1">
              Item 1
            </SelectItem>
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByRole("combobox");
      expect(trigger.className).toContain("w-full");
    });

    test("renders select with groups and labels", () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Group 1</SelectLabel>
              <SelectItem value="1">Item 1</SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Group 2</SelectLabel>
              <SelectItem value="2">Item 2</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByRole("combobox");
      expect(trigger).toBeTruthy();
    });
  });
});
