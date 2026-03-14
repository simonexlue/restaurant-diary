import { DayPicker } from "react-day-picker";

export default function DateVisitedPicker({
    value,
    onSelect,
    isOpen,
    onToggle,
    datePickerRef,
}) {
    return (
        <div ref={datePickerRef} className="relative">
            <button
                type="button"
                className={`w-full border border-gray-300 rounded-lg py-2 flex items-start px-3 bg-[rgb(248,245,242)] ${value ? "text-stone-800" : "text-stone-400"
                    }`}
                onClick={onToggle}
            >
                {value ? value.toLocaleDateString() : "Pick a date"}
            </button>

            {isOpen && (
                <div className="absolute left-0 top-full mt-2 z-20">
                    <DayPicker
                        animate
                        mode="single"
                        selected={value}
                        onSelect={onSelect}
                        className="w-90 bg-white shadow-lg rounded-lg p-5 border border-gray-200"
                    />
                </div>
            )}
        </div>
    );
}