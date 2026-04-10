import { useEffect, useState, useRef } from "react"
import { HiOutlineCamera, HiOutlineTrash } from "react-icons/hi";
import { updateUserProfileWithOptionalPhoto } from "../../services/profile";

export default function EditProfileModal({
    userId,
    profile,
    profilePhotoUrl,
    onClose,
    onSaved,
}) {
    const [displayName, setDisplayName] = useState("")
    const [location, setLocation] = useState("")
    const [bio, setBio] = useState("")

    const fileInputRef = useRef(null);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
    const [removeExistingPhoto, setRemoveExistingPhoto] = useState(false);

    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        setDisplayName(profile?.display_name || "")
        setLocation(profile?.location || "")
        setBio(profile?.bio || "")
    }, [profile])

    useEffect(() => {
        if (!photoFile && !removeExistingPhoto) {
            setPhotoPreviewUrl(profilePhotoUrl || null);
        }

        if (removeExistingPhoto) {
            setPhotoPreviewUrl(null);
        }
    }, [profilePhotoUrl, photoFile, removeExistingPhoto]);

    useEffect(() => {
        return () => {
            if (photoPreviewUrl && photoPreviewUrl.startsWith("blob:")) {
                URL.revokeObjectURL(photoPreviewUrl);
            }
        };
    }, [photoPreviewUrl]);

    function handleChoosePhotoClick() {
        fileInputRef.current?.click();
    }

    function handlePhotoChange(event) {
        const file = event.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            return;
        }

        if (photoPreviewUrl && photoPreviewUrl.startsWith("blob:")) {
            URL.revokeObjectURL(photoPreviewUrl);
        }

        const nextPreviewUrl = URL.createObjectURL(file);

        setPhotoFile(file);
        setPhotoPreviewUrl(nextPreviewUrl);
        setRemoveExistingPhoto(false);
    }

    function handleRemovePhoto() {
        if (photoPreviewUrl && photoPreviewUrl.startsWith("blob:")) {
            URL.revokeObjectURL(photoPreviewUrl);
        }

        setPhotoFile(null);
        setPhotoPreviewUrl(null);
        setRemoveExistingPhoto(Boolean(profile?.avatar_url));

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!userId) {
            setErrorMessage("User id is missing")
            return;
        }

        try {
            setSaving(true);
            setErrorMessage("")

            await updateUserProfileWithOptionalPhoto({
                userId,
                displayName,
                location,
                bio,
                photoFile,
                existingPhotoPath: profile?.avatar_url,
                removeExistingPhoto,
            })

            await onSaved?.()
            onClose();
        } catch (error) {
            setErrorMessage(error.message || "Failed to update profile")
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2 py-6">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl p-6 shadow-xl">
                {/* Name / Pic / Location / Bio */}
                <form onSubmit={handleSubmit} className="bg-white relative flex flex-col justify-center items-center px-10 py-6 rounded-lg">
                    {/* Profile pic */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                            {photoPreviewUrl ? (
                                <img
                                    src={photoPreviewUrl}
                                    alt={`${profile?.display_name || profile?.username || "User"} avatar`}
                                    className="w-24 h-24 rounded-full object-cover border-4 border-[rgb(239,206,191)]"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-gray-300 border-4 border-[rgb(239,206,191)]" />
                            )}

                            {/* LEFT: remove */}
                            {(photoPreviewUrl || profile?.avatar_url) && (
                                <button
                                    type="button"
                                    onClick={handleRemovePhoto}
                                    className="absolute -bottom-1 -left-1 border-2 border-white flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:cursor-pointer"
                                >
                                    <HiOutlineTrash className="text-sm" />
                                </button>
                            )}

                            {/* RIGHT: upload/change */}
                            <button
                                type="button"
                                onClick={handleChoosePhotoClick}
                                className="absolute -bottom-1 -right-1 border-2 border-white flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(203,84,51)] text-white shadow-md hover:cursor-pointer"
                            >
                                <HiOutlineCamera className="text-sm" />
                            </button>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoChange}
                        />
                    </div>

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

                    {errorMessage && (
                        <p className="mt-4 w-full text-sm text-red-600">{errorMessage}</p>
                    )}

                    {/* Action buttons */}
                    <div className="mt-6 flex w-full justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="h-10 rounded-lg border border-stone-300 bg-white px-4 text-sm text-stone-700 hover:cursor-pointer"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="h-10 rounded-lg bg-[rgb(203,84,51)] px-4 text-sm text-white hover:cursor-pointer"
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>

    )
}