import { useParams, useNavigate, useLocation } from "react-router-dom";
import TagPill from "../components/ui/TagPill";
import { FaRegStar } from "react-icons/fa";
import { RiBookOpenLine } from "react-icons/ri";
import { MdPeopleOutline, MdOutlineCalendarToday } from "react-icons/md";
import DishCard from "../components/restaurant/DishCard";
import { getRestaurantById, getRestaurantFriendsVisitedCount } from "../services/restaurant";
import { useEffect, useState, useMemo } from "react";
import {
    getRestaurantDetailEntries,
    getDishPhotoUrl,
    deleteDishEntry,
    toggleDishEntryLike,
    createDishEntryComment,
    deleteDishEntryComment,
    invalidateMyDiaryCardsCache,
} from "../services/diary";
import useUserProfile from "../hooks/useUserProfile";
import EditDishEntryModal from "../components/restaurant/EditDishEntryModal";
import { formatDate } from "../utils/date";
import { invalidateHomePersonalCaches } from "../services/home";

export default function RestaurantDetails() {
    const { id, friendId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const {
        user,
        loading: profileLoading,
        errorMessage: profileErrorMessage,
    } = useUserProfile();

    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [restaurant, setRestaurant] = useState(null);
    const [dishEntries, setDishEntries] = useState([]);
    const [sortBy, setSortBy] = useState("latest");
    const [openEntryId, setOpenEntryId] = useState(null);
    const [editingEntryId, setEditingEntryId] = useState(null);
    const [deletingEntryId, setDeletingEntryId] = useState(null);
    const [friendsVisitedCount, setFriendsVisitedCount] = useState(
        location.state?.restaurant?.friends?.length ?? 0
    );

    const isFriendView = Boolean(friendId);
    const targetUserId = friendId || user?.id;
    const friendName =
        location.state?.friendName ||
        location.state?.restaurant?.selectedFriendName ||
        "Friend";
    const canManageEntries = !isFriendView;

    const dishesTried = dishEntries.length;

    async function buildEntriesWithAssets(entries) {
        const entriesWithAssets = await Promise.all(
            entries.map(async (entry) => {
                if (!entry.photo_path) {
                    return {
                        ...entry,
                        photoUrl: null,
                    };
                }

                const photoUrl = await getDishPhotoUrl(entry.photo_path);

                return {
                    ...entry,
                    photoUrl,
                };
            })
        );

        return entriesWithAssets;
    }

    useEffect(() => {
        if (profileLoading) {
            return;
        }

        if (profileErrorMessage) {
            setErrorMessage(profileErrorMessage);
            setLoading(false);
            return;
        }

        if (!user) {
            setErrorMessage("You must be signed in to view this restaurant.");
            setLoading(false);
            return;
        }

        if (!id || !targetUserId) {
            setErrorMessage("Missing restaurant or user information.");
            setLoading(false);
            return;
        }

        async function loadRestaurant() {
            try {
                setLoading(true);
                setErrorMessage("");

                const requests = [
                    getRestaurantById(id),
                    getRestaurantDetailEntries({
                        restaurantId: id,
                        targetUserId,
                        viewerUserId: user.id,
                    }),
                ];

                if (!isFriendView) {
                    requests.push(getRestaurantFriendsVisitedCount(id));
                }

                const results = await Promise.all(requests);

                const restaurantData = results[0];
                const dishEntriesData = results[1];
                const friendsVisited = !isFriendView ? results[2] : null;

                const dishEntriesWithAssets = await buildEntriesWithAssets(dishEntriesData);

                setRestaurant(restaurantData);
                setDishEntries(dishEntriesWithAssets);

                if (!isFriendView) {
                    setFriendsVisitedCount(friendsVisited ?? 0);
                }
            } catch (error) {
                setErrorMessage(error.message || "Failed to get restaurant details.");
            } finally {
                setLoading(false);
            }
        }

        loadRestaurant();
    }, [id, targetUserId, user?.id, profileLoading, profileErrorMessage, isFriendView]);

    async function refreshRestaurantEntries() {
        if (!id || !targetUserId || !user?.id) {
            return;
        }

        try {
            const dishEntriesData = await getRestaurantDetailEntries({
                restaurantId: id,
                targetUserId,
                viewerUserId: user.id,
            });

            const dishEntriesWithAssets = await buildEntriesWithAssets(dishEntriesData);

            setDishEntries(dishEntriesWithAssets);
        } catch (error) {
            setErrorMessage(error.message || "Failed to refresh dish entries.");
        }
    }

    async function handleDeleteEntry(entry) {
        if (!entry?.id || !user?.id) return;

        const confirmed = window.confirm(
            `Delete "${entry.dish_name || "this dish entry"}"? This cannot be undone.`
        );

        if (!confirmed) return;

        try {
            setDeletingEntryId(entry.id);
            setErrorMessage("");

            await deleteDishEntry({
                entryId: entry.id,
                userId: user.id,
                photoPath: entry.photo_path,
            });

            invalidateHomePersonalCaches(user.id);
            invalidateMyDiaryCardsCache(user.id);

            setDishEntries((prev) => prev.filter((item) => item.id !== entry.id));

            if (openEntryId === entry.id) {
                setOpenEntryId(null);
            }

            if (editingEntryId === entry.id) {
                setEditingEntryId(null);
            }
        } catch (error) {
            setErrorMessage(error.message || "Failed to delete dish entry.");
        } finally {
            setDeletingEntryId(null);
        }
    }

    async function handleToggleLike(entryId, isCurrentlyLiked) {
        if (!user?.id || !entryId) return;

        try {
            setErrorMessage("");

            await toggleDishEntryLike(entryId, user.id, isCurrentlyLiked);

            setDishEntries((prev) =>
                prev.map((entry) => {
                    if (entry.id !== entryId) {
                        return entry;
                    }

                    return {
                        ...entry,
                        likedByCurrentUser: !isCurrentlyLiked,
                        likeCount: isCurrentlyLiked
                            ? Math.max(0, (entry.likeCount || 0) - 1)
                            : (entry.likeCount || 0) + 1,
                    };
                })
            );
        } catch (error) {
            setErrorMessage(error.message || "Failed to update like.");
        }
    }

    const averageRating = useMemo(() => {
        if (dishEntries.length === 0) {
            return "0.0";
        }

        const total = dishEntries.reduce((sum, entry) => {
            return sum + Number(entry.item_rating || 0);
        }, 0);

        return (total / dishEntries.length).toFixed(1);
    }, [dishEntries]);

    const visits = useMemo(() => {
        const uniqueDates = new Set(
            dishEntries
                .map((entry) => entry.date_tried)
                .filter(Boolean)
        );

        return uniqueDates.size;
    }, [dishEntries]);

    const restaurantTags = useMemo(() => {
        return Array.from(
            new Set(
                dishEntries.flatMap((entry) =>
                    Array.isArray(entry.tags) ? entry.tags : []
                )
            )
        );
    }, [dishEntries]);

    const sortedDishEntries = useMemo(() => {
        const entriesCopy = [...dishEntries];

        switch (sortBy) {
            case "topRated":
                return entriesCopy.sort((a, b) => {
                    return Number(b.item_rating || 0) - Number(a.item_rating || 0);
                });

            case "priceHigh":
                return entriesCopy.sort((a, b) => {
                    return Number(b.price || 0) - Number(a.price || 0);
                });

            case "priceLow":
                return entriesCopy.sort((a, b) => {
                    return Number(a.price || 0) - Number(b.price || 0);
                });

            case "az":
                return entriesCopy.sort((a, b) => {
                    return (a.dish_name || "").localeCompare(b.dish_name || "");
                });

            case "latest":
            default:
                return entriesCopy.sort((a, b) => {
                    const dateA = new Date(a.date_tried || a.created_at);
                    const dateB = new Date(b.date_tried || b.created_at);
                    return dateB - dateA;
                });
        }
    }, [dishEntries, sortBy]);

    async function handleAddComment(entryId, commentText) {
        if (!user?.id || !entryId) return;

        try {
            setErrorMessage("");

            const newComment = await createDishEntryComment({
                entryId,
                userId: user.id,
                comment: commentText,
            });

            setDishEntries((prev) =>
                prev.map((entry) => {
                    if (entry.id !== entryId) return entry;

                    const nextComments = [...(entry.comments || []), newComment];

                    return {
                        ...entry,
                        comments: nextComments,
                        commentCount: nextComments.length,
                    };
                })
            );
        } catch (error) {
            setErrorMessage(error.message || "Failed to add comment.");
            throw error;
        }
    }

    async function handleDeleteComment(entryId, commentId) {
        if (!user?.id || !entryId || !commentId) return;

        try {
            setErrorMessage("");

            await deleteDishEntryComment(commentId, user.id);

            setDishEntries((prev) =>
                prev.map((entry) => {
                    if (entry.id !== entryId) return entry;

                    const nextComments = (entry.comments || []).filter(
                        (comment) => comment.id !== commentId
                    );

                    return {
                        ...entry,
                        comments: nextComments,
                        commentCount: nextComments.length,
                    };
                })
            );
        } catch (error) {
            setErrorMessage(error.message || "Failed to delete comment.");
        }
    }

    const dishesHeading = isFriendView ? `${friendName}'s Dishes` : "Your Dishes";

    return (
        <div className="flex flex-col gap-4 mx-auto w-full max-w-6xl">
            {loading && (
                <p className="text-sm text-stone-500">Loading restaurant...</p>
            )}

            {!loading && errorMessage && (
                <p className="text-sm text-red-600">{errorMessage}</p>
            )}

            {!loading && !errorMessage && restaurant && (
                <>
                    <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-start">
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-row gap-2 flex-wrap">
                                {restaurantTags.length > 0
                                    ? restaurantTags.map((tag) => (
                                        <TagPill key={tag} label={tag} />
                                    ))
                                    : null}
                            </div>

                            <h1 className="text-3xl text-stone-700">
                                {restaurant.name}
                            </h1>

                            <p className="text-[rgb(137,122,114)] text-sm">
                                {restaurant?.address}
                            </p>

                            {isFriendView && (
                                <p className="text-sm text-[rgb(137,122,114)]">
                                    Viewing entry from {friendName}
                                </p>
                            )}
                        </div>

                        {canManageEntries && (
                            <div>
                                <button
                                    onClick={() => navigate(`/diary/new?restaurantId=${id}`)}
                                    className="w-1/4 md:w-full md:px-3 mb-4 h-10 mt-2 rounded-md bg-[rgb(203,84,51)] py-2 text-sm text-white hover:cursor-pointer"
                                >
                                    + Add Dish
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <div className="flex flex-row items-center justify-start gap-4 border rounded-lg bg-white border-stone-200 py-4 px-5 shadow-sm">
                            <div className="bg-[rgb(253,246,244)] rounded-4xl p-3">
                                <FaRegStar size={24} className="text-[rgb(203,84,51)]" />
                            </div>

                            <div>
                                <p className="text-lg font-semibold">{averageRating}</p>
                                <p className="text-xs text-[rgb(137,122,114)]">Avg Rating</p>
                            </div>
                        </div>

                        <div className="flex flex-row items-center justify-start gap-4 border rounded-lg bg-white border-stone-200 py-4 px-5 shadow-sm">
                            <div className="bg-[rgb(253,246,244)] rounded-4xl p-3">
                                <RiBookOpenLine size={22} className="text-[rgb(203,84,51)]" />
                            </div>

                            <div>
                                <p className="text-lg font-semibold">{dishesTried}</p>
                                <p className="text-xs text-[rgb(137,122,114)]">Dishes Tried</p>
                            </div>
                        </div>

                        <div className="flex flex-row items-center justify-start gap-4 border rounded-lg bg-white border-stone-200 py-4 px-5 shadow-sm">
                            <div className="bg-[rgb(253,246,244)] rounded-4xl p-3">
                                <MdOutlineCalendarToday size={22} className="text-[rgb(203,84,51)]" />
                            </div>

                            <div>
                                <p className="text-lg font-semibold">{visits}</p>
                                <p className="text-xs text-[rgb(137,122,114)]">Visits</p>
                            </div>
                        </div>

                        <div className="flex flex-row items-center justify-start gap-4 border rounded-lg bg-white border-stone-200 py-4 px-5 shadow-sm">
                            <div className="bg-[rgb(253,246,244)] rounded-4xl p-3">
                                <MdPeopleOutline size={26} className="text-[rgb(203,84,51)]" />
                            </div>

                            <div>
                                <p className="text-lg font-semibold">
                                    {isFriendView ? "Friend" : friendsVisitedCount}
                                </p>
                                <p className="text-xs text-[rgb(137,122,114)]">
                                    {isFriendView ? "Shared View" : "Friends Visited"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-row justify-between mt-4 items-center">
                        <p className="text-xl text-stone-800">{dishesHeading}</p>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="text-sm text-stone-700 border rounded-lg border-stone-300 py-1 px-2"
                        >
                            <option value="latest">Latest First</option>
                            <option value="topRated">Top Rated</option>
                            <option value="priceHigh">Price: High</option>
                            <option value="priceLow">Price: Low</option>
                            <option value="az">A-Z</option>
                        </select>
                    </div>

                    <div>
                        {dishEntries.length === 0 ? (
                            <div className="rounded-xl border border-stone-200 bg-white px-5 py-6 text-sm text-[rgb(137,122,114)] shadow-sm">
                                {isFriendView
                                    ? `No shared dish entries yet for ${friendName} at this restaurant.`
                                    : "No dish entries yet for this restaurant."}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-5">
                                {sortedDishEntries.map((entry) => (
                                    <DishCard
                                        key={entry.id}
                                        dishName={entry.dish_name}
                                        itemRating={entry.item_rating}
                                        price={entry.price}
                                        dateTried={formatDate(entry.date_tried)}
                                        review={entry.review}
                                        tags={entry.tags}
                                        photoUrl={entry.photoUrl}
                                        likeCount={entry.likeCount || 0}
                                        likedByCurrentUser={entry.likedByCurrentUser || false}
                                        onLikeToggle={() =>
                                            handleToggleLike(entry.id, entry.likedByCurrentUser)
                                        }
                                        isOpen={openEntryId === entry.id}
                                        onToggle={() =>
                                            setOpenEntryId((prev) =>
                                                prev === entry.id ? null : entry.id
                                            )
                                        }
                                        onEdit={
                                            canManageEntries
                                                ? () => setEditingEntryId(entry.id)
                                                : undefined
                                        }
                                        onDelete={
                                            canManageEntries
                                                ? () => handleDeleteEntry(entry)
                                                : undefined
                                        }
                                        isDeleting={deletingEntryId === entry.id}
                                        commentCount={entry.commentCount || 0}
                                        comments={entry.comments || []}
                                        currentUserId={user?.id}
                                        onAddComment={(commentText) => handleAddComment(entry.id, commentText)}
                                        onDeleteComment={(commentId) => handleDeleteComment(entry.id, commentId)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {canManageEntries && editingEntryId && (
                <EditDishEntryModal
                    entryId={editingEntryId}
                    onClose={() => setEditingEntryId(null)}
                    onSaved={async () => {
                        await refreshRestaurantEntries();
                        setEditingEntryId(null);
                    }}
                />
            )}
        </div>
    );
}