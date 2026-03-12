import { useState } from "react";
import image from "../assets/auth-hero.jpg";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";

export default function Signup() {
    const [fullName, setFullName] = useState("")
    const [username, setUserName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [successMessage, setSuccessMessage] = useState("")

    async function signUpNewUser({ fullName, username, email, password }) {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: `${window.location.origin}/login`,
                data: {
                    username,
                    display_name: fullName
                }
            }
        })

        if (error) {
            throw error;
        }

        if (!data.user) {
            throw new Error("User account was not created.");
        }

        return data
    }

    async function handleCreate(e) {
        e.preventDefault()

        setErrorMessage("")
        setSuccessMessage("")

        // Validation
        if (!fullName.trim() || !username.trim() || !email.trim() || !password.trim()) {
            setErrorMessage("Please fill in all fields.");
            return;
        }

        if (password.length < 8) {
            setErrorMessage("Password must be at least 8 characters.");
            return;
        }

        try {
            setLoading(true)

            const data = await signUpNewUser({
                fullName: fullName.trim(),
                username: username.trim(),
                email: email.trim(),
                password,
            })

            setFullName("")
            setUserName("")
            setEmail("")
            setPassword("")

            if (data.session) {
                setSuccessMessage("Account created successfully!")
            } else {
                setSuccessMessage("Account created. Check your email to confirm.")
            }
        } catch (error) {
            setErrorMessage(error.message || "Something went wrong.")
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
                    <h4 className="mb-0 sm:mb-3 text-left text-2xl md:text-3xl font-semibold text-stone-700">
                        Create Your Account
                    </h4>

                    <p className="hidden sm:block sm:mb-3 text-sm md:text-md text-stone-500">Start documenting your food adventures</p>

                    <div className="mb-3 h-4 w-full border-b border-stone-300" />

                    <form className="mt-2 md:mt-5 flex flex-col" onSubmit={handleCreate} >
                        <div className="mb-4">
                            <label className="mb-2 block text-stone-700">Full Name</label>
                            <input
                                type="text"
                                placeholder="Jane Doe"
                                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 focus:outline-[rgb(203,84,51)]"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="mb-2 block text-stone-700">Username</label>
                            <input
                                type="text"
                                placeholder="janedoe123"
                                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 focus:outline-[rgb(203,84,51)]"
                                value={username}
                                onChange={(e) => setUserName(e.target.value)}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="mb-2 block text-stone-700">Email</label>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 focus:outline-[rgb(203,84,51)]"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="mb-6">
                            <label className="mb-2 block text-stone-700">Password</label>
                            <input
                                type="password"
                                placeholder="********"
                                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 focus:outline-[rgb(203,84,51)]"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {errorMessage && <p className="mb-4 text-sm text-red-600">{errorMessage}</p>}
                        {successMessage && <p className="mb-4 text-sm text-green-600">{successMessage}</p>}

                        <button type="submit" disabled={loading} className="mb-4 h-10 rounded-md bg-[rgb(203,84,51)] py-2 text-sm text-white hover:cursor-pointer disabled:cursor-not-allowed">
                            {loading ? "Creating Account..." : "Create Account"}
                        </button>

                        <div className="mt-4 flex justify-center gap-1 text-stone-500">
                            <p>Have an account?</p>
                            <Link to="/login" className="text-[rgb(203,84,51)]">
                                Sign in
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}