// This component sets up routing and combines all the parts of the DApp.



import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import StakingActions from './components/StakingActions';
import TransactionHistory from './components/TransactionHistory';
import Footer from './components/Footer';

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-gray-800 text-white flex flex-col">
        <Header />
        <main className="container mx-auto px-6 flex-grow">
          <Dashboard />
          <StakingActions />
          <TransactionHistory />
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
