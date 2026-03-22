import { MdPeopleOutline } from "react-icons/md";

export default function MapFriendCard({ friend, isSelected = false, onClick }) {
    return (
        <div
            onClick={onClick}
            className={`flex flex-row gap-3 items-center hover:bg-[rgb(245,232,214)] rounded-lg px-2 py-2 ${isSelected ? "bg-[rgb(245,232,214)]" : ""} ${onClick ? "cursor-pointer" : ""}`}
        >
            <div className="bg-white rounded-4xl p-3 border border-stone-200">
                <MdPeopleOutline />
            </div>

            <div className="flex flex-col gap-0">
                <p className="text-stone-800 text-sm">
                    {friend?.display_name || friend?.username || "Friend"}
                </p>
                <p className="text-[rgb(137,122,114)] text-xs">
                    {friend?.entryCount || 0} entries
                </p>
            </div>
        </div>
    );
}