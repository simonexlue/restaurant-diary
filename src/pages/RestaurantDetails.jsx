import { useParams } from "react-router-dom"
import TagPill from "../components/ui/TagPill";
import { FaRegStar } from "react-icons/fa";
import { RiBookOpenLine } from "react-icons/ri";
import { MdPeopleOutline, MdOutlineCalendarToday } from "react-icons/md";
import RestaurantCard from "../components/restaurant/RestaurantCard";

export default function RestaurantDetails() {
    const { id } = useParams();

    return (
        <div className="flex flex-col gap-4 mx-auto w-full max-w-6xl">
            {/* Tags, Title, Address, Add an entry button */}
            <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-start">
                <div className="flex flex-col gap-3">
                    {/* Tags */}
                    <div className="flex gap-2">
                        <TagPill label="Japanese" />
                        <TagPill label="Sushi" />
                        <TagPill label="Date Night" />
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl text-stone-700">
                        Toyo Sushi Restaurant
                    </h1>
                    {/* Address */}
                    <p className="text-[rgb(137,122,114)] text-sm">23 Commerce St, New York, NY 10014</p>
                </div>

                {/* Button  */}
                <div>
                    <button className="w-1/4 md:w-full md:px-3 mb-4 h-10 mt-2 rounded-md bg-[rgb(203,84,51)] py-2 text-sm text-white hover:cursor-pointer">+ Add Dish</button>
                </div>

            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="flex flex-row items-center justify-start gap-4 border rounded-lg bg-white border-stone-200 py-4 px-5 shadow-sm">
                    <div className="bg-[rgb(253,246,244)] rounded-4xl p-3">
                        <FaRegStar size={24} className="text-[rgb(203,84,51)]" />
                    </div>

                    <div>
                        <p className="text-lg font-semibold">4.2</p>
                        <p className="text-xs text-[rgb(137,122,114)]">Avg Rating</p>
                    </div>
                </div>
                <div className="flex flex-row items-center justify-start gap-4 border rounded-lg bg-white border-stone-200 py-4 px-5 shadow-sm">
                    <div className="bg-[rgb(253,246,244)] rounded-4xl p-3">
                        <RiBookOpenLine size={22} className="text-[rgb(203,84,51)]" />
                    </div>
                    <div>
                        <p className="text-lg font-semibold">5</p>
                        <p className="text-xs text-[rgb(137,122,114)]">Dishes Tried</p>
                    </div>
                </div>
                <div className="flex flex-row items-center justify-start gap-4 border rounded-lg bg-white border-stone-200 py-4 px-5 shadow-sm">
                    <div className="bg-[rgb(253,246,244)] rounded-4xl p-3">
                        <MdOutlineCalendarToday size={22} className="text-[rgb(203,84,51)]" />
                    </div>
                    <div>
                        <p className="text-lg font-semibold">3</p>
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
        </div>
    )
}