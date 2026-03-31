import { useEffect, useState } from "react";
import TopNavigation from "../components/layout/TopNavigation";
import { supabase } from "../lib/supabase";
import useUserProfile from "../hooks/useUserProfile";
import { useNavigate } from "react-router-dom";

export default function Home() {
    const { profile, loading, errorMessage } = useUserProfile()

    if (loading) {
        return <p>Loading...</p>
    }
    if (errorMessage) {
        return <p>{errorMessage}</p>
    }

    async function handleLogOut() {
        try {
            const { error } = await supabase.auth.signOut();

            if (error) {
                throw error;
            }

            navigate("/login");
        } catch (error) {
            console.error("Logout failed:", error.message);
        }
    }

    return (
        <div>
            <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-start">
                <div className="flex flex-col gap-1">
                    <p className="text-3xl text-bold text-stone-700">Welcome back</p>
                    <p className="text-[rgb(137,122,114)]">{profile?.display_name}</p>
                </div>
                <div className="flex flex-row gap-2">
                    <button className="px-4 py-2 text-sm text-white border rounded-lg bg-[rgb(203,84,51)]">+ Add Entry</button>
                    <button className="px-4 py-2 text-sm text-stone-700 border border-stone-200 rounded-lg">Open Map</button>
                    <button className="px-4 py-2 text-sm text-stone-700 border border-stone-200 rounded-lg lg:hidden">Search</button>
                </div>
            </div>
        </div>
    )
}