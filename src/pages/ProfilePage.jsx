import { IoBookOutline } from "react-icons/io5";
import { MdPeopleOutline } from "react-icons/md"
import { IoPricetagsOutline, IoLocationOutline } from "react-icons/io5";
import TagPill from "../components/ui/TagPill";

export default function ProfilePage() {

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
        <div className="flex flex-col gap-6 max-w-3xl mx-auto">

            {/* Name / Pic / Location / Bio */}
            <div className="bg-white flex flex-col justify-center items-center p-10 rounded-lg shadow-xs">
                {/* Placeholder profile pic */}
                <div className="bg-gray-300 w-20 h-20 rounded-full" />

                {/* Name */}
                <h1 className="text-2xl text-stone-800 font-semibold mt-4">Simone Lue</h1>

                {/* Location  */}
                <div className="flex flex-row items-center mt-1">
                    <IoLocationOutline className="text-[rgb(137,122,114)] text-sm" />
                    <p className="text-sm text-[rgb(137,122,114)]">Vancouver, BC</p>
                </div>

                {/* Bio */}
                <p className="text-sm text-[rgb(137,122,114)] text-center mt-4">I am a big back who loves food. Always looking for the best sushi, pho or pasta.</p>
            </div>


            {/* Stats: Entries, Places, Friends  */}
            <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center bg-white shadow-xs rounded-lg p-6 gap-1">
                    <IoBookOutline className="text-[rgb(203,84,51)] text-lg" />
                    <p className="text-lg text-stone-800 font-semibold">47</p>
                    <p className="text-sm text-[rgb(137,122,114)]">Entries</p>
                </div>
                <div className="flex flex-col items-center bg-white shadow-xs rounded-lg p-6 gap-1">
                    <IoLocationOutline className="text-[rgb(203,84,51)] text-lg" />
                    <p className="text-lg text-stone-800 font-semibold">23</p>
                    <p className="text-sm text-[rgb(137,122,114)]">Places</p>
                </div>
                <div className="flex flex-col items-center bg-white shadow-xs rounded-lg p-6 gap-1">
                    <MdPeopleOutline className="text-[rgb(203,84,51)] text-xl" />
                    <p className="text-lg text-stone-800 font-semibold">12</p>
                    <p className="text-sm text-[rgb(137,122,114)]">Friends</p>
                </div>
            </div>

            {/* Tags */}
            <div className="bg-white shadow-xs rounded-lg p-6 flex flex-col gap-3">
                <div className="flex flex-row items-center gap-2">
                    <IoPricetagsOutline className="relative text-[rgb(203,84,51)] text-sm top-[1px]" />
                    <p className="text-stone-800 text-sm font-semibold">Tags</p>
                </div>

                <div className="flex flex-row gap-2 flex-wrap">
                    <TagPill label="Italian" />
                    <TagPill label="Japanese" />
                    <TagPill label="Pho" />
                    <TagPill label="Pasta" />
                    <TagPill label="Pasta" />
                    <TagPill label="Pasta" />
                    <TagPill label="Pasta" />
                    <TagPill label="Pasta" />
                    <TagPill label="Pasta" />
                </div>
            </div>


            <div className="mt-auto border border-red-300 rounded-lg">
                <button
                    onClick={handleLogOut}
                    className="w-full text-center text-red-500 hover:cursor-pointer hover:bg-red-100 pl-4 py-2 rounded-lg"
                >
                    Sign Out
                </button>
            </div>
        </div>
    )
}