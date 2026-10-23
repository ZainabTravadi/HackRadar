import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Join from '@/pages/Join';
import { MemoryRouter } from 'react-router-dom';

function renderJoin() {
  return render(
    <MemoryRouter>
      <Join />
    </MemoryRouter>,
  );
}

function fillBasics() {
  fireEvent.change(screen.getByLabelText(/Name \*/i), { target: { value: 'Test User' } });
  fireEvent.change(screen.getByLabelText(/Email \*/i), { target: { value: 'test@example.com' } });
}

async function goToStepFour() {
  fillBasics();
  fireEvent.click(screen.getByRole('button', { name: /next/i }));
  const engineering = await screen.findByRole('button', { name: /engineering/i });
  fireEvent.click(engineering);
  fireEvent.click(screen.getByRole('button', { name: /next/i }));
  fireEvent.click(screen.getByRole('button', { name: /next/i }));
}

describe('Join page', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('role selection toggles and requires at least one area', async () => {
    renderJoin();
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

  test('only the final step exposes a single submit action', async () => {
    renderJoin();

    expect(screen.queryByRole('button', { name: /submit/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    await screen.findByRole('button', { name: /engineering/i });
    expect(screen.queryByRole('button', { name: /submit/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.queryByRole('button', { name: /submit/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getAllByRole('button', { name: /submit/i })).toHaveLength(1);
  });

  test('shows client validation for missing fields after reaching the final step', async () => {
    renderJoin();
    // Advance to the final step without filling in the required details.
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    await screen.findByRole('button', { name: /engineering/i });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => expect(screen.getByText(/Provide a name and a valid email/)).toBeInTheDocument());
  });

  test('blocks submission without a selected contribution area', async () => {
    renderJoin();
    fillBasics();
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    await screen.findByRole('button', { name: /engineering/i });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => expect(screen.getByText(/Select at least one contribution area/)).toBeInTheDocument());
  });

  test('successful submission shows success state and sends the expected payload', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) } as unknown as Response),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    renderJoin();
    await goToStepFour();
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => expect(screen.getByText(/You are on the radar/i)).toBeInTheDocument());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toContain('/api/initiative/applications');
    const payload = JSON.parse(String(init.body));
    expect(payload).toMatchObject({
      name: 'Test User',
      email: 'test@example.com',
      contributionAreas: ['engineering'],
    });
    expect(payload).not.toHaveProperty('contributionTypes');
  });

  test('shows loading feedback while the submission is in flight', async () => {
    let resolveFetch: (value: Response) => void = () => {};
    global.fetch = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    ) as unknown as typeof fetch;

    renderJoin();
    await goToStepFour();
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(screen.getByRole('button', { name: /submitting/i })).toBeDisabled();

    resolveFetch({ ok: true, json: () => Promise.resolve({ success: true }) } as unknown as Response);
    await waitFor(() => expect(screen.getByText(/You are on the radar/i)).toBeInTheDocument());
  });

  test('rapid repeated clicks trigger only one submission request', async () => {
    let resolveFetch: (value: Response) => void = () => {};
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    renderJoin();
    await goToStepFour();
    const submit = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submit);
    fireEvent.click(submit);
    fireEvent.click(submit);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveFetch({ ok: true, json: () => Promise.resolve({ success: true }) } as unknown as Response);
    await waitFor(() => expect(screen.getByText(/You are on the radar/i)).toBeInTheDocument());
  });

  test('surfaces a submission error', async () => {
    global.fetch = vi.fn(() =>
      Promise.reject(new Error('Request failed with status 500')),
    ) as unknown as typeof fetch;

    renderJoin();
    await goToStepFour();
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => expect(screen.getByText(/Request failed with status 500/i)).toBeInTheDocument());
  });
});
