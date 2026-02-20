import React from 'react';

export const useNavigate = () => jest.fn();
export const Link = ({ children, to }) => <a href={to}>{children}</a>;
export const BrowserRouter = ({ children }) => <div>{children}</div>;
export const Routes = ({ children }) => <div>{children}</div>;
export const Route = () => null;

const reactRouterDom = {
  useNavigate,
  Link,
  BrowserRouter,
  Routes,
  Route,
};

export default reactRouterDom;
