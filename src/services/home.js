import { supabase } from "../lib/supabase";
import { getDishPhotoUrl } from "./diary";

/*
  Personal Home data cache:
  - recent entries
  - palate
  - home onboarding status
*/

const recentEntriesCache = new Map();
const palateCache = new Map();
const homeOnboardingCache = new Map();

function makeCacheKey(userId, limit) {
  return `${userId}-${limit}`;
}

export function invalidateRecentEntriesCache(userId) {
  if (!userId) {
    recentEntriesCache.clear();
    return;
  }

  for (const key of recentEntriesCache.keys()) {
    if (key.startsWith(`${userId}-`)) {
      recentEntriesCache.delete(key);
    }
  }
}

export function invalidatePalateCache(userId) {
  if (!userId) {
    palateCache.clear();
    return;
  }

  for (const key of palateCache.keys()) {
    if (key.startsWith(`${userId}-`)) {
      palateCache.delete(key);
    }
  }
}

export function invalidateHomeOnboardingCache(userId) {
  if (!userId) {
    homeOnboardingCache.clear();
    return;
  }

  homeOnboardingCache.delete(userId);
}

export function invalidateHomePersonalCaches(userId) {
  invalidateRecentEntriesCache(userId);
  invalidatePalateCache(userId);
}

export async function getRecentEntries(userId, limit = 5, options = {}) {
  if (!userId) {
    throw new Error("User id is required");
  }

  const { forceRefresh = false } = options;
  const cacheKey = makeCacheKey(userId, limit);

  if (!forceRefresh && recentEntriesCache.has(cacheKey)) {
    return recentEntriesCache.get(cacheKey);
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

  recentEntriesCache.set(cacheKey, entriesWithPhotoUrls);
  return entriesWithPhotoUrls;
}

export async function getHomeFriendsActivity(limit = 5) {
  const { data, error } = await supabase.rpc("get_home_friends_activity", {
    p_limit: limit,
  });

  if (error) {
    console.error("Error fetching friend activity:", error);
    throw error;
  }

  return (data || []).map((row) => ({
    id: row.id,
    friendId: row.friend_id,
    name: row.name,
    username: row.username,
    avatar_url: row.avatar_url,
    recentVisit: row.recent_visit,
    location: row.location,
    time: row.activity_time,
    restaurantId: row.restaurant_id,
  }));
}

export async function getHomePalateData(userId, limit = 5, options = {}) {
  if (!userId) {
    throw new Error("User id is required");
  }

  const { forceRefresh = false } = options;
  const cacheKey = makeCacheKey(userId, limit);

  if (!forceRefresh && palateCache.has(cacheKey)) {
    return palateCache.get(cacheKey);
  }

  const { data, error } = await supabase.rpc("get_home_palate_data", {
    p_limit: limit,
  });

  if (error) {
    console.error("Error fetching palate data:", error);
    throw error;
  }

  const result = data || [];
  palateCache.set(cacheKey, result);
  return result;
}

/*
  Home onboarding status:
  - not_started
  - skipped
  - completed
*/

export async function getHomeOnboardingStatus(userId, options = {}) {
  if (!userId) {
    throw new Error("User id is required");
  }

  const { forceRefresh = false } = options;

  if (!forceRefresh && homeOnboardingCache.has(userId)) {
    return homeOnboardingCache.get(userId);
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("home_onboarding_status")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching home onboarding status:", error);
    throw error;
  }

  const status = data?.home_onboarding_status || "not_started";
  homeOnboardingCache.set(userId, status);
  return status;
}

export async function updateHomeOnboardingStatus(userId, status) {
  if (!userId) {
    throw new Error("User id is required");
  }

  const allowedStatuses = ["not_started", "skipped", "completed"];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid home onboarding status");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      home_onboarding_status: status,
    })
    .eq("id", userId);

  if (error) {
    console.error("Error updating home onboarding status:", error);
    throw error;
  }

  homeOnboardingCache.set(userId, status);
  return status;
}

export async function markHomeOnboardingSkipped(userId) {
  return updateHomeOnboardingStatus(userId, "skipped");
}

export async function markHomeOnboardingCompleted(userId) {
  return updateHomeOnboardingStatus(userId, "completed");
}