import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import DiaryCard from "../components/diary/DiaryCard";
import { getMyDiaryCards, getDishPhotoUrl, invalidateMyDiaryCardsCache } from "../services/diary";
import { deleteRestaurantForUser } from "../services/restaurant";
import useUserProfile from "../hooks/useUserProfile";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import TagPill from "../components/ui/TagPill";
import { getProfileById } from "../services/profile";
import { invalidateHomePersonalCaches } from "../services/home";

export default function MyDiary() {
    const { user, loading: profileLoading, errorMessage: profileErrorMessage } = useUserProfile();
    const { friendId } = useParams();

    const [searchRestaurant, setSearchRestaurant] = useState("");
    const [sortOption, setSortOption] = useState("latest");
    const [selectedTag, setSelectedTag] = useState("");
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [restaurants, setRestaurants] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [tagsExpanded, setTagsExpanded] = useState(false);
    const [showExpandButton, setShowExpandButton] = useState(false);
    const [deletingRestaurantId, setDeletingRestaurantId] = useState(null);
    const [viewedDisplayName, setViewedDisplayName] = useState("");

    const tagsContainerRef = useRef(null);

    const diaryUserId = friendId || user?.id;
    const isOwnDiary = !friendId || friendId === user?.id;

    useEffect(() => {
        if (!user || !diaryUserId) return;
        fetchDiaryData();
    }, [user, diaryUserId]);

    useEffect(() => {
        const container = tagsContainerRef.current;
        if (!container || tagsExpanded) {
            setShowExpandButton(false);
            return;
        }

        setShowExpandButton(container.scrollHeight > container.clientHeight + 2);
    }, [allTags, tagsExpanded]);

    useEffect(() => {
        async function loadViewedProfileName() {
            if (isOwnDiary) {
                setViewedDisplayName("");
                return;
            }

            if (!friendId) return;

            try {
                const profile = await getProfileById(friendId);
                setViewedDisplayName(
                    profile?.display_name || profile?.username || ""
                );
            } catch (error) {
                console.error("Failed to load viewed profile name:", error.message);
                setViewedDisplayName("");
            }
        }

        loadViewedProfileName();
    }, [friendId, isOwnDiary]);

    async function fetchDiaryData() {
        if (!user || !diaryUserId) return;

        setLoading(true);
        setErrorMessage("");

        try {
            const diaryCards = await getMyDiaryCards(diaryUserId, {
                forceRefresh: !isOwnDiary ? true : false,
            });

            const uniqueTags = Array.from(
                new Set(
                    diaryCards.flatMap((restaurant) =>
                        Array.isArray(restaurant.allTags) ? restaurant.allTags : []
                    )
                )
            ).sort((a, b) => a.localeCompare(b));

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

    async function handleDeleteRestaurant(restaurantId, restaurantName) {
        if (!user?.id || !restaurantId || !isOwnDiary) return;

        const confirmed = window.confirm(
            `Delete "${restaurantName}" and all entries in it? This cannot be undone.`
        );

        if (!confirmed) return;

        try {
            setDeletingRestaurantId(restaurantId);
            setErrorMessage("");

            await deleteRestaurantForUser({
                restaurantId,
                userId: user.id,
            });

            invalidateHomePersonalCaches(user.id);
            invalidateMyDiaryCardsCache(user.id);

            await fetchDiaryData();
        } catch (error) {
            setErrorMessage(error.message || "Failed to delete restaurant.");
        } finally {
            setDeletingRestaurantId(null);
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

    const firstName = viewedDisplayName.trim().split(" ")[0];

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
                    <h1 className="text-3xl text-stone-700">
                        {isOwnDiary ? "My Diary" : `${firstName || "User"}'s Diary`}
                    </h1>
                    <p className="text-[rgb(137,122,114)] text-sm">
                        {restaurants.length} restaurants | {totalEntries} entries
                    </p>
                </div>

                {isOwnDiary && (
                    <Link
                        to="/diary/new"
                        className="px-4 py-2 text-sm text-white border rounded-lg bg-[rgb(203,84,51)]"
                    >
                        + New Entry
                    </Link>
                )}
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
                    <div className="grid grid-cols-1 gap-3 mt-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                        {filteredRestaurants.map((restaurant) => (
                            <div key={restaurant.id} className="flex flex-col gap-2">
                                <DiaryCard
                                    id={restaurant.id}
                                    name={restaurant.name}
                                    address={restaurant.address}
                                    entryCount={restaurant.entryCount}
                                    lastVisited={restaurant.lastVisited}
                                    averageRating={restaurant.averageRating}
                                    topTag={restaurant.topTag}
                                    imageUrl={restaurant.imageUrl}
                                    onDelete={
                                        isOwnDiary
                                            ? () => handleDeleteRestaurant(restaurant.id, restaurant.name)
                                            : undefined
                                    }
                                    isDeleting={deletingRestaurantId === restaurant.id}
                                    routePath={
                                        isOwnDiary
                                            ? `/restaurant/${restaurant.id}`
                                            : `/friends/${friendId}/restaurants/${restaurant.id}`
                                    }
                                />
                            </div>
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