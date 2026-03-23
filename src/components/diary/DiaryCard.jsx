import { GoTrash } from "react-icons/go";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";
import { RiBookOpenLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";

function formatLastVisited(dateString) {
    if (!dateString) return "No visits yet";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString("en-CA", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function formatAddress(address) {
    if (!address) return "";

    const parts = address.split(",");

    if (parts.length >= 2) {
        return `${parts[0].trim()}, ${parts[1].trim()}`;
    }

    return address;
}

function renderStars(rating) {
    if (rating === null || rating === undefined) {
        return (
            <span className="text-xs text-[rgb(137,122,114)]">
                No ratings yet
            </span>
        );
    }

    const stars = [];

    for (let i = 1; i <= 5; i++) {
        if (rating >= i) {
            stars.push(<FaStar key={i} />);
        } else if (rating >= i - 0.5) {
            stars.push(<FaStarHalfAlt key={i} />);
        } else {
            stars.push(<FaRegStar key={i} />);
        }
    }

    return (
        <div className="flex items-center gap-1 text-[rgb(203,84,51)] text-sm">
            {stars}
        </div>
    );
}

export default function DiaryCard({
    id,
    name,
    address,
    entryCount,
    lastVisited,
    averageRating,
    topTag,
    imageUrl,
    onDelete,
    isDeleting,
}) {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate(`/restaurant/${id}`)}
            className="h-full flex flex-col overflow-hidden rounded-lg border border-stone-200 bg-white hover:cursor-pointer hover:border-[rgb(203,84,51)]"
        >
            {/* IMAGE + DELETE BUTTON */}
            <div className="relative h-56 md:h-64 lg:h-56 w-full bg-stone-100">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-stone-400">
                        No photo yet
                    </div>
                )}

                {/* DELETE BUTTON */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.();
                    }}
                    disabled={isDeleting}
                    className="absolute top-2 right-2 rounded-full bg-white/90 p-2 shadow hover:bg-red-50"
                >
                    <GoTrash className="text-red-600" size={16} />
                </button>
            </div>

            <div className="flex flex-1 flex-col px-3 py-3 gap-1">
                <div className="flex flex-row justify-between items-center">
                    {renderStars(averageRating)}

                    <p className="text-xs text-[rgb(137,122,114)]">
                        {formatLastVisited(lastVisited)}
                    </p>
                </div>

                <p className="text-base font-medium text-stone-800">{name}</p>

                <p className="text-sm text-[rgb(137,122,114)]">
                    {formatAddress(address)}
                </p>

                <div className="mt-auto flex flex-row items-end justify-between pt-2">
                    <div className="flex flex-row items-center gap-1">
                        <RiBookOpenLine className="text-xs text-[rgb(137,122,114)]" />
                        <p className="text-xs text-[rgb(137,122,114)]">
                            {entryCount} {entryCount === 1 ? "entry" : "entries"}
                        </p>
                    </div>

                    <div className="min-h-[28px] flex items-end">
                        {topTag && (
                            <span className="text-xs rounded-full bg-stone-100 px-2 py-1 text-[rgb(203,84,51)] capitalize">
                                {topTag}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}