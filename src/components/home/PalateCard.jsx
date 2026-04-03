export default function PalateCard({ label, percent }) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex flex-row items-center justify-between">
                <p className="text-sm text-stone-800">{label}</p>
                <p className="text-xs text-[rgb(137,122,114)]">{percent}%</p>
            </div>

            <div className="h-2 w-full rounded-full bg-stone-200">
                <div
                    className="h-2 rounded-full bg-[rgb(203,84,51)]"
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>

    )
}