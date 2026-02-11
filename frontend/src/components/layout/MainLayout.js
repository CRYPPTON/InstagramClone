import React from 'react';
import Header from './Header';

const MainLayout = ({ children }) => {
  return (
    <div>
      <Header />
      <main style={{ padding: '20px' }}>
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
