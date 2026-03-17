import { useParams } from "react-router-dom"
import TagPill from "../components/ui/TagPill";
import { FaRegStar } from "react-icons/fa";
import { RiBookOpenLine } from "react-icons/ri";
import { MdPeopleOutline, MdOutlineCalendarToday } from "react-icons/md";
import DishCard from "../components/restaurant/DishCard";
import { getRestaurantById } from "../services/restaurant";
import { useEffect, useState, useMemo } from "react";
import { getDishEntriesForRestaurant, getDishPhotoUrl } from "../services/diary";
import useUserProfile from "../hooks/useUserProfile";
import { useNavigate } from "react-router-dom";

export default function RestaurantDetails() {
    const { id } = useParams();
    const { user, loading: profileLoading, errorMessage: profileErrorMessage } = useUserProfile();
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState("")
    const [restaurant, setRestaurant] = useState(null)
    const [dishEntries, setDishEntries] = useState([])
    const [sortBy, setSortBy] = useState("latest")
    const [openEntryId, setOpenEntryId] = useState(null);
    const dishesTried = dishEntries.length
    const navigate = useNavigate();

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

        async function loadRestaurant() {
            try {
                setLoading(true)
                setErrorMessage("")

                const restaurantData = await getRestaurantById(id)
                const dishEntriesData = await getDishEntriesForRestaurant(id, user.id)

                const dishEntriesWithPhotoUrls = await Promise.all(
                    dishEntriesData.map(async (entry) => {
                        if (!entry.photo_path) {
                            return {
                                ...entry,
                                photoUrl: null,
                            };
                        }
                        const photoUrl = await getDishPhotoUrl(entry.photo_path)
                        return {
                            ...entry,
                            photoUrl,
                        }
                    })
                )

                setRestaurant(restaurantData)
                setDishEntries(dishEntriesWithPhotoUrls)
                console.log(dishEntriesWithPhotoUrls)
            } catch (error) {
                setErrorMessage(error.message || "Failed to get restaurant details.")
            } finally {
                setLoading(false)
            }
        }

        loadRestaurant();

    }, [id, user, profileLoading, profileErrorMessage])

    const averageRating = useMemo(() => {
        if (dishEntries.length === 0) {
            return "0.0"
        }

        const total = dishEntries.reduce((sum, entry) => {
            return sum + Number(entry.item_rating || 0);
        }, 0)
        return (total / dishEntries.length).toFixed(1)
    }, [dishEntries])

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
        const entriesCopy = [...dishEntries]

        switch (sortBy) {
            case "topRated":
                return entriesCopy.sort((a, b) => {
                    return Number(b.item_rating || 0) - Number(a.item_rating || 0)
                })
            case "priceHigh":
                return entriesCopy.sort((a, b) => {
                    return Number(b.price || 0) - Number(a.price || 0)
                })
            case "priceLow":
                return entriesCopy.sort((a, b) => {
                    return Number(a.price || 0) - Number(b.price || 0)
                })
            case "az":
                return entriesCopy.sort((a, b) => {
                    return String(a.dish_name || "") - String(b.dish_name || "")
                })
            case "latest":
            default:
                return entriesCopy.sort((a, b) => {
                    const aDate = a.date_tried ? new Date(a.date_tried).getTime() : 0;
                    const bDate = b.date_tried ? new Date(b.date_tried).getTime() : 0;

                    return bDate - aDate;
                });
        }
    }, [dishEntries, sortBy])

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
                    {/* Tags, Title, Address, Add an entry button */}
                    <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-start">
                        <div className="flex flex-col gap-3">
                            {/* Tags */}
                            <div className="flex flex-row gap-2">
                                {restaurantTags.length > 0 ? (
                                    restaurantTags.map((tag) => (
                                        <TagPill key={tag} label={tag} />
                                    ))
                                ) : null}
                            </div>


                            {/* Title */}
                            <h1 className="text-3xl text-stone-700">
                                {restaurant.name}
                            </h1>

                            {/* Address */}
                            <p className="text-[rgb(137,122,114)] text-sm">
                                {restaurant?.address}
                            </p>
                        </div>

                        {/* Button  */}
                        <div>
                            <button
                                onClick={() => navigate(`/diary/new?restaurantId=${id}`)}
                                className="w-1/4 md:w-full md:px-3 mb-4 h-10 mt-2 rounded-md bg-[rgb(203,84,51)] py-2 text-sm text-white hover:cursor-pointer">
                                + Add Dish
                            </button>
                        </div>
                    </div>

                    {/* Metrics */}
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
                                <p className="text-lg font-semibold">1</p>
                                <p className="text-xs text-[rgb(137,122,114)]">Friends Visited</p>
                            </div>
                        </div>
                    </div>

                    {/* Dishes subheader */}
                    <div className="flex flex-row justify-between mt-4 items-center">
                        <p className="text-xl text-stone-800">My Dishes</p>
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

                    {/* List layout */}
                    <div>
                        {dishEntries.length === 0 ? (
                            <div className="rounded-xl border border-stone-200 bg-white px-5 py-6 text-sm text-[rgb(137,122,114)] shadow-sm">
                                No dish entries yet for this restaurant.
                            </div>
                        ) : (
                            <div className="flex flex-col gap-5">
                                {sortedDishEntries.map((entry) => (
                                    <DishCard
                                        key={entry.id}
                                        dishName={entry.dish_name}
                                        itemRating={entry.item_rating}
                                        price={entry.price}
                                        dateTried={entry.date_tried}
                                        review={entry.review}
                                        tags={entry.tags}
                                        photoUrl={entry.photoUrl}
                                        isOpen={openEntryId === entry.id}
                                        onToggle={() =>
                                            setOpenEntryId((prev) => (prev === entry.id ? null : entry.id))
                                        }
                                    />
                                ))}
                            </div>
                        )

                        }
                    </div>
                </>
            )}
        </div>
    );
}