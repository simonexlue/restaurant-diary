import { useEffect, useState } from "react";
import { IoMdClose } from "react-icons/io";
import FriendProfileCard from "./FriendProfileCard";

const friendsDummy = [
    { displayName: "Sydney Chu", userName: "sydknee" }, //Avatar URL to be included
    { displayName: "Jodi Tabuchi", userName: "jtabuchi" }, //Avatar URL to be included
    { displayName: "Jane Doe", userName: "jdoe123" }, //Avatar URL to be included
]

export default function FriendsModal({
    onClose,
}) {
    const [searchFriend, setSearchFriend] = useState("")
    const [filteredFriends, setFilteredFriends] = useState([])

    useEffect(() => {
        const filteredList = friendsDummy.filter((friend) => (friend.displayName.toLowerCase().includes(searchFriend.toLowerCase())) || (friend.userName).toLowerCase().includes(searchFriend.toLowerCase()))
        setFilteredFriends(filteredList)
    }, [searchFriend])

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

                {filteredFriends.map((friend) => (
                    <div>
                        <FriendProfileCard displayName={friend.displayName} username={friend.userName} />
                    </div>
                ))}
            </div>
        </div>
    )
}