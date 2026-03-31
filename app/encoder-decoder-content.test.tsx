import { describe, it, expect, vi, Mock, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/__tests__/test-utils';
import userEvent from '@testing-library/user-event';
import { Base64EncoderDecoderContent } from './encoder-decoder-content';
import { useTranslation } from '@/hooks/use-translation';
import { useAppContext } from '@/components/app-provider';

// Mock the encoding module
const mockEncode = vi.fn((text: string) => Promise.resolve(btoa(text)));
vi.mock('./encoding', () => ({
  encode: (opts: { text: string }) => mockEncode(opts.text),
  decode: vi.fn((opts: { text: string }) => Promise.resolve(atob(opts.text))),
}));

// Mock the useTranslation hook
vi.mock('@/hooks/use-translation');

// Mock the useAppContext hook
vi.mock('@/components/app-provider');

describe('Base64EncoderDecoderContent', () => {
  beforeEach(() => {
    (useTranslation as Mock).mockReturnValue({
      t: (key: string) => {
        const translations: { [key: string]: string } = {
          'encoderDecoder.title': 'Encoder & Decoder',
          'encoderDecoder.inputTextPlaceholder': 'Enter the text to be processed',
          'encoderDecoder.outputTextPlaceholder': 'Output...'
        };
        return translations[key] || key;
      },
      locale: 'en'
    });
    (useAppContext as Mock).mockReturnValue({
      settings: { autoCopy: false },
      isSafeMode: false,
      setIsSafeMode: vi.fn(),
      setLocale: vi.fn(),
    });
  });

  it('renders the component and main title in English', () => {
    render(<Base64EncoderDecoderContent />);

    // Check for the title in English
    expect(screen.getByText('Encoder & Decoder')).toBeInTheDocument();

    // Check for text areas by their English placeholders
    expect(screen.getByPlaceholderText('Enter the text to be processed')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Output...')).toBeInTheDocument();
  });

  it('calls the mocked encode function when user types', async () => {
    render(<Base64EncoderDecoderContent />);

    const inputArea = screen.getByPlaceholderText('Enter the text to be processed');
    const outputArea = screen.getByPlaceholderText('Output...');

    await userEvent.type(inputArea, 'Hello');
    expect(mockEncode).toHaveBeenCalledWith('Hello');
    await waitFor(() => expect(outputArea).toHaveValue('SGVsbG8='));
  });
});
