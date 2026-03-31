import { Link } from "react-router-dom";
import { IoMenuOutline } from "react-icons/io5";
import { PiBowlFood } from "react-icons/pi";
import NavLinkItem from "../common/NavLinkItem";
import { IoSearchOutline } from "react-icons/io5";
import { useState, useEffect } from "react";

export default function TopNavigation() {
    const navlinks = [
        { label: "Map", path: "/map" },
        { label: "My Diary", path: "/diary" },
        { label: "Friends", path: "/friends" },
        { label: "Collections", path: "/collections" },
        { label: "Profile", path: "/profile" },
    ]

    const [isMenuOpen, setIsMenuOpen] = useState(false)

    useEffect(() => {
        function handleResize() {
            if (window.innerWidth >= 1024) {
                setIsMenuOpen(false);
            }
        }

        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

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

                <div className="hidden lg:flex relative items-center">
                    <IoSearchOutline className="absolute left-3 text-stone-400" />
                    <input type="text" className="bg-[rgb(245,232,214)] rounded-lg px-3 py-2 pl-10 focus:outline-[rgb(203,84,51)] text-sm w-80 placeholder:text-stone-400" placeholder="Search for a restaurant" />
                </div>

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
                            x
                        </button>
                    </div>

                    <div className="mt-4 ml-6 flex flex-col gap-6">
                        {navlinks.map((item) => (
                            <NavLinkItem
                                key={item.path}
                                label={item.label}
                                path={item.path}
                                onClick={() => setIsMenuOpen(false)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}