import { MdPeopleOutline } from "react-icons/md"
import { IoPricetagsOutline, IoLocationOutline, IoBookOutline } from "react-icons/io5";
import { HiOutlinePencil } from "react-icons/hi2";
import TagPill from "../components/ui/TagPill";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import useUserProfile from "../hooks/useUserProfile";
import { getUserDiaryRestaurants, getUserDishEntries } from "../services/diary";
import { getFriendsList } from "../services/friends";
import { getTopTagsFromEntries } from "../utils/tags";
import { getProfilePhotoUrl } from "../services/profile";
import EditProfileModal from "../components/profile/EditProfileModal";

export default function ProfilePage() {
    const navigate = useNavigate();
    const {
        profile,
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

    useEffect(() => {
        async function loadProfileData() {
            if (!user?.id) return;

            try {
                setStatsLoading(true);
                setStatsError("");

                const [savedRestaurants, entries, friends] = await Promise.all([
                    getUserDiaryRestaurants(user.id),
                    getUserDishEntries(user.id),
                    getFriendsList(user.id),
                ]);

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
    }, [user?.id]);

    useEffect(() => {
        async function loadProfilePhoto() {
            if (!profile?.avatar_url) {
                setProfilePhotoUrl(null)
                return;
            }

            const signedUrl = await getProfilePhotoUrl(profile.avatar_url)
            setProfilePhotoUrl(signedUrl)
        }
        loadProfilePhoto();
    }, [profile?.avatar_url])

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

    return (
        <div className="flex flex-col gap-6 max-w-3xl mx-auto">

            {/* Name / Pic / Location / Bio */}
            <div className="bg-white relative flex flex-col justify-center items-center p-10 rounded-lg shadow-xs">

                {/* Edit icon */}
                <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="absolute top-4 right-4 text-stone-500 hover:text-[rgb(203,84,51)] hover:cursor-pointer"
                >
                    <HiOutlinePencil />
                </button>

                {/* Profile pic */}
                {profilePhotoUrl ? (
                    <img
                        src={profilePhotoUrl}
                        alt={`${profile?.display_name || profile?.username || "User"} avatar`}
                        className="w-20 h-20 rounded-full object-cover"
                    />
                ) : (
                    // Placeholder
                    <div className="bg-gray-300 w-20 h-20 rounded-full" />
                )}

                {/* Name */}
                <h1 className="text-2xl text-stone-800 font-semibold mt-4">{profile?.display_name || profile?.username || "Unnamed User"}</h1>

                {/* Location  */}
                {profile?.location && (
                    <div className="flex flex-row items-center gap-1 mt-1">
                        <IoLocationOutline className="text-[rgb(137,122,114)] text-sm" />
                        <p className="text-sm text-[rgb(137,122,114)]">{profile.location}</p>
                    </div>
                )}

                {/* Bio */}
                {profile?.bio && (
                    <p className="text-sm text-[rgb(137,122,114)] text-center mt-4 max-w-md">
                        {profile.bio}
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
                    profile={profile}
                    profilePhotoUrl={profilePhotoUrl}
                    onClose={() => setIsEditModalOpen(false)}
                    onSaved={() => window.location.reload()}
                />
            )}
        </div>
    )
}