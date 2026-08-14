import { render, screen } from '@testing-library/react';
import Transparency from '@/pages/Transparency';
import { MemoryRouter } from 'react-router-dom';

test('transparency page renders and shows adapters list', async () => {
  render(<MemoryRouter><Transparency /></MemoryRouter>);
  expect(await screen.findByRole('heading', { name: /Built in the open/i })).toBeInTheDocument();
  expect(screen.getByText(/Adapters present in the repository/i)).toBeInTheDocument();
});
