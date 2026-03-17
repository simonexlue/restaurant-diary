import placeholder from "../../assets/auth-hero.jpg"
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";
import TagPill from "../ui/TagPill";
import { useState } from "react";

export default function RestaurantCard() {
    const [toggleNotes, setToggleNotes] = useState(false)

    return (
        <div className="border border-stone-300 bg-white rounded-lg flex flex-col md:flex-row md:gap-2">
            <div className="h-50 w-full overflow-hidden rounded-t-lg md:rounded-l-lg md:rounded-r-none md:h-40 md:w-100">
                <img
                    src={placeholder}
                    className="h-full w-full object-cover"
                />
            </div>

            <div className="bg-white px-3 py-4 w-full rounded-lg flex flex-col md:py-6">
                <div className="flex flex-col">
                    <div className="flex flex-row justify-between items-center">
                        <p className="text-stone-800 md:text-xl">Toro Nigiri</p>
                        <button className="text-sm" onClick={() => setToggleNotes((prev) => !prev)} >Open</button>
                    </div>

                    <div className="flex flex-row gap-3 text-sm text-[rgb(137,122,114)] items-center mt-2 md:text-md md:mt-2">
                        <div className="flex flex-row text-[rgb(203,84,51)] text-lg">
                            <FaStar />
                            <FaStar />
                            <FaStar />
                            <FaStar />
                            <FaStar />
                        </div>
                        <p>$28</p>
                        <p>Feb 13, 2026</p>
                    </div>
                </div>
                <div className="mt-auto">
                    <p className="text-xs mt-3">Tags</p>
                </div>



                {toggleNotes &&
                    (<div className="text-sm mt-3">
                        Notes go in here.
                    </div>
                    )}
            </div>
        </div>
    )
}