import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MainControls } from './main-controls';
import { useEncoderState } from '@/hooks/use-encoder-state';

// Mock the useEncoderState hook
vi.mock('@/hooks/use-encoder-state', () => ({
  useEncoderState: vi.fn(),
}));

describe('MainControls', () => {
  it('should render the mode switch and labels', () => {
    (useEncoderState as vi.Mock).mockReturnValue({
      mode: 'encode',
      setMode: vi.fn(),
      setInputText: vi.fn(),
      setOutputText: vi.fn(),
      setErrorText: vi.fn(),
    });

    render(<MainControls />);

    expect(screen.getByLabelText('فك التشفير')).toBeInTheDocument();
    expect(screen.getByLabelText('تشفير النص')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('should call setMode when the switch is clicked', () => {
    const setMode = vi.fn();
    (useEncoderState as vi.Mock).mockReturnValue({
      mode: 'encode',
      setMode,
      setInputText: vi.fn(),
      setOutputText: vi.fn(),
      setErrorText: vi.fn(),
    });

    render(<MainControls />);

    const switchControl = screen.getByRole('switch');
    fireEvent.click(switchControl);

    expect(setMode).toHaveBeenCalledWith('decode');
  });

  it('should show introductory text in encode mode', () => {
    (useEncoderState as vi.Mock).mockReturnValue({
      mode: 'encode',
      setMode: vi.fn(),
      setInputText: vi.fn(),
      setOutputText: vi.fn(),
      setErrorText: vi.fn(),
    });

    render(<MainControls />);
    expect(screen.getByText('شفر الي تشتيه وانبسط 😋')).toBeInTheDocument();
  });

  it('should hide introductory text in decode mode', () => {
    (useEncoderState as vi.Mock).mockReturnValue({
      mode: 'decode',
      setMode: vi.fn(),
      setInputText: vi.fn(),
      setOutputText: vi.fn(),
      setErrorText: vi.fn(),
    });

    render(<MainControls />);
    expect(screen.queryByText('شفر الي تشتيه وانبسط 😋')).not.toBeInTheDocument();
  });
});
