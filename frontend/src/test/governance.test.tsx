import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Governance from '@/pages/Governance';

test('renders governance page', () => {
  render(
    <MemoryRouter>
      <Governance />
    </MemoryRouter>
  );
  expect(screen.getByText(/Built by the community/i)).toBeInTheDocument();
  expect(screen.getByText(/Governance Principles/i)).toBeInTheDocument();
});
