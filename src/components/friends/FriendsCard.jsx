import { MdPeopleOutline } from "react-icons/md"
import { IoLocationOutline } from "react-icons/io5"
import { formatDate } from "../../utils/date"
import { useEffect, useState } from "react";
import { getProfilePhotoUrl } from "../../services/profile";

export default function FriendsCard({
    id,
    displayName,
    username,
    entryCount,
    mutualCount,
    recentRestaurant,
    recentTime,
    avatar_url,
}) {
    const [avatarUrl, setAvatarUrl] = useState(null);

    useEffect(() => {
        async function loadAvatar() {
            if (!avatar_url) {
                setAvatarUrl(null);
                return;
            }

            const signedUrl = await getProfilePhotoUrl(avatar_url);
            setAvatarUrl(signedUrl);
        }

        loadAvatar();
    }, [avatar_url]);

    return (
        <div className="w-full border border-stone-200 rounded-lg shadow-xs bg-white px-4 py-3 flex flex-row items-start gap-3">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-stone-200 bg-white">
                {avatarUrl ? (
                    <img src={avatarUrl} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <MdPeopleOutline />
                    </div>
                )}
            </div>

            {/* Name and username */}
            <div className="flex flex-col flex-1 gap-2">
                <div className="flex flex-col gap-0">
                    <p className="text-stone-800">{displayName}</p>
                    <p className="text-[rgb(137,122,114)] text-xs">@{username}</p>
                </div>

                {/* Metadata */}
                <div className="flex flex-row gap-3">
                    <p className="text-xs text-[rgb(137,122,114)]">{entryCount} entries</p>
                    {/* <p className="text-xs text-[rgb(137,122,114)]">{mutualCount} mutuals</p>  Not in this MVP */}
                </div>

                {/* Recent Activity */}
                {recentRestaurant !== null && recentRestaurant !== "" &&
                    <div className="bg-[rgb(244,232,215)] rounded-lg px-2 py-1 flex flex-row gap-1 items-center">
                        <IoLocationOutline className="text-xs text-[rgb(203,84,51)]" />
                        <p className="text-xs text-stone-700">{recentRestaurant}</p>
                        {recentTime !== null && recentTime !== "" && <p className="text-xs text-stone-500">- {formatDate(recentTime)}</p>}

                    </div>}

            </div>
        </div>
    )
}