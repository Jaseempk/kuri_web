import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Onboarding from "../Onboarding";
import { renderWithProviders } from "../../test/utils";

// Mock react-router-dom hooks
const mockNavigate = vi.hoisted(() => vi.fn());
const mockUseLocation = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: mockUseLocation,
  };
});

// Mock wagmi useAccount hook
const mockUseAccount = vi.hoisted(() => vi.fn());

vi.mock("wagmi", async () => {
  const actual = await vi.importActual("wagmi");
  return {
    ...actual,
    useAccount: mockUseAccount,
  };
});

// Mock useUserProfile hook
const mockUpdateProfile = vi.hoisted(() => vi.fn());
const mockUseUserProfile = vi.hoisted(() => vi.fn());

vi.mock("../../hooks/useUserProfile", () => ({
  useUserProfile: mockUseUserProfile,
}));

// Mock utility functions
vi.mock("../../utils/sanitize", () => ({
  sanitizeInput: vi.fn((input) => input.replace(/<[^>]*>/g, "")),
}));

vi.mock("../../utils/fileValidation", () => ({
  validateImageFile: vi.fn((file) => {
    if (file.size > 5000000) {
      return { isValid: false, error: "File too large" };
    }
    if (!file.type.startsWith("image/")) {
      return { isValid: false, error: "Invalid file type" };
    }
    return { isValid: true };
  }),
}));

// Mock error handling utilities
vi.mock("../../utils/apiErrors", () => ({
  formatErrorForUser: vi.fn((error) => 
    error instanceof Error ? error.message : "An error occurred"
  ),
}));

// Mock analytics
vi.mock("../../utils/analytics", () => ({
  trackEvent: vi.fn(),
  trackError: vi.fn(),
}));

// Mock toast notifications
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock UI components
vi.mock("../../components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock("../../components/ui/input", () => ({
  Input: (props: any) => <input {...props} />,
}));

describe("Onboarding", () => {
  const mockUserAddress = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef" as `0x${string}`;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAccount.mockReturnValue({
      address: mockUserAddress,
    });

    mockUseUserProfile.mockReturnValue({
      profile: null,
      updateProfile: mockUpdateProfile,
    });

    mockUseLocation.mockReturnValue({
      state: { returnUrl: "/markets", source: "direct" },
    });

    mockUpdateProfile.mockResolvedValue({
      username: "testuser",
      display_name: "Test User",
    });
  });

  describe("form validation", () => {
    it("validates username is required", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <Onboarding />
        </MemoryRouter>,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      const submitButton = screen.getByRole("button", { name: /complete profile/i });
      
      // Try to submit without username
      await user.click(submitButton);

      expect(screen.getByText("Username is required")).toBeInTheDocument();
      expect(mockUpdateProfile).not.toHaveBeenCalled();
    });

    it("validates display name is required", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <Onboarding />
        </MemoryRouter>,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      const usernameInput = screen.getByPlaceholderText("Choose a unique username");
      const submitButton = screen.getByRole("button", { name: /complete profile/i });

      // Fill username but leave display name empty
      await user.type(usernameInput, "testuser");
      await user.click(submitButton);

      expect(screen.getByText("Display name is required")).toBeInTheDocument();
      expect(mockUpdateProfile).not.toHaveBeenCalled();
    });

    it("validates username format", async () => {
      const user = userEvent.setup();

      render(  
        <MemoryRouter>
          <Onboarding />
        </MemoryRouter>,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      const usernameInput = screen.getByPlaceholderText("Choose a unique username");
      const displayNameInput = screen.getByPlaceholderText("Enter your display name");
      const submitButton = screen.getByRole("button", { name: /complete profile/i });

      // Test invalid username with special characters
      await user.type(usernameInput, "test@user");
      await user.type(displayNameInput, "Test User");
      await user.click(submitButton);

      expect(screen.getByText(/Username must be 3-20 characters and contain only letters, numbers, and underscores/)).toBeInTheDocument();
      expect(mockUpdateProfile).not.toHaveBeenCalled();
    });

    it("validates username length constraints", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <Onboarding />
        </MemoryRouter>,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      const usernameInput = screen.getByPlaceholderText("Choose a unique username");
      const displayNameInput = screen.getByPlaceholderText("Enter your display name");
      const submitButton = screen.getByRole("button", { name: /complete profile/i });

      // Test username too short
      await user.type(usernameInput, "ab");
      await user.type(displayNameInput, "Test User");
      await user.click(submitButton);

      expect(screen.getByText(/Username must be 3-20 characters and contain only letters, numbers, and underscores/)).toBeInTheDocument();
      expect(mockUpdateProfile).not.toHaveBeenCalled();
    });

    it("requires profile picture upload", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <Onboarding />
        </MemoryRouter>,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      const usernameInput = screen.getByPlaceholderText("Choose a unique username");
      const displayNameInput = screen.getByPlaceholderText("Enter your display name");
      const submitButton = screen.getByRole("button", { name: /complete profile/i });

      await user.type(usernameInput, "testuser");
      await user.type(displayNameInput, "Test User");
      await user.click(submitButton);

      expect(screen.getByText("Please add a profile picture to continue")).toBeInTheDocument();
      expect(mockUpdateProfile).not.toHaveBeenCalled();
    });

    it("validates image file size and type", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <Onboarding />
        </MemoryRouter>,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      const fileInput = screen.getByRole("textbox", { hidden: true }) || 
                       document.querySelector('input[type="file"]');

      // Create oversized file
      const oversizedFile = new File(["x".repeat(6000000)], "large.jpg", {
        type: "image/jpeg",
      });

      await user.upload(fileInput as HTMLInputElement, oversizedFile);

      expect(screen.getByText("File too large")).toBeInTheDocument();
    });

    it("handles invalid file types", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <Onboarding />
        </MemoryRouter>,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      const fileInput = screen.getByRole("textbox", { hidden: true }) || 
                       document.querySelector('input[type="file"]');

      // Create non-image file
      const textFile = new File(["test content"], "document.txt", {
        type: "text/plain",
      });

      await user.upload(fileInput as HTMLInputElement, textFile);

      expect(screen.getByText("Invalid file type")).toBeInTheDocument();
    });
  });

  describe("successful profile creation", () => {
    const setupValidForm = async (user: any) => {
      const usernameInput = screen.getByPlaceholderText("Choose a unique username");
      const displayNameInput = screen.getByPlaceholderText("Enter your display name");
      const fileInput = screen.getByRole("textbox", { hidden: true }) || 
                       document.querySelector('input[type="file"]');

      await user.type(usernameInput, "testuser123");
      await user.type(displayNameInput, "Test User");

      // Upload valid image
      const validFile = new File(["image content"], "profile.jpg", {
        type: "image/jpeg",
      });
      await user.upload(fileInput as HTMLInputElement, validFile);
    };

    it("creates profile successfully with valid form", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <Onboarding />
        </MemoryRouter>,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      await setupValidForm(user);

      const submitButton = screen.getByRole("button", { name: /complete profile/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({
          username: "testuser123",
          display_name: "Test User",
          image: expect.any(File),
          reputation_score: 0,
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith("/markets", { replace: true });
    });

    it("shows loading state during profile creation", async () => {
      const user = userEvent.setup();
      
      // Make updateProfile hang to test loading state
      let resolveUpdateProfile: (value: any) => void;
      const updateProfilePromise = new Promise((resolve) => {
        resolveUpdateProfile = resolve;
      });
      mockUpdateProfile.mockReturnValue(updateProfilePromise);

      render(
        <MemoryRouter>
          <Onboarding />
        </MemoryRouter>,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      await setupValidForm(user);

      const submitButton = screen.getByRole("button", { name: /complete profile/i });
      await user.click(submitButton);

      // Check loading state
      expect(screen.getByText("Creating Profile...")).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      // Resolve the promise
      resolveUpdateProfile!({});
    });

    it("handles profile creation errors", async () => {
      const user = userEvent.setup();
      const apiError = new Error("Username already taken");
      mockUpdateProfile.mockRejectedValue(apiError);

      render(
        <MemoryRouter>
          <Onboarding />
        </MemoryRouter>,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      await setupValidForm(user);

      const submitButton = screen.getByRole("button", { name: /complete profile/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Username already taken")).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("input sanitization", () => {
    it("sanitizes text inputs to prevent XSS", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <Onboarding />
        </MemoryRouter>,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      const usernameInput = screen.getByPlaceholderText("Choose a unique username");
      const displayNameInput = screen.getByPlaceholderText("Enter your display name");
      const fileInput = screen.getByRole("textbox", { hidden: true }) || 
                       document.querySelector('input[type="file"]');

      await user.type(usernameInput, "testuser");
      await user.type(displayNameInput, "<script>alert('xss')</script>Safe Name");

      // Upload valid image
      const validFile = new File(["image content"], "profile.jpg", {
        type: "image/jpeg",
      });
      await user.upload(fileInput as HTMLInputElement, validFile);

      const submitButton = screen.getByRole("button", { name: /complete profile/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({
          username: "testuser",
          display_name: "Safe Name", // XSS tags should be stripped
          image: expect.any(File),
          reputation_score: 0,
        });
      });
    });
  });

  describe("skip functionality", () => {
    it("allows skipping onboarding", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <Onboarding />
        </MemoryRouter>,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      const skipButton = screen.getByRole("button", { name: /skip for now/i });
      await user.click(skipButton);

      expect(mockNavigate).toHaveBeenCalledWith("/markets", { replace: true });
      expect(mockUpdateProfile).not.toHaveBeenCalled();
    });

    it("navigates back in history when possible", async () => {
      const user = userEvent.setup();
      
      // Mock window.history.length to simulate browser history
      Object.defineProperty(window, 'history', {
        value: { length: 5 },
        writable: true
      });

      render(
        <MemoryRouter>
          <Onboarding />
        </MemoryRouter>,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      const skipButton = screen.getByRole("button", { name: /skip for now/i });
      await user.click(skipButton);

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe("redirect behavior", () => {
    it("redirects to markets if user already has profile", () => {
      mockUseUserProfile.mockReturnValue({
        profile: {
          username: "existinguser",
          display_name: "Existing User",
        },
        updateProfile: mockUpdateProfile,
      });

      render(
        <MemoryRouter>
          <Onboarding />
        </MemoryRouter>,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      expect(mockNavigate).toHaveBeenCalledWith("/markets");
    });

    it("uses custom return URL from navigation state", () => {
      mockUseLocation.mockReturnValue({
        state: { returnUrl: "/specific-market/123", source: "direct" },
      });

      mockUseUserProfile.mockReturnValue({
        profile: {
          username: "existinguser",
          display_name: "Existing User",
        },
        updateProfile: mockUpdateProfile,
      });

      render(
        <MemoryRouter>
          <Onboarding />
        </MemoryRouter>,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      expect(mockNavigate).toHaveBeenCalledWith("/specific-market/123");
    });
  });

  describe("analytics tracking", () => {
    it("tracks onboarding start event", () => {
      const { trackEvent } = require("../../utils/analytics");

      render(
        <MemoryRouter>
          <Onboarding />
        </MemoryRouter>,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      expect(trackEvent).toHaveBeenCalledWith("onboarding_started", {
        source: "direct",
      });
    });

    it("tracks profile creation success", async () => {
      const user = userEvent.setup();
      const { trackEvent } = require("../../utils/analytics");

      render(
        <MemoryRouter>
          <Onboarding />
        </MemoryRouter>,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      const usernameInput = screen.getByPlaceholderText("Choose a unique username");
      const displayNameInput = screen.getByPlaceholderText("Enter your display name");
      const fileInput = screen.getByRole("textbox", { hidden: true }) || 
                       document.querySelector('input[type="file"]');

      await user.type(usernameInput, "testuser");
      await user.type(displayNameInput, "Test User");

      const validFile = new File(["image content"], "profile.jpg", {
        type: "image/jpeg",
      });
      await user.upload(fileInput as HTMLInputElement, validFile);

      const submitButton = screen.getByRole("button", { name: /complete profile/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(trackEvent).toHaveBeenCalledWith("profile_created", {
          has_display_name: true,
          has_bio: false,
        });
      });

      expect(trackEvent).toHaveBeenCalledWith("onboarding_completed", {
        duration: expect.any(Number),
        steps_completed: 1,
      });
    });

    it("tracks onboarding abandonment on skip", async () => {
      const user = userEvent.setup();
      const { trackEvent } = require("../../utils/analytics");

      render(
        <MemoryRouter>
          <Onboarding />
        </MemoryRouter>,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      const skipButton = screen.getByRole("button", { name: /skip for now/i });
      await user.click(skipButton);

      expect(trackEvent).toHaveBeenCalledWith("onboarding_abandoned", {
        step: "profile_creation",
        duration: expect.any(Number),
      });
    });
  });

  describe("accessibility", () => {
    it("provides proper form labels and structure", () => {
      render(
        <MemoryRouter>
          <Onboarding />
        </MemoryRouter>,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      expect(screen.getByLabelText("Profile Picture")).toBeInTheDocument();
      expect(screen.getByLabelText("Username")).toBeInTheDocument();
      expect(screen.getByLabelText("Display Name")).toBeInTheDocument();
    });

    it("provides helpful input constraints and validation", () => {
      render(
        <MemoryRouter>
          <Onboarding />
        </MemoryRouter>,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      const usernameInput = screen.getByPlaceholderText("Choose a unique username");
      
      expect(usernameInput).toHaveAttribute("pattern", "^[a-zA-Z0-9_]{3,20}$");
      expect(usernameInput).toHaveAttribute("title", "Username must be 3-20 characters and contain only letters, numbers, and underscores");
      expect(usernameInput).toHaveAttribute("required");

      const displayNameInput = screen.getByPlaceholderText("Enter your display name");
      expect(displayNameInput).toHaveAttribute("maxLength", "50");
      expect(displayNameInput).toHaveAttribute("required");
    });
  });

  describe("image preview functionality", () => {
    it("shows image preview after valid file upload", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <Onboarding />
        </MemoryRouter>,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      const fileInput = screen.getByRole("textbox", { hidden: true }) || 
                       document.querySelector('input[type="file"]');

      const validFile = new File(["image content"], "profile.jpg", {
        type: "image/jpeg",
      });

      // Mock URL.createObjectURL
      const mockObjectURL = "blob:test-url";
      global.URL.createObjectURL = vi.fn(() => mockObjectURL);

      await user.upload(fileInput as HTMLInputElement, validFile);

      const previewImage = screen.getByAltText("Profile Preview");
      expect(previewImage).toBeInTheDocument();
      expect(previewImage).toHaveAttribute("src", mockObjectURL);
    });

    it("clears image preview when file is removed", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <Onboarding />
        </MemoryRouter>,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      const fileInput = screen.getByRole("textbox", { hidden: true }) || 
                       document.querySelector('input[type="file"]');

      const validFile = new File(["image content"], "profile.jpg", {
        type: "image/jpeg",
      });

      // Mock URL.createObjectURL
      global.URL.createObjectURL = vi.fn(() => "blob:test-url");

      await user.upload(fileInput as HTMLInputElement, validFile);
      expect(screen.getByAltText("Profile Preview")).toBeInTheDocument();

      // Clear the file input
      await user.upload(fileInput as HTMLInputElement, []);
      expect(screen.queryByAltText("Profile Preview")).not.toBeInTheDocument();
    });
  });
});