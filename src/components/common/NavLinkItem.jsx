import { Link } from "react-router-dom";

export default function NavLinkItem({ label, path }) {

    return (
        <Link to={path} className="text-[rgb(137,122,114)]" >{label}</Link>
    )
}