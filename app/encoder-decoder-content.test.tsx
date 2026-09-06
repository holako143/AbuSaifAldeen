import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@/__tests__/test-utils';
import userEvent from '@testing-library/user-event';
import { Base64EncoderDecoderContent } from './encoder-decoder-content';
import { useAppContext } from '@/components/app-provider';
import React from 'react';

// Mock the encoding module to prevent calls to the Web Crypto API in JSDOM
vi.mock('./encoding', () => ({
  encode: vi.fn().mockImplementation(async ({ text }) => `encoded:${text}`),
  decode: vi.fn().mockImplementation(async ({ text }) => text.replace('encoded:', '')),
}));


// Mock clipboard API and other browser APIs
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
  share: vi.fn().mockResolvedValue(undefined),
});

// A helper component to set the locale for testing purposes
const WithEnglishLocale: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const { setLocale } = useAppContext();
    // Set locale to English once on mount
    React.useEffect(() => {
        setLocale('en');
    }, [setLocale]);
    return <>{children}</>;
}

describe('Base64EncoderDecoderContent', () => {
  it('renders the component and main title in English', () => {
    render(
        <WithEnglishLocale>
            <Base64EncoderDecoderContent />
        </WithEnglishLocale>
    );

    // Check for the title in English
    expect(screen.getByText('تشفير & فك التشفير')).toBeInTheDocument();

    // Check for text areas by their English placeholders
    expect(screen.getByPlaceholderText('Enter the text to be processed')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Output...')).toBeInTheDocument();
  });

  it('calls the mocked encode function when user types', async () => {
    render(
        <WithEnglishLocale>
            <Base64EncoderDecoderContent />
        </WithEnglishLocale>
    );

    const inputArea = screen.getByPlaceholderText('Enter the text to be processed');
    const outputArea = screen.getByPlaceholderText('Output...');

    // Type into the input
    await userEvent.type(inputArea, 'Hello World');

    // Wait for the debounced encoding to complete and check the output
    await waitFor(() => {
        expect(outputArea).toHaveValue('encoded:Hello World');
    }, { timeout: 1000 }); // debounce is 500ms
  });
});
