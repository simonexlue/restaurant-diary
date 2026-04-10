import { useEffect, useState } from "react";
import { getProfilePhotoUrl } from "../../services/profile";
import { MdPeopleOutline } from "react-icons/md";
import { searchUsers, sendFriendRequest } from "../../services/friends";
import useDebouncedValue from "../../hooks/useDebouncedValue";

function SearchUserRow({ user, sendingUserId, onSend }) {
    const [avatarUrl, setAvatarUrl] = useState(null);

    useEffect(() => {
        async function loadAvatar() {
            if (!user?.avatar_url) {
                setAvatarUrl(null);
                return;
            }

            const signedUrl = await getProfilePhotoUrl(user.avatar_url);
            setAvatarUrl(signedUrl);
        }

        loadAvatar();
    }, [user?.avatar_url]);

    return (
        <div className="border border-stone-300 rounded-lg px-3 py-4 flex flex-row gap-3 items-center justify-between">
            <div className="flex flex-row gap-3 items-center">
                <div className="h-10 w-10 overflow-hidden rounded-full bg-stone-100">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={user.display_name || user.username || "User"}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <MdPeopleOutline />
                        </div>
                    )}
                </div>

                <div>
                    <p className="text-md text-stone-800">
                        {user.display_name}
                    </p>
                    <p className="text-[rgb(137,122,114)] text-xs">
                        @{user.username}
                    </p>
                </div>
            </div>

            <button
                type="button"
                className="px-4 py-2 text-sm text-white border rounded-lg bg-[rgb(203,84,51)] hover:cursor-pointer"
                disabled={sendingUserId === user.id}
                onClick={() => onSend(user.id)}
            >
                {sendingUserId === user.id ? "Sending..." : "Send"}
            </button>
        </div>
    );
}

export default function AddFriendModal({ onClose, currentUserId, onRequestSent }) {
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search, 300);
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [sendingUserId, setSendingUserId] = useState(null)
    const [successMessage, setSuccessMessage] = useState("")

    useEffect(() => {
        async function runSearch() {
            if (!debouncedSearch.trim()) {
                setResults([]);
                setErrorMessage("");
                setLoading(false)
                return
            }

            try {
                setLoading(true);
                setErrorMessage("")

                const users = await searchUsers(debouncedSearch, currentUserId);
                setResults(users)
            } catch (error) {
                setErrorMessage(error.message || "Failed to search users.")
                setResults([])
            } finally {
                setLoading(false)
            }
        }

        runSearch()
    }, [debouncedSearch, currentUserId])

    async function handleSendRequest(receiverId) {
        try {
            setSendingUserId(receiverId);
            setErrorMessage("");
            setSuccessMessage("");

            await sendFriendRequest(receiverId, currentUserId);

            setSuccessMessage("Friend request sent.");

            if (onRequestSent) {
                await onRequestSent();
            }
        } catch (error) {
            setErrorMessage(error.message || "Failed to send friend request");
        } finally {
            setSendingUserId(null);
        }
    }

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
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setSuccessMessage("");
                    }}
                    className="w-full mt-3 mb-4 border border-stone-300 rounded-lg px-3 py-1.5"
                />

                {successMessage && (
                    <p className="text-green-700 text-sm mb-3">{successMessage}</p>
                )}

                {search.trim() === "" ? (
                    <div className="text-[rgb(137,122,114)] text-sm flex items-center justify-center py-10">
                        Start typing to search for users
                    </div>
                ) : loading ? (
                    <div className="text-[rgb(137,122,114)] text-sm flex items-center justify-center py-10">
                        Searching...
                    </div>
                ) : errorMessage ? (
                    <div className="text-red-500 text-sm flex items-center justify-center py-10">
                        {errorMessage}
                    </div>
                ) : results.length === 0 ? (
                    <div className="text-[rgb(137,122,114)] text-sm flex items-center justify-center py-10">
                        No user found
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {results.map((user) => (
                            <SearchUserRow
                                key={user.id}
                                user={user}
                                sendingUserId={sendingUserId}
                                onSend={handleSendRequest}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}