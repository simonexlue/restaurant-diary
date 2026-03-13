export default function SaveRestaurantModal({
    title, name, address, setName, setAddress, onConfirm, onCancel,
}) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
            <div className="relative z-[10000] w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <h2 className="mb-4 text-lg font-semibold text-stone-800">{title}</h2>

                <div className="mb-3">
                    <label className="mb-1 block text-sm text-stone-600">
                        Restaurant Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-stone-500"
                    />
                </div>

                <div className="mb-4">
                    <label className="mb-1 block text-sm text-stone-600">Address</label>
                    <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-stone-500"
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={onConfirm}
                        className="rounded-lg bg-stone-800 px-4 py-2 text-sm text-white hover:bg-stone-700"
                    >
                        Confirm Save
                    </button>

                    <button
                        onClick={onCancel}
                        className="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}