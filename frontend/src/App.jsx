import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Auth from './pages/Auth';
import CustomerDashboard from './pages/CustomerDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Careers from './pages/Careers';

function Layout() {
  const location = useLocation();
  const isDashboard = ['/customer', '/employee', '/admin'].includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/customer" element={<CustomerDashboard />} />
          <Route path="/employee" element={<EmployeeDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
      {!isDashboard && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}
