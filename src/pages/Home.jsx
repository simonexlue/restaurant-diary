import { useEffect, useState } from "react";
import TopNavigation from "../components/layout/TopNavigation";
import { supabase } from "../lib/supabase";
import useUserProfile from "../hooks/useUserProfile";

export default function Home() {
    const { profile, loading, errorMessage } = useUserProfile()
    const [displayName, setDisplayName] = useState("");

    if (loading) {
        return <p>Loading...</p>
    }
    if (errorMessage) {
        return <p>{errorMessage}</p>
    }

    return (
        <div>
            <div>
                <p>Welcome back, {profile?.display_name}</p>

            </div>
        </div>
    )
}