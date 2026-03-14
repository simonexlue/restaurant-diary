import { IoLockClosedOutline, IoGlobeOutline } from "react-icons/io5";
import { MdPeopleOutline } from "react-icons/md";

export default function PrivacySelector({ value, onChange }) {
    function getPrivacyOptionClasses(option) {
        const isSelected = value === option;

        return `flex flex-col gap-2 items-center py-5 border w-1/3 rounded-lg transition-colors cursor-pointer ${isSelected
            ? "border-[rgb(203,84,51)] bg-[rgb(253,246,244)]"
            : "border-stone-300 hover:border-[rgb(203,84,51)] hover:bg-[rgb(253,246,244)]"
            }`;
    }

    function getPrivacyTextClasses(option) {
        const isSelected = value === option;

        return isSelected
            ? "text-[rgb(203,84,51)]"
            : "text-[rgb(137,122,114)] group-hover:text-[rgb(203,84,51)]";
    }

    return (
        <div className="flex flex-row justify-between gap-3">
            <div
                role="button"
                tabIndex={0}
                onClick={() => onChange("public")}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        onChange("public");
                    }
                }}
                className={`${getPrivacyOptionClasses("public")} group`}
            >
                <IoGlobeOutline
                    size={24}
                    className={
                        value === "public"
                            ? "text-[rgb(203,84,51)]"
                            : "text-[rgb(137,122,114)] group-hover:text-[rgb(203,84,51)]"
                    }
                />
                <p className={`text-sm ${getPrivacyTextClasses("public")}`}>Public</p>
                <p className={`text-xs ${getPrivacyTextClasses("public")}`}>Everyone</p>
            </div>

            <div
                role="button"
                tabIndex={0}
                onClick={() => onChange("friends")}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        onChange("friends");
                    }
                }}
                className={`${getPrivacyOptionClasses("friends")} group`}
            >
                <MdPeopleOutline
                    size={24}
                    className={
                        value === "friends"
                            ? "text-[rgb(203,84,51)]"
                            : "text-[rgb(137,122,114)] group-hover:text-[rgb(203,84,51)]"
                    }
                />
                <p className={`text-sm ${getPrivacyTextClasses("friends")}`}>Friends</p>
                <p className={`text-xs ${getPrivacyTextClasses("friends")}`}>Friends only</p>
            </div>

            <div
                role="button"
                tabIndex={0}
                onClick={() => onChange("private")}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        onChange("private");
                    }
                }}
                className={`${getPrivacyOptionClasses("private")} group`}
            >
                <IoLockClosedOutline
                    size={24}
                    className={
                        value === "private"
                            ? "text-[rgb(203,84,51)]"
                            : "text-[rgb(137,122,114)] group-hover:text-[rgb(203,84,51)]"
                    }
                />
                <p className={`text-sm ${getPrivacyTextClasses("private")}`}>Private</p>
                <p className={`text-xs ${getPrivacyTextClasses("private")}`}>Only you</p>
            </div>
        </div>
    );
}