import "@testing-library/jest-dom/vitest";
import React from "react";
import { act } from "react";
import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useFocusTrap } from "@/hooks/useFocusTrap";
import CreatePostModal from "@/components/modals/CreatePostModal";
import ProfileSettings from "@/components/profile/ProfileSettings";

const mockUseAppContext = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("axios");

vi.mock("react-toastify", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("@/context/AppContext", () => ({
  useAppContext: mockUseAppContext,
}));

function createElement<P extends object>(
  Component: React.ComponentType<P>,
  props: P
) {
  return React.createElement(Component, props);
}

function FocusTrapHarness({ active = true }: { active?: boolean }) {
  const ref = useFocusTrap(active);

  return React.createElement(
    "div",
    { ref },
    React.createElement("button", null, "First"),
    React.createElement("button", null, "Last")
  );
}

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ---------- useFocusTrap hook tests ----------

describe("useFocusTrap", () => {
  it("moves focus to the first focusable element when activated", async () => {
    render(createElement(FocusTrapHarness, { active: true }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
    });
  });

  it("restores focus to the previously focused element on unmount", () => {
    const trigger = document.createElement("button");
    trigger.textContent = "Open Modal";
    document.body.appendChild(trigger);
    trigger.focus();

    const restoreSpy = vi.spyOn(trigger, "focus");
    const { unmount } = render(createElement(FocusTrapHarness, { active: true }));

    unmount();

    expect(restoreSpy).toHaveBeenCalled();
    document.body.removeChild(trigger);
  });

  it("wraps Tab from last element back to first", () => {
    render(createElement(FocusTrapHarness, { active: true }));

    const first = screen.getByRole("button", { name: "First" });
    const last = screen.getByRole("button", { name: "Last" });

    last.focus();
    fireEvent.keyDown(document, {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });

    expect(first).toHaveFocus();
  });

  it("wraps Shift+Tab from first element back to last", () => {
    render(createElement(FocusTrapHarness, { active: true }));

    const first = screen.getByRole("button", { name: "First" });
    const last = screen.getByRole("button", { name: "Last" });

    first.focus();
    fireEvent.keyDown(document, {
      key: "Tab",
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });

    expect(last).toHaveFocus();
  });

  it("does nothing when active is false", () => {
    const addSpy = vi.spyOn(document, "addEventListener");

    renderHook(() => useFocusTrap(false));

    expect(addSpy).not.toHaveBeenCalledWith("keydown", expect.any(Function));
    addSpy.mockRestore();
  });
});

// ---------- CreatePostModal accessibility tests ----------

describe("CreatePostModal accessibility", () => {
  const onClose = vi.fn();
  const onPostCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockUseAppContext.mockReturnValue({
      userData: { id: "1" },
      setPosts: vi.fn(),
    });
  });

  it("renders with role='dialog' and aria-modal='true'", () => {
    render(createElement(CreatePostModal, { onClose, onPostCreated }));

    const dialog = screen.getByRole("dialog");

    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("has aria-labelledby pointing to the modal title", () => {
    render(createElement(CreatePostModal, { onClose, onPostCreated }));

    const dialog = screen.getByRole("dialog");
    const labelledBy = dialog.getAttribute("aria-labelledby");
    const title = labelledBy ? document.getElementById(labelledBy) : null;

    expect(labelledBy).toBeTruthy();
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent(/create new post/i);
  });

  it("backdrop has aria-hidden='true'", () => {
    const { container } = render(
      createElement(CreatePostModal, { onClose, onPostCreated })
    );

    expect(container.querySelector("[aria-hidden='true']")).toBeInTheDocument();
  });

  it("closes when Escape key is pressed", async () => {
    vi.useFakeTimers();
    render(createElement(CreatePostModal, { onClose, onPostCreated }));

    fireEvent.keyDown(document, { key: "Escape" });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(onClose).toHaveBeenCalled();
  });

  it("close button has aria-label='Close modal'", () => {
    render(createElement(CreatePostModal, { onClose, onPostCreated }));

    expect(screen.getByLabelText("Close modal")).toBeInTheDocument();
  });

  it("focus is trapped when tabbing from the last focusable element", async () => {
    render(createElement(CreatePostModal, { onClose, onPostCreated }));

    const dialog = screen.getByRole("dialog");
    const focusable = getFocusableElements(dialog);

    expect(focusable.length).toBeGreaterThan(1);

    focusable.at(-1)?.focus();
    fireEvent.keyDown(document, {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });

    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    expect(document.activeElement).toBe(focusable[0]);
  });
});

// ---------- ProfileSettings accessibility tests ----------

describe("ProfileSettings accessibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppContext.mockReturnValue({
      userData: {
        id: "1",
        username: "testuser",
        name: "Test",
        surname: "User",
        phoneNumber: "",
        bio: "",
        description: "",
        isPrivate: false,
        avatar: null,
      },
      setUserData: vi.fn(),
    });
  });

  it("renders with role='dialog' and aria-modal='true'", () => {
    render(createElement(ProfileSettings, {}));

    const dialog = screen.getByRole("dialog");

    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("has aria-labelledby pointing to the heading", () => {
    render(createElement(ProfileSettings, {}));

    const dialog = screen.getByRole("dialog");
    const labelledBy = dialog.getAttribute("aria-labelledby");
    const heading = labelledBy ? document.getElementById(labelledBy) : null;

    expect(labelledBy).toBeTruthy();
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent(/edit profile/i);
  });

  it("resets editable fields when Escape is pressed", () => {
    render(createElement(ProfileSettings, {}));

    fireEvent.click(screen.getAllByText("Edit")[0]);
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.getByDisplayValue("testuser")).toBeDisabled();
  });

  it("focus is trapped when tabbing from the last focusable element", async () => {
    render(createElement(ProfileSettings, {}));

    const dialog = screen.getByRole("dialog");
    const focusable = getFocusableElements(dialog);

    expect(focusable.length).toBeGreaterThan(1);

    focusable.at(-1)?.focus();
    fireEvent.keyDown(document, {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });

    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    expect(document.activeElement).toBe(focusable[0]);
  });
});