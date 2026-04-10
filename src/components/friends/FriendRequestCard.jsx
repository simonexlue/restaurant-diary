import { MdPeopleOutline } from "react-icons/md"
import { useEffect, useState } from "react";
import { getProfilePhotoUrl } from "../../services/profile";
import { formatTimeAgo } from "../../utils/formatTimeAgo";

export default function FriendRequestCard({
    id,
    displayName,
    username,
    mutualCount,
    requestedAt,
    onAccept,
    onDecline,
    actionLoading,
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
        <div className="flex flex-row items-center gap-3 bg-white rounded-lg py-2 shadow-sm justify-between px-5">
            <div className="flex flex-row gap-3 items-center">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-stone-200 bg-white">
                    {avatarUrl ? (
                        <img src={avatarUrl} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <MdPeopleOutline />
                        </div>
                    )}
                </div>

                <div >
                    <p className="text-stone-800">{displayName}</p>
                    <p className="text-[rgb(137,122,114)] text-sm">
                        {mutualCount} mutual friends | {formatTimeAgo(requestedAt)}
                    </p>
                </div>
            </div>

            <div className="flex flex-row gap-3" >
                <button
                    className="px-4 py-2 text-sm text-white border rounded-lg bg-[rgb(203,84,51)] hover:cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    type="button"
                    onClick={onAccept}
                    disabled={actionLoading}
                >
                    +
                </button>
                <button
                    className="px-4 py-2 text-sm text-stone-800 border border-stone-300 rounded-lg bg-[rgb(248,245,242)] hover:cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    type="button"
                    onClick={onDecline}
                    disabled={actionLoading}
                >
                    -
                </button>
            </div>
        </div>
    )
}