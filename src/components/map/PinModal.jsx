import photo from "../../assets/auth-hero.jpg";
import TagPill from "../ui/TagPill";
import MapFriendCard from "./MapFriendCard";
import { IoClose } from "react-icons/io5";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";

export default function PinModal({
    isOpen,
    onClose,
    restaurant,
    isFriendView = false,
    onAddEntry,
    onViewDiary,
    currentUserEntryCount = 0,
    selectedFriendId = null,
    onSelectFriend,
}) {
    if (!isOpen || !restaurant) return null;

    const friendCount = restaurant.friends?.length || 0;

    const rawRating = Number(restaurant.averageRating);
    const rating = isNaN(rawRating) ? null : Math.round(rawRating * 10) / 10;

    function renderStars(value) {
        if (value == null) return <p className="text-xs text-[rgb(137,122,114)]">—</p>;

        const stars = [];

        for (let i = 1; i <= 5; i++) {
            if (value >= i) {
                stars.push(<FaStar key={i} className="text-[rgb(203,84,51)]" />);
            } else if (value >= i - 0.5) {
                stars.push(<FaStarHalfAlt key={i} className="text-[rgb(203,84,51)]" />);
            } else {
                stars.push(<FaRegStar key={i} className="text-[rgb(203,84,51)]" />);
            }
        }

        return (
            <div className="flex items-center gap-1">
                {stars}
                <span className="text-xs text-[rgb(137,122,114)] ml-1">
                    {value.toFixed(1)}
                </span>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-end bg-black/40 px-4 py-6">
            <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-[rgb(248,245,242)] shadow-xl">
                <div className="relative h-56 md:h-64 lg:h-56 w-full bg-stone-100">
                    <img src={photo} className="h-full w-full object-cover" />

                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 rounded-full bg-white p-2 shadow hover:cursor-pointer"
                    >
                        <IoClose className="text-stone-700" size={18} />
                    </button>
                </div>

                <div className="px-4 py-3 flex flex-col gap-2">
                    <div className="flex flex-col">
                        <p className="text-md text-stone-800">{restaurant.name}</p>
                        <p className="text-xs text-[rgb(137,122,114)]">
                            {restaurant.address || "No address"}
                        </p>
                    </div>

                    {/* ⭐ UPDATED RATING */}
                    <div className="flex flex-row justify-between items-center">
                        {renderStars(rating)}
                        <p className="text-xs text-[rgb(137,122,114)]">
                            {currentUserEntryCount} entries
                        </p>
                    </div>

                    {restaurant.cuisine && (
                        <div>
                            <TagPill label={restaurant.cuisine} />
                        </div>
                    )}

                    {isFriendView && (
                        <div className="mt-2">
                            <p className="text-xs text-stone-700">Friends who visited</p>
                            <div className="flex flex-col gap-1 mt-1 mb-3">
                                {friendCount > 0 ? (
                                    restaurant.friends.map((friend) => (
                                        <MapFriendCard
                                            key={friend.id}
                                            friend={friend}
                                            isSelected={selectedFriendId === friend.id}
                                            onClick={() => onSelectFriend(friend)}
                                        />
                                    ))
                                ) : (
                                    <p className="text-xs text-[rgb(137,122,114)]">
                                        No friends found.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className={`flex gap-2 ${!isFriendView ? "mt-4" : ""}`}>
                        <button
                            onClick={onAddEntry}
                            className="w-1/2 mb-4 h-10 rounded-lg bg-[rgb(203,84,51)] py-2 text-sm text-white hover:cursor-pointer border border-stone-200"
                        >
                            Add Entry
                        </button>
                        <button
                            onClick={onViewDiary}
                            className="w-1/2 mb-4 h-10 rounded-lg bg-white py-2 text-sm text-stone-800 hover:cursor-pointer border border-stone-200"
                        >
                            View Diary
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}