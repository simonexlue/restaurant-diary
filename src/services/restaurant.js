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
    if (!userId) {
        throw new Error("User id is required.");
    }

    if (!restaurantId) {
        throw new Error("Restaurant id is required.");
    }

    const { data: existingRow, error: existingError } = await supabase
        .from("saved_restaurants")
        .select("id, user_id, restaurant_id")
        .eq("user_id", userId)
        .eq("restaurant_id", restaurantId)
        .maybeSingle();

    if (existingError) {
        throw existingError;
    }

    if (existingRow) {
        return existingRow;
    }

    const { data, error } = await supabase
        .from("saved_restaurants")
        .insert([
            {
                user_id: userId,
                restaurant_id: restaurantId,
            },
        ])
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

export async function getRestaurantById(restaurant_id) {
    if (!restaurant_id) {
        throw new Error("Restaurant id is missing.");
    }

    const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", restaurant_id)
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function deleteRestaurantForUser({ userId, restaurantId }) {
    if (!userId) {
        throw new Error("User id is required.");
    }

    if (!restaurantId) {
        throw new Error("Restaurant id is required.");
    }

    const { error: deleteSavedError } = await supabase
        .from("saved_restaurants")
        .delete()
        .eq("user_id", userId)
        .eq("restaurant_id", restaurantId);

    if (deleteSavedError) {
        throw deleteSavedError;
    }

    const [
        { count: remainingSavedCount, error: remainingSavedError },
        { count: remainingDishEntryCount, error: remainingDishEntryError },
    ] = await Promise.all([
        supabase
            .from("saved_restaurants")
            .select("*", { count: "exact", head: true })
            .eq("restaurant_id", restaurantId),

        supabase
            .from("dish_entries")
            .select("*", { count: "exact", head: true })
            .eq("restaurant_id", restaurantId),
    ]);

    if (remainingSavedError) {
        throw remainingSavedError;
    }

    if (remainingDishEntryError) {
        throw remainingDishEntryError;
    }

    const canDeleteRestaurantRow =
        (remainingSavedCount ?? 0) === 0 &&
        (remainingDishEntryCount ?? 0) === 0;

    if (canDeleteRestaurantRow) {
        const { error: deleteRestaurantError } = await supabase
            .from("restaurants")
            .delete()
            .eq("id", restaurantId);

        if (deleteRestaurantError) {
            throw deleteRestaurantError;
        }
    }

    return {
        removedFromUserSavedRestaurants: true,
        deletedRestaurantRow: canDeleteRestaurantRow,
    };
}

export async function fetchFriendRestaurantPins() {
    const { data, error } = await supabase.rpc("get_map_friend_restaurant_pins");

    if (error) {
        throw error;
    }

    return (data || []).map((row) => ({
        restaurantId: row.restaurant_id,
        google_place_id: row.google_place_id,
        name: row.name,
        address: row.address,
        lat: row.lat,
        lng: row.lng,
        friends: Array.isArray(row.friends) ? row.friends : [],
        currentUserEntryCount: row.current_user_entry_count || 0,
        averageRating:
            row.average_rating !== null && row.average_rating !== undefined
                ? Number(row.average_rating)
                : null,
    }));
}

export async function getRestaurantFriendsVisitedCount(restaurantId) {
    if (!restaurantId) {
        throw new Error("Restaurant id is required.");
    }

    const { data, error } = await supabase.rpc("get_restaurant_friends_visited_count", {
        p_restaurant_id: restaurantId,
    });

    if (error) {
        throw error;
    }

    return data?.[0]?.friends_visited_count ?? 0;
}