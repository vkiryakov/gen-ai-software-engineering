import { NavLink, Route, Routes } from 'react-router-dom';
import { TicketsPage } from './pages/TicketsPage';

export function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-row">
          <h1>🎧 Support Tickets</h1>
          <nav className="nav">
            <NavLink to="/" end>
              Tickets
            </NavLink>
          </nav>
        </div>
        <p>React + NestJS + shared contracts, wired through Turborepo.</p>
      </header>

      <Routes>
        <Route path="/" element={<TicketsPage />} />
      </Routes>
    </div>
  );
}
