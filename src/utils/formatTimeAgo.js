export function formatTimeAgo(dateString) {
    if(!dateString) return ""

    const now = new Date()
    const created = new Date(dateString);
    
    const diffInMs = now - created;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
        return "Just now";
    }

    if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
    }

    return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
}