import { useEffect, useState } from "react";
import fallbackPhoto from "../../assets/auth-hero.jpg";
import { getDishPhotoUrl } from "../../services/diary";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";
import { RiBookOpenLine } from "react-icons/ri";

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

export default function DiaryCard({
    id,
    name,
    address,
    entryCount,
    lastVisited,
    averageRating,
    topTag,
    recentPhoto,
}) {
    const [imageUrl, setImageUrl] = useState(null);

    function renderStars(rating) {
        if (rating === null || rating === undefined) {
            return <span className="text-xs text-[rgb(137,122,114)]">No ratings yet</span>
        }

        const stars = []

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
            <div className="flex gap-1 text-[rgb(203,84,51)]">
                {stars}
            </div>
        );
    }

    useEffect(() => {
        let isMounted = true;

        async function loadImage() {
            if (!recentPhoto) {
                if (isMounted) {
                    setImageUrl(null);
                }
                return;
            }

            const signedUrl = await getDishPhotoUrl(recentPhoto);

            if (isMounted) {
                setImageUrl(signedUrl);
            }
        }

        loadImage();

        return () => {
            isMounted = false;
        };
    }, [recentPhoto]);

    function formatAddress(address) {
        if (!address) return "";
        const parts = address.split(",")

        if (parts.length >= 2) {
            return `${parts[0].trim()}, ${parts[1].trim()}`;
        }

        return address
    }

    return (
        <div className="h-full flex flex-col overflow-hidden rounded-lg border border-stone-200 bg-white">
            <div className="h-60 w-full bg-stone-100">
                <img
                    src={imageUrl || fallbackPhoto}
                    alt={name}
                    className="h-full w-full object-cover"
                />
            </div>

            <div className="px-3 py-3 flex flex-col gap-1">
                <div className="flex flex-row justify-between items-center">
                    <p className="text-xs text-[rgb(137,122,114)]">
                        {renderStars(averageRating)}
                    </p>

                    <p className="text-xs text-[rgb(137,122,114)]">
                        {formatLastVisited(lastVisited)}
                    </p>
                </div>

                <p className="text-base font-medium text-stone-800">{name}</p>
                <p className="text-sm text-[rgb(137,122,114)]">{formatAddress(address)}</p>

                <div className="flex flex-row justify-between items-center">
                    <div className="flex flex-row items-center gap-1">
                        <RiBookOpenLine className="text-xs text-[rgb(137,122,114)]" />
                        <p className="text-xs text-[rgb(137,122,114)]">
                            {entryCount} {entryCount === 1 ? "entry" : "entries"}
                        </p>
                    </div>


                    {topTag && (
                        <div className="mt-1 flex flex-wrap gap-1">
                            <span className="text-xs rounded-full bg-stone-100 px-2 py-1 text-[rgb(203,84,51)] capitalize">
                                {topTag}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}