import { MdPeopleOutline } from "react-icons/md"
import { IoLocationOutline } from "react-icons/io5"

export default function FriendsCard({
    id,
    displayName,
    username,
    entryCount,
    mutualCount,
    recentRestaurant,
    recentTime,
    avatarUrl,
}) {
    return (
        <div className="w-full border border-stone-200 rounded-lg shadow-xs bg-white px-4 py-3 flex flex-row items-start gap-3">
            {/* Profile pic placeholder */}
            <div className="bg-white rounded-4xl p-3 border border-stone-200">
                <MdPeopleOutline />
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
                    <p className="text-xs text-[rgb(137,122,114)]">{mutualCount} mutuals</p>
                </div>

                {/* Recent Activity */}
                <div className="bg-[rgb(244,232,215)] rounded-lg px-2 py-1 flex flex-row gap-1 items-center">
                    <IoLocationOutline className="text-xs text-[rgb(203,84,51)]" />
                    <p className="text-xs text-stone-700">{recentRestaurant}</p>
                    <p className="text-xs text-stone-500">- {recentTime}</p>
                </div>
            </div>
        </div>
    )
}