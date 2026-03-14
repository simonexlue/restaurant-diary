import { useEffect, useState } from "react"
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

export default function MyDiary() {
    const [searchRestaurant, setSearchRestaurant] = useState("")
    const [filteredRestaurants, setFilteredRestaurants] = useState(null)
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState("")
    const [data, setData] = useState(null)

    useEffect(() => {
        fetchDiaryData()
    }, [])

    useEffect(() => {
        filterRestaurants();
    }, [searchRestaurant])

    async function fetchDiaryData() {
        setLoading(true)
        setErrorMessage("")

        try {
            const data = await getUserDiaryRestaurants()

            setData(data);
            console.log(data)

        } catch (error) {
            setErrorMessage(error.message || "Failed to load restaurants")
        } finally {
            setLoading(false)
        }
    }

    function filterRestaurants() {
        const filteredList = dummyRestaurants
        if (!searchRestaurant.trim()) {
            setFilteredRestaurants(filteredList)
        } else {
            setFilteredRestaurants(dummyRestaurants.filter((restaurant) => restaurant.name.toLowerCase().includes(searchRestaurant.toLowerCase())))
        }
    }

    const totalEntries = dummyRestaurants.reduce(
        (sum, restaurant) => sum + restaurant.entryCount,
        0
    );

    return (
        <div >
            {/* Header */}
            <div className="flex flex-row justify-between items-start">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl text-stone-700">My Diary</h1>
                    <p className="text-[rgb(137,122,114)] text-sm">{dummyRestaurants.length} restaurants | {totalEntries} entries</p>
                </div>
                <Link to="/diary/new" className="px-4 py-2 text-sm text-white border rounded-lg bg-[rgb(203,84,51)]">+ New Entry</Link>
            </div>

            {/* Search, Filters, and Tags */}
            <div className="border border-gray-300 rounded-lg bg-white py-4 px-4 mt-6">
                <input type="text" className="rounded-lg border border-gray-300 bg-white px-3 focus:outline-[rgb(203,84,51)]"
                    value={searchRestaurant}
                    onChange={(e) => setSearchRestaurant(e.target.value)}
                    placeholder="Search"
                />
            </div>

            {/* Grid */}
            {filteredRestaurants && (
                <div className="mt-6">
                    <p className="text-[rgb(137,122,114)] text-sm">Showing {filteredRestaurants.length} of {dummyRestaurants.length} restaurants</p>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        {filteredRestaurants.map((restaurant) => <DiaryCard key={restaurant.id} id={restaurant.id} name={restaurant.name} address={restaurant.address} entryCount={restaurant.entryCount} lastVisited={restaurant.lastVisited} recentDishes={restaurant.recentDishes} />)}
                    </div>
                    {filteredRestaurants.length === 0 && <div className="flex items-center justify-center mt-10 text-[rgb(137,122,114)] text-lg">No restaurants found</div>}
                </div>
            )}

        </div>
    )
}