import { Routes, Route } from "react-router-dom";
import RootLayout from "./components/layout/RootLayout";
import MenuPage from "./pages/MenuPage";
import AboutPage from "./pages/AboutPage";
import DashboardPage from "./pages/DashboardPage";
import DashboardOverview from "./pages/dashboard/Overview";
import DashboardItems from "./pages/dashboard/Items";
import DashboardItemNew from "./pages/dashboard/ItemNew";
import DashboardItemEdit from "./pages/dashboard/ItemEdit";
import DashboardCategories from "./pages/dashboard/Categories";
import DashboardSettings from "./pages/dashboard/Settings";
import DashboardHours from "./pages/dashboard/Hours";
import DashboardReviews from "./pages/dashboard/Reviews";
import DashboardDaily from "./pages/dashboard/Daily";
import DashboardStatistics from "./pages/dashboard/Statistics";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./auth/ProtectedRoute";
import ItemPage from "./pages/ItemPage";
import OmakasePage from "./pages/OmakasePage";
import DrinksPage from "./pages/DrinksPage";
import DashboardDrinks from "./pages/dashboard/Drinks";
import DashboardEvents from "./pages/dashboard/Events";
import EventsPage from "./pages/EventsPage";
import EventDetailPage from "./pages/EventDetailPage";

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<MenuPage />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="menu/:id" element={<ItemPage />} />
        <Route path="drinks" element={<DrinksPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/:id" element={<EventDetailPage />} />
        <Route path="omakase" element={<OmakasePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard">
            <Route index element={<DashboardOverview />} />
            <Route path="items" element={<DashboardItems />} />
            <Route path="items/new" element={<DashboardItemNew />} />
            <Route path="items/:id/edit" element={<DashboardItemEdit />} />
            <Route path="daily" element={<DashboardDaily />} />
            <Route path="statistics" element={<DashboardStatistics />} />
            <Route path="drinks" element={<DashboardDrinks />} />
            <Route path="events" element={<DashboardEvents />} />
            <Route path="categories" element={<DashboardCategories />} />
            <Route path="reviews" element={<DashboardReviews />} />
            <Route path="hours" element={<DashboardHours />} />
            <Route path="settings" element={<DashboardSettings />} />
            {/* Fallback to overview inside dashboard */}
            <Route path="*" element={<DashboardOverview />} />
          </Route>
        </Route>
        <Route path="*" element={<MenuPage />} />
      </Route>
    </Routes>
  );
}
