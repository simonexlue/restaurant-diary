import { Link } from "react-router-dom";
import { IoMenuOutline } from "react-icons/io5";
import { PiBowlFood } from "react-icons/pi";
import NavLinkItem from "../common/NavLinkItem";
import { IoSearchOutline } from "react-icons/io5";
import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { supabase } from "../../lib/supabase";
import useUserProfile from "../../hooks/useUserProfile";
import { useNavigate } from "react-router-dom";

export default function TopNavigation() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const { profile, loading, errorMessage } = useUserProfile()
    const navigate = useNavigate();

    const navlinks = [
        { label: "Map", path: "/map" },
        { label: "My Diary", path: "/diary" },
        { label: "Friends", path: "/friends" },
        { label: "Profile", path: "/profile" },
    ]

    useEffect(() => {
        function handleResize() {
            if (window.innerWidth >= 1024) {
                setIsMenuOpen(false);
            }
        }

        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (errorMessage) {
        return <p>{errorMessage}</p>;
    }

    async function handleLogOut() {
        try {
            const { error } = await supabase.auth.signOut();

            if (error) {
                throw error;
            }

            navigate("/login");
        } catch (error) {
            console.error("Logout failed:", error.message);
        }
    }

    return (
        <>
            <header className="flex flex-row justify-between px-6 border-b py-5 items-center border-stone-300 sticky z-10 md:px-8 md:py-6">
                <Link to="/" className="flex items-center gap-2">
                    <PiBowlFood color="rgb(203,84,51)" className="text-3xl md:text-4xl relative top-[1px]" />
                    <h4 className="text-[rgb(32,26,22)] text-2xl md:text-3xl leading-none">BiteDiary</h4>
                </Link>

                <div className="hidden lg:flex lg:gap-10">
                    {navlinks.map((item) => (
                        <NavLinkItem label={item.label} path={item.path} />
                    ))}
                </div>

                {/* <div className="hidden lg:flex relative items-center">
                    <IoSearchOutline className="absolute left-3 text-stone-400" />
                    <input type="text" className="bg-[rgb(245,232,214)] rounded-lg px-3 py-2 pl-10 focus:outline-[rgb(203,84,51)] text-sm w-80 placeholder:text-stone-400" placeholder="Search for a restaurant" />
                </div> */}

                <button
                    type="button"
                    className="lg:hidden hover:cursor-pointer"
                    onClick={() => setIsMenuOpen(true)}
                >
                    <IoMenuOutline className="text-3xl md:text-4xl" />
                </button>
            </header >

            {/* Hamburger menu */}
            <div
                className={`fixed inset-0 z-[100] bg-black/40 transition-opacity duration-300 ${isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
                onClick={() => setIsMenuOpen(false)}
            >
                <div
                    className={`ml-auto h-full w-[88%] max-w-sm bg-white px-6 py-6 transform transition-transform duration-300 ${isMenuOpen ? "translate-x-0" : "translate-x-full"
                        }`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(false)}
                            className="cursor-pointer"
                        >
                            <IoClose size={18} className="text-[rgb(137,122,114)]" />
                        </button>
                    </div>

                    <div className="flex flex-col h-full">
                        <div className="mt-4 ml-6 mr-6 flex flex-col gap-6">
                            {navlinks.map((item) => (
                                <NavLinkItem
                                    key={item.path}
                                    label={item.label}
                                    path={item.path}
                                    onClick={() => setIsMenuOpen(false)}
                                    variant="mobile"
                                />
                            ))}
                        </div>

                        <div className="mt-auto ml-6 mr-6 mb-10">
                            <button
                                onClick={handleLogOut}
                                className="w-full text-left text-red-500 hover:bg-[rgb(244,232,215)] pl-4 py-2 rounded-lg"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}