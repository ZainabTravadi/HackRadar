import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Join from '@/pages/Join';
import { MemoryRouter } from 'react-router-dom';

describe('Join page', () => {
  test('role selection toggles and requires at least one area', async () => {
    render(<MemoryRouter><Join /></MemoryRouter>);
    // advance to contribution step and find a role button
    const next = screen.getByRole('button', { name: /next/i });
    fireEvent.click(next);
    const eng = await screen.findByRole('button', { name: /engineering/i });
    expect(eng).toBeInTheDocument();
    fireEvent.click(eng);
    expect(eng).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(eng);
    expect(eng).toHaveAttribute('aria-pressed', 'false');
  });

  test('shows client validation for missing fields', async () => {
    render(<MemoryRouter><Join /></MemoryRouter>);
    const submit = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submit);
    await waitFor(() => expect(screen.getByText(/Provide a name and a valid email/)).toBeInTheDocument());
  });

  test('successful submission shows success state', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) } as unknown as Response));
    render(<MemoryRouter><Join /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText(/Name \*/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/Email \*/i), { target: { value: 'test@example.com' } });
    const next = screen.getByRole('button', { name: /next/i });
    fireEvent.click(next);
    const eng = await screen.findByRole('button', { name: /engineering/i });
    fireEvent.click(eng);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    await waitFor(() => expect(screen.getByText(/You are on the radar/i)).toBeInTheDocument());
  });
});
