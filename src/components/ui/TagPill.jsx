export default function TagPill({
    label,
    selected = false,
    onClick,
    removable = false,
    onRemove,
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${selected
                ? "border-[rgb(203,84,51)] bg-[rgb(253,246,244)] text-[rgb(203,84,51)]"
                : "border-stone-300 bg-white text-[rgb(137,122,114)] hover:border-[rgb(203,84,51)] hover:bg-[rgb(253,246,244)] hover:text-[rgb(203,84,51)]"
                }`}
        >
            <span>{label}</span>

            {removable && (
                <span
                    onClick={(event) => {
                        event.stopPropagation();
                        onRemove?.();
                    }}
                    className="text-xs"
                    aria-hidden="true"
                >
                    ✕
                </span>
            )}
        </button>
    )
}