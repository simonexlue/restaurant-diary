import { MdPeopleOutline } from "react-icons/md"
import { formatTimeAgo } from "../../utils/formatTimeAgo"
import { useEffect, useState } from "react";
import { getProfilePhotoUrl } from "../../services/profile";

export default function SentRequestCard({
    id,
    displayName,
    username,
    sentAt,
    status,
    onCancel,
    actionLoading,
    avatar_url,
    onClick,
}) {
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [, setNow] = useState(Date.now());

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

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(Date.now());
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-white border border-stone-200 rounded-lg flex flex-row px-3 py-3 gap-3 justify-between items-center">
            <button
                type="button"
                onClick={onClick}
                className="flex flex-row gap-3 items-center text-left hover:cursor-pointer"
            >
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-stone-200 bg-white">
                    {avatarUrl ? (
                        <img src={avatarUrl} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <MdPeopleOutline />
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-0 min-w-0">
                    <p className="text-stone-800 truncate">{displayName}</p>
                    <div className="flex flex-row gap-3">
                        <p className="text-[rgb(137,122,114)] text-xs truncate">@{username}</p>
                        <p className="text-[rgb(137,122,114)] text-xs">{formatTimeAgo(sentAt)}</p>
                    </div>
                </div>
            </button>

            <div>
                <div className="flex flex-row text-sm gap-5 mr-5">
                    <p className="bg-[rgb(244,232,215)] px-3 rounded-2xl py-1 text-stone-700">{status}</p>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={actionLoading}
                        className="text-red-500 disabled:opacity-60 disabled:cursor-not-allowed hover:cursor-pointer"
                    >
                        {actionLoading ? "Cancelling..." : "Cancel"}
                    </button>
                </div>
            </div>
        </div>
    )
}