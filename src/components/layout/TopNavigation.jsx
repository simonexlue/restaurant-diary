import { Link } from "react-router-dom";
import { IoMenuOutline } from "react-icons/io5";
import { PiBowlFood } from "react-icons/pi";
import NavLinkItem from "../common/NavLinkItem";
import { IoSearchOutline } from "react-icons/io5";

export default function TopNavigation() {
    const navlinks = [
        { label: "Map", path: "/map" },
        { label: "My Diary", path: "/diary" },
        { label: "Friends", path: "/friends" },
        { label: "Collections", path: "/collections" },
        { label: "Profile", path: "/profile" },
    ]

    return (
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

            <IoMenuOutline className="text-3xl md:text-4xl lg:hidden" />
        </header>
    )
}