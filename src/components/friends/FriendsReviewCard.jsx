import photo from "../../assets/auth-hero.jpg"
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";
import { formatDate } from "../../utils/date";
import { useNavigate } from "react-router-dom";
import { getProfilePhotoUrl } from "../../services/profile";
import { useState, useEffect } from "react";
import { MdPeopleOutline } from "react-icons/md";

export default function FriendsReviewCard({
    id,
    friendId,
    restaurantId,
    displayName,
    userName,
    userAvatar,
    date,
    restaurantName,
    location,
    rating,
    dishCount,
    photoUrl,
}) {
    const navigate = useNavigate()
    const [avatarUrl, setAvatarUrl] = useState(null);

    useEffect(() => {
        async function loadAvatar() {
            if (!userAvatar) {
                setAvatarUrl(null);
                return;
            }

            const signedUrl = await getProfilePhotoUrl(userAvatar);
            setAvatarUrl(signedUrl);
        }

        loadAvatar();
    }, [userAvatar]);

    function renderStars(rating = 0) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return (
            <>
                {Array.from({ length: fullStars }).map((_, index) => (
                    <FaStar key={`full-${index}`} />
                ))}
                {hasHalfStar && <FaStarHalfAlt key="half" />}
                {Array.from({ length: emptyStars }).map((_, index) => (
                    <FaRegStar key={`empty-${index}`} />
                ))}
            </>
        );
    }

    return (
        <div className="border border-stone-200 bg-white rounded-lg overflow-hidden grid grid-cols-1 md:grid-cols-[18rem_minmax(0,1fr)] md:gap-3 shadow-sm">

            {/* Image */}
            <div className="relative h-56 md:h-full min-h-40 overflow-hidden bg-stone-100">
                <img
                    src={photoUrl || photo}
                    className="absolute inset-0 h-full w-full object-cover"
                />
            </div>

            {/* Content */}
            <div className="py-3 px-4 flex flex-col gap-2 md:py-5">

                {/* User row */}
                <div className="flex flex-row gap-2 items-center">
                    <div className="h-6 w-6 overflow-hidden rounded-full">
                        {avatarUrl ? (
                            <img src={avatarUrl} className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center">
                                <MdPeopleOutline />
                            </div>
                        )}
                    </div>
                    <p className="text-sm font-medium text-stone-800">{displayName}</p>
                    <p className="text-[rgb(137,122,114)] text-xs ml-2">{formatDate(date)}</p>
                </div>

                {/* Restaurant info */}
                <div className="flex flex-col gap-2">
                    <p className="text-stone-800 text-lg">{restaurantName}</p>
                    <p className="text-[rgb(137,122,114)] text-xs">{location}</p>

                    <div className="flex flex-row items-center gap-1 text-[rgb(203,84,51)] text-sm">
                        {rating !== null ? renderStars(rating) : null}
                        <p>{rating ?? "—"}</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex flex-row justify-between items-end mt-auto">
                    <p className="text-[rgb(137,122,114)] text-xs">
                        {dishCount} {dishCount === 1 ? "dish reviewed" : "dishes reviewed"}
                    </p>
                    <button
                        type="button"
                        className="px-4 py-1 text-sm text-white border rounded-lg bg-[rgb(203,84,51)] hover:cursor-pointer"
                        onClick={() =>
                            navigate(`/friends/${friendId}/restaurants/${restaurantId}`, {
                                state: {
                                    friendName: displayName,
                                },
                            })
                        }
                    >
                        View
                    </button>
                </div>
            </div>
        </div>
    )
}