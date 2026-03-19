import { useState } from "react";
import { MdPeopleOutline } from "react-icons/md";

const resultsMock = [
    {
        id: 1,
        displayName: "Liam O'Brien",
        username: "liamob"
    },
    {
        id: 2,
        displayName: "Daniel Lee",
        username: "danl"
    }
];

export default function AddFriendModal({ onClose }) {
    const [search, setSearch] = useState("");

    const filteredResults = resultsMock.filter((user) =>
        user.displayName.toLowerCase().includes(search.toLowerCase()) ||
        user.username.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-[rgb(248,245,242)] p-6 shadow-xl"
            >
                <div className="flex flex-row items-start justify-between">
                    <p className="text-lg text-stone-800">Add Friend</p>
                    <button
                        onClick={onClose}
                        className="hover:cursor-pointer text-stone-600"
                        type="button"
                    >
                        x
                    </button>
                </div>

                <p className="text-[rgb(137,122,114)] text-sm">
                    Search by name or username to send a friend request.
                </p>

                <input
                    type="text"
                    placeholder="Search by name or @username"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full mt-3 mb-4 border border-stone-300 rounded-lg px-3 py-1.5"
                />

                {search.trim() === "" ? (
                    <div className="text-[rgb(137,122,114)] text-sm flex items-center justify-center py-10">
                        Start typing to search for users
                    </div>
                ) : filteredResults.length === 0 ? (
                    <div className="text-[rgb(137,122,114)] text-sm flex items-center justify-center py-10">
                        No user found
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {filteredResults.map((user) => (
                            <div
                                key={user.id}
                                className="border border-stone-300 rounded-lg px-3 py-4 flex flex-row gap-3 items-center justify-between"
                            >
                                <div className="flex flex-row gap-3 items-center">
                                    <div className="bg-orange-200 rounded-4xl p-3">
                                        <MdPeopleOutline />
                                    </div>

                                    <div>
                                        <p className="text-md text-stone-800">
                                            {user.displayName}
                                        </p>
                                        <p className="text-[rgb(137,122,114)] text-xs">
                                            @{user.username}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="px-4 py-2 text-sm text-white border rounded-lg bg-[rgb(203,84,51)]"
                                >
                                    Send
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}