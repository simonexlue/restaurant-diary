import { IoLocationOutline } from "react-icons/io5";

export default function FirstEntryGuideCard() {
    return (
        <div className="w-[100%] px-6">
            <div className="w-full rounded-lg border border-stone-200 bg-[rgb(248,245,242)] px-4 py-5">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <div className="rounded-full bg-[rgb(244,232,215)] p-2">
                            <IoLocationOutline className="text-[rgb(203,84,51)]" />
                        </div>
                        <div className="flex flex-col">
                            <p className="text-xs tracking-wide text-[rgb(137,122,114)]">
                                GET STARTED
                            </p>
                            <p className="text-lg text-stone-800">
                                Add your first entry
                            </p>
                        </div>
                    </div>

                    <p className="text-sm text-[rgb(137,122,114)]">
                        Open the map, search for a restaurant using Google suggestions,
                        and log your first dish.
                    </p>
                </div>
            </div>
        </div>
    );
}