import { MdPeopleOutline } from "react-icons/md"

export default function SentRequestCard({
    id,
    displayName,
    username,
    sentAt,
    status,
}) {
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
                        <p className="text-[rgb(137,122,114)] text-xs">{sentAt}</p>
                    </div>
                </div>
            </div>

            <div>
                <div className="flex flex-row text-sm gap-5 mr-5">
                    <p className="bg-[rgb(244,232,215)] px-3 rounded-2xl py-1 text-stone-700">{status}</p>
                    <button className="text-red-500">Cancel</button>
                </div>
            </div>
        </div>
    )
}