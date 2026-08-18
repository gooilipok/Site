import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CookieBanner } from './components/CookieBanner';

import { HomePage } from './pages/HomePage';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { CreateOrderPage } from './pages/CreateOrderPage';
import { AgreementsPage } from './pages/AgreementsPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { ConsentPage } from './pages/ConsentPage';
import { AdminPage } from './pages/AdminPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { UnauthorizedPage, ForbiddenPage, ServerErrorPage } from './pages/ErrorPage';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <div className="flex flex-col min-h-screen bg-[#0f1418] text-[#ecf0f1] font-sans selection:bg-[#c5a059] selection:text-black relative overflow-x-hidden">
            {/* BACKGROUND ANIMATED GEARS & CONVEYOR BELT TRACKS */}
            <div className="bg-animation" aria-hidden="true">
              <div className="gear gear-1 opacity-20" />
              <div className="gear gear-2 opacity-15" />
              <div className="gear gear-3 opacity-25" />
              
              {/* Animated Conveyor Belt Diagonal Lines */}
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(197,160,89,0.03)_25%,transparent_25%,transparent_50%,rgba(197,160,89,0.03)_50%,rgba(197,160,89,0.03)_75%,transparent_75%,transparent)] bg-[length:60px_60px] animate-[slide_12s_linear_infinite]" />
            </div>

            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/order/create" element={<CreateOrderPage />} />
                
                {/* Agreements Routes */}
                <Route path="/agreements" element={<AgreementsPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/consent" element={<ConsentPage />} />

                {/* Admin Panel */}
                <Route path="/admin" element={<AdminPage />} />

                {/* Error Pages */}
                <Route path="/401" element={<UnauthorizedPage />} />
                <Route path="/403" element={<ForbiddenPage />} />
                <Route path="/404" element={<NotFoundPage />} />
                <Route path="/500" element={<ServerErrorPage />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </main>
            <Footer />
            <CookieBanner />
          </div>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}
