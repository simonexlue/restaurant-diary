export default function SelectedRestaurantCard({ restaurant, onClear }) {
    if (!restaurant) return null;

    return (
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="font-semibold text-stone-800">{restaurant.name}</p>
                    <p className="mt-1 text-sm text-stone-500">{restaurant.address}</p>
                </div>

                <button
                    type="button"
                    onClick={onClear}
                    className="text-sm text-stone-500 underline"
                >
                    Change
                </button>
            </div>
        </div>
    );
}