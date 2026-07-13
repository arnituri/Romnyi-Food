import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import AddRecipe from '../AddRecipe';
import NotFound from '../NotFound';
import SearchBar from '../../components/SearchBar';

function renderRoute(path, element) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/add" element={<AddRecipe />} />
        <Route path="/edit/:id" element={<AddRecipe />} />
        <Route path="*" element={element} />
      </Routes>
    </MemoryRouter>
  );
}

describe('critical routes', () => {
  it('renders the Hungarian Not Found fallback with internal navigation links', () => {
    renderRoute('/unknown-route', <NotFound />);

    expect(screen.getByRole('heading', { name: /az oldal nem található/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /főoldal/i })[0]).toHaveAttribute('href', '/');
    expect(screen.getAllByRole('link', { name: /receptek/i })[0]).toHaveAttribute('href', '/recipes');
  });

  it('keeps add mode available as a new recipe form', () => {
    renderRoute('/add');

    expect(screen.getByRole('heading', { name: /új recept/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/recept neve/i)).toBeInTheDocument();
  });

  it('shows a safe missing-recipe state instead of an empty edit form', () => {
    renderRoute('/edit/missing');

    expect(screen.getByRole('heading', { name: /a recept nem található/i })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/recept neve/i)).not.toBeInTheDocument();
  });

  it('provides the shared recipe search with an accessible Hungarian name', () => {
    render(<SearchBar />);

    expect(screen.getByLabelText('Receptek keresése')).toBeInTheDocument();
  });
});
