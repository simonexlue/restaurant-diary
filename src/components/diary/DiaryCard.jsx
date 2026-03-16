export default function DiaryCard({
    id,
    name,
    address,
    entryCount,
    lastVisited,
    recentDishes,
}) {
    return (
        <div className="border rounded-lg px-3 py-2 bg-white">
            <p>{name}</p>
            <p>{address}</p>
            <p>{entryCount} entries</p>
            <p>Last Visited: {lastVisited || "No visits yet"}</p>
            <p>
                {recentDishes.length > 0
                    ? recentDishes.join(", ")
                    : "No dishes logged yet"}
            </p>
        </div>
    );
}