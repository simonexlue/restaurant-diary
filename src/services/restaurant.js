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

export async function fetchFriendRestaurantPins(userId) {
    if (!userId) {
        throw new Error("User id is required.");
    }

    const { data: friendshipRows, error: friendshipError } = await supabase
        .from("friendships")
        .select("user_one_id, user_two_id")
        .or(`user_one_id.eq.${userId},user_two_id.eq.${userId}`);

    if (friendshipError) {
        throw friendshipError;
    }

    const friendIds = (friendshipRows || []).map((row) =>
        row.user_one_id === userId ? row.user_two_id : row.user_one_id
    );

    const allUserIds = [...new Set([userId, ...friendIds])];

    const { data: entryRows, error: entryError } = await supabase
        .from("dish_entries")
        .select(`
            id,
            user_id,
            restaurant_id,
            item_rating,
            privacy,
            restaurants (
                id,
                google_place_id,
                name,
                address,
                lat,
                lng
            )
        `)
        .in("user_id", allUserIds);

    if (entryError) {
        throw entryError;
    }

    if (!entryRows || entryRows.length === 0) {
        return [];
    }

    const uniqueFriendIds = [...new Set(friendIds)];

    let profileMap = new Map();

    if (uniqueFriendIds.length > 0) {
        const { data: profileRows, error: profileError } = await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url")
            .in("id", uniqueFriendIds);

        if (profileError) {
            throw profileError;
        }

        profileMap = new Map(
            (profileRows || []).map((profile) => [profile.id, profile])
        );
    }

    const groupedMap = new Map();

    for (const entry of entryRows) {
        const restaurant = entry.restaurants;

        if (!restaurant || restaurant.lat == null || restaurant.lng == null) {
            continue;
        }

        if (!groupedMap.has(entry.restaurant_id)) {
            groupedMap.set(entry.restaurant_id, {
                restaurantId: restaurant.id,
                google_place_id: restaurant.google_place_id,
                name: restaurant.name,
                address: restaurant.address,
                lat: restaurant.lat,
                lng: restaurant.lng,
                friendsMap: new Map(),
                currentUserEntryCount: 0,
                ratingValues: [],
            });
        }

        const groupedRestaurant = groupedMap.get(entry.restaurant_id);

        if (entry.user_id === userId) {
            groupedRestaurant.currentUserEntryCount += 1;

            if (entry.item_rating != null) {
                groupedRestaurant.ratingValues.push(Number(entry.item_rating));
            }

            continue;
        }

        const isVisibleToFriends =
            entry.privacy === "friends" || entry.privacy === "public";

        if (!isVisibleToFriends) {
            continue;
        }

        const profile = profileMap.get(entry.user_id);

        if (!groupedRestaurant.friendsMap.has(entry.user_id)) {
            groupedRestaurant.friendsMap.set(entry.user_id, {
                id: entry.user_id,
                username: profile?.username || "",
                display_name: profile?.display_name || "",
                avatar_url: profile?.avatar_url || "",
                entryCount: 0,
                ratings: [],
            });
        }

        const friendEntry = groupedRestaurant.friendsMap.get(entry.user_id);
        friendEntry.entryCount += 1;

        if (entry.item_rating != null) {
            const numericRating = Number(entry.item_rating);
            friendEntry.ratings.push(numericRating);
            groupedRestaurant.ratingValues.push(numericRating);
        }
    }

    return Array.from(groupedMap.values()).map((restaurant) => {
        const friends = Array.from(restaurant.friendsMap.values()).map((friend) => {
            const averageRating =
                friend.ratings.length > 0
                    ? friend.ratings.reduce((sum, rating) => sum + rating, 0) /
                      friend.ratings.length
                    : null;

            return {
                id: friend.id,
                username: friend.username,
                display_name: friend.display_name,
                avatar_url: friend.avatar_url,
                entryCount: friend.entryCount,
                averageRating,
            };
        });

        const averageRating =
            restaurant.ratingValues.length > 0
                ? restaurant.ratingValues.reduce((sum, rating) => sum + rating, 0) /
                  restaurant.ratingValues.length
                : null;

        return {
            restaurantId: restaurant.restaurantId,
            google_place_id: restaurant.google_place_id,
            name: restaurant.name,
            address: restaurant.address,
            lat: restaurant.lat,
            lng: restaurant.lng,
            friends,
            currentUserEntryCount: restaurant.currentUserEntryCount,
            averageRating,
        };
    });
}