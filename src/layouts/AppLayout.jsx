import { Outlet, useLocation } from "react-router-dom";
import TopNavigation from "../components/layout/TopNavigation";

export default function AppLayout() {
    const location = useLocation();
    const isMapPage = location.pathname === "/map";

    return (
        <div
            className={`flex flex-col ${isMapPage ? "h-dvh overflow-hidden" : "min-h-dvh"
                }`}
        >
            <TopNavigation />

            <main
                className={`min-h-0 flex-1 bg-[rgb(248,245,242)] ${isMapPage ? "" : "px-4 py-6 lg:px-6"
                    }`}
            >
                <Outlet />
            </main>
        </div>
    );
}