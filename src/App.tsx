import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthProvider, useAuth } from './auth/AuthContext';

import { AdminLayout } from './layout/AdminLayout';

import { LoginPage } from './pages/LoginPage';

import { DashboardPage } from './pages/DashboardPage';

import { UsersPage } from './pages/UsersPage';

import { UserDetailPage } from './pages/UserDetailPage';

import { AssistantStatsPage } from './pages/AssistantStatsPage';

import { AuditLogsPage } from './pages/AuditLogsPage';

import { VerificationsPage } from './pages/VerificationsPage';

import { BookingsPage } from './pages/BookingsPage';

import { CategoriesPage } from './pages/CategoriesPage';

import { CitiesPage } from './pages/CitiesPage';

import { PaymentsPage, EarningsPage, ReviewsPage, ReferralsPage } from './pages/FinancePages';

import { SettingsPage } from './pages/SettingsPage';

import { RejectionsPage } from './pages/RejectionsPage';

import { PromosPage } from './pages/PromosPage';

import { PayoutsPage } from './pages/PayoutsPage';

import { SupportPage } from './pages/SupportPage';
import { WebsiteContactPage } from './pages/WebsiteContactPage';
import { AssistantApplicationsPage } from './pages/AssistantApplicationsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { HomeAdsPage } from './pages/HomeAdsPage';
import { HomeHeroPage } from './pages/HomeHeroPage';



function Protected({ children }: { children: React.ReactNode }) {

  const { user, loading } = useAuth();

  if (loading) return <div className="loading-state" style={{ padding: 40 }}>Loading…</div>;

  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;

}



export default function App() {

  return (

    <AuthProvider>

      <BrowserRouter>

        <Routes>

          <Route path="/login" element={<LoginPage />} />

          <Route

            path="/"

            element={

              <Protected>

                <AdminLayout />

              </Protected>

            }

          >

            <Route index element={<DashboardPage />} />

            <Route path="users" element={<UsersPage />} />

            <Route path="users/:id" element={<UserDetailPage />} />

            <Route path="assistants" element={<AssistantStatsPage />} />

            <Route path="audit-logs" element={<AuditLogsPage />} />

            <Route path="verifications" element={<VerificationsPage />} />

            <Route path="bookings" element={<BookingsPage />} />

            <Route path="categories" element={<CategoriesPage />} />

            <Route path="cities" element={<CitiesPage />} />

            <Route path="payments" element={<PaymentsPage />} />

            <Route path="earnings" element={<EarningsPage />} />

            <Route path="reviews" element={<ReviewsPage />} />

            <Route path="referrals" element={<ReferralsPage />} />

            <Route path="settings" element={<SettingsPage />} />

            <Route path="home-ads" element={<HomeAdsPage />} />
            <Route path="home-hero" element={<HomeHeroPage />} />

            <Route path="rejections" element={<RejectionsPage />} />

            <Route path="promos" element={<PromosPage />} />

            <Route path="payouts" element={<PayoutsPage />} />

            <Route path="support" element={<SupportPage />} />

            <Route path="website-contact" element={<WebsiteContactPage />} />

            <Route path="assistant-applications" element={<AssistantApplicationsPage />} />

            <Route path="notifications" element={<NotificationsPage />} />

          </Route>

        </Routes>

      </BrowserRouter>

    </AuthProvider>

  );

}

