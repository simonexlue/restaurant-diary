import { MdPeopleOutline } from "react-icons/md"
import { formatTimeAgo } from "../../utils/formatTimeAgo"
import { useState, useEffect } from "react";
import { getProfilePhotoUrl } from "../../services/profile";

export default function FriendsActivity({ name, recentVisit, time, avatar_url }) {
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
        <div className="flex flex-row items-center gap-3">
            <div className="flex flex-row gap-3 items-center">

                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-stone-100">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={name || "Friend"}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <MdPeopleOutline />
                        </div>
                    )}
                </div>
            </div>

            <div>
                <div className="flex flex-row gap-1">
                    <p className="text-stone-800">{name}</p>
                    <p className="text-[rgb(137,122,114)]">visited</p>
                    <p className="text-[rgb(203,84,51)]">{recentVisit}</p>
                </div>
                <p className="text-[rgb(137,122,114)] text-sm">{formatTimeAgo(time)}</p>
            </div>
        </div>

    )
}