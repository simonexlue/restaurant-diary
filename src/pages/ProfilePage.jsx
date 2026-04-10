import { MdPeopleOutline } from "react-icons/md"
import { BsPersonCheckFill, BsFillPersonDashFill, BsFillPersonPlusFill } from "react-icons/bs";
import { IoPricetagsOutline, IoLocationOutline, IoBookOutline } from "react-icons/io5";
import { HiOutlinePencil } from "react-icons/hi2";
import TagPill from "../components/ui/TagPill";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import useUserProfile from "../hooks/useUserProfile";
import { getUserDiaryRestaurants, getUserDishEntries } from "../services/diary";
import {
    getFriendsList,
    getFriendshipStatus,
    sendFriendRequest,
    removeFriend,
    acceptFriendRequest,
    declineFriendRequest,
} from "../services/friends";
import { getTopTagsFromEntries } from "../utils/tags";
import { getProfilePhotoUrl, getProfileById } from "../services/profile";
import EditProfileModal from "../components/profile/EditProfileModal";

export default function ProfilePage() {
    const navigate = useNavigate();
    const { userId: routeUserId } = useParams();
    const {
        profile: currentUserProfile,
        user,
        loading: profileLoading,
        errorMessage: profileErrorMessage,
    } = useUserProfile();
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState("");
    const [totalEntries, setTotalEntries] = useState(0);
    const [totalPlaces, setTotalPlaces] = useState(0);
    const [totalFriends, setTotalFriends] = useState(0);
    const [dishEntries, setDishEntries] = useState([]);
    const [profilePhotoUrl, setProfilePhotoUrl] = useState(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    const [viewedProfile, setViewedProfile] = useState(null);
    const viewedUserId = routeUserId || user?.id;
    const isOwnProfile = !routeUserId || routeUserId === user?.id;

    const [friendshipState, setFriendshipState] = useState("pending");
    const [friendshipLoading, setFriendshipLoading] = useState(false);
    const [friendshipActionLoading, setFriendshipActionLoading] = useState(false);
    const [friendshipRequestId, setFriendshipRequestId] = useState(null);
    const [friendshipSenderId, setFriendshipSenderId] = useState(null);
    const [friendshipReceiverId, setFriendshipReceiverId] = useState(null);

    useEffect(() => {
        async function loadProfileData() {
            if (!user?.id || !viewedUserId) return;

            try {
                setStatsLoading(true);
                setStatsError("");

                const profileToShow = isOwnProfile
                    ? currentUserProfile
                    : await getProfileById(viewedUserId);

                const [savedRestaurants, entries, friends] = await Promise.all([
                    getUserDiaryRestaurants(viewedUserId),
                    getUserDishEntries(viewedUserId),
                    getFriendsList(viewedUserId),
                ]);

                setViewedProfile(profileToShow);
                setTotalPlaces(savedRestaurants.length);
                setTotalEntries(entries.length);
                setTotalFriends(friends.length);
                setDishEntries(entries);
            } catch (error) {
                setStatsError(error.message || "Failed to load profile data.");
            } finally {
                setStatsLoading(false);
            }
        }

        loadProfileData();
    }, [user?.id, viewedUserId, isOwnProfile, currentUserProfile]);

    useEffect(() => {
        async function loadFriendshipState() {
            if (!user?.id || !viewedUserId || isOwnProfile) {
                return;
            }

            try {
                setFriendshipLoading(true);

                const result = await getFriendshipStatus(user.id, viewedUserId);

                setFriendshipState(result.status);
                setFriendshipRequestId(result.requestId || null);
                setFriendshipSenderId(result.senderId || null);
                setFriendshipReceiverId(result.receiverId || null);
            } catch (error) {
                console.error("Failed to load friendship status:", error.message);
                setFriendshipState("not_friends");
                setFriendshipRequestId(null);
                setFriendshipSenderId(null);
                setFriendshipReceiverId(null);
            } finally {
                setFriendshipLoading(false);
            }
        }

        loadFriendshipState();
    }, [user?.id, viewedUserId, isOwnProfile]);

    useEffect(() => {
        if (isOwnProfile) {
            setFriendshipState("self");
            setFriendshipRequestId(null);
            setFriendshipSenderId(null);
            setFriendshipReceiverId(null);
        }
    }, [isOwnProfile]);

    useEffect(() => {
        async function loadProfilePhoto() {
            if (!viewedProfile?.avatar_url) {
                setProfilePhotoUrl(null);
                return;
            }

            const signedUrl = await getProfilePhotoUrl(viewedProfile.avatar_url);
            setProfilePhotoUrl(signedUrl);
        }

        loadProfilePhoto();
    }, [viewedProfile?.avatar_url]);

    const topTags = getTopTagsFromEntries(dishEntries, 20);

    if (profileLoading || statsLoading) {
        return <p>Loading...</p>;
    }

    if (profileErrorMessage) {
        return <p>{profileErrorMessage}</p>;
    }

    if (statsError) {
        return <p>{statsError}</p>;
    }

    async function handleLogOut() {
        try {
            const { error } = await supabase.auth.signOut();

            if (error) {
                throw error;
            }

            navigate("/login");
        } catch (error) {
            console.error("Logout failed:", error.message);
        }
    }

    async function handleSendFriendRequest() {
        if (!user?.id || !viewedUserId) return;

        try {
            setFriendshipActionLoading(true);

            const request = await sendFriendRequest(viewedUserId, user.id);
            setFriendshipState("pending");
            setFriendshipRequestId(request?.id || null);
        } catch (error) {
            console.error("Failed to send friend request:", error.message);
        } finally {
            setFriendshipActionLoading(false);
        }
    }

    async function handleRemoveFriend() {
        if (!user?.id || !viewedUserId) return;

        try {
            setFriendshipActionLoading(true);

            await removeFriend(user.id, viewedUserId);
            setFriendshipState("not_friends");
            setFriendshipRequestId(null);
            setTotalFriends((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to remove friend:", error.message);
        } finally {
            setFriendshipActionLoading(false);
        }
    }

    async function handleAcceptFriendRequest() {
        if (!user?.id || !friendshipRequestId) return;

        try {
            setFriendshipActionLoading(true);

            await acceptFriendRequest(friendshipRequestId, user.id);
            setFriendshipState("friends");
            setFriendshipRequestId(null);
            setFriendshipSenderId(null);
            setFriendshipReceiverId(null);
            setTotalFriends((prev) => prev + 1);
        } catch (error) {
            console.error("Failed to accept friend request:", error.message);
        } finally {
            setFriendshipActionLoading(false);
        }
    }

    async function handleDeclineFriendRequest() {
        if (!user?.id || !friendshipRequestId) return;

        try {
            setFriendshipActionLoading(true);

            await declineFriendRequest(friendshipRequestId, user.id);
            setFriendshipState("not_friends");
            setFriendshipRequestId(null);
            setFriendshipSenderId(null);
            setFriendshipReceiverId(null);
        } catch (error) {
            console.error("Failed to decline friend request:", error.message);
        } finally {
            setFriendshipActionLoading(false);
        }
    }

    const isIncomingPendingRequest =
        friendshipState === "pending" && friendshipSenderId === viewedUserId;

    return (
        <div className="flex flex-col gap-6 max-w-3xl mx-auto">

            {/* Name / Pic / Location / Bio */}
            <div className="bg-white relative flex flex-col justify-center items-center p-10 rounded-lg shadow-xs">

                {/* Edit icon */}
                <div className="absolute top-4 right-4">
                    {isOwnProfile ? (
                        <button
                            type="button"
                            onClick={() => setIsEditModalOpen(true)}
                            className="text-stone-500 hover:text-[rgb(203,84,51)] hover:cursor-pointer"
                        >
                            <HiOutlinePencil />
                        </button>
                    ) : (
                        <div className="flex flex-row items-center gap-2">

                            {friendshipState === "not_friends" && (
                                <button
                                    type="button"
                                    onClick={handleSendFriendRequest}
                                    className="hover:scale-105 transition hover:cursor-pointer flex items-center justify-center p-2 rounded-full bg-[rgb(203,84,51)] hover:opacity-90"
                                    disabled={friendshipActionLoading || friendshipLoading}
                                >
                                    <BsFillPersonPlusFill className="text-white text-sm" />
                                </button>
                            )}

                            {friendshipState === "pending" && (
                                isIncomingPendingRequest ? (
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleAcceptFriendRequest}
                                            disabled={friendshipActionLoading || friendshipLoading}
                                            className="px-3 py-1 text-xs rounded-lg bg-[rgb(203,84,51)] text-white disabled:opacity-60 disabled:cursor-not-allowed hover:cursor-pointer"
                                        >
                                            Accept
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleDeclineFriendRequest}
                                            disabled={friendshipActionLoading || friendshipLoading}
                                            className="px-3 py-1 text-xs rounded-lg border border-stone-300 text-stone-600 disabled:opacity-60 disabled:cursor-not-allowed hover:cursor-pointer"
                                        >
                                            Decline
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        className="px-3 py-1 text-xs rounded-full bg-stone-200 text-stone-500 cursor-not-allowed"
                                        disabled
                                    >
                                        Pending
                                    </button>
                                )
                            )}

                            {friendshipState === "friends" && (
                                <>
                                    <button
                                        type="button"
                                        className="flex items-center justify-center p-2 rounded-full bg-[rgb(203,84,51)]"
                                        disabled
                                    >
                                        <BsPersonCheckFill className="text-white text-sm" />
                                    </button>

                                    <button
                                        type="button"
                                        className="hover:scale-105 transition hover:cursor-pointer flex items-center justify-center p-2 rounded-full border border-stone-300 hover:bg-stone-100"
                                        onClick={handleRemoveFriend}
                                        disabled={friendshipActionLoading || friendshipLoading}
                                    >
                                        <BsFillPersonDashFill className="text-stone-500 text-sm" />
                                    </button>
                                </>
                            )}

                        </div>
                    )}
                </div>

                {/* Profile pic */}
                {profilePhotoUrl ? (
                    <img
                        src={profilePhotoUrl}
                        alt={`${viewedProfile?.display_name || viewedProfile?.username || "User"} avatar`}
                        className="w-20 h-20 rounded-full object-cover"
                    />
                ) : (
                    // Placeholder
                    <div className="bg-gray-300 w-20 h-20 rounded-full" />
                )}

                {/* Name */}
                <h1 className="text-2xl text-stone-800 font-semibold mt-4">
                    {viewedProfile?.display_name || viewedProfile?.username || "Unnamed User"}
                </h1>

                {/* Location  */}
                {viewedProfile?.location && (
                    <div className="flex flex-row items-center gap-1 mt-1">
                        <IoLocationOutline className="text-[rgb(137,122,114)] text-sm" />
                        <p className="text-sm text-[rgb(137,122,114)]">{viewedProfile.location}</p>
                    </div>
                )}

                {/* Bio */}
                {viewedProfile?.bio && (
                    <p className="text-sm text-[rgb(137,122,114)] text-center mt-4 max-w-md">
                        {viewedProfile.bio}
                    </p>
                )}
            </div>


            {/* Stats: Entries, Places, Friends  */}
            <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center bg-white shadow-xs rounded-lg p-6 gap-1">
                    <IoBookOutline className="text-[rgb(203,84,51)] text-lg" />
                    <p className="text-lg text-stone-800 font-semibold">{totalEntries}</p>
                    <p className="text-sm text-[rgb(137,122,114)]">Entries</p>
                </div>
                <div className="flex flex-col items-center bg-white shadow-xs rounded-lg p-6 gap-1">
                    <IoLocationOutline className="text-[rgb(203,84,51)] text-lg" />
                    <p className="text-lg text-stone-800 font-semibold">{totalPlaces}</p>
                    <p className="text-sm text-[rgb(137,122,114)]">Places</p>
                </div>
                <div className="flex flex-col items-center bg-white shadow-xs rounded-lg p-6 gap-1">
                    <MdPeopleOutline className="text-[rgb(203,84,51)] text-xl" />
                    <p className="text-lg text-stone-800 font-semibold">{totalFriends}</p>
                    <p className="text-sm text-[rgb(137,122,114)]">Friends</p>
                </div>
            </div>

            {/* Tags */}
            <div className="bg-white shadow-xs rounded-lg p-6 flex flex-col gap-3">
                <div className="flex flex-row items-center gap-2">
                    <IoPricetagsOutline className="relative text-[rgb(203,84,51)] text-sm top-[1px]" />
                    <p className="text-stone-800 text-sm font-semibold">Tags</p>
                </div>

                {topTags.length > 0 ? (
                    <div className="flex flex-row gap-2 flex-wrap">
                        {topTags.map((tag) => (
                            <TagPill key={tag} label={tag} />
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-[rgb(137,122,114)]">No tags yet.</p>
                )}
            </div>

            <div className="mt-auto border border-red-300 rounded-lg">
                <button
                    onClick={handleLogOut}
                    className="w-full text-center text-red-500 hover:cursor-pointer hover:bg-red-100 pl-4 py-2 rounded-lg"
                >
                    Sign Out
                </button>
            </div>

            {isEditModalOpen && (
                <EditProfileModal
                    userId={user?.id}
                    profile={currentUserProfile}
                    profilePhotoUrl={profilePhotoUrl}
                    onClose={() => setIsEditModalOpen(false)}
                    onSaved={() => window.location.reload()}
                />
            )}
        </div>
    )
}