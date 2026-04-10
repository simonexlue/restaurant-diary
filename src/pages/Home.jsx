import { useEffect, useState } from "react";
import { MdPeopleOutline } from "react-icons/md"
import useUserProfile from "../hooks/useUserProfile";
import { useNavigate } from "react-router-dom";
import FriendsActivity from "../components/home/FriendsActivity";
import PalateCard from "../components/home/PalateCard";
import RecentEntryCard from "../components/home/RecentEntryCard";
import { getRecentEntries, getHomeFriendsActivity, getHomePalateData } from "../services/home";

export default function Home() {
    const { profile, loading, errorMessage } = useUserProfile()
    const [recentEntries, setRecentEntries] = useState([])
    const [recentEntriesLoading, setRecentEntriesLoading] = useState(true)
    const [recentEntriesError, setRecentEntriesError] = useState("")

    const [friendsActivity, setFriendsActivity] = useState([]);
    const [friendsActivityLoading, setFriendsActivityLoading] = useState(true);
    const [friendsActivityError, setFriendsActivityError] = useState("");

    const [palateData, setPalateData] = useState([]);
    const [palateLoading, setPalateLoading] = useState(true);
    const [palateError, setPalateError] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        async function loadPalateData() {
            if (!profile?.id) {
                setPalateLoading(false);
                return;
            }

            try {
                setPalateLoading(true);
                setPalateError("");

                const data = await getHomePalateData(profile.id);
                setPalateData(data);
            } catch (error) {
                setPalateError(error.message || "Failed to load palate data");
                setPalateData([]);
            } finally {
                setPalateLoading(false);
            }
        }

        loadPalateData();
    }, [profile?.id]);

    useEffect(() => {
        async function loadFriendsActivity() {
            if (!profile?.id) {
                setFriendsActivityLoading(false);
                return;
            }

            try {
                setFriendsActivityLoading(true);
                setFriendsActivityError("");

                const data = await getHomeFriendsActivity(profile.id);
                setFriendsActivity(data);
            } catch (error) {
                setFriendsActivityError(error.message || "Failed to load friend activity");
                setFriendsActivity([]);
            } finally {
                setFriendsActivityLoading(false);
            }
        }

        loadFriendsActivity();
    }, [profile?.id]);

    useEffect(() => {
        async function loadRecentEntries() {
            if (!profile?.id) {
                setRecentEntriesLoading(false)
                return;
            }

            try {
                setRecentEntriesLoading(true)
                setRecentEntriesError("")

                const entries = await getRecentEntries(profile.id)
                setRecentEntries(entries)
            } catch (error) {
                setRecentEntriesError("Failed to load recent entries")
            } finally {
                setRecentEntriesLoading(false);
            }
        }

        loadRecentEntries();
    }, [profile?.id])

    if (loading) {
        return <p>Loading...</p>
    }
    if (errorMessage) {
        return <p>{errorMessage}</p>
    }

    return (
        <div className="flex flex-col gap-8 max-w-7xl mx-auto">
            <div className="bg-white px-6 py-6 shadow-xs rounded-lg flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-start">
                <div className="flex flex-col gap-1">
                    <p className="text-3xl text-bold text-stone-700">Welcome back</p>
                    <p className="text-[rgb(137,122,114)]">{profile?.display_name}</p>
                </div>
                <div className="flex flex-row gap-2">
                    <button
                        className="px-4 py-2 text-sm text-white border rounded-lg bg-[rgb(203,84,51)] hover:cursor-pointer"
                        onClick={() => navigate(`/diary/new`)}
                    >
                        + Add Entry
                    </button>
                    <button
                        className="px-4 py-2 text-sm text-stone-700 border border-stone-200 rounded-lg hover:cursor-pointer"
                        onClick={() => navigate(`/map`)}
                    >
                        Open Map
                    </button>
                </div>
            </div>

            <div className="py-3 pb-8 px-6 rounded-lg bg-white shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-start">
                    {/* Palate Section */}
                    <div className="flex-1 flex flex-col gap-2 pt-2">
                        <p className="text-[rgb(137,122,114)] text-sm">YOUR PALATE</p>
                        <p className="text-[rgb(137,122,114)] text-xs">Cuisines you've been loving lately</p>

                        <div className="flex flex-col gap-4 mt-2">
                            {palateLoading ? (
                                <p className="text-sm text-[rgb(137,122,114)]">Loading palate...</p>
                            ) : palateError ? (
                                <p className="text-sm text-red-500">{palateError}</p>
                            ) : palateData.length === 0 ? (
                                <p className="text-sm text-[rgb(137,122,114)]">No palate data yet.</p>
                            ) : (
                                palateData.map((palate) => (
                                    <PalateCard
                                        key={palate.label}
                                        label={palate.label}
                                        percent={palate.percent}
                                    />
                                ))
                            )}
                        </div>
                    </div>

                    {/* Mobile divider */}
                    <div className="border-t border-stone-200 my-6 lg:hidden" />

                    {/* Desktop divider */}
                    <div className="hidden lg:block self-stretch w-px bg-stone-200 mx-6" />

                    {/* Friends Activity */}
                    <div className="flex-1 flex flex-col pt-2">
                        <div className="flex flex-row gap-2 items-center mb-4">
                            <MdPeopleOutline className="text-[rgb(137,122,114)]" />
                            <p className="text-[rgb(137,122,114)] text-sm">FRIENDS ACTIVITY</p>
                        </div>

                        <div className="flex flex-col gap-4">
                            {friendsActivityLoading ? (
                                <p className="text-sm text-[rgb(137,122,114)]">Loading activity...</p>
                            ) : friendsActivityError ? (
                                <p className="text-sm text-red-500">{friendsActivityError}</p>
                            ) : friendsActivity.length === 0 ? (
                                <p className="text-sm text-[rgb(137,122,114)]">No friend activity yet.</p>
                            ) : (
                                friendsActivity.map((friend) => (
                                    <FriendsActivity
                                        key={friend.id}
                                        name={friend.name}
                                        recentVisit={friend.recentVisit}
                                        time={friend.time}
                                        avatar_url={friend.avatar_url}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-lg flex flex-col gap-3 bg-white shadow-xs py-4">
                <div className="px-6">
                    <p className="text-[rgb(137,122,114)] text-sm mb-2 mt-2">RECENT ENTRIES</p>
                    <p className="text-stone-700 text-md">Your latest meals, in one clean list.</p>
                </div>

                <div className="flex flex-col items-center">
                    {recentEntriesLoading && (
                        <p className="w-full px-6 text-sm text-stone-500">Loading recent entries...</p>
                    )}

                    {!recentEntriesLoading && recentEntriesError && (
                        <p className="w-full px-6 text-sm text-red-600">{recentEntriesError}</p>
                    )}

                    {!recentEntriesLoading && !recentEntriesError && recentEntries.length === 0 && (
                        <p className="w-full px-6 text-sm text-stone-500">No recent entries yet.</p>
                    )}

                    {!recentEntriesLoading && !recentEntriesError && recentEntries.map((entry, index) => (
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
                            isLast={index === recentEntries.length - 1}
                            onClick={() => {
                                if (!entry.restaurantId) return;
                                navigate(`/restaurant/${entry.restaurantId}`)
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}