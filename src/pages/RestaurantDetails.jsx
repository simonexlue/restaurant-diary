import { useParams } from "react-router-dom"
import TagPill from "../components/ui/TagPill";
import { FaRegStar } from "react-icons/fa";
import { RiBookOpenLine } from "react-icons/ri";
import { MdPeopleOutline, MdOutlineCalendarToday } from "react-icons/md";
import RestaurantCard from "../components/restaurant/RestaurantCard";
import { getRestaurantById } from "../services/restaurant";
import { useEffect, useState, useMemo } from "react";
import { getDishEntriesForRestaurant } from "../services/diary";
import useUserProfile from "../hooks/useUserProfile";

export default function RestaurantDetails() {
    const { id } = useParams();
    const { user, loading: profileLoading, errorMessage: profileErrorMessage } = useUserProfile();
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState("")
    const [restaurant, setRestaurant] = useState(null)
    const [dishEntries, setDishEntries] = useState([])
    const dishesTried = dishEntries.length

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

                setRestaurant(restaurantData)
                setDishEntries(dishEntriesData)
                console.log(dishEntriesData)
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
    })

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
                            <div>
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
                            <button className="w-1/4 md:w-full md:px-3 mb-4 h-10 mt-2 rounded-md bg-[rgb(203,84,51)] py-2 text-sm text-white hover:cursor-pointer">
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
                        <select className="text-sm text-stone-700 border rounded-lg border-stone-300 py-1 px-2">
                            <option>Latest First</option>
                            <option>Top Rated</option>
                            <option>Price: High</option>
                            <option>Price: Low</option>
                            <option>A-Z</option>
                        </select>
                    </div>

                    {/* List layout */}
                    <div>
                        <RestaurantCard />
                    </div>
                </>
            )}
        </div>
    );
}