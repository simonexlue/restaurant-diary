import { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import DiaryCard from "../components/diary/DiaryCard";
import { getUserDiaryRestaurants, getUserDishEntries, getDishPhotoUrl } from "../services/diary";
import useUserProfile from "../hooks/useUserProfile";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import TagPill from "../components/ui/TagPill";

function normalizeTags(tags) {
    if (!tags) return [];

    if (Array.isArray(tags)) {
        return tags.map((tag) => String(tag).trim()).filter(Boolean)
    }

    return [String(tags).trim()].filter(Boolean);
}

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
                const entryTags = normalizeTags(entry.tags);

                for (const tag of entryTags) {
                    const currentCount = tagCounts.get(tag) || 0;
                    tagCounts.set(tag, currentCount + 1);
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
                        const entryTags = normalizeTags(entry.tags);

                        for (const tag of entryTags) {
                            if (mostCommonTags.includes(tag)) {
                                topTag = tag;
                                break;
                            }
                        }

                        if (topTag) break;
                    }
                }
            }

            const recentPhoto =
                sortedEntries.find((entry) => entry.photo_path)?.photo_path || null;

            const allTags = Array.from(tagCounts.keys());

            return {
                id: restaurant.id,
                name: restaurant.name,
                address: restaurant.address || "No address provided",
                entryCount: entries.length,
                lastVisited: sortedEntries[0]?.date_tried || null,
                averageRating,
                topTag,
                recentPhoto,
                allTags,
            };
        })
        .filter(Boolean);
}

function buildAllUniqueTags(dishEntries) {
    const uniqueTags = new Set();

    for (const entry of dishEntries) {
        const entryTags = normalizeTags(entry.tags);

        for (const tag of entryTags) {
            uniqueTags.add(tag);
        }
    }

    return Array.from(uniqueTags).sort((a, b) => a.localeCompare(b));
}

export default function MyDiary() {
    const { user, loading: profileLoading, errorMessage: profileErrorMessage } = useUserProfile();

    const [searchRestaurant, setSearchRestaurant] = useState("");
    const [sortOption, setSortOption] = useState("latest");
    const [selectedTag, setSelectedTag] = useState("");
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [restaurants, setRestaurants] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [tagsExpanded, setTagsExpanded] = useState(false);
    const [showExpandButton, setShowExpandButton] = useState(false);

    const tagsContainerRef = useRef(null);

    useEffect(() => {
        if (!user) return;
        fetchDiaryData();
    }, [user]);

    useEffect(() => {
        const container = tagsContainerRef.current;
        if (!container || tagsExpanded) {
            setShowExpandButton(false);
            return;
        }

        setShowExpandButton(container.scrollHeight > container.clientHeight + 2);
    }, [allTags, tagsExpanded]);

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
            const uniqueTags = buildAllUniqueTags(dishEntries);

            const diaryCardsWithImageUrls = await Promise.all(
                diaryCards.map(async (restaurant) => {
                    if (!restaurant.recentPhoto) {
                        return {
                            ...restaurant,
                            imageUrl: null,
                        };
                    }

                    const imageUrl = await getDishPhotoUrl(restaurant.recentPhoto);

                    return {
                        ...restaurant,
                        imageUrl,
                    };
                })
            );

            setRestaurants(diaryCardsWithImageUrls);
            setAllTags(uniqueTags);
        } catch (error) {
            setErrorMessage(error.message || "Failed to load restaurants");
        } finally {
            setLoading(false);
        }
    }

    const filteredRestaurants = useMemo(() => {
        let result = [...restaurants];

        if (searchRestaurant.trim()) {
            result = result.filter((restaurant) =>
                restaurant.name.toLowerCase().includes(searchRestaurant.toLowerCase())
            );
        }

        if (selectedTag) {
            result = result.filter((restaurant) =>
                restaurant.allTags?.includes(selectedTag)
            );
        }

        if (sortOption === "latest") {
            result.sort((a, b) => {
                if (!a.lastVisited) return 1;
                if (!b.lastVisited) return -1;
                return b.lastVisited.localeCompare(a.lastVisited);
            });
        }

        if (sortOption === "highest-rating") {
            result.sort((a, b) => {
                const aRating = a.averageRating ?? -1;
                const bRating = b.averageRating ?? -1;
                return bRating - aRating;
            });
        }

        if (sortOption === "a-z") {
            result.sort((a, b) => a.name.localeCompare(b.name));
        }

        return result;
    }, [restaurants, searchRestaurant, selectedTag, sortOption]);

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
                <div className="flex flex-col gap-3">
                    <div className="flex flex-row items-center gap-2">
                        <input
                            type="text"
                            className="h-10 flex-1 rounded-lg border border-gray-300 px-3 bg-[rgb(248,245,242)] text-sm focus:outline-[rgb(203,84,51)]"
                            value={searchRestaurant}
                            onChange={(e) => setSearchRestaurant(e.target.value)}
                            placeholder="Search restaurants"
                        />

                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            className="h-10 w-44 rounded-lg border border-gray-300 bg-[rgb(248,245,242)] px-3 text-sm text-stone-600 focus:outline-[rgb(203,84,51)]"
                        >
                            <option value="latest">Latest First</option>
                            <option value="highest-rating">Highest Rating</option>
                            <option value="a-z">A-Z</option>
                        </select>
                    </div>

                    {allTags.length > 0 && (
                        <div>
                            <div
                                ref={tagsContainerRef}
                                className={`overflow-hidden ${tagsExpanded ? "" : "max-h-9"}`}
                            >
                                <div className="flex flex-wrap gap-2">
                                    <TagPill
                                        label="All"
                                        selected={selectedTag === ""}
                                        onClick={() => setSelectedTag("")}
                                    />

                                    {allTags.map((tag) => (
                                        <TagPill
                                            key={tag}
                                            label={tag}
                                            selected={selectedTag === tag}
                                            onClick={() => setSelectedTag(tag)}
                                        />
                                    ))}
                                </div>
                            </div>

                            {(showExpandButton || tagsExpanded) && (
                                <button
                                    type="button"
                                    onClick={() => setTagsExpanded((prev) => !prev)}
                                    className="mt-2 flex items-center gap-1 text-sm text-[rgb(137,122,114)]"
                                >
                                    {tagsExpanded ? (
                                        <>
                                            <FiChevronUp />
                                            Show less
                                        </>
                                    ) : (
                                        <>
                                            <FiChevronDown />
                                            Show all tags
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-6">
                <p className="text-[rgb(137,122,114)] text-sm">
                    Showing {filteredRestaurants.length} of {restaurants.length} restaurants
                    {selectedTag ? ` • Tag: ${selectedTag}` : ""}
                </p>

                {filteredRestaurants.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 lg:grid-cols-3 xl:grid-cols-5">
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
                                imageUrl={restaurant.imageUrl}
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