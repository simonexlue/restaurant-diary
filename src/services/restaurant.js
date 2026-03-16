import { supabase } from "../lib/supabase";

export async function fetchRestaurants() {
    const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        throw error;
    }

    return data || [];
}

export async function fetchSavedRestaurantsForUser(userId) {
    const { data, error } = await supabase
        .from("saved_restaurants")
        .select(`
            id,
            restaurant_id,
            created_at,
            restaurants (
                id,
                google_place_id,
                name,
                address,
                lat,
                lng,
                source,
                created_at,
                updated_at
            )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        throw error;
    }

    return (data || [])
        .map((row) => row.restaurants)
        .filter(Boolean);
}

export async function findRestaurantByGooglePlaceId(googlePlaceId) {
    const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("google_place_id", googlePlaceId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}

export async function createGoogleRestaurant({
    google_place_id,
    name,
    address,
    lat,
    lng,
}) {
    const { data, error } = await supabase
        .from("restaurants")
        .insert({
            google_place_id,
            name,
            address: address || null,
            lat,
            lng,
            source: "google",
        })
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function createManualRestaurant({ name, address, lat, lng }) {
    const { data, error } = await supabase
        .from("restaurants")
        .insert({
            google_place_id: null,
            name,
            address: address || null,
            lat,
            lng,
            source: "manual",
        })
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function saveGoogleRestaurantIfNotExists({
    google_place_id,
    name,
    address,
    lat,
    lng,
}) {
    const existingRestaurant = await findRestaurantByGooglePlaceId(google_place_id);

    if (existingRestaurant) {
        return {
            restaurant: existingRestaurant,
            alreadyExists: true,
        };
    }

    const newRestaurant = await createGoogleRestaurant({
        google_place_id,
        name,
        address,
        lat,
        lng,
    });

    return {
        restaurant: newRestaurant,
        alreadyExists: false,
    };
}

export async function getOrCreateRestaurantFromGooglePlace(place) {
    const google_place_id = place.id;
    const lat = place.location?.lat();
    const lng = place.location?.lng();

    if (!google_place_id || lat == null || lng == null) {
        throw new Error("Missing Google place details.");
    }

    const result = await saveGoogleRestaurantIfNotExists({
        google_place_id,
        name: place.displayName || "Unnamed restaurant",
        address: place.formattedAddress || null,
        lat,
        lng,
    });

    return result.restaurant;
}

export async function saveRestaurantForUser({ userId, restaurantId }) {
    const { data, error } = await supabase
        .from("saved_restaurants")
        .upsert(
            [
                {
                    user_id: userId,
                    restaurant_id: restaurantId,
                },
            ],
            {
                onConflict: "user_id,restaurant_id",
            }
        )
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function createManualRestaurantForUser({
    userId,
    name,
    address,
    lat,
    lng,
}) {
    const restaurant = await createManualRestaurant({
        name,
        address,
        lat,
        lng,
    });

    await saveRestaurantForUser({
        userId,
        restaurantId: restaurant.id,
    });

    return restaurant;
}

export async function saveGoogleRestaurantForUser({
    userId,
    google_place_id,
    name,
    address,
    lat,
    lng,
}) {
    const result = await saveGoogleRestaurantIfNotExists({
        google_place_id,
        name,
        address,
        lat,
        lng,
    });

    await saveRestaurantForUser({
        userId,
        restaurantId: result.restaurant.id,
    });

    return result;
}