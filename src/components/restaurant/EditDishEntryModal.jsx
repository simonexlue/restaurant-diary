import { useEffect, useState } from "react";
import CreateDishEntry from "../../pages/CreateDishEntry";
import { getDishEntryById, getDishPhotoUrl } from "../../services/diary";
import { getRestaurantById } from "../../services/restaurant";
import useUserProfile from "../../hooks/useUserProfile";

export default function EditDishEntryModal({
    entryId,
    onClose,
    onSaved,
}) {
    const { user } = useUserProfile();
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [entry, setEntry] = useState(null);
    const [restaurant, setRestaurant] = useState(null);

    useEffect(() => {
        async function loadEditData() {
            if (!entryId || !user?.id) {
                return;
            }

            try {
                setLoading(true);
                setErrorMessage("");

                const entryData = await getDishEntryById(entryId, user.id);
                const restaurantData = await getRestaurantById(entryData.restaurant_id);

                let photoUrl = null;
                if (entryData.photo_path) {
                    photoUrl = await getDishPhotoUrl(entryData.photo_path);
                }

                setEntry({
                    ...entryData,
                    photoUrl,
                });
                setRestaurant(restaurantData);
            } catch (error) {
                setErrorMessage(error.message || "Failed to load dish entry.");
            } finally {
                setLoading(false);
            }
        }

        loadEditData();
    }, [entryId, user]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-[rgb(248,245,242)] p-6 shadow-xl">
                {loading && <p className="text-sm text-stone-500">Loading entry...</p>}

                {!loading && errorMessage && (
                    <div className="flex flex-col gap-4">
                        <p className="text-sm text-red-600">{errorMessage}</p>
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-10 rounded-md border border-stone-200 bg-white px-4 text-sm text-stone-800"
                        >
                            Close
                        </button>
                    </div>
                )}

                {!loading && !errorMessage && entry && restaurant && (
                    <CreateDishEntry
                        mode="edit"
                        initialEntry={entry}
                        initialRestaurant={restaurant}
                        onCancelOverride={onClose}
                        onSuccess={onSaved}
                        isModal={true}
                    />
                )}
            </div>
        </div>
    );
}