import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Impact from '@/pages/Impact';

test('renders impact page', () => {
  render(
    <MemoryRouter>
      <Impact />
    </MemoryRouter>
  );
  expect(screen.getByText(/What HackRadar aims to improve/i)).toBeInTheDocument();
  expect(screen.getByText(/Opportunity discovery/i)).toBeInTheDocument();
});
