import { useEffect, useState } from "react"

export default function EditProfileModal({
    profile,
    profilePhotoUrl,
    onClose,
}) {
    const [displayName, setDisplayName] = useState("")
    const [location, setLocation] = useState("")
    const [bio, setBio] = useState("")

    useEffect(() => {
        setDisplayName(profile?.display_name || "")
        setLocation(profile?.location || "")
        setBio(profile?.bio || "")
    }, [profile])

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2 py-6">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl p-6 shadow-xl">
                {/* Name / Pic / Location / Bio */}
                <form className="bg-white relative flex flex-col justify-center items-center px-10 py-6 rounded-lg">
                    {/* Profile pic */}
                    {profilePhotoUrl ? (
                        <img
                            src={profilePhotoUrl}
                            alt={`${profile?.display_name || profile?.username || "User"} avatar`}
                            className="w-20 h-20 rounded-full object-cover"
                        />
                    ) : (
                        <div className="bg-gray-300 w-20 h-20 rounded-full" />
                    )}


                    {/* Name */}
                    <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="mt-4 h-10 w-full rounded-lg border border-gray-300 px-3 bg-[rgb(248,245,242)] focus:outline-[rgb(203,84,51)]"
                        placeholder="Your name"
                    />


                    {/* Location  */}
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="mt-4 h-10 w-full rounded-lg border border-gray-300 px-3 bg-[rgb(248,245,242)] focus:outline-[rgb(203,84,51)]"
                        placeholder="Ex. Vancouver, BC"
                    />


                    {/* Bio */}
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Biography"
                        className="mt-4 min-h-28 w-full rounded-lg border border-gray-300 px-3 py-3 bg-[rgb(248,245,242)] focus:outline-[rgb(203,84,51)]"
                    />

                    {/* Action buttons */}
                    <div className="mt-6 flex w-full justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-10 rounded-lg border border-stone-300 bg-white px-4 text-sm text-stone-700 hover:cursor-pointer"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="h-10 rounded-lg bg-[rgb(203,84,51)] px-4 text-sm text-white hover:cursor-pointer"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>

    )
}