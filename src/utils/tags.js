export function normalizeTags(tags) {
    if (!tags) return [];

    if (Array.isArray(tags)) {
        return tags.map((tag) => String(tag).trim()).filter(Boolean);
    }

    return [String(tags).trim()].filter(Boolean);
}

export function getTopTagsFromEntries(entries, limit = 8) {
    const tagCounts = new Map();

    for (const entry of entries) {
        const entryTags = normalizeTags(entry.tags);

        for (const tag of entryTags) {
            const currentCount = tagCounts.get(tag) || 0;
            tagCounts.set(tag, currentCount + 1);
        }
    }

    return Array.from(tagCounts.entries())
        .sort((a, b) => {
            if (b[1] !== a[1]) {
                return b[1] - a[1];
            }

            return a[0].localeCompare(b[0]);
        })
        .slice(0, limit)
        .map(([tag]) => tag);
}