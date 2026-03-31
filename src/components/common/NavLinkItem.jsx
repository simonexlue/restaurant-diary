import { Link } from "react-router-dom";

export default function NavLinkItem({ label, path, onClick }) {

    return (
        <Link to={path} onClick={onClick} className="text-[rgb(137,122,114)]" >{label}</Link>
    )
}