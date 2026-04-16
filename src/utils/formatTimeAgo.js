export function formatTimeAgo(dateString) {
    if (!dateString) return "";

    const now = new Date();
    const created = new Date(dateString);

    const diffInMs = now - created;
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) {
        return "Just now";
    }

    if (diffInMinutes < 60) {
        return `${diffInMinutes} min${diffInMinutes === 1 ? "" : "s"} ago`;
    }

    if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
    }

    return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
}