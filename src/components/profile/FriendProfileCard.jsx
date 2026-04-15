import { MdPeopleOutline } from "react-icons/md"

export default function FriendProfileCard({ displayName, username, avatar_url }) {
    return (
        <div className="relative w-full rounded-lg bg-white py-3 flex flex-row items-center gap-3 hover:cursor-pointer ">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-stone-200 bg-white">
                {avatar_url ? (
                    <img src={avatar_url} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <MdPeopleOutline />
                    </div>
                )}
            </div>

            {(displayName || username) && (
                <div className="flex flex-col">
                    {displayName && <p className="text-stone-800 font-medium hover:cursor-pointer">{displayName}</p>}
                    {username && <p className="text-[rgb(137,122,114)] text-sm hover:cursor-pointer">{username}</p>}
                </div>
            )}

            <button
                className="absolute right-4 px-3 rounded-lg bg-[rgb(244,232,215)] text-stone-800 text-sm py-1 hover:cursor-pointer hover:bg-[rgb(235,220,200)]"
            >
                Remove
            </button>

        </div>
    )
}