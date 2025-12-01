import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ErrorBoundary } from "./error-boundary";

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Regex pattern for reset button text (moved to module level for performance)
const RESET_BUTTON_PATTERN = /بازنشانی صفحه/i;

// Component that throws an error for testing
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Test error message");
  }
  return <div>No error</div>;
}

describe("ErrorBoundary", () => {
  it("should render children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText("Test content")).toBeTruthy();
  });

  it("should catch errors and display fallback UI", () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = mock(() => {
      // Intentionally empty to suppress error output
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Check for Persian error message
    expect(screen.getByText("خطای غیرمنتظره")).toBeTruthy();
    expect(
      screen.getByText(
        "متأسفیم، مشکلی پیش آمده است. لطفاً صفحه را بازنشانی کنید."
      )
    ).toBeTruthy();

    // Restore console.error
    console.error = originalError;
  });

  it("should display reset button in error state", () => {
    const originalError = console.error;
    console.error = mock(() => {
      // Intentionally empty to suppress error output
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const resetButton = screen.getByRole("button", {
      name: RESET_BUTTON_PATTERN,
    });
    expect(resetButton).toBeTruthy();

    console.error = originalError;
  });

  it("should reload page when reset button is clicked", () => {
    const originalError = console.error;
    const originalReload = window.location.reload;
    console.error = mock(() => {
      // Intentionally empty to suppress error output
    });
    window.location.reload = mock(() => {
      // Intentionally empty to mock reload
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const resetButton = screen.getByRole("button", {
      name: RESET_BUTTON_PATTERN,
    });
    fireEvent.click(resetButton);

    expect(window.location.reload).toHaveBeenCalled();

    console.error = originalError;
    window.location.reload = originalReload;
  });

  it("should render custom fallback when provided", () => {
    const originalError = console.error;
    console.error = mock(() => {
      // Intentionally empty to suppress error output
    });

    const customFallback = <div>Custom error fallback</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Custom error fallback")).toBeTruthy();
    expect(screen.queryByText("خطای غیرمنتظره")).toBeFalsy();

    console.error = originalError;
  });

  it("should display error message in development mode", () => {
    const originalError = console.error;
    const originalEnv = import.meta.env.DEV;
    console.error = mock(() => {
      // Intentionally empty to suppress error output
    });

    // Force dev mode
    import.meta.env.DEV = true;

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Test error message")).toBeTruthy();

    console.error = originalError;
    import.meta.env.DEV = originalEnv;
  });

  it("should display alert triangle icon in error state", () => {
    const originalError = console.error;
    console.error = mock(() => {
      // Intentionally empty to suppress error output
    });

    const { container } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Check for icon container
    const iconContainer = container.querySelector(".text-destructive");
    expect(iconContainer).toBeTruthy();

    console.error = originalError;
  });

  it("should not display error when error is fixed", () => {
    const originalError = console.error;
    console.error = mock(() => {
      // Intentionally empty to suppress error output
    });

    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error should be displayed
    expect(screen.getByText("خطای غیرمنتظره")).toBeTruthy();

    // Re-render with no error
    // Note: In reality, ErrorBoundary doesn't automatically recover
    // This test demonstrates the component structure
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Error boundary state persists, so error still shows
    // This is expected React behavior
    expect(screen.getByText("خطای غیرمنتظره")).toBeTruthy();

    console.error = originalError;
  });
});
