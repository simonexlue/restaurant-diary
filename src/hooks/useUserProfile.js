import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

export default function useUserProfile() {
    const [profile, setProfile] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const inFlightRef = useRef(false);

    useEffect(() => {
        let isMounted = true;

        async function fetchUserProfile() {
            if (inFlightRef.current) {
                return;
            }

            try {
                inFlightRef.current = true;

                if (isMounted) {
                    setLoading(true);
                    setErrorMessage("");
                }

                const {
                    data: { session },
                    error: sessionError,
                } = await supabase.auth.getSession();

                if (sessionError) {
                    throw sessionError;
                }

                const currentUser = session?.user ?? null;

                if (!currentUser) {
                    if (isMounted) {
                        setUser(null);
                        setProfile(null);
                    }
                    return;
                }

                if (isMounted) {
                    setUser(currentUser);
                }

                const { data: profileData, error: profileError } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", currentUser.id)
                    .single();

                if (profileError) {
                    throw profileError;
                }

                if (isMounted) {
                    setProfile(profileData);
                }
            } catch (error) {
                if (isMounted) {
                    setErrorMessage(error.message || "Failed to load profile");
                }
            } finally {
                inFlightRef.current = false;
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        fetchUserProfile();

        return () => {
            isMounted = false;
        };
    }, []);

    return {
        user,
        profile,
        loading,
        errorMessage,
    };
}