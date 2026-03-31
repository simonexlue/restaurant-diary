import { Link } from "react-router-dom";

export default function NavLinkItem({ label, path, onClick, variant = "desktop" }) {

    return (
        <Link
            to={path}
            onClick={onClick}
            className={`
                text-[rgb(137,122,114)]
                ${variant === "mobile" ? "hover:bg-[rgb(244,232,215)] pl-4 py-2 rounded-lg" : ""}
            `} >
            {label}
        </Link>
    )
}