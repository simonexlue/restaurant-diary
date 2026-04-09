import { supabase } from "../lib/supabase";
import { getDishPhotoUrl } from "./diary";

export async function getRecentEntries(userId, limit = 5) {
    if(!userId) {
        throw new Error("User id is required")
    }

    const {data, error} = await supabase
        .from("dish_entries")
        .select(`
            id,
            dish_name,
            item_rating,
            tags,
            review,
            photo_path,
            created_at,
            restaurants (
                name,
                address
            )
        `)
        .eq("user_id", userId)
        .order("created_at", {ascending: false})
        .limit(limit);

    if(error) {
        console.error("Error fetching recent entries: ", error)
        throw error
    }

    const entriesWithPhotoUrls = await Promise.all(
        (data || []).map(async (entry) => {
            const photoUrl = entry.photo_path
                ? await getDishPhotoUrl(entry.photo_path)
                : null;

            return {
                id: entry.id,
                restaurantName: entry.restaurants?.name || "No restaurant name",
                dishName: entry.dish_name || "",
                rating: entry.item_rating,
                tags: entry.tags || [],
                createdAt: entry.created_at,
                review: entry.review || null,
                location: entry.restaurants?.address || "",
                photoUrl,
            };
        })
    );

    return entriesWithPhotoUrls
}