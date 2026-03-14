export default function DiaryCard({ id, name, address, entryCount, lastVisited, recentDishes }) {

    return (
        <div className="py-2 border rounded-lg px-3 py-2 bg-white">
            <p>{name}</p>
            <p>{address}</p>
            <p>{entryCount} entries</p>
            <p>Last Visited: {lastVisited}</p>
            <p>{recentDishes}</p>

        </div>
    )
}