import { supabase } from "../lib/supabase";

const PROFILE_PHOTOS_BUCKET = "profile-photos";
const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 60;
const SIGNED_URL_REFRESH_BUFFER_MS = 60 * 1000;

const profilePhotoUrlCache = new Map();

function getCachedProfilePhotoUrl(photoPath) {
    if (!photoPath) return null;

    const cached = profilePhotoUrlCache.get(photoPath);

    if (!cached) {
        return null;
    }

    const isExpired = Date.now() >= cached.expiresAt;

    if (isExpired) {
        profilePhotoUrlCache.delete(photoPath);
        return null;
    }

    return cached.url;
}

function setCachedProfilePhotoUrl(photoPath, url) {
    if (!photoPath || !url) return;

    const expiresAt =
        Date.now() +
        SIGNED_URL_EXPIRES_IN_SECONDS * 1000 -
        SIGNED_URL_REFRESH_BUFFER_MS;

    profilePhotoUrlCache.set(photoPath, {
        url,
        expiresAt,
    });
}

export function invalidateProfilePhotoUrlCache(photoPath) {
    if (!photoPath) return;
    profilePhotoUrlCache.delete(photoPath);
}

export function clearProfilePhotoUrlCache() {
    profilePhotoUrlCache.clear();
}

export async function getProfilePhotoUrl(photoPath) {
    if (!photoPath) return null;

    const cachedUrl = getCachedProfilePhotoUrl(photoPath);
    if (cachedUrl) {
        return cachedUrl;
    }

    const { data, error } = await supabase.storage
        .from(PROFILE_PHOTOS_BUCKET)
        .createSignedUrl(photoPath, SIGNED_URL_EXPIRES_IN_SECONDS);

    if (error) {
        return null;
    }

    const signedUrl = data?.signedUrl || null;

    if (signedUrl) {
        setCachedProfilePhotoUrl(photoPath, signedUrl);
    }

    return signedUrl;
}

export async function uploadProfilePhoto({ file, userId }) {
    if (!file) return null;

    const filePath = buildProfilePhotoPath({
        originalFileName: file.name,
        userId,
    });

    const { error } = await supabase.storage
        .from(PROFILE_PHOTOS_BUCKET)
        .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
        });

    if (error) {
        throw new Error(error.message || "Failed to upload profile photo.");
    }

    return filePath;
}

export async function removeProfilePhoto(photoPath) {
    if (!photoPath) return;

    const { error } = await supabase.storage
        .from(PROFILE_PHOTOS_BUCKET)
        .remove([photoPath]);

    if (error) {
        console.error("Failed to remove profile photo:", error);
        return;
    }

    invalidateProfilePhotoUrlCache(photoPath);
}

export async function updateUserProfile({
    userId,
    displayName,
    location,
    bio,
    avatarUrl,
}) {
    if (!userId) {
        throw new Error("User id is required.");
    }

    const payload = {
        display_name: displayName?.trim() || null,
        location: location?.trim() || null,
        bio: bio?.trim() || null,
        avatar_url: avatarUrl || null,
    };

    const { data, error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", userId)
        .select()
        .single();

    if (error) {
        throw new Error(error.message || "Failed to update profile.");
    }

    return data;
}

export async function updateUserProfileWithOptionalPhoto({
    userId,
    displayName,
    location,
    bio,
    photoFile,
    existingPhotoPath,
    removeExistingPhoto = false,
}) {
    let nextPhotoPath = existingPhotoPath || null;
    let uploadedNewPhotoPath = null;

    try {
        if (photoFile) {
            uploadedNewPhotoPath = await uploadProfilePhoto({
                file: photoFile,
                userId,
            });

            nextPhotoPath = uploadedNewPhotoPath;
        } else if (removeExistingPhoto) {
            nextPhotoPath = null;
        }

        const updatedProfile = await updateUserProfile({
            userId,
            displayName,
            location,
            bio,
            avatarUrl: nextPhotoPath,
        });

        if (photoFile && existingPhotoPath) {
            await removeProfilePhoto(existingPhotoPath);
        }

        if (removeExistingPhoto && existingPhotoPath) {
            await removeProfilePhoto(existingPhotoPath);
        }

        return updatedProfile;
    } catch (error) {
        if (uploadedNewPhotoPath) {
            await removeProfilePhoto(uploadedNewPhotoPath);
        }

        throw error;
    }
}

function buildProfilePhotoPath({ originalFileName, userId }) {
    const safeFileName = sanitizeFileName(originalFileName);
    const fileExt = safeFileName.includes(".")
        ? safeFileName.split(".").pop()
        : "jpg";

    const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
    return `${userId}/avatar/${fileName}`;
}

function sanitizeFileName(fileName) {
    return String(fileName)
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9.-]/g, "");
}

export async function getProfileById(userId) {
    if (!userId) {
        throw new Error("User id is required");
    }

    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (error) {
        throw new Error(error.message || "Failed to load profile");
    }

    return data;
}