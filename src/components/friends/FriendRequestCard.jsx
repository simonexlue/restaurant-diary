import { MdPeopleOutline } from "react-icons/md"

export default function FriendRequestCard({
    id,
    displayName,
    username,
    mutualCount,
    requestedAt,
}) {

    function formatTimeAgo(dateString) {
        if (!dateString) {
            return ""
        }

        const now = new Date()
        const past = new Date(dateString);
        const diffInMs = now - past

        const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

        if (diffInMinutes < 60) {
            return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
        }

        if (diffInHours < 24) {
            return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
        }

        return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
    }

    return (
        <div className="flex flex-row items-center gap-3 bg-white rounded-lg py-2 shadow-sm justify-between px-5">
            <div className="flex flex-row gap-3 items-center">
                {/* Profile pic placeholder */}
                <div className="bg-white rounded-4xl p-3">
                    <MdPeopleOutline />
                </div>

                <div >
                    <p className="text-stone-800">{displayName}</p>
                    <p className="text-[rgb(137,122,114)] text-sm">
                        {mutualCount} mutual friends | {formatTimeAgo(requestedAt)}
                    </p>
                </div>
            </div>

            <div className="flex flex-row gap-3" >
                <button className="px-4 py-2 text-sm text-white border rounded-lg bg-[rgb(203,84,51)]">+</button>
                <button className="px-4 py-2 text-sm text-stone-800 border border-stone-300 rounded-lg bg-[rgb(248,245,242)]">-</button>
            </div>
        </div>
    )
}