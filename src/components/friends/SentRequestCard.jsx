import { MdPeopleOutline } from "react-icons/md"

export default function SentRequestCard({
    id,
    displayName,
    username,
    sentAt,
    status,
    onCancel,
    actionLoading,
}) {

    function formatTimeAgo(dateString) {
        if (!dateString) return "";

        const now = new Date();
        const past = new Date(dateString);
        const diffInMs = now - past;

        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInMinutes < 60) {
            return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
        }

        if (diffInHours < 24) {
            return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
        }

        return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
    }

    return (
        <div className="bg-white border border-stone-200 rounded-lg flex flex-row px-3 py-3 gap-3 justify-between items-center">
            <div className="flex flex-row gap-3 items-center">
                {/* Profile pic placeholder */}
                <div className="bg-white rounded-4xl p-3 border border-stone-200">
                    <MdPeopleOutline />
                </div>

                <div className="flex flex-col gap-0">
                    <p className="text-stone-800">{displayName}</p>
                    <div className="flex flex-row gap-3">
                        <p className="text-[rgb(137,122,114)] text-xs">@{username}</p>
                        <p className="text-[rgb(137,122,114)] text-xs">{formatTimeAgo(sentAt)}</p>
                    </div>
                </div>
            </div>

            <div>
                <div className="flex flex-row text-sm gap-5 mr-5">
                    <p className="bg-[rgb(244,232,215)] px-3 rounded-2xl py-1 text-stone-700">{status}</p>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={actionLoading}
                        className="text-red-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {actionLoading ? "Cancelling..." : "Cancel"}
                    </button>
                </div>
            </div>
        </div>
    )
}