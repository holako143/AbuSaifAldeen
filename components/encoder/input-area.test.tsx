import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { InputArea } from './input-area';
import { useEncoderState } from '@/hooks/use-encoder-state';

// Mock hooks
vi.mock('@/hooks/use-encoder-state', () => ({
  useEncoderState: vi.fn(),
}));
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('InputArea', () => {
  const mockSetIsScannerOpen = vi.fn();

  beforeEach(() => {
    (useEncoderState as vi.Mock).mockReturnValue({
      inputText: 'test input',
      setInputText: vi.fn(),
      mode: 'encode',
    });
  });

  it('renders the textarea with the correct placeholder for encode mode', () => {
    render(<InputArea setIsScannerOpen={mockSetIsScannerOpen} />);
    expect(screen.getByPlaceholderText('أكتب النص الذي تريد تشفيرة')).toBeInTheDocument();
  });

  it('renders the textarea with the correct placeholder for decode mode', () => {
    (useEncoderState as vi.Mock).mockReturnValue({
      inputText: 'test input',
      setInputText: vi.fn(),
      mode: 'decode',
    });
    render(<InputArea setIsScannerOpen={mockSetIsScannerOpen} />);
    expect(screen.getByPlaceholderText('الصق الرمز المشفر')).toBeInTheDocument();
  });

  it('renders all action buttons', () => {
    render(<InputArea setIsScannerOpen={mockSetIsScannerOpen} />);
    expect(screen.getByTitle('Upload File')).toBeInTheDocument();
    expect(screen.getByTitle('Scan QR Code')).toBeInTheDocument();
    expect(screen.getByTitle('Paste')).toBeInTheDocument();
    expect(screen.getByTitle('Clear')).toBeInTheDocument();
  });
});
