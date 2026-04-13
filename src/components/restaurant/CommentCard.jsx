import { MdPeopleOutline } from "react-icons/md";
import { GoTrash } from "react-icons/go";
import { formatTimeAgo } from "../../utils/formatTimeAgo";
import { getProfilePhotoUrl } from "../../services/profile";
import { useEffect, useState } from "react";

export default function CommentCard({
    displayName,
    createdAt,
    comment,
    avatarUrl,
    onDelete,
}) {
    const [avatarSrc, setAvatarSrc] = useState(null);
    useEffect(() => {
        async function loadAvatar() {
            if (!avatarUrl) {
                setAvatarSrc(null);
                return;
            }

            const signedUrl = await getProfilePhotoUrl(avatarUrl);
            setAvatarSrc(signedUrl);
        }

        loadAvatar();
    }, [avatarUrl]);

    return (
        <div className="flex flex-row gap-3">
            <div className="h-8 w-8 overflow-hidden rounded-full bg-stone-100 shrink-0">
                {avatarSrc ? (
                    <img
                        src={avatarSrc}
                        alt="avatar"
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <MdPeopleOutline />
                    </div>
                )}
            </div>

            <div className="flex flex-col w-full">
                <div className="flex flex-row items-center justify-between gap-4">
                    <div className="flex flex-row items-center gap-2">
                        <p className="text-stone-800 text-sm">{displayName}</p>
                        <p className="relative top-[1px] text-[rgb(137,122,114)] text-xs">
                            {formatTimeAgo(createdAt)}
                        </p>
                    </div>

                    {onDelete && (
                        <button
                            type="button"
                            onClick={onDelete}
                            className="text-red-400 hover:cursor-pointer"
                        >
                            <GoTrash size={14} />
                        </button>
                    )}
                </div>

                <p className="text-[rgb(137,122,114)] text-xs">{comment}</p>
            </div>
        </div>
    );
}