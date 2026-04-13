import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Centers from './pages/Centers';
import Tenants from './pages/Tenants';
import TenantDetails from './pages/TenantDetails';
import Contracts from './pages/Contracts';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/centers" element={<Centers />} />
            <Route path="/tenants" element={<Tenants />} />
            <Route path="/tenants/:id" element={<TenantDetails />} />
            <Route path="/contracts" element={<Contracts />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </Router>
      <Toaster />
    </AuthProvider>
  );
}
