import React from 'react';
import Layout from './Layout';

const ProponentLayout = ({ children, roleName }) => {
  return (
    <div className="App">
      <Layout>
        {children}
      </Layout>
    </div>
  );
};

export default ProponentLayout;
