import { useEffect, useState } from "react";
import TopNavigation from "../components/layout/TopNavigation";
import { MdPeopleOutline } from "react-icons/md"
import { supabase } from "../lib/supabase";
import useUserProfile from "../hooks/useUserProfile";
import { useNavigate } from "react-router-dom";
import FriendsActivity from "../components/home/FriendsActivity";
import PalateCard from "../components/home/PalateCard";
import RecentEntryCard from "../components/home/RecentEntryCard";

const friendsMock = [
    { name: "Sarah M.", recentVisit: "Nobu Downtown", time: "3h ago" },
    { name: "James L.", recentVisit: "Tartine Bakery", time: "8h ago" },
    { name: "Priya K.", recentVisit: "Din Tai Fung", time: "5h ago" },
]

const palateData = [
    { label: "Japanese", percent: 85 },
    { label: "Italian", percent: 68 },
    { label: "French", percent: 45 },
    { label: "Chinese", percent: 38 },
    { label: "Nordic", percent: 20 },
];

const recentEntries = [
    {
        id: "1",
        restaurantName: "Sukiyabashi Jiro",
        dishName: "Omakase — 20 Course",
        rating: 5,
        tags: ["Japanese", "Omakase"],
        createdAt: "2026-03-28T18:00:00.000Z",
        review: "The omakase experience was transcendent. Every piece of sushi was perfection.",
        location: "Tokyo, Japan",
        photoUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80",
    },
    {
        id: "2",
        restaurantName: "L'Artisan",
        dishName: "Duck Confit",
        rating: 4.5,
        tags: ["French"],
        createdAt: "2026-04-02T09:00:00.000Z",
        review: "Rich, crispy, and perfectly balanced with the sauce.",
        location: "Montreal, Canada",
        photoUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    },
    {
        id: "3",
        restaurantName: "Pasta E Basta",
        dishName: "Truffle Tagliatelle",
        rating: null,
        tags: [],
        createdAt: "2026-04-01T20:00:00.000Z",
        review: null,
        location: "Rome, Italy",
        photoUrl: null,
    },
];


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
        <div className="flex flex-col gap-8">
            <div className="bg-white px-6 py-6 shadow-xs rounded-lg flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-start">
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

            <div className="py-3 px-6 rounded-lg flex flex-col gap-6 bg-white shadow-xs">
                {/* Palate Section */}
                <div className="flex flex-col gap-2">
                    <p className="text-[rgb(137,122,114)] text-sm mt-2">YOUR PALATE</p>
                    <p className="text-[rgb(137,122,114)] text-xs">Cuisines you've been loving lately</p>
                    <div className="flex flex-col gap-4 mt-2">
                        {palateData.map((palate) => (
                            <PalateCard label={palate.label} percent={palate.percent} />
                        ))}
                    </div>
                </div>

                <div className="border-t border-stone-200 "></div>

                {/* Recent friends activity */}
                <div className="mb-4">
                    <div className="flex flex-row gap-2 items-center">
                        <MdPeopleOutline className="relative top-[-8px] text-[rgb(137,122,114)]" />
                        <p className="text-[rgb(137,122,114)] text-sm mb-4">FRIENDS ACTIVITY</p>
                    </div>

                    <div className="flex flex-col gap-4">
                        {friendsMock.map((friend) => (
                            <FriendsActivity key={friend.name} name={friend.name} recentVisit={friend.recentVisit} time={friend.time} />
                        ))}
                    </div>
                </div>
            </div>

            <div className="rounded-lg flex flex-col gap-3 bg-white shadow-xs py-4">
                <div className="px-6">
                    <p className="text-[rgb(137,122,114)] text-sm mb-2 mt-2">RECENT ENTRIES</p>
                    <p className="text-stone-700 text-md">Your latest meals, in one clean list.</p>
                </div>

                <div className="flex flex-col gap-6 items-center">
                    {recentEntries.map((entry) => (
                        <RecentEntryCard
                            key={entry.id}
                            restaurantName={entry.restaurantName}
                            dishName={entry.dishName}
                            rating={entry.rating}
                            tags={entry.tags}
                            createdAt={entry.createdAt}
                            review={entry.review}
                            location={entry.location}
                            photoUrl={entry.photoUrl}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}