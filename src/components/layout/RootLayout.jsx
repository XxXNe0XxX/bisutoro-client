import { Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPublicAppSettings } from "../../lib/api";
import Navbar from "../ui/Navbar";
import { motion as Motion } from "motion/react";

export default function RootLayout() {
  const location = useLocation();

  // Fetch public settings to decide visibility of certain nav items (e.g., Omakase)
  const publicSettings = useQuery({
    queryKey: ["public-app-settings"],
    queryFn: getPublicAppSettings,
  });

  // Choose nav items based on being in dashboard or not
  const isDashboard = location.pathname.startsWith("/dashboard");
  const siteNav = [
    { to: "/menu", label: "Menu" },
    { to: "/drinks", label: "Drinks" },
    // Only include Omakase when explicitly enabled; avoids flash on load
    ...(publicSettings.data?.show_omakase_section === true
      ? [{ to: "/omakase", label: "Omakase" }]
      : []),
    { to: "/about", label: "About" },
  ];
  const dashboardNav = [
    { to: "/dashboard", label: "Overview", end: true },
    { to: "/dashboard/drinks", label: "Drinks" },
    { to: "/dashboard/items", label: "Items" },
    { to: "/dashboard/categories", label: "Categories" },
    { to: "/dashboard/daily", label: "Daily Specials" },
    { to: "/dashboard/statistics", label: "Statistics" },
    { to: "/dashboard/hours", label: "Hours" },
    { to: "/dashboard/reviews", label: "Reviews" },
    { to: "/dashboard/settings", label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-gray-100 dark:to-gray-500 to-400% bg-fixed  ">
      {/* Sidebar/Drawer Navbar is positioned fixed; reserve space on md+ */}
      <Navbar items={isDashboard ? dashboardNav : siteNav} />
      <div className="md:pl-64 ">
        {/* Mobile top-bar height spacer */}
        <main className="max-w-[960px] mx-auto pb-3 h-full md:min-h-[94dvh] min-h-[90dvh] overflow-hidden ">
          <div className="h-0 md:h-14" />

          <Outlet />
        </main>
        <footer className="py-2 text-sm opacity-30 text-center text-base-fg">
          <p>
            &copy; {new Date().getFullYear()} Bisutoro. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
