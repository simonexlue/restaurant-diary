import { MdPeopleOutline } from "react-icons/md";
import { useEffect, useState } from "react";
import { getProfilePhotoUrl } from "../../services/profile";

export default function MapFriendCard({ friend, isSelected = false, onClick }) {
    const [avatarUrl, setAvatarUrl] = useState(null);

    useEffect(() => {
        async function loadAvatar() {
            if (!friend?.avatar_url) {
                setAvatarUrl(null)
                return;
            }

            const signedUrl = await getProfilePhotoUrl(friend.avatar_url)
            setAvatarUrl(signedUrl)
        }

        loadAvatar();
    }, [friend?.avatar_url])

    return (
        <div
            onClick={onClick}
            className={`flex flex-row gap-3 items-center hover:bg-[rgb(245,232,214)] rounded-lg px-2 py-2 ${isSelected ? "bg-[rgb(245,232,214)]" : ""} ${onClick ? "cursor-pointer" : ""}`}
        >
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-stone-200 bg-white">
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt={friend?.display_name || friend?.username || "Friend"}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <MdPeopleOutline />
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-0">
                <p className="text-stone-800 text-sm">
                    {friend?.display_name || friend?.username || "Friend"}
                </p>
                <p className="text-[rgb(137,122,114)] text-xs">
                    {friend?.entryCount || 0} entries
                </p>
            </div>
        </div>
    );
}