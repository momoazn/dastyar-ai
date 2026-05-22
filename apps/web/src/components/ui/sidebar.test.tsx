import { afterEach, describe, expect, it } from "bun:test";
import "../../../test-setup";
import { cleanup, render } from "@testing-library/react";
import { Sidebar, SidebarProvider } from "./sidebar";

afterEach(() => {
  cleanup();
});

function renderDesktopSidebar(side: "left" | "right") {
  const noop = () => null;

  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: 1280,
    writable: true,
  });
  window.matchMedia = (query: string) =>
    ({
      addEventListener: noop,
      addListener: noop,
      dispatchEvent: () => true,
      matches: false,
      media: query,
      onchange: null,
      removeEventListener: noop,
      removeListener: noop,
    }) as MediaQueryList;

  return render(
    <SidebarProvider>
      <Sidebar side={side}>
        <div>ناوبری</div>
      </Sidebar>
      <main>محتوا</main>
    </SidebarProvider>
  );
}

describe("Sidebar", () => {
  it("pins the right sidebar to the physical right edge in RTL layouts", () => {
    const { getByText } = renderDesktopSidebar("right");

    const sidebar = getByText("ناوبری").closest(
      "[data-slot='sidebar-container']"
    );

    expect(sidebar?.className).toContain("right-0");
    expect(sidebar?.className).not.toContain("end-0");
  });

  it("pins the left sidebar to the physical left edge", () => {
    const { getByText } = renderDesktopSidebar("left");

    const sidebar = getByText("ناوبری").closest(
      "[data-slot='sidebar-container']"
    );

    expect(sidebar?.className).toContain("left-0");
    expect(sidebar?.className).not.toContain("start-0");
  });
});
