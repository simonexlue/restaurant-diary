import { useState } from "react";
import image from "../assets/auth-hero.jpg";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [successMessage, setSuccessMessage] = useState("")
    const [isRedirecting, setIsRedirecting] = useState(false);
    const navigate = useNavigate();

    async function handleLogin(e) {
        e.preventDefault();
        setIsRedirecting(false)
        setLoading(true)
        setErrorMessage("")
        setSuccessMessage("")

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            })

            if (error) {
                throw error;
            }
            setIsRedirecting(true)
            setSuccessMessage("Login successful! Redirecting...");

            setTimeout(() => {
                navigate("/")
            }, 3000)

        } catch (error) {
            setErrorMessage(error.message || "Something went wrong")
        } finally {
            setLoading(false)
        }

    }

    return (
        <div className="relative min-h-screen w-screen bg-stone-100 xl:flex xl:flex-row">
            {/* Background image for small/md/lg */}
            <div className="absolute inset-0 xl:hidden">
                <img src={image} className="h-full w-full object-cover" />
            </div>

            {/* Left image side for xl+ */}
            <div className="hidden xl:block xl:w-1/2">
                <img src={image} className="h-screen w-full object-cover" />
            </div>

            {/* Form side */}
            <div className="relative z-10 flex min-h-screen w-full items-center justify-center xl:w-1/2 xl:bg-stone-100">
                <div className="w-[85%] max-w-md rounded-xl bg-stone-100 p-8 shadow-lg sm:w-[75%] md:w-[65%] lg:w-[55%] xl:w-[75%] xl:max-w-none xl:rounded-none xl:bg-transparent xl:p-0 xl:shadow-none">
                    <h4 className="mb-0 sm:mb-3 text-left text-3xl font-semibold text-stone-700">
                        Welcome Back
                    </h4>

                    <p className="hidden sm:block sm:mb-3 text-md text-stone-500">Sign in to continue</p>

                    <div className="mb-3 h-4 w-full border-b border-stone-300" />

                    <form onSubmit={handleLogin} className="mt-5 flex flex-col">
                        <div className="mb-4">
                            <label className="mb-2 block text-stone-700">Email</label>
                            <input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                type="email"
                                placeholder="you@example.com"
                                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 focus:outline-[rgb(203,84,51)]"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="mb-2 block text-stone-700">Password</label>
                            <input
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                type="password"
                                placeholder="********"
                                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 focus:outline-[rgb(203,84,51)] "
                            />
                        </div>

                        {errorMessage && <p className="mb-4 text-sm text-red-600">{errorMessage}</p>}
                        {successMessage && <p className="mb-4 text-sm text-green-600">{successMessage}</p>}

                        <button type="submit" disabled={loading || isRedirecting} className="mb-4 h-10 rounded-md bg-[rgb(203,84,51)] py-2 text-sm text-white hover:cursor-pointer disabled:cursor-not-allowed">
                            {loading ? "Signing in..." : isRedirecting ? "Redirecting..." : "Sign In"}
                        </button>

                        <div className="mt-4 flex justify-center gap-1 text-stone-500">
                            <p>Don't have an account?</p>
                            <Link to="/signup" className="text-[rgb(203,84,51)]">
                                Sign up
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}