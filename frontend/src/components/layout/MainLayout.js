import React from 'react';
import Sidebar from './Sidebar';

const MainLayout = ({ children }) => {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ marginLeft: '250px', padding: '20px', width: '100%' }}>
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
