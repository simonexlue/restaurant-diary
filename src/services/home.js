import { supabase } from "../lib/supabase";
import { getDishPhotoUrl } from "./diary";

export async function getRecentEntries(userId, limit = 5) {
  if (!userId) {
    throw new Error("User id is required");
  }

  const { data, error } = await supabase
    .from("dish_entries")
    .select(
      `
            id,
            dish_name,
            restaurant_id,
            item_rating,
            tags,
            review,
            photo_path,
            created_at,
            restaurants (
                name,
                address
            )
        `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching recent entries: ", error);
    throw error;
  }

  const entriesWithPhotoUrls = await Promise.all(
    (data || []).map(async (entry) => {
      const photoUrl = entry.photo_path
        ? await getDishPhotoUrl(entry.photo_path)
        : null;

      return {
        id: entry.id,
        restaurantId: entry.restaurant_id,
        restaurantName: entry.restaurants?.name || "No restaurant name",
        dishName: entry.dish_name || "",
        rating: entry.item_rating,
        tags: entry.tags || [],
        createdAt: entry.created_at,
        review: entry.review || null,
        location: entry.restaurants?.address || "",
        photoUrl,
      };
    }),
  );

  return entriesWithPhotoUrls;
}

export async function getHomeFriendsActivity(currentUserId, limit = 5) {
  if (!currentUserId) {
    throw new Error("Current user id is required.");
  }

  const { data: friendshipRows, error: friendshipsError } = await supabase
    .from("friendships")
    .select(
      `
            id,
            user_one_id,
            user_two_id,
            user_one:profiles!friendships_user_one_id_fkey (
                id,
                username,
                display_name,
                avatar_url
            ),
            user_two:profiles!friendships_user_two_id_fkey (
                id,
                username,
                display_name,
                avatar_url
            )
        `,
    )
    .or(`user_one_id.eq.${currentUserId},user_two_id.eq.${currentUserId}`);

  if (friendshipsError) {
    throw friendshipsError;
  }

  const friends = (friendshipRows ?? [])
    .map((row) => {
      const friendProfile =
        row.user_one_id === currentUserId ? row.user_two : row.user_one;

      return {
        id: friendProfile?.id,
        username: friendProfile?.username,
        displayName: friendProfile?.display_name,
        avatarUrl: friendProfile?.avatar_url,
      };
    })
    .filter((friend) => friend.id);

  if (friends.length === 0) {
    return [];
  }

  const friendIds = friends.map((friend) => friend.id);

  const friendMap = {};
  for (const friend of friends) {
    friendMap[friend.id] = friend;
  }

  const { data: entryRows, error: entriesError } = await supabase
    .from("dish_entries")
    .select(
      `
            id,
            user_id,
            date_tried,
            created_at,
            restaurant:restaurants (
                id,
                name,
                address
            )
        `,
    )
    .in("user_id", friendIds)
    .order("date_tried", { ascending: false })
    .order("created_at", { ascending: false });

  if (entriesError) {
    throw entriesError;
  }

  const seenFriendIds = new Set();
  const activity = [];

  for (const row of entryRows ?? []) {
    if (seenFriendIds.has(row.user_id)) {
      continue;
    }

    seenFriendIds.add(row.user_id);

    activity.push({
      id: row.id,
      friendId: row.user_id,
      name: friendMap[row.user_id]?.displayName || "Unknown",
      username: friendMap[row.user_id]?.username || "",
      recentVisit: row.restaurant?.name || "Unknown restaurant",
      location: row.restaurant?.address || "",
      time: row.date_tried || row.created_at,
      restaurantId: row.restaurant?.id || null,
    });
  }

  return activity.slice(0, limit);
}
