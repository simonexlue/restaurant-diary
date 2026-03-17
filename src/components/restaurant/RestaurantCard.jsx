import placeholder from "../../assets/auth-hero.jpg"
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";
import TagPill from "../ui/TagPill";
import { useState } from "react";

export default function RestaurantCard() {
    const [toggleNotes, setToggleNotes] = useState(false)

    return (
        <div className="border border-stone-300 rounded-lg flex flex-col">
            <div className="h-50 w-full overflow-hidden rounded-t-lg">
                <img
                    src={placeholder}
                    className="h-full w-full object-cover"
                />
            </div>

            <div className="bg-white px-3 py-4 w-full rounded-lg flex flex-col">
                <div className="flex flex-row justify-between items-center">
                    <p className="text-stone-800">Toro Nigiri</p>
                    <button className="text-sm" onClick={() => setToggleNotes((prev) => !prev)} >Open</button>
                </div>

                <div className="flex flex-row gap-3 text-sm text-[rgb(137,122,114)] items-center">
                    <div className="flex flex-row text-[rgb(203,84,51)]">
                        <FaStar />
                        <FaStar />
                        <FaStar />
                        <FaStar />
                        <FaStar />
                    </div>
                    <p>$28</p>
                    <p>Feb 13, 2026</p>
                </div>

                <p className="text-xs mt-3">Tags</p>


                {toggleNotes &&
                    (<div className="text-sm mt-3">
                        Notes go in here.
                    </div>
                    )}
            </div>
        </div>
    )
}