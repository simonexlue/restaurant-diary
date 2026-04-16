import { MdPeopleOutline } from "react-icons/md"
import { useEffect, useState } from "react"
import { getProfilePhotoUrl } from "../../services/profile"

export default function FriendProfileCard({
    displayName,
    username,
    avatar_url,
    showRemoveButton = false,
    onRemove,
    removeLoading = false,
    onClick,
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
        <div className="relative w-full rounded-lg bg-white py-3 flex flex-row items-center gap-3">
            <button
                type="button"
                onClick={onClick}
                className="flex flex-1 min-w-0 items-center gap-3 text-left hover:cursor-pointer"
            >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-stone-200 bg-white">
                    {avatarUrl ? (
                        <img src={avatarUrl} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <MdPeopleOutline />
                        </div>
                    )}
                </div>

                {(displayName || username) && (
                    <div className="flex min-w-0 flex-col">
                        {displayName && (
                            <p className="truncate text-stone-800 font-medium">
                                {displayName}
                            </p>
                        )}
                        {username && (
                            <p className="truncate text-[rgb(137,122,114)] text-sm">
                                {username}
                            </p>
                        )}
                    </div>
                )}
            </button>

            {showRemoveButton && (
                <button
                    type="button"
                    onClick={onRemove}
                    disabled={removeLoading}
                    className="absolute right-4 px-3 rounded-lg bg-[rgb(244,232,215)] text-stone-800 text-sm py-1 hover:cursor-pointer hover:bg-[rgb(235,220,200)] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {removeLoading ? "Removing..." : "Remove"}
                </button>
            )}
        </div>
    )
}