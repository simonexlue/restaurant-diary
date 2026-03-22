import { supabase } from "../lib/supabase";

function sortFriendsIds(userA, userB) {
    return userA < userB ? [userA, userB] : [userB, userA];
}

export async function searchUsers(searchTerm, currentUserId) {
    const trimmedSearch  = searchTerm?.trim();

    if(!trimmedSearch) {
        return []
    }

    if(!currentUserId) {
        throw new Error("Current user id is required.")
    }

    const {data, error} = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .or(`username.ilike.%${trimmedSearch}%,display_name.ilike.%${trimmedSearch}%`)
        .neq("id", currentUserId)
        .order("display_name", {ascending: true})
        .limit(6);

    if(error) {
        throw error;
    }

    return data ?? [];
}

export async function sendFriendRequest(receiverId, currentUserId) {
    if(!receiverId) {
        throw new Error("Receiver id is required");
    }

    if(!currentUserId) {
        throw new Error("Current user id is required")
    }

    if(currentUserId === receiverId) {
        throw new Error("You cannot send a friend request to yourself.")
    }

    const [userOneId, userTwoId] = sortFriendsIds(currentUserId, receiverId)

    const { data:existingFriendship, error:friendshipError} = await supabase
        .from("friendships")
        .select("id")
        .eq("user_one_id", userOneId)
        .eq("user_two_id", userTwoId)
        .maybeSingle();

        if(friendshipError) {
            throw friendshipError
        }

        if(existingFriendship) {
            throw new Error("You are already friends with this user.")
        }

        const {data: existingRequest, error: requestError} = await supabase
            .from("friend_requests")
            .select("id, sender_id, receiver_id, status")
            .or(
                `and(sender_id.eq.${currentUserId},receiver_id.eq.${receiverId},status.eq.pending),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUserId},status.eq.pending)`
            )
            .maybeSingle();

        if(requestError) {
            throw requestError
        }

        if(existingRequest){
            throw new Error("A pending friend request already exists")
        }

        const {data, error} = await supabase
            .from("friend_requests")
            .insert({
                sender_id: currentUserId,
                receiver_id: receiverId,
                status: "pending",
            })
            .select()
            .single()

        if(error) { 
            throw error
        }

        return data;
}

export async function getIncomingFriendRequests(currentUserId) {
    if(!currentUserId) {
        throw new Error("Current user id is required")
    }

    const {data, error} = await supabase
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

    return data ?? [];
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

    const [userOneId, userTwoId] = sortFriendsIds(request.sender_id, request.receiver_id);

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
        .select("id, receiver_id, status")
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

    return true;
}

export async function getSentFriendRequests(currentUserId) {
    if (!currentUserId) {
        throw new Error("Current user id is required.");
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

    return data ?? [];
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

    return true;
}

export async function getFriendsList(currentUserId) {
    if (!currentUserId) {
        throw new Error("Current user id is required.");
    }

    const { data: friendshipRows, error: friendshipsError } = await supabase
        .from("friendships")
        .select(`
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
        `)
        .or(`user_one_id.eq.${currentUserId},user_two_id.eq.${currentUserId}`);

    if (friendshipsError) {
        throw friendshipsError;
    }

    const baseFriends = (friendshipRows ?? []).map((row) => {
        const friendProfile =
            row.user_one_id === currentUserId ? row.user_two : row.user_one;

        return {
            id: friendProfile?.id,
            username: friendProfile?.username,
            display_name: friendProfile?.display_name,
            avatar_url: friendProfile?.avatar_url,
        };
    });

    if (baseFriends.length === 0) {
        return [];
    }

    const friendIds = baseFriends.map((friend) => friend.id).filter(Boolean);

const { data: entryRows, error: entriesError } = await supabase
    .from("dish_entries")
    .select(`
        id,
        user_id,
        date_tried,
        restaurant:restaurants (
            id,
            name
        )
    `)
    .in("user_id", friendIds)
    .order("date_tried", { ascending: false })
    .order("created_at", { ascending: false });

    if (entriesError) {
        throw entriesError;
    }

    const entryStatsByUserId = {};

 for (const friendId of friendIds) {
    entryStatsByUserId[friendId] = {
        entryCount: 0,
        recentRestaurant: null,
        recentTime: null,
    };
}

for (const row of entryRows ?? []) {
    const userId = row.user_id;

    if (!entryStatsByUserId[userId]) {
        entryStatsByUserId[userId] = {
            entryCount: 0,
            recentRestaurant: null,
            recentTime: null,
        };
    }

    entryStatsByUserId[userId].entryCount += 1;

    if (!entryStatsByUserId[userId].recentTime) {
        entryStatsByUserId[userId].recentRestaurant = row.restaurant?.name ?? null;
        entryStatsByUserId[userId].recentTime = row.date_tried ?? null;
    }
}

    return baseFriends.map((friend) => {
        const stats = entryStatsByUserId[friend.id] ?? {
            entryCount: 0,
            recentRestaurant: null,
            recentTime: null,
        };

        return {
            ...friend,
            entryCount: stats.entryCount,
            mutualCount: 0,
            recentRestaurant: stats.recentRestaurant,
            recentTime: stats.recentTime,
        };
    });
}