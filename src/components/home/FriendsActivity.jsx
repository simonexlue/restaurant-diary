import { MdPeopleOutline } from "react-icons/md"

export default function FriendsActivity({ name, recentVisit, time }) {
    return (
        <div className="flex flex-row items-center gap-3">
            <div className="flex flex-row gap-3 items-center">
                {/* Profile pic placeholder */}
                <div className="bg-stone-100 rounded-4xl p-3">
                    <MdPeopleOutline />
                </div>
            </div>

            <div>
                <div className="flex flex-row gap-1">
                    <p className="text-stone-800">{name}</p>
                    <p className="text-[rgb(137,122,114)]">visited</p>
                    <p className="text-[rgb(203,84,51)]">{recentVisit}</p>
                </div>
                <p className="text-[rgb(137,122,114)] text-sm">{time}</p>
            </div>
        </div>

    )
}