import { Outlet } from "react-router-dom";
import TopNavigation from "../components/layout/TopNavigation";

export default function AppLayout() {
    return (
        <div>
            <TopNavigation />
            <main className="bg-[rgb(248,245,242)] h-screen px-4 py-6 lg:px-6 py-7">
                <Outlet />
            </main>
        </div>
    )
}