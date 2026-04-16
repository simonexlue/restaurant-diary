import { supabase } from "../lib/supabase";
import { getDishPhotoUrl } from "./diary";

function sortFriendsIds(userA, userB) {
    return userA < userB ? [userA, userB] : [userB, userA];
}

/* Cache helpers */
const friendsListCache = new Map();
const incomingRequestsCache = new Map();
const sentRequestsCache = new Map();

export function invalidateFriendsListCache(userId) {
    if (!userId) return;
    friendsListCache.delete(String(userId));
}

export function invalidateIncomingRequestsCache(userId) {
    if (!userId) return;
    incomingRequestsCache.delete(String(userId));
}

export function invalidateSentRequestsCache(userId) {
    if (!userId) return;
    sentRequestsCache.delete(String(userId));
}

export function invalidateFriendsPageCaches(userId) {
    invalidateFriendsListCache(userId);
    invalidateIncomingRequestsCache(userId);
    invalidateSentRequestsCache(userId);
}

export function clearFriendsPageCaches() {
    friendsListCache.clear();
    incomingRequestsCache.clear();
    sentRequestsCache.clear();
}


/* Search / requests */
export async function searchUsers(searchTerm, currentUserId) {
    const trimmedSearch = searchTerm?.trim();

    if (!trimmedSearch) {
        return [];
    }

    if (!currentUserId) {
        throw new Error("Current user id is required.");
    }

    const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .or(`username.ilike.%${trimmedSearch}%,display_name.ilike.%${trimmedSearch}%`)
        .neq("id", currentUserId)
        .order("display_name", { ascending: true })
        .limit(6);

    if (error) {
        throw error;
    }

    return data ?? [];
}

export async function sendFriendRequest(receiverId, currentUserId) {
    if (!receiverId) {
        throw new Error("Receiver id is required");
    }

    if (!currentUserId) {
        throw new Error("Current user id is required");
    }

    if (currentUserId === receiverId) {
        throw new Error("You cannot send a friend request to yourself.");
    }

    const [userOneId, userTwoId] = sortFriendsIds(currentUserId, receiverId);

    const { data: existingFriendship, error: friendshipError } = await supabase
        .from("friendships")
        .select("id")
        .eq("user_one_id", userOneId)
        .eq("user_two_id", userTwoId)
        .maybeSingle();

    if (friendshipError) {
        throw friendshipError;
    }

    if (existingFriendship) {
        throw new Error("You are already friends with this user.");
    }

    const { data: existingRequest, error: requestError } = await supabase
        .from("friend_requests")
        .select("id, sender_id, receiver_id, status")
        .or(
            `and(sender_id.eq.${currentUserId},receiver_id.eq.${receiverId},status.eq.pending),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUserId},status.eq.pending)`
        )
        .maybeSingle();

    if (requestError) {
        throw requestError;
    }

    if (existingRequest) {
        throw new Error("A pending friend request already exists");
    }

    const { data, error } = await supabase
        .from("friend_requests")
        .insert({
            sender_id: currentUserId,
            receiver_id: receiverId,
            status: "pending",
        })
        .select()
        .single();

    if (error) {
        throw error;
    }

    invalidateSentRequestsCache(currentUserId);
    invalidateIncomingRequestsCache(receiverId);

    return data;
}

export async function getIncomingFriendRequests(currentUserId, options = {}) {
    if (!currentUserId) {
        throw new Error("Current user id is required");
    }

    const { forceRefresh = false } = options;
    const cacheKey = String(currentUserId);

    if (!forceRefresh && incomingRequestsCache.has(cacheKey)) {
        return incomingRequestsCache.get(cacheKey);
    }

    const { data, error } = await supabase
        .from("friend_requests")
        .select(`
            id,
            sender_id,
            receiver_id,
            status,
            created_at,
            sender_profile:profiles!friend_requests_sender_id_fkey (
                id,
                username,
                display_name,
                avatar_url
            )
        `)
        .eq("receiver_id", currentUserId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

    if (error) {
        throw error;
    }

    const finalData = data ?? [];
    incomingRequestsCache.set(cacheKey, finalData);

    return finalData;
}

export async function acceptFriendRequest(requestId, currentUserId) {
    if (!requestId) {
        throw new Error("Request id is required.");
    }

    if (!currentUserId) {
        throw new Error("Current user id is required.");
    }

    const { data: request, error: requestError } = await supabase
        .from("friend_requests")
        .select("id, sender_id, receiver_id, status")
        .eq("id", requestId)
        .maybeSingle();

    if (requestError) {
        throw requestError;
    }

    if (!request) {
        throw new Error("Friend request not found.");
    }

    if (request.receiver_id !== currentUserId) {
        throw new Error("You can only accept requests sent to you.");
    }

    if (request.status !== "pending") {
        throw new Error("This request is no longer pending.");
    }

    const senderId = request.sender_id;
    const receiverId = request.receiver_id;

    const [userOneId, userTwoId] = sortFriendsIds(senderId, receiverId);

    const { data: existingFriendship, error: friendshipCheckError } = await supabase
        .from("friendships")
        .select("id")
        .eq("user_one_id", userOneId)
        .eq("user_two_id", userTwoId)
        .maybeSingle();

    if (friendshipCheckError) {
        throw friendshipCheckError;
    }

    if (!existingFriendship) {
        const { error: friendshipInsertError } = await supabase
            .from("friendships")
            .insert({
                user_one_id: userOneId,
                user_two_id: userTwoId,
            });

        if (friendshipInsertError) {
            throw friendshipInsertError;
        }
    }

    const { error: deleteError } = await supabase
        .from("friend_requests")
        .delete()
        .eq("id", requestId);

    if (deleteError) {
        throw deleteError;
    }

    invalidateFriendsPageCaches(receiverId);
    invalidateFriendsPageCaches(senderId);
    invalidateProfileFriendsListCache(senderId);
    invalidateProfileFriendsListCache(receiverId);

    return true;
}

export async function declineFriendRequest(requestId, currentUserId) {
    if (!requestId) {
        throw new Error("Request id is required.");
    }

    if (!currentUserId) {
        throw new Error("Current user id is required.");
    }

    const { data: request, error: requestError } = await supabase
        .from("friend_requests")
        .select("id, sender_id, receiver_id, status")
        .eq("id", requestId)
        .maybeSingle();

    if (requestError) {
        throw requestError;
    }

    if (!request) {
        throw new Error("Friend request not found.");
    }

    if (request.receiver_id !== currentUserId) {
        throw new Error("You can only decline requests sent to you.");
    }

    if (request.status !== "pending") {
        throw new Error("This request is no longer pending.");
    }

    const { error: deleteError } = await supabase
        .from("friend_requests")
        .delete()
        .eq("id", requestId);

    if (deleteError) {
        throw deleteError;
    }

    const senderId = request.sender_id;
    const receiverId = request.receiver_id;

    invalidateIncomingRequestsCache(receiverId);
    invalidateSentRequestsCache(senderId);

    return true;
}

export async function getSentFriendRequests(currentUserId, options = {}) {
    if (!currentUserId) {
        throw new Error("Current user id is required.");
    }

    const { forceRefresh = false } = options;
    const cacheKey = String(currentUserId);

    if (!forceRefresh && sentRequestsCache.has(cacheKey)) {
        return sentRequestsCache.get(cacheKey);
    }

    const { data, error } = await supabase
        .from("friend_requests")
        .select(`
            id,
            sender_id,
            receiver_id,
            status,
            created_at,
            receiver_profile:profiles!friend_requests_receiver_id_fkey (
                id,
                username,
                display_name,
                avatar_url
            )
        `)
        .eq("sender_id", currentUserId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

    if (error) {
        throw error;
    }

    const finalData = data ?? [];
    sentRequestsCache.set(cacheKey, finalData);

    return finalData;
}

export async function cancelFriendRequest(requestId, currentUserId) {
    if (!requestId) {
        throw new Error("Request id is required.");
    }

    if (!currentUserId) {
        throw new Error("Current user id is required.");
    }

    const { data: request, error: requestError } = await supabase
        .from("friend_requests")
        .select("id, sender_id, status")
        .eq("id", requestId)
        .maybeSingle();

    if (requestError) {
        throw requestError;
    }

    if (!request) {
        throw new Error("Friend request not found.");
    }

    if (request.sender_id !== currentUserId) {
        throw new Error("You can only cancel your own requests.");
    }

    if (request.status !== "pending") {
        throw new Error("Only pending requests can be cancelled.");
    }

    const { error } = await supabase
        .from("friend_requests")
        .delete()
        .eq("id", requestId);

    if (error) {
        throw error;
    }

    invalidateSentRequestsCache(currentUserId);
    invalidateIncomingRequestsCache(request.receiver_id);

    return true;
}


/* Friends tab RPC */

export async function getFriendsList(currentUserId, options = {}) {
    if (!currentUserId) {
        throw new Error("Current user id is required.");
    }

    const { forceRefresh = false } = options;
    const cacheKey = String(currentUserId);

    if (!forceRefresh && friendsListCache.has(cacheKey)) {
        return friendsListCache.get(cacheKey);
    }

    const { data, error } = await supabase.rpc("get_friends_list_cards");

    if (error) {
        throw error;
    }

    const finalData = (data ?? []).map((friend) => ({
        ...friend,
        entryCount: Number(friend.entry_count ?? 0),
        mutualCount: 0,
        recentRestaurant: friend.recent_restaurant ?? null,
        recentTime: friend.recent_time ?? null,
    }));

    friendsListCache.set(cacheKey, finalData);

    return finalData;
}


/* Feed tab RPC */
export async function getFriendsFeed(currentUserId, options = {}) {
    if (!currentUserId) {
        throw new Error("Current user id is required.");
    }

    const { limit = 10 } = options;

    const { data, error } = await supabase.rpc("get_friends_feed_cards", {
        limit_count: limit,
    });

    if (error) {
        throw error;
    }

    const feedCardsWithImageUrls = await Promise.all(
        (data ?? []).map(async (card) => {
            if (!card.photo_path) {
                return {
                    id: card.id,
                    friendId: card.friend_id,
                    restaurantId: card.restaurant_id,
                    displayName: card.display_name,
                    userName: card.username,
                    userAvatar: card.user_avatar,
                    date: card.date,
                    restaurantName: card.restaurant_name,
                    location: card.location,
                    rating: card.rating !== null ? Number(card.rating) : null,
                    dishCount: Number(card.dish_count ?? 0),
                    photoUrl: null,
                };
            }

            const photoUrl = await getDishPhotoUrl(card.photo_path);

            return {
                id: card.id,
                friendId: card.friend_id,
                restaurantId: card.restaurant_id,
                displayName: card.display_name,
                userName: card.username,
                userAvatar: card.user_avatar,
                date: card.date,
                restaurantName: card.restaurant_name,
                location: card.location,
                rating: card.rating !== null ? Number(card.rating) : null,
                dishCount: Number(card.dish_count ?? 0),
                photoUrl,
            };
        })
    );

    return feedCardsWithImageUrls;
}

export async function getFriendshipStatus(currentUserId, viewedUserId) {
    if (!currentUserId) {
        throw new Error("Current user id is required.");
    }

    if (!viewedUserId) {
        throw new Error("Viewed user id is required.");
    }

    if (currentUserId === viewedUserId) {
        return {
            status: "self",
            requestId: null,
        };
    }

    const [userOneId, userTwoId] = sortFriendsIds(currentUserId, viewedUserId);

    const { data: friendship, error: friendshipError } = await supabase
        .from("friendships")
        .select("id")
        .eq("user_one_id", userOneId)
        .eq("user_two_id", userTwoId)
        .maybeSingle();

    if (friendshipError) {
        throw friendshipError;
    }

    if (friendship) {
        return {
            status: "friends",
            requestId: null,
        };
    }

    const { data: pendingRequest, error: requestError } = await supabase
        .from("friend_requests")
        .select("id, sender_id, receiver_id, status")
        .or(
            `and(sender_id.eq.${currentUserId},receiver_id.eq.${viewedUserId},status.eq.pending),and(sender_id.eq.${viewedUserId},receiver_id.eq.${currentUserId},status.eq.pending)`
        )
        .maybeSingle();

    if (requestError) {
        throw requestError;
    }

    if (pendingRequest) {
        return {
            status: "pending",
            requestId: pendingRequest.id,
            senderId: pendingRequest.sender_id,
            receiverId: pendingRequest.receiver_id,
        };
    }

    return {
        status: "not_friends",
        requestId: null,
    };
}

export async function removeFriend(currentUserId, viewedUserId) {
    if (!currentUserId) {
        throw new Error("Current user id is required.");
    }

    if (!viewedUserId) {
        throw new Error("Viewed user id is required.");
    }

    const [userOneId, userTwoId] = sortFriendsIds(currentUserId, viewedUserId);

    const { data: existingFriendship, error: findError } = await supabase
        .from("friendships")
        .select("id, user_one_id, user_two_id")
        .eq("user_one_id", userOneId)
        .eq("user_two_id", userTwoId)
        .maybeSingle();

    if (findError) {
        throw findError;
    }

    if (!existingFriendship) {
        throw new Error("Friendship not found.");
    }

    const { error: deleteError } = await supabase
        .from("friendships")
        .delete()
        .eq("id", existingFriendship.id);

    if (deleteError) {
        throw deleteError;
    }

    invalidateFriendsPageCaches(currentUserId);
    invalidateProfileFriendsListCache(currentUserId);
    invalidateProfileFriendsListCache(viewedUserId);

    return true;
}

export async function getRelationshipStatusesForUsers(currentUserId, userIds = []) {
    if (!currentUserId) {
        throw new Error("Current user id is required.");
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
        return {};
    }

    const uniqueUserIds = [...new Set(userIds.filter(Boolean))].filter(
        (id) => id !== currentUserId
    );

    if (uniqueUserIds.length === 0) {
        return {};
    }

    const statusesByUserId = {};

    for (const userId of uniqueUserIds) {
        statusesByUserId[userId] = {
            status: "not_friends",
            requestId: null,
            senderId: null,
            receiverId: null,
        };
    }

    const { data: friendshipRows, error: friendshipError } = await supabase
        .from("friendships")
        .select("id, user_one_id, user_two_id")
        .or(
            uniqueUserIds
                .map(
                    (userId) =>
                        `and(user_one_id.eq.${sortFriendsIds(currentUserId, userId)[0]},user_two_id.eq.${sortFriendsIds(currentUserId, userId)[1]})`
                )
                .join(",")
        );

    if (friendshipError) {
        throw friendshipError;
    }

    for (const row of friendshipRows ?? []) {
        const otherUserId =
            row.user_one_id === currentUserId ? row.user_two_id : row.user_one_id;

        if (otherUserId) {
            statusesByUserId[otherUserId] = {
                status: "friends",
                requestId: null,
                senderId: null,
                receiverId: null,
            };
        }
    }

    const { data: requestRows, error: requestError } = await supabase
        .from("friend_requests")
        .select("id, sender_id, receiver_id, status")
        .eq("status", "pending")
        .or(
            uniqueUserIds
                .map(
                    (userId) =>
                        `and(sender_id.eq.${currentUserId},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUserId})`
                )
                .join(",")
        );

    if (requestError) {
        throw requestError;
    }

    for (const row of requestRows ?? []) {
        const otherUserId =
            row.sender_id === currentUserId ? row.receiver_id : row.sender_id;

        if (otherUserId && statusesByUserId[otherUserId]?.status !== "friends") {
            statusesByUserId[otherUserId] = {
                status: "pending",
                requestId: row.id,
                senderId: row.sender_id,
                receiverId: row.receiver_id,
            };
        }
    }

    return statusesByUserId;
}

// For Profile page.
const profileFriendsListCache = new Map();

export function invalidateProfileFriendsListCache(userId) {
    if(!userId) {
        return
    }

    profileFriendsListCache.delete(String(userId))
}

export async function getProfileFriendsList(viewedUserId, options = {}) {
    if(!viewedUserId) { 
        throw new Error("Viewed user id is required")
    }

    const {forceRefresh = false} = options
    const cacheKey = String(viewedUserId)

    if(!forceRefresh && profileFriendsListCache.has(cacheKey)) {
        return profileFriendsListCache.get(cacheKey)
    }
    const {data, error} = await supabase.rpc("get_profile_friends_list", {
        target_user_id: viewedUserId
    })

    if(error) {
        throw error
    }
    const finalData = data ?? []
    profileFriendsListCache.set(cacheKey, finalData)

    return finalData
}