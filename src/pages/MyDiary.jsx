import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DiaryCard from "../components/diary/DiaryCard";
import { getUserDiaryRestaurants, getUserDishEntries } from "../services/diary";
import useUserProfile from "../hooks/useUserProfile";

function buildDiaryCards(savedRestaurants, dishEntries) {
    const entriesByRestaurantId = new Map();

    for (const entry of dishEntries) {
        const existingEntries = entriesByRestaurantId.get(entry.restaurant_id) || [];
        existingEntries.push(entry);
        entriesByRestaurantId.set(entry.restaurant_id, existingEntries);
    }

    return savedRestaurants
        .map((savedRestaurant) => {
            const restaurant = savedRestaurant.restaurants;
            if (!restaurant) return null;

            const entries = entriesByRestaurantId.get(savedRestaurant.restaurant_id) || [];

            const sortedEntries = [...entries].sort((a, b) => {
                if (!a.date_tried) return 1;
                if (!b.date_tried) return -1;
                return b.date_tried.localeCompare(a.date_tried);
            });

            let averageRating = null;

            const entriesWithRatings = entries.filter(
                (entry) =>
                    entry.item_rating !== null &&
                    entry.item_rating !== undefined &&
                    !Number.isNaN(Number(entry.item_rating))
            );

            if (entriesWithRatings.length > 0) {
                const totalRating = entriesWithRatings.reduce(
                    (sum, entry) => sum + Number(entry.item_rating),
                    0
                );

                averageRating = totalRating / entriesWithRatings.length;
            }

            const tagCounts = new Map();
            let topTag = null;

            for (const entry of entries) {
                if (!entry.tags || entry.tags.length === 0) continue;

                const entryTags = Array.isArray(entry.tags) ? entry.tags : [entry.tags];

                for (const tag of entryTags) {
                    if (!tag) continue;

                    const normalizedTag = String(tag).trim();
                    if (!normalizedTag) continue;

                    const currentCount = tagCounts.get(normalizedTag) || 0;
                    tagCounts.set(normalizedTag, currentCount + 1);
                }
            }

            if (tagCounts.size > 0) {
                let highestCount = 0;

                for (const count of tagCounts.values()) {
                    if (count > highestCount) {
                        highestCount = count;
                    }
                }

                const mostCommonTags = [];

                for (const [tag, count] of tagCounts.entries()) {
                    if (count === highestCount) {
                        mostCommonTags.push(tag);
                    }
                }

                if (mostCommonTags.length === 1) {
                    topTag = mostCommonTags[0];
                } else {
                    for (const entry of sortedEntries) {
                        if (!entry.tags || entry.tags.length === 0) continue;

                        const entryTags = Array.isArray(entry.tags) ? entry.tags : [entry.tags];

                        for (const tag of entryTags) {
                            const normalizedTag = String(tag).trim();

                            if (mostCommonTags.includes(normalizedTag)) {
                                topTag = normalizedTag;
                                break;
                            }
                        }

                        if (topTag) break;
                    }
                }
            }

            const recentPhoto =
                sortedEntries.find((entry) => entry.photo_path)?.photo_path || null;

            return {
                id: restaurant.id,
                name: restaurant.name,
                address: restaurant.address || "No address provided",
                entryCount: entries.length,
                lastVisited: sortedEntries[0]?.date_tried || null,
                averageRating,
                topTag,
                recentPhoto,
            };
        })
        .filter(Boolean);
}

export default function MyDiary() {
    const { user, loading: profileLoading, errorMessage: profileErrorMessage } = useUserProfile();

    const [searchRestaurant, setSearchRestaurant] = useState("");
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [restaurants, setRestaurants] = useState([]);

    useEffect(() => {
        if (!user) return;
        fetchDiaryData();
    }, [user]);

    async function fetchDiaryData() {
        if (!user) return;

        setLoading(true);
        setErrorMessage("");

        try {
            const [savedRestaurants, dishEntries] = await Promise.all([
                getUserDiaryRestaurants(user.id),
                getUserDishEntries(user.id),
            ]);

            const diaryCards = buildDiaryCards(savedRestaurants, dishEntries);
            setRestaurants(diaryCards);
        } catch (error) {
            setErrorMessage(error.message || "Failed to load restaurants");
        } finally {
            setLoading(false);
        }
    }

    const filteredRestaurants = useMemo(() => {
        if (!searchRestaurant.trim()) {
            return restaurants;
        }

        return restaurants.filter((restaurant) =>
            restaurant.name.toLowerCase().includes(searchRestaurant.toLowerCase())
        );
    }, [restaurants, searchRestaurant]);

    const totalEntries = restaurants.reduce(
        (sum, restaurant) => sum + restaurant.entryCount,
        0
    );

    if (profileLoading || loading) {
        return <p>Loading...</p>;
    }

    if (profileErrorMessage) {
        return <p>{profileErrorMessage}</p>;
    }

    if (errorMessage) {
        return <p>{errorMessage}</p>;
    }

    return (
        <div>
            <div className="flex flex-row justify-between items-start">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl text-stone-700">My Diary</h1>
                    <p className="text-[rgb(137,122,114)] text-sm">
                        {restaurants.length} restaurants | {totalEntries} entries
                    </p>
                </div>

                <Link
                    to="/diary/new"
                    className="px-4 py-2 text-sm text-white border rounded-lg bg-[rgb(203,84,51)]"
                >
                    + New Entry
                </Link>
            </div>

            <div className="border border-gray-200 rounded-lg bg-white py-4 px-4 mt-6">
                <input
                    type="text"
                    className="rounded-lg border border-gray-200 bg-white px-3 focus:outline-[rgb(203,84,51)]"
                    value={searchRestaurant}
                    onChange={(e) => setSearchRestaurant(e.target.value)}
                    placeholder="Search"
                />
            </div>

            <div className="mt-6">
                <p className="text-[rgb(137,122,114)] text-sm">
                    Showing {filteredRestaurants.length} of {restaurants.length} restaurants
                </p>

                {filteredRestaurants.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        {filteredRestaurants.map((restaurant) => (
                            <DiaryCard
                                key={restaurant.id}
                                id={restaurant.id}
                                name={restaurant.name}
                                address={restaurant.address}
                                entryCount={restaurant.entryCount}
                                lastVisited={restaurant.lastVisited}
                                averageRating={restaurant.averageRating}
                                topTag={restaurant.topTag}
                                recentPhoto={restaurant.recentPhoto}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center mt-10 text-[rgb(137,122,114)] text-lg">
                        No restaurants found
                    </div>
                )}
            </div>
        </div>
    );
}