import FriendsCard from "../components/friends/FriendsCard";
import { MdPeopleOutline } from "react-icons/md";
import FriendsReviewCard from "../components/friends/FriendsReviewCard";
import SentRequestCard from "../components/friends/SentRequestCard";
import { useState, useEffect } from "react";
import FriendRequestCard from "../components/friends/FriendRequestCard";
import AddFriendModal from "../components/friends/AddFriendModal";
import { IoPaperPlaneOutline } from "react-icons/io5";
import { IoBookOutline } from "react-icons/io5";
import useUserProfile from "../hooks/useUserProfile";
import { getIncomingFriendRequests, acceptFriendRequest, declineFriendRequest, getSentFriendRequests, cancelFriendRequest } from "../services/friends";

const friendsMock = [
    {
        id: 1,
        displayName: "Sarah Mitchell",
        username: "sarahm",
        entryCount: 67,
        mutualCount: 3,
        recentRestaurant: "Din Tai Fung",
        recentTime: "5h ago",
        avatarUrl: null
    },
    {
        id: 2,
        displayName: "Alex Chen",
        username: "alexc",
        entryCount: 42,
        mutualCount: 5,
        recentRestaurant: "Kinton Ramen",
        recentTime: "1d ago",
        avatarUrl: null
    },
    {
        id: 3,
        displayName: "Emily Carter",
        username: "emilyc",
        entryCount: 89,
        mutualCount: 2,
        recentRestaurant: "Nobu Downtown",
        recentTime: "2d ago",
        avatarUrl: null
    }
];

const feedMock = [
    {
        id: 1,
        displayName: "Sarah Mitchell",
        userAvatar: null,
        date: "2025-03-15",
        restaurantName: "Nobu Downtown",
        location: "New York, USA",
        rating: 4.5,
        dishCount: 4,
        photoUrl: null
    },
    {
        id: 2,
        displayName: "Alex Chen",
        userAvatar: null,
        date: "2025-03-14",
        restaurantName: "Kinton Ramen",
        location: "Toronto, Canada",
        rating: 4,
        dishCount: 2,
        photoUrl: null
    },
    {
        id: 3,
        displayName: "Emily Carter",
        userAvatar: null,
        date: "2025-03-12",
        restaurantName: "Din Tai Fung",
        location: "Vancouver, Canada",
        rating: 5,
        dishCount: 3,
        photoUrl: null
    }
];

export default function Friends() {
    const { profile, loading, errorMessage } = useUserProfile();
    const [activeTab, setActiveTab] = useState("friends");
    const [showAddFriendModal, setShowAddFriendModal] = useState(false);

    const [incomingRequests, setIncomingRequests] = useState([])
    const [requestLoading, setRequestLoading] = useState(false)
    const [requestsError, setRequestsError] = useState("")
    const [actionLoadingId, setActionLoadingId] = useState(null)

    const [sentRequests, setSentRequests] = useState([]);
    const [sentRequestsLoading, setSentRequestsLoading] = useState(false);
    const [sentRequestsError, setSentRequestsError] = useState("");
    const [cancelLoadingId, setCancelLoadingId] = useState(null);

    useEffect(() => {
        async function loadIncomingRequests() {
            if (!profile?.id) {
                return
            }

            try {
                setRequestLoading(true)
                setRequestsError("")

                const data = await getIncomingFriendRequests(profile.id);
                setIncomingRequests(data)
            } catch (error) {
                setRequestsError(error.message || "Failed to load friend requests")
                setIncomingRequests([]);
            } finally {
                setRequestLoading(false)
            }
        }

        loadIncomingRequests();
    }, [profile?.id])

    useEffect(() => {
        async function loadSentRequests() {
            if (!profile?.id) {
                return;
            }
        }

        loadSentRequests();
    }, [profile?.id]);

    async function loadSentRequests() {
        if (!profile?.id) {
            return;
        }

        try {
            setSentRequestsLoading(true);
            setSentRequestsError("");

            const data = await getSentFriendRequests(profile.id);
            setSentRequests(data);
        } catch (error) {
            setSentRequestsError(error.message || "Failed to load sent requests.");
            setSentRequests([]);
        } finally {
            setSentRequestsLoading(false);
        }
    }

    async function handleAcceptRequest(requestId) {
        try {
            setActionLoadingId(requestId)
            setRequestsError("")

            await acceptFriendRequest(requestId, profile.id)
            setIncomingRequests((prev) => prev.filter((request) => request.id !== requestId))
        } catch (error) {
            setRequestsError(error.message || "Failed to accept request")
        } finally {
            setActionLoadingId(null)
        }
    }

    async function handleDeclineRequest(requestId) {
        try {
            setActionLoadingId(requestId)
            setRequestsError("")

            await declineFriendRequest(requestId, profile.id)
            setIncomingRequests((prev) => prev.filter((request) => request.id !== requestId))
        } catch (error) {
            setRequestsError(error.message || "Failed to decline request")
        } finally {
            setActionLoadingId(null)
        }
    }

    async function handleCancelRequest(requestId) {
        try {
            setCancelLoadingId(requestId);
            setSentRequestsError("");

            await cancelFriendRequest(requestId, profile.id);

            // remove from UI immediately
            setSentRequests((prev) =>
                prev.filter((request) => request.id !== requestId)
            );
        } catch (error) {
            setSentRequestsError(error.message || "Failed to cancel request.");
        } finally {
            setCancelLoadingId(null);
        }
    }

    return (
        <div className="flex flex-col gap-5 max-w-6xl mx-auto">

            {/*Header */}
            <div className="flex flex-col gap-4 md:flex-row justify-between items-start ">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl text-stone-700">Friends </h1>
                    <p className="text-[rgb(137,122,114)] text-sm">
                        6 friends | {incomingRequests.length} pending requests
                    </p>
                </div>

                {/* Link is temporary to /diary/new until page is created */}
                <button
                    className="px-4 py-2 text-sm text-white border rounded-lg bg-[rgb(203,84,51)] hover:cursor-pointer"
                    onClick={() => setShowAddFriendModal(true)}
                >
                    Add Friend
                </button>
            </div>

            {/* Friend Requests */}
            {(requestLoading || requestsError || incomingRequests.length > 0) && (
                <div className="flex flex-col gap-3 border border-[rgb(239,206,191)] rounded-lg mt-3 px-4 py-3 bg-[rgb(253,246,244)]">
                    <div className="flex flex-row items-center gap-3">
                        <div className="bg-white rounded-4xl p-3">
                            <MdPeopleOutline size={22} className="text-[rgb(203,84,51)]" />
                        </div>

                        <div>
                            <p className="text-stone-800">
                                Friend Requests ({incomingRequests.length})
                            </p>
                            <p className="text-[rgb(137,122,114)] text-sm">
                                People who want to connect
                            </p>
                        </div>
                    </div>

                    {requestLoading ? (
                        <p className="text-sm text-[rgb(137,122,114)]">Loading requests...</p>
                    ) : requestsError ? (
                        <p className="text-sm text-red-500">{requestsError}</p>
                    ) : (
                        incomingRequests.map((request) => (
                            <FriendRequestCard
                                key={request.id}
                                id={request.id}
                                displayName={request.sender_profile?.display_name}
                                username={request.sender_profile?.username}
                                requestedAt={request.created_at}
                                mutualCount={0}
                                onAccept={() => handleAcceptRequest(request.id)}
                                onDecline={() => handleDeclineRequest(request.id)}
                                actionLoading={actionLoadingId === request.id}
                            />
                        ))
                    )}
                </div>
            )}

            {/* Tabs */}
            <div className="flex flex-row gap-3 bg-[rgb(237,232,228)] rounded-lg px-3 py-2 justify-start items-center w-max">
                <button
                    className={`flex flex-row items-center gap-2 py-1.5 px-3 rounded-lg hover:cursor-pointer ${activeTab === "friends"
                        ? "bg-white text-stone-700"
                        : "text-stone-700"}`}
                    onClick={() => setActiveTab("friends")}
                >
                    <MdPeopleOutline size={20} />
                    Friends
                </button>
                <button
                    className={`flex flex-row items-center gap-2 py-1.5 px-3 rounded-lg hover:cursor-pointer ${activeTab === "feed"
                        ? "bg-white text-stone-700"
                        : "text-stone-700"}`}
                    onClick={() => setActiveTab("feed")}
                >
                    <IoBookOutline className="relative top-[1px]" />
                    Feed
                </button>
                <button
                    className={`flex flex-row items-center gap-2 py-1.5 px-3 rounded-lg hover:cursor-pointer ${activeTab === "sent"
                        ? "bg-white text-stone-700"
                        : "text-stone-700"}`}
                    onClick={() => setActiveTab("sent")}
                >
                    <IoPaperPlaneOutline className="relative top-[1px]" />
                    Sent
                </button>
            </div>

            {/* Friends Tab Content */}
            {activeTab === "friends" && (
                <div className="flex flex-col gap-4">
                    <input
                        type="text"
                        className="border border-stone-200 rounded-lg px-3 py-2 w-full focus:outline-[rgb(203,84,51)]"
                        placeholder="Search friends..."
                    />

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {friendsMock.map((friend) => (
                            <FriendsCard
                                id={friend.id}
                                displayName={friend.displayName}
                                username={friend.username}
                                entryCount={friend.entryCount}
                                mutualCount={friend.mutualCount}
                                recentRestaurant={friend.recentRestaurant}
                                recentTime={friend.recentTime}
                                avatarUrl={friend.avatarUrl}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Feed Tab Content  */}
            {activeTab === "feed" && (
                <div>
                    <p className="text-[rgb(137,122,114)] text-sm mb-3">
                        Recent entries from your friends
                    </p>
                    <div className="flex flex-col gap-4">
                        {feedMock.map((feed) => (
                            <FriendsReviewCard
                                id={feed.id}
                                displayName={feed.displayName}
                                userAvatar={feed.userAvatar}
                                date={feed.date}
                                restaurantName={feed.restaurantName}
                                location={feed.location}
                                rating={feed.rating}
                                dishCount={feed.dishCount}
                                photoUrl={feed.photoUrl}
                            />
                        ))}
                    </div>
                </div>
            )}


            {/* Sent Tab Content */}
            {activeTab === "sent" && (
                <div className="flex flex-col gap-2">
                    {sentRequestsLoading ? (
                        <p className="text-sm text-[rgb(137,122,114)]">Loading sent requests...</p>
                    ) : sentRequestsError ? (
                        <p className="text-sm text-red-500">{sentRequestsError}</p>
                    ) : sentRequests.length === 0 ? (
                        <p className="text-sm text-[rgb(137,122,114)]">No sent requests</p>
                    ) : (
                        sentRequests.map((request) => (
                            <SentRequestCard
                                key={request.id}
                                id={request.id}
                                displayName={request.receiver_profile?.display_name}
                                username={request.receiver_profile?.username}
                                sentAt={request.created_at}
                                status={request.status}
                                onCancel={() => handleCancelRequest(request.id)}
                                actionLoading={cancelLoadingId === request.id}
                            />
                        ))
                    )}
                </div>
            )}

            {showAddFriendModal && (
                <AddFriendModal onClose={() => setShowAddFriendModal(false)} currentUserId={profile?.id} onRequestSent={loadSentRequests} />
            )}
        </div>
    )
}