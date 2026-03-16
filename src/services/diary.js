import { supabase } from "../lib/supabase";
import { saveRestaurantForUser } from "./restaurant";

const DISH_PHOTOS_BUCKET = "dish-photos";

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

    return data;
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

    return data;
}

export async function getDishPhotoUrl(photoPath) {
    if (!photoPath) return null;

    const { data, error } = await supabase.storage
        .from(DISH_PHOTOS_BUCKET)
        .createSignedUrl(photoPath, 60 * 60);

    if (error) {
        console.error("Failed to create signed URL:", error);
        return null;
    }

    return data?.signedUrl || null;
}

function formatDateForPostgres(date) {
    if (!date) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function sanitizeFileName(fileName) {
    return fileName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9.-]/g, "");
}

export async function uploadDishPhoto({ file, userId, restaurantId }) {
    if (!file) return null;

    const safeFileName = sanitizeFileName(file.name);
    const fileExt = safeFileName.includes(".")
        ? safeFileName.split(".").pop()
        : "jpg";

    const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${userId}/${restaurantId}/${fileName}`;

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
    const payload = {
        user_id: userId,
        restaurant_id: restaurantId,
        date_tried: formatDateForPostgres(dateTried),
        dish_name: dishName.trim(),
        item_rating: itemRating ?? null,
        review: review?.trim() || null,
        privacy: privacy || "private",
        price:
            price === "" || price === null || price === undefined
                ? null
                : Number(price),
        tags: tags?.length ? tags : [],
        photo_path: photoPath || null,
    };

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

        const entry = await createDishEntry({
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

        return entry;
    } catch (error) {
        if (uploadedPhotoPath) {
            await removeDishPhoto(uploadedPhotoPath);
        }

        throw error;
    }
}