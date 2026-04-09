import { FaStar } from "react-icons/fa";
import { IoLocationOutline } from "react-icons/io5";
import { FiArrowRight } from "react-icons/fi";
import { formatTimeAgo } from "../../utils/formatTimeAgo"
import { formatLocation } from "../../utils/formatLocation";
import { IoMdTime } from "react-icons/io";

export default function RecentEntryCard(
    { restaurantName,
        dishName,
        rating,
        tags = [],
        createdAt,
        review,
        location,
        photoUrl,
        isLast,
    }
) {
    const primaryTag = tags?.[0];
    const timeAgo = formatTimeAgo(createdAt);

    return (
        <div className="w-[95%]">
            <div className="flex flex-row gap-4 px-3 py-4 hover:cursor-pointer hover:rounded-lg hover:bg-[rgb(248,245,242)]">
                {photoUrl ? (
                    <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0">
                        <img
                            src={photoUrl}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ) : (
                    <div className="w-24 h-24 rounded-lg shrink-0 bg-stone-100" />
                )}

                <div className="flex flex-col gap-2 flex-1 min-w-0">
                    <div className="flex flex-row gap-4 items-center">
                        {primaryTag && (
                            <p className="bg-[rgb(244,232,215)] rounded-lg text-xs text-stone-800 px-2 py-1">
                                {primaryTag}
                            </p>
                        )}

                        {rating !== null && rating !== undefined && (
                            <div className="flex items-center gap-1">
                                <FaStar className="text-[rgb(203,84,51)]" />
                                <p className="text-xs text-[rgb(137,122,114)]">{rating}</p>
                            </div>
                        )}

                        <div className="flex flex-row items-center gap-1">
                            <IoMdTime className="text-[rgb(137,122,114)]" />
                            <p className="text-xs text-[rgb(137,122,114)]">{timeAgo}</p>
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <div className="flex flex-row justify-between">
                            <p className="text-lg text-stone-800">{restaurantName}</p>
                            <FiArrowRight className="text-[rgb(137,122,114)] shrink-0" />
                        </div>

                        <p className="text-sm text-stone-800">{dishName}</p>

                        <div className="flex flex-col gap-2 mt-2">
                            {review && (
                                <p className="text-sm text-[rgb(137,122,114)] line-clamp-2">
                                    {review}
                                </p>
                            )}

                            <div className="flex flex-row gap-1 items-center">
                                <IoLocationOutline className="text-[rgb(137,122,114)]" />
                                <p className="text-sm text-[rgb(137,122,114)]">
                                    {formatLocation(location)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {!isLast && <div className="mx-3 border-b border-stone-200" />}
        </div>
    );
}