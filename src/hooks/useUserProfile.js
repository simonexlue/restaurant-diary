import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function useUserProfile(){
    const [profile, setProfile] = useState(null);
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState("")

    useEffect(() => {
        async function fetchUserProfile() {
            try {
                setLoading(true)
                setErrorMessage("")

                const {
                    data: {user}, 
                    error: userError,
                } = await supabase.auth.getUser();

                if(!user) {
                    setUser(null)
                    setProfile(null)
                    return;
                }
                setUser(user)

                const {data: profileData, error:profileError} = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single()

                if(profileError) {
                    throw profileError
                }

                setProfile(profileData)

            } catch (error) {
                setErrorMessage(error.message || "Failed to load profile")
            } finally {
                setLoading(false)
            }
        }

        fetchUserProfile();
    }, [])

    return {
        user,
        profile,
        loading,
        errorMessage
    }
}