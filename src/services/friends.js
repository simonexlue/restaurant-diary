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
        .or(`username.ilike.%${trimmedSearch}%, display_name.ilike.%${trimmedSearch}%`)
        .range("id", currentUserId)
        .order("display_name", {ascending: true})
        .limit(6);

    if(error) {
        throw error;
    }

    return data ?? [];
}