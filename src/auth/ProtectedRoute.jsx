import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function ProtectedRoute({ children }) {
    const [loading, setLoading] = useState(true)
    const [session, setSession] = useState(null);

    useEffect(() => {
        async function getSession() {
            const { data } = await supabase.auth.getSession();
            setSession(data.session);
            setLoading(false);
        }

        getSession();
    }, [])

    if (loading) return null;
    if (!session) {
        return <Navigate to="/login" replace />
    }

    return children
}