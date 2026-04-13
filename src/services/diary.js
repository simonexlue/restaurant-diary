import { supabase } from "../lib/supabase";
import { saveRestaurantForUser } from "./restaurant";

const DISH_PHOTOS_BUCKET = "dish-photos";
const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 60;

export async function getUserDiaryRestaurants(userId) {
    const { data, error } = await supabase
        .from("saved_restaurants")
        .select(`
            id,
            restaurant_id,
            restaurants (
                id,
                name,
                address
            )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching saved restaurants:", error);
        throw error;
    }

    return data || [];
}

export async function getUserDishEntries(userId) {
    const { data, error } = await supabase
        .from("dish_entries")
        .select(`
            id,
            restaurant_id,
            dish_name,
            date_tried,
            item_rating,
            tags,
            photo_path
        `)
        .eq("user_id", userId)
        .order("date_tried", { ascending: false });

    if (error) {
        console.error("Error fetching dish entries:", error);
        throw error;
    }

    return data || [];
}

export async function getDishPhotoUrl(photoPath) {
    if (!photoPath) return null;

    const { data, error } = await supabase.storage
        .from(DISH_PHOTOS_BUCKET)
        .createSignedUrl(photoPath, SIGNED_URL_EXPIRES_IN_SECONDS);

    if (error) {
        console.error("Failed to create signed URL:", error);
        return null;
    }

    return data?.signedUrl || null;
}

export async function uploadDishPhoto({ file, userId, restaurantId }) {
    if (!file) return null;

    const filePath = buildDishPhotoPath({
        originalFileName: file.name,
        userId,
        restaurantId,
    });

    const { error } = await supabase.storage
        .from(DISH_PHOTOS_BUCKET)
        .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
        });

    if (error) {
        throw new Error(error.message || "Failed to upload dish photo.");
    }

    return filePath;
}

export async function removeDishPhoto(photoPath) {
    if (!photoPath) return;

    const { error } = await supabase.storage
        .from(DISH_PHOTOS_BUCKET)
        .remove([photoPath]);

    if (error) {
        console.error("Failed to remove uploaded photo during rollback:", error);
    }
}

export async function createDishEntry({
    userId,
    restaurantId,
    dateTried,
    dishName,
    itemRating,
    review,
    privacy,
    price,
    tags,
    photoPath,
}) {
    const payload = buildDishEntryPayload({
        userId,
        restaurantId,
        dateTried,
        dishName,
        itemRating,
        review,
        privacy,
        price,
        tags,
        photoPath,
    });

    const { data, error } = await supabase
        .from("dish_entries")
        .insert([payload])
        .select()
        .single();

    if (error) {
        throw new Error(error.message || "Failed to create dish entry.");
    }

    return data;
}

export async function createDishEntryWithOptionalPhoto({
    userId,
    restaurantId,
    dateTried,
    dishName,
    itemRating,
    review,
    privacy,
    price,
    tags,
    photoFile,
}) {
    let uploadedPhotoPath = null;

    try {
        await saveRestaurantForUser({
            userId,
            restaurantId,
        });

        if (photoFile) {
            uploadedPhotoPath = await uploadDishPhoto({
                file: photoFile,
                userId,
                restaurantId,
            });
        }

        return await createDishEntry({
            userId,
            restaurantId,
            dateTried,
            dishName,
            itemRating,
            review,
            privacy,
            price,
            tags,
            photoPath: uploadedPhotoPath,
        });
    } catch (error) {
        if (uploadedPhotoPath) {
            await removeDishPhoto(uploadedPhotoPath);
        }

        throw error;
    }
}

function buildDishEntryPayload({
    userId,
    restaurantId,
    dateTried,
    dishName,
    itemRating,
    review,
    privacy,
    price,
    tags,
    photoPath,
}) {
    return {
        user_id: userId,
        restaurant_id: restaurantId,
        date_tried: formatDateForPostgres(dateTried),
        dish_name: dishName?.trim() || "",
        item_rating: itemRating ?? null,
        review: review?.trim() || null,
        privacy: privacy || "private",
        price: normalizePrice(price),
        tags: normalizeTags(tags),
        photo_path: photoPath || null,
    };
}

function normalizePrice(price) {
    if (price === "" || price === null || price === undefined) {
        return null;
    }

    const numericPrice = Number(price);
    return Number.isNaN(numericPrice) ? null : numericPrice;
}

function normalizeTags(tags) {
    if (!Array.isArray(tags) || tags.length === 0) {
        return [];
    }

    return tags
        .map((tag) => String(tag).trim())
        .filter(Boolean);
}

function buildDishPhotoPath({ originalFileName, userId, restaurantId }) {
    const safeFileName = sanitizeFileName(originalFileName);
    const fileExt = safeFileName.includes(".")
        ? safeFileName.split(".").pop()
        : "jpg";

    const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
    return `${userId}/${restaurantId}/${fileName}`;
}

function formatDateForPostgres(date) {
    if (!date) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function sanitizeFileName(fileName) {
    return String(fileName)
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9.-]/g, "");
}

export async function getDishEntriesForRestaurant(restaurantId, userId) {
    if(!restaurantId) {
        throw new Error("Restaurant id is missing.")
    }

    if(!userId) {
        throw new Error("userId is missing")
    }

    const { data, error} = await supabase
        .from("dish_entries")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("user_id", userId)
        .order("date_tried", {ascending: false})
        .order("created_at", {ascending: false})

    if(error) {
        throw error;
    }

    return data ?? []
}

export async function getDishEntryById(entryId, userId) {
        if (!entryId) {
        throw new Error("Dish entry id is missing.");
    }

    if (!userId) {
        throw new Error("User id is missing.");
    }

    const { data, error } = await supabase
        .from("dish_entries")
        .select("*")
        .eq("id", entryId)
        .eq("user_id", userId)
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function deleteDishEntry({ entryId, userId, photoPath }) {
    if (!entryId) {
        throw new Error("Dish entry id is required.");
    }

    if (!userId) {
        throw new Error("User id is required.");
    }

    const { error } = await supabase
        .from("dish_entries")
        .delete()
        .eq("id", entryId)
        .eq("user_id", userId);

    if (error) {
        throw error;
    }

    if (photoPath) {
        await removeDishPhoto(photoPath);
    }
}

export async function updateDishEntry({
    entryId,
    userId,
    restaurantId,
    dateTried,
    dishName,
    itemRating,
    review,
    privacy,
    price,
    tags,
    photoPath,
}) {
    if (!entryId) {
        throw new Error("Dish entry id is required.");
    }

    if (!userId) {
        throw new Error("User id is required.");
    }

    const payload = buildDishEntryPayload({
        userId,
        restaurantId,
        dateTried,
        dishName,
        itemRating,
        review,
        privacy,
        price,
        tags,
        photoPath,
    });

    delete payload.user_id;
    delete payload.restaurant_id;

    const { data, error } = await supabase
        .from("dish_entries")
        .update(payload)
        .eq("id", entryId)
        .eq("user_id", userId)
        .select()
        .single();

    if (error) {
        throw new Error(error.message || "Failed to update dish entry.");
    }

    return data;
}

export async function updateDishEntryWithOptionalPhoto({
    entryId,
    userId,
    restaurantId,
    dateTried,
    dishName,
    itemRating,
    review,
    privacy,
    price,
    tags,
    photoFile,
    existingPhotoPath,
    removeExistingPhoto = false,
}) {
    let nextPhotoPath = existingPhotoPath || null;
    let uploadedNewPhotoPath = null;

    try {
        if (photoFile) {
            uploadedNewPhotoPath = await uploadDishPhoto({
                file: photoFile,
                userId,
                restaurantId,
            });

            nextPhotoPath = uploadedNewPhotoPath;
        } else if (removeExistingPhoto) {
            nextPhotoPath = null;
        }

        const updatedEntry = await updateDishEntry({
            entryId,
            userId,
            restaurantId,
            dateTried,
            dishName,
            itemRating,
            review,
            privacy,
            price,
            tags,
            photoPath: nextPhotoPath,
        });

        if (photoFile && existingPhotoPath) {
            await removeDishPhoto(existingPhotoPath);
        }

        if (removeExistingPhoto && existingPhotoPath) {
            await removeDishPhoto(existingPhotoPath);
        }

        return updatedEntry;
    } catch (error) {
        if (uploadedNewPhotoPath) {
            await removeDishPhoto(uploadedNewPhotoPath);
        }

        throw error;
    }
}

export async function getLikeSummaryForEntries(entryIds, currentUserId) {
    if (!Array.isArray(entryIds) || entryIds.length === 0) {
        return {};
    }

    const { data, error } = await supabase
        .from("dish_entry_likes")
        .select("dish_entry_id, user_id")
        .in("dish_entry_id", entryIds);

    if (error) {
        throw error;
    }

    const summary = {};

    for (const entryId of entryIds) {
        summary[entryId] = {
            likeCount: 0,
            likedByCurrentUser: false,
        };
    }

    for (const row of data ?? []) {
        if (!summary[row.dish_entry_id]) {
            summary[row.dish_entry_id] = {
                likeCount: 0,
                likedByCurrentUser: false,
            };
        }

        summary[row.dish_entry_id].likeCount += 1;

        if (row.user_id === currentUserId) {
            summary[row.dish_entry_id].likedByCurrentUser = true;
        }
    }

    return summary;
}

export async function likeDishEntry(entryId, currentUserId) {
    if (!entryId) {
        throw new Error("Dish entry id is required.");
    }

    if (!currentUserId) {
        throw new Error("User id is required.");
    }

    const { error } = await supabase
        .from("dish_entry_likes")
        .insert({
            dish_entry_id: entryId,
            user_id: currentUserId,
        });

    if (error) {
        throw error;
    }

    return true;
}

export async function unlikeDishEntry(entryId, currentUserId) {
    if (!entryId) {
        throw new Error("Dish entry id is required.");
    }

    if (!currentUserId) {
        throw new Error("User id is required.");
    }

    const { error } = await supabase
        .from("dish_entry_likes")
        .delete()
        .eq("dish_entry_id", entryId)
        .eq("user_id", currentUserId);

    if (error) {
        throw error;
    }

    return true;
}

export async function toggleDishEntryLike(entryId, currentUserId, isCurrentlyLiked) {
    if (isCurrentlyLiked) {
        return unlikeDishEntry(entryId, currentUserId);
    }

    return likeDishEntry(entryId, currentUserId);
}

export async function getCommentsForEntries(entryIds) {
    if (!Array.isArray(entryIds) || entryIds.length === 0) {
        return {};
    }

    const { data: commentsData, error: commentsError } = await supabase
        .from("dish_entry_comments")
        .select(`
            id,
            dish_entry_id,
            user_id,
            comment,
            created_at,
            updated_at
        `)
        .in("dish_entry_id", entryIds)
        .order("created_at", { ascending: true });

    if (commentsError) {
        throw commentsError;
    }

    const userIds = Array.from(
        new Set((commentsData ?? []).map((row) => row.user_id).filter(Boolean))
    );

    let profilesMap = {};

    if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url")
            .in("id", userIds);

        if (profilesError) {
            throw profilesError;
        }

        profilesMap = Object.fromEntries(
            (profilesData ?? []).map((profile) => [profile.id, profile])
        );
    }

    const groupedComments = {};

    for (const entryId of entryIds) {
        groupedComments[entryId] = [];
    }

    for (const row of commentsData ?? []) {
        if (!groupedComments[row.dish_entry_id]) {
            groupedComments[row.dish_entry_id] = [];
        }

        groupedComments[row.dish_entry_id].push({
            id: row.id,
            dish_entry_id: row.dish_entry_id,
            user_id: row.user_id,
            comment: row.comment,
            created_at: row.created_at,
            updated_at: row.updated_at,
            profile: profilesMap[row.user_id] ?? null,
        });
    }

    return groupedComments;
}

export async function createDishEntryComment({ entryId, userId, comment }) {
    if (!entryId) {
        throw new Error("Dish entry id is required.");
    }

    if (!userId) {
        throw new Error("User id is required.");
    }

    const trimmedComment = comment?.trim();

    if (!trimmedComment) {
        throw new Error("Comment cannot be empty.");
    }

    const { data, error } = await supabase
        .from("dish_entry_comments")
        .insert({
            dish_entry_id: entryId,
            user_id: userId,
            comment: trimmedComment,
        })
        .select(`
            id,
            dish_entry_id,
            user_id,
            comment,
            created_at,
            updated_at
        `)
        .single();

    if (error) {
        throw error;
    }

    const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .eq("id", userId)
        .single();

    if (profileError) {
        throw profileError;
    }

    return {
        id: data.id,
        dish_entry_id: data.dish_entry_id,
        user_id: data.user_id,
        comment: data.comment,
        created_at: data.created_at,
        updated_at: data.updated_at,
        profile: profileData,
    };
}

export async function deleteDishEntryComment(commentId, userId) {
    if (!commentId) {
        throw new Error("Comment id is required.");
    }

    if (!userId) {
        throw new Error("User id is required.");
    }

    const { error } = await supabase
        .from("dish_entry_comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", userId);

    if (error) {
        throw error;
    }

    return true;
}