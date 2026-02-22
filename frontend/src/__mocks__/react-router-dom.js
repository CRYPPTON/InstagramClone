import React from 'react';

// Mock the components to just render their children
export const BrowserRouter = ({ children }) => <div data-testid="browser-router">{children}</div>;
export const HashRouter = ({ children }) => <div data-testid="hash-router">{children}</div>;
export const MemoryRouter = ({ children }) => <div data-testid="memory-router">{children}</div>;
export const Routes = ({ children }) => <div data-testid="routes">{children}</div>;
export const Route = ({ element }) => element;
export const Navigate = ({ to }) => <div data-testid="navigate" data-to={to} />;
export const Link = ({ children, to }) => <a href={to}>{children}</a>;
export const NavLink = ({ children, to }) => <a href={to}>{children}</a>;
export const Outlet = () => <div data-testid="outlet" />;

// Mock the hooks
export const useNavigate = jest.fn(() => jest.fn());
export const useParams = jest.fn(() => ({}));
export const useLocation = jest.fn(() => ({ pathname: '/' }));
export const useSearchParams = jest.fn(() => [new URLSearchParams(), jest.fn()]);

const reactRouterDom = {
  BrowserRouter,
  HashRouter,
  MemoryRouter,
  Routes,
  Route,
  Navigate,
  Link,
  NavLink,
  Outlet,
  useNavigate,
  useParams,
  useLocation,
  useSearchParams,
};

export default reactRouterDom;
