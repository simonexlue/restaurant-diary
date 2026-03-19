import photo from "../../assets/auth-hero.jpg"
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";

export default function FriendsReviewCard() {
    return (
        <div className="h-full flex flex-col overflow-hidden rounded-lg border border-stone-200 bg-white">
            <div className="h-56 md:h-64 lg:h-56 w-full bg-stone-100">
                <img
                    src={photo}
                    className="h-full w-full object-cover"
                />
            </div>

            <div className="py-3 px-4 flex flex-col gap-2">
                <div className="flex flex-row gap-2 items-center">
                    <img src={photo} className="h-6 rounded-4xl" />
                    <p className="text-sm font-medium text-stone-800">Sarah Mitchell</p>
                    <p className="text-[rgb(137,122,114)] text-xs ml-2">Mar 15, 2025</p>
                </div>

                <div className="flex flex-col gap-2">
                    <p className="text-stone-800 text-lg">Nobu Downtown</p>
                    <p className="text-[rgb(137,122,114)] text-xs">New York, USA</p>

                    <div className="flex flex-row items-center gap-1 text-[rgb(203,84,51)] text-sm">
                        <FaStar />
                        <FaStar />
                        <FaStar />
                        <FaStarHalfAlt />
                        <FaRegStar />
                        <p>4.5</p>
                    </div>
                </div>

                <div className="flex flex-row justify-between items-end">
                    <p className="text-[rgb(137,122,114)] text-xs">4 dishes reviewed</p>
                    <button className="px-4 py-1 text-sm text-white border rounded-lg bg-[rgb(203,84,51)]">View</button>
                </div>
            </div>
        </div>
    )
}