import { render, screen } from '@testing-library/react';
import Roadmap from '@/pages/Roadmap';
import { MemoryRouter } from 'react-router-dom';

test('roadmap page renders sections', async () => {
  render(<MemoryRouter><Roadmap /></MemoryRouter>);
  expect(await screen.findByRole('heading', { name: /Roadmap/i })).toBeInTheDocument();
  expect(screen.getByText(/Now/i)).toBeInTheDocument();
});
