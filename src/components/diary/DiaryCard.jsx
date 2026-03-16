import { useEffect, useState } from "react";
import fallbackPhoto from "../../assets/auth-hero.jpg";
import { getDishPhotoUrl } from "../../services/diary";

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

    return (
        <div className="h-full flex flex-col overflow-hidden rounded-lg border border-stone-200 bg-white">
            <div className="h-56 w-full bg-stone-100">
                <img
                    src={imageUrl || fallbackPhoto}
                    alt={name}
                    className="h-full w-full object-cover"
                />
            </div>

            <div className="px-3 py-3 flex flex-col gap-1">
                <div className="flex flex-row justify-between items-center">
                    <p className="text-xs text-[rgb(137,122,114)]">
                        Rating:{" "}
                        {averageRating !== null && averageRating !== undefined
                            ? averageRating.toFixed(1)
                            : "No ratings yet"}
                    </p>

                    <p className="text-xs text-[rgb(137,122,114)]">
                        {formatLastVisited(lastVisited)}
                    </p>
                </div>

                <p className="text-base font-medium text-stone-800">{name}</p>
                <p className="text-sm text-[rgb(137,122,114)]">{address}</p>

                {topTag && (
                    <div className="mt-1 flex flex-wrap gap-1">
                        <span className="text-xs rounded-full bg-stone-100 px-2 py-1 text-[rgb(203,84,51)] capitalize">
                            {topTag}
                        </span>
                    </div>
                )}

                <p className="text-xs text-[rgb(137,122,114)] mt-1">
                    {entryCount} {entryCount === 1 ? "entry" : "entries"}
                </p>
            </div>
        </div>
    );
}