import placeholder from "../../assets/auth-hero.jpg"
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";
import TagPill from "../ui/TagPill";
import { useState } from "react";

export default function DishCard({
    dishName,
    itemRating,
    price,
    dateTried,
    review,
    tags = [],
    photoUrl,
}) {
    const [toggleNotes, setToggleNotes] = useState(false)

    function formatDate(dateString) {
        if (!dateString) {
            return "No date";
        }

        const date = new Date(dateString);
        return date.toLocaleDateString("en-CA", {
            year: "numeric",
            month: "short",
            day: "numeric"
        })
    }

    function renderStars(rating) {
        const numericRating = Number(rating || 0);
        const stars = [];

        for (let i = 1; i <= 5; i++) {
            if (numericRating >= i) {
                stars.push(<FaStar key={i} />)
            } else if (numericRating >= i - 0.5) {
                stars.push(<FaStarHalfAlt key={i} />)
            } else {
                stars.push(<FaRegStar key={i} />)
            }
        }
        return stars
    }

    return (
        <div className="border border-stone-300 bg-white rounded-lg flex flex-col md:flex-row md:gap-2 shadow-sm">
            <div className="h-50 w-full overflow-hidden rounded-t-lg md:rounded-l-lg md:rounded-r-none md:h-40 md:w-100">
                <img
                    src={photoUrl || placeholder}
                    className="h-full w-full object-cover"
                />
            </div>

            <div className="bg-white px-3 py-4 w-full rounded-lg flex flex-col md:py-6">
                <div className="flex flex-col">
                    <div className="flex flex-row justify-between items-center">
                        <p className="text-stone-800 md:text-xl">{dishName}</p>
                        <button className="text-sm" onClick={() => setToggleNotes((prev) => !prev)} >
                            {toggleNotes ? "Close" : "Open"}
                        </button>
                    </div>

                    <div className="flex flex-row gap-3 text-sm text-[rgb(137,122,114)] items-center mt-2 md:text-md md:mt-2">
                        <div className="flex flex-row text-[rgb(203,84,51)] text-lg">
                            {renderStars(itemRating)}
                        </div>

                        <p>{price ? `$${price}` : "No price"}</p>

                        <p>{formatDate(dateTried)}</p>
                    </div>
                </div>
                <div className="mt-auto">
                    {Array.isArray(tags) && tags.length > 0 ? (
                        tags.map((tag) => (
                            <TagPill key={tag} label={tag} />
                        ))
                    ) : (
                        <p className="text-sm text-stone-400">No tags</p>
                    )}
                </div>



                {toggleNotes &&
                    (<div className="text-sm mt-3">
                        {review || "No notes added."}
                    </div>
                    )}
            </div>
        </div>
    )
}