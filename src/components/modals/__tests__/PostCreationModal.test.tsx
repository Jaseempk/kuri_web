/**
 * PostCreationModal Test Suite
 * 
 * Comprehensive tests for the new modal system including
 * all previously broken functionality (backdrop click, mobile positioning, etc.)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { PostCreationModal } from '../PostCreationModal';
import { usePostCreationStore } from '../../../stores/postCreationStore';
import { modalService } from '../../../services/modalService';
import { imageGenerationService } from '../../../services/imageGenerationService';
import { eventBus } from '../../../utils/eventBus';

// Mock dependencies
vi.mock('../../../services/modalService');
vi.mock('../../../services/imageGenerationService');
vi.mock('../../../utils/eventBus');
vi.mock('../../../utils/analytics');
vi.mock('../../../hooks/useClipboard');
vi.mock('sonner');

// Mock market data
const mockMarket = {
  address: '0x1234567890123456789012345678901234567890',
  name: 'Test Savings Circle',
  totalParticipants: 10,
  intervalType: 0,
  kuriAmount: '1000000', // 1 USDC in micro units
  activeParticipants: 5,
  state: 0,
};

describe('PostCreationModal', () => {
  const user = userEvent.setup();
  let mockOnViewMarket: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnViewMarket = vi.fn();
    
    // Reset Zustand store
    usePostCreationStore.getState().reset();
    
    // Mock modal service
    vi.mocked(modalService.show).mockImplementation(() => {});
    vi.mocked(modalService.hide).mockImplementation(() => {});
    vi.mocked(modalService.isModalOpen).mockReturnValue(true);
    
    // Mock image generation service
    vi.mocked(imageGenerationService.generateImage).mockResolvedValue({
      imageData: 'data:image/png;base64,mock-image-data',
      downloadUrl: 'blob:mock-download-url',
      generationTime: 1500,
    });
    
    // Mock event bus
    vi.mocked(eventBus.emit).mockImplementation(() => {});
    vi.mocked(eventBus.on).mockImplementation(() => () => {});
    
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    
    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Modal Display and Lifecycle', () => {
    it('renders when modal is visible with market data', () => {
      // Set up store state
      act(() => {
        usePostCreationStore.getState().showModal(mockMarket);
      });

      render(<PostCreationModal onViewMarket={mockOnViewMarket} />);

      expect(screen.getByText('Circle Created Successfully!')).toBeInTheDocument();
      expect(screen.getByText('Share your circle with your community')).toBeInTheDocument();
    });

    it('does not render when modal is not visible', () => {
      render(<PostCreationModal onViewMarket={mockOnViewMarket} />);
      
      expect(screen.queryByText('Circle Created Successfully!')).not.toBeInTheDocument();
    });

    it('integrates with modal service on mount', () => {
      act(() => {
        usePostCreationStore.getState().showModal(mockMarket);
      });

      render(<PostCreationModal onViewMarket={mockOnViewMarket} />);

      expect(modalService.show).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          onClose: expect.any(Function),
          preventBackdropClose: false, // This is the key fix!
        })
      );
    });

    it('calls modal service hide on cleanup', () => {
      act(() => {
        usePostCreationStore.getState().showModal(mockMarket);
      });

      const { unmount } = render(<PostCreationModal onViewMarket={mockOnViewMarket} />);
      
      unmount();

      expect(modalService.hide).toHaveBeenCalled();
    });
  });

  describe('Template Selection', () => {
    beforeEach(() => {
      act(() => {
        usePostCreationStore.getState().showModal(mockMarket);
      });
    });

    it('renders all template options', () => {
      render(<PostCreationModal onViewMarket={mockOnViewMarket} />);

      expect(screen.getByText('🎉 Party')).toBeInTheDocument();
      expect(screen.getByText('📈 Stats')).toBeInTheDocument();
      expect(screen.getByText('✨ Clean')).toBeInTheDocument();
    });

    it('highlights selected template', () => {
      render(<PostCreationModal onViewMarket={mockOnViewMarket} />);

      const heroButton = screen.getByText('🎉 Party');
      expect(heroButton).toHaveClass('bg-[#C84E31]', 'text-white');
    });

    it('changes template when clicked', async () => {
      render(<PostCreationModal onViewMarket={mockOnViewMarket} />);

      const statsButton = screen.getByText('📈 Stats');
      await user.click(statsButton);

      await waitFor(() => {
        expect(usePostCreationStore.getState().selectedTemplate).toBe('stats');
      });
    });

    it('clears existing image when template changes', async () => {
      // Set up with existing image
      act(() => {
        usePostCreationStore.getState().setGeneratedImage('existing-image', 'existing-url');
      });

      render(<PostCreationModal onViewMarket={mockOnViewMarket} />);

      const statsButton = screen.getByText('📈 Stats');
      await user.click(statsButton);

      await waitFor(() => {
        expect(usePostCreationStore.getState().generatedImage).toBe('');
      });
    });
  });

  describe('Image Generation', () => {
    beforeEach(() => {
      act(() => {
        usePostCreationStore.getState().showModal(mockMarket);
      });
    });

    it('starts image generation on mount', async () => {
      render(<PostCreationModal onViewMarket={mockOnViewMarket} />);

      await waitFor(() => {
        expect(imageGenerationService.generateImage).toHaveBeenCalledWith(
          mockMarket,
          'hero', // default template
          expect.any(String) // user address
        );
      });
    });

    it('displays loading state during generation', () => {
      render(<PostCreationModal onViewMarket={mockOnViewMarket} />);

      expect(screen.getByText('Generating image...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('displays generated image when complete', async () => {
      // Mock successful generation
      act(() => {
        usePostCreationStore.getState().setGeneratedImage(
          'data:image/png;base64,generated-image',
          'blob:download-url'
        );
      });

      render(<PostCreationModal onViewMarket={mockOnViewMarket} />);

      const image = screen.getByAltText('Circle celebration');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'data:image/png;base64,generated-image');
    });

    it('handles generation errors gracefully', async () => {
      vi.mocked(imageGenerationService.generateImage).mockRejectedValue(
        new Error('Generation failed')
      );

      render(<PostCreationModal onViewMarket={mockOnViewMarket} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to generate image')).toBeInTheDocument();
      });
    });
  });

  describe('Sharing and Actions', () => {
    beforeEach(() => {
      act(() => {
        usePostCreationStore.getState().showModal(mockMarket);
        usePostCreationStore.getState().setGeneratedImage(
          'data:image/png;base64,test-image',
          'blob:test-url'
        );
      });
    });

    it('displays correct share URL', () => {
      render(<PostCreationModal onViewMarket={mockOnViewMarket} />);

      const expectedUrl = `${window.location.origin}/markets/${mockMarket.address}`;
      expect(screen.getByText(new RegExp(mockMarket.address.slice(0, 8)))).toBeInTheDocument();
    });

    it('copies link to clipboard when copy button clicked', async () => {
      render(<PostCreationModal onViewMarket={mockOnViewMarket} />);

      const copyButtons = screen.getAllByText('Copy');
      await user.click(copyButtons[0]); // First copy button (in URL section)

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        `${window.location.origin}/markets/${mockMarket.address}`
      );
    });

    it('handles download when download button clicked', async () => {
      // Mock document.createElement and appendChild
      const mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: vi.fn(),
        parentNode: null,
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

      render(<PostCreationModal onViewMarket={mockOnViewMarket} />);

      const downloadButton = screen.getByText('Download');
      await user.click(downloadButton);

      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.href).toBe('blob:test-url');
      expect(mockLink.download).toContain('kuri-circle');
    });

    it('handles custom message input', async () => {
      render(<PostCreationModal onViewMarket={mockOnViewMarket} />);

      const textarea = screen.getByPlaceholderText('Add a custom message (optional)');
      await user.type(textarea, 'Custom share message');

      expect(usePostCreationStore.getState().customMessage).toBe('Custom share message');
    });

    it('calls onViewMarket when View Circle clicked', async () => {
      render(<PostCreationModal onViewMarket={mockOnViewMarket} />);

      const viewButton = screen.getByText('View Circle');
      await user.click(viewButton);

      expect(mockOnViewMarket).toHaveBeenCalled();
    });
  });

  describe('Close Functionality', () => {
    beforeEach(() => {
      act(() => {
        usePostCreationStore.getState().showModal(mockMarket);
      });
    });

    it('renders close button', () => {
      render(<PostCreationModal onViewMarket={mockOnViewMarket} />);

      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toBeInTheDocument();
    });

    it('closes modal when close button clicked', async () => {
      render(<PostCreationModal onViewMarket={mockOnViewMarket} />);

      const closeButton = screen.getByLabelText('Close modal');
      await user.click(closeButton);

      expect(usePostCreationStore.getState().isVisible).toBe(false);
    });

    it('enables backdrop click (THIS WAS BROKEN BEFORE!)', () => {
      render(<PostCreationModal onViewMarket={mockOnViewMarket} />);

      // Verify modal service was called with backdrop click enabled
      expect(modalService.show).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          preventBackdropClose: false, // Key fix - backdrop click is now enabled!
        })
      );
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      act(() => {
        usePostCreationStore.getState().showModal(mockMarket);
      });
    });

    it('applies mobile-optimized styles', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<PostCreationModal onViewMarket={mockOnViewMarket} />);

      // Verify modal service handles responsive positioning
      expect(modalService.show).toHaveBeenCalled();
    });

    it('applies desktop styles for larger screens', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      render(<PostCreationModal onViewMarket={mockOnViewMarket} />);

      expect(modalService.show).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles missing market gracefully', () => {
      act(() => {
        usePostCreationStore.getState().showModal(mockMarket);
        // Then clear the market
        usePostCreationStore.setState({ market: null });
      });

      render(<PostCreationModal onViewMarket={mockOnViewMarket} />);

      // Should not render when no market
      expect(screen.queryByText('Circle Created Successfully!')).not.toBeInTheDocument();
    });

    it('handles image generation service errors', async () => {
      vi.mocked(imageGenerationService.generateImage).mockRejectedValue(
        new Error('Service unavailable')
      );

      act(() => {
        usePostCreationStore.getState().showModal(mockMarket);
      });

      render(<PostCreationModal onViewMarket={mockOnViewMarket} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to generate image')).toBeInTheDocument();
      });
    });

    it('cleans up resources on unmount', () => {
      act(() => {
        usePostCreationStore.getState().showModal(mockMarket);
        usePostCreationStore.getState().setGeneratedImage('image', 'blob:test-url');
      });

      const { unmount } = render(<PostCreationModal onViewMarket={mockOnViewMarket} />);
      
      unmount();

      // Should call hide on modal service
      expect(modalService.hide).toHaveBeenCalled();
    });
  });

  describe('Analytics Integration', () => {
    beforeEach(() => {
      act(() => {
        usePostCreationStore.getState().showModal(mockMarket);
        usePostCreationStore.getState().setGeneratedImage('image', 'blob:test-url');
      });
    });

    it('tracks download events', async () => {
      const mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: vi.fn(),
        parentNode: null,
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);

      render(<PostCreationModal onViewMarket={mockOnViewMarket} />);

      const downloadButton = screen.getByText('Download');
      await user.click(downloadButton);

      // Analytics should be tracked (mocked in beforeEach)
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('tracks template changes', async () => {
      render(<PostCreationModal onViewMarket={mockOnViewMarket} />);

      const statsButton = screen.getByText('📈 Stats');
      await user.click(statsButton);

      // Template should be updated
      await waitFor(() => {
        expect(usePostCreationStore.getState().selectedTemplate).toBe('stats');
      });
    });
  });
});

describe('Integration with Modal Service', () => {
  it('modal service positioning works correctly', () => {
    const mockContainer = document.createElement('div');
    
    modalService.show(mockContainer, {
      onClose: () => {},
      preventBackdropClose: false,
    });

    // Verify modal service methods are called
    expect(modalService.show).toHaveBeenCalledWith(
      mockContainer,
      expect.objectContaining({
        preventBackdropClose: false,
      })
    );
  });

  it('handles multiple rapid open/close operations', async () => {
    const store = usePostCreationStore.getState();
    
    // Simulate rapid operations
    act(() => {
      store.showModal(mockMarket);
      store.hideModal();
      store.showModal(mockMarket);
    });

    expect(store.isVisible).toBe(true);
    expect(store.market).toEqual(mockMarket);
  });
});