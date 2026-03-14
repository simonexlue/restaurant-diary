import TagPill from "../ui/TagPill";

const SUGGESTED_TAGS = [
    "Spicy",
    "Sweet",
    "Savory",
    "Seafood",
    "Dessert",
    "Comfort Food",
    "Vegetarian",
    "Quick Bite",
];

export default function TagsSelector({
    selectedTags,
    customTagInput,
    setCustomTagInput,
    onToggleSuggestedTag,
    onAddCustomTag,
    onRemoveTag,
}) {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
                {SUGGESTED_TAGS.map((tag) => {
                    const isSelected = selectedTags.some(
                        (selectedTag) => selectedTag.toLowerCase() === tag.toLowerCase()
                    );

                    return (
                        <TagPill
                            key={tag}
                            label={tag}
                            selected={isSelected}
                            onClick={() => onToggleSuggestedTag(tag)}
                        />
                    );
                })}
            </div>

            <div className="flex gap-2">
                <input
                    type="text"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    placeholder="Add custom tag"
                    className="flex-1 rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-stone-500"
                />
                <button
                    type="button"
                    onClick={onAddCustomTag}
                    className="rounded-xl border border-stone-300 px-4 py-3 text-sm text-stone-700 transition hover:bg-stone-50"
                >
                    Add
                </button>
            </div>

            {selectedTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                        <TagPill
                            key={tag}
                            label={tag}
                            selected
                            removable
                            onRemove={() => onRemoveTag(tag)}
                        />
                    ))}
                </div>
            ) : null}
        </div>
    );
}