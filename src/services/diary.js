import { supabase } from "../lib/supabase";

export async function getUserDiaryRestaurants() {
    const {data, error} = await supabase
        .from("dish_entries")
        .select(`
            id,
            restaurant_id,
            dish_name,
            date_tried,
            restaurants (
                id,
                name,
                address
            )
            `)
            .order("date_tried", { ascending: false });
    if (error) {
        console.error("Error fetching diary restaurants:", error);
        throw error;
    }
    return data
}