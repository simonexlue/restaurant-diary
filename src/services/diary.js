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