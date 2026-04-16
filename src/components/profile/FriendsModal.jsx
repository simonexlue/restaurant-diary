import { useEffect, useState } from "react";
import { IoMdClose } from "react-icons/io";
import FriendProfileCard from "./FriendProfileCard";
import { useNavigate } from "react-router-dom";
import { getProfileFriendsList, removeFriend } from "../../services/friends";

export default function FriendsModal({
    onClose,
    viewedUserId,
    isOwnProfile,
    currentUserId,
}) {
    const navigate = useNavigate();
    const [searchFriend, setSearchFriend] = useState("")
    const [filteredFriends, setFilteredFriends] = useState([])
    const [friends, setFriends] = useState([])
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState("")
    const [removingFriendId, setRemovingFriendId] = useState(null)


    useEffect(() => {
        async function loadFriends() {
            if (!viewedUserId) return;

            try {
                setLoading(true)
                setErrorMessage("")

                const data = await getProfileFriendsList(viewedUserId)
                setFriends(data || [])
                setFilteredFriends(data || [])
            } catch (error) {
                setErrorMessage(error.message || "Failed to load friends");
            } finally {
                setLoading(false)
            }
        }

        loadFriends()
    }, [viewedUserId])

    useEffect(() => {
        const search = searchFriend.trim().toLowerCase()
        if (!search) {
            setFilteredFriends(friends)
            return
        }

        const filteredList = friends.filter((friend) =>
            (friend.displayName?.toLowerCase() || "").includes(search) ||
            (friend.username?.toLowerCase() || "").includes(search)
        )

        setFilteredFriends(filteredList)
    }, [searchFriend, friends])

    async function handleRemoveFriend(friendId) {
        if (!currentUserId || !friendId) return;

        try {
            setRemovingFriendId(friendId)
            setErrorMessage("")

            await removeFriend(currentUserId, friendId)
            const updatedFriends = friends.filter((friend) => friend.id !== friendId)
            setFriends(updatedFriends)
            setFilteredFriends(updatedFriends)
        } catch (error) {
            setErrorMessage(error.message || "Failed to remove friend.")
        } finally {
            setRemovingFriendId(null)
        }
    }

    function handleFriendClick(friendId) {
        if (!friendId) return;

        onClose();

        if (friendId === currentUserId) {
            navigate("/profile");
        } else {
            navigate(`/profile/${friendId}`);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6 py-6">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl p-6 shadow-xl bg-white">
                <div className="relative flex flex-row items-center justify-center">
                    <h1 className="font-medium">
                        Friends
                    </h1>
                    <button className="absolute right-4 hover:cursor-pointer" onClick={onClose}>
                        <IoMdClose size={20} />
                    </button>
                </div>

                <div className="border-t border-stone-200 my-3" />

                <input
                    type="text"
                    value={searchFriend}
                    onChange={(e) => setSearchFriend(e.target.value)}
                    placeholder="Search"
                    className="border border-stone-200 rounded-lg w-full px-3 py-1 bg-[rgb(248,245,242)] text-sm focus:outline-[rgb(203,84,51)]"
                />

                {loading && (
                    <p className="mt-4 text-sm text-[rgb(137,122,114)]">
                        Loading friends...
                    </p>
                )}

                {!loading && errorMessage && (
                    <p className="mt-4 text-sm text-red-500">
                        {errorMessage}
                    </p>
                )}

                {!loading && !errorMessage && filteredFriends.length === 0 && (
                    <p className="mt-4 text-sm text-[rgb(137,122,114)]">
                        No friends found.
                    </p>
                )}

                {!loading && !errorMessage && filteredFriends.map((friend) => (
                    <div key={friend.id}>
                        <FriendProfileCard
                            displayName={friend.display_name}
                            username={friend.username}
                            avatar_url={friend.avatar_url}
                            showRemoveButton={isOwnProfile}
                            onRemove={() => handleRemoveFriend(friend.id)}
                            removeLoading={removingFriendId === friend.id}
                            onClick={() => handleFriendClick(friend.id)}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}