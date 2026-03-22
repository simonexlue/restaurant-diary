import placeholder from "../../assets/auth-hero.jpg"
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";
import TagPill from "../ui/TagPill";
import { useState } from "react";
import { LuChevronUp, LuChevronDown } from "react-icons/lu";
import { HiOutlinePencil } from "react-icons/hi2";
import { GoTrash } from "react-icons/go";

export default function DishCard({
    dishName,
    itemRating,
    price,
    dateTried,
    review,
    tags = [],
    photoUrl,
    isOpen,
    onToggle,
    onEdit,
    onDelete,
}) {
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
        <div className="border border-stone-300 bg-white rounded-lg overflow-hidden grid grid-cols-1 md:grid-cols-[18rem_minmax(0,1fr)] md:gap-3 shadow-sm">
            <div className="relative h-50 md:h-full min-h-40 overflow-hidden">
                <img
                    src={photoUrl || placeholder}
                    alt={dishName || "Dish photo"}
                    className="absolute inset-0 h-full w-full object-cover"
                />
            </div>

            <div className="bg-white px-3 py-4 w-full flex flex-col md:py-6">
                <div className="flex flex-col">
                    <div className="flex flex-row justify-between items-start">
                        <p className="text-stone-800 md:text-xl">{dishName}</p>
                        <div className="flex items-center gap-1 mr-3">
                            {onEdit && (
                                <button
                                    type="button"
                                    className="text-md px-2 py-1 text-green-700 hover:cursor-pointer"
                                    onClick={onEdit}
                                >
                                    <HiOutlinePencil />
                                </button>
                            )}

                            {onDelete && (
                                <button
                                    type="button"
                                    className="text-md px-2 py-1 text-red-400 hover:cursor-pointer"
                                    onClick={onDelete}
                                >
                                    <GoTrash />
                                </button>
                            )}

                            <button
                                type="button"
                                className="text-lg hover:cursor-pointer text-stone-800"
                                onClick={onToggle}
                            >
                                {isOpen ? <LuChevronUp /> : <LuChevronDown />}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-row gap-3 text-sm text-[rgb(137,122,114)] items-center mt-2 md:text-md md:mt-2">
                        <div className="flex flex-row text-[rgb(203,84,51)] text-lg">
                            {renderStars(itemRating)}
                        </div>

                        <p>{price ? `$${price}` : "No price"}</p>
                        <p>{formatDate(dateTried)}</p>
                    </div>
                </div>

                <div className="mt-3">
                    {Array.isArray(tags) && tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag) => (
                                <TagPill key={tag} label={tag} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-stone-400">No tags</p>
                    )}
                </div>

                {isOpen && (
                    <div className="text-sm mt-3">
                        {review || "No notes added."}
                    </div>
                )}
            </div>
        </div>
    );
}