import { useEffect, useState, useMemo } from "react"
import DiaryCard from "../components/diary/DiaryCard"
import { getUserDiaryRestaurants } from "../services/diary"
import { Link } from "react-router-dom"

const dummyRestaurants = [
    {
        id: "1",
        name: "Osteria Francescana",
        address: "ABC",
        entryCount: 4,
        lastVisited: "2026-03-01",
        recentDishes: ["Truffle Pasta", "Tiramisu"]
    },
    {
        id: "2",
        name: "Sushi By Yuji",
        address: "ABC",
        entryCount: 4,
        lastVisited: "2026-03-01",
        recentDishes: ["Truffle Pasta", "Tiramisu"]
    },
    {
        id: "3",
        name: "Sushi Hill",
        address: "ABC",
        entryCount: 4,
        lastVisited: "2026-03-01",
        recentDishes: ["Truffle Pasta", "Tiramisu"]
    },
]

function groupEntriesByRestaurant(entries) {
    const groupedMap = new Map();

    for (const entry of entries) {
        const restaurant = entry.restaurants;
        if (!restaurant) continue;

        const existingGroup = groupedMap.get(entry.restaurant_id);

        if (!existingGroup) {
            groupedMap.set(entry.restaurant_id, {
                id: restaurant.id,
                name: restaurant.name,
                address: restaurant.address || "No address provided",
                entryCount: 1,
                lastVisited: entry.date_tried,
                recentDishes: entry.dish_name ? [entry.dish_name] : [],
            });
            continue;
        }
        existingGroup.entryCount += 1;

        if (
            entry.date_tried &&
            (!existingGroup.lastVisited || entry.date_tried > existingGroup.lastVisited)
        ) {
            existingGroup.lastVisited = entry.date_tried;
        }

        if (entry.dish_name) {
            const alreadyIncluded = existingGroup.recentDishes.includes(entry.dish_name);

            if (!alreadyIncluded && existingGroup.recentDishes.length < 3) {
                existingGroup.recentDishes.push(entry.dish_name);
            }
        }
    }

    return Array.from(groupedMap.values()).sort((a, b) => {
        if (!a.lastVisited) return 1;
        if (!b.lastVisited) return -1;
        return b.lastVisited.localeCompare(a.lastVisited);
    });
}

export default function MyDiary() {
    const [searchRestaurant, setSearchRestaurant] = useState("");
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [restaurants, setRestaurants] = useState([]);

    useEffect(() => {
        fetchDiaryData();
    }, []);

    async function fetchDiaryData() {
        setLoading(true);
        setErrorMessage("");

        try {
            const rawEntries = await getUserDiaryRestaurants();
            const groupedRestaurants = groupEntriesByRestaurant(rawEntries);

            setRestaurants(groupedRestaurants);
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

    if (loading) {
        return <p>Loading...</p>;
    }

    if (errorMessage) {
        return <p>{errorMessage}</p>;
    }

    return (
        <div>
            {/* Header */}
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

            {/* Search */}
            <div className="border border-gray-300 rounded-lg bg-white py-4 px-4 mt-6">
                <input
                    type="text"
                    className="rounded-lg border border-gray-300 bg-white px-3 focus:outline-[rgb(203,84,51)]"
                    value={searchRestaurant}
                    onChange={(e) => setSearchRestaurant(e.target.value)}
                    placeholder="Search"
                />
            </div>

            {/* Grid */}
            <div className="mt-6">
                <p className="text-[rgb(137,122,114)] text-sm">
                    Showing {filteredRestaurants.length} of {restaurants.length} restaurants
                </p>

                {filteredRestaurants.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        {filteredRestaurants.map((restaurant) => (
                            <DiaryCard
                                key={restaurant.id}
                                id={restaurant.id}
                                name={restaurant.name}
                                address={restaurant.address}
                                entryCount={restaurant.entryCount}
                                lastVisited={restaurant.lastVisited}
                                recentDishes={restaurant.recentDishes}
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