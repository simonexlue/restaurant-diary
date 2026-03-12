import { Outlet } from "react-router-dom";
import TopNavigation from "../components/layout/TopNavigation";

export default function AppLayout() {
    return (
        <div>
            <TopNavigation />
            <main>
                <Outlet />
            </main>
        </div>
    )
}