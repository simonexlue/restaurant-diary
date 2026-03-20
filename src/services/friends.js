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