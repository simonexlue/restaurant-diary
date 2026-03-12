import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "../lib/loadGoogleMaps";
import { fetchRestaurants, createManualRestaurant } from "../services/restaurant";

export default function MapPage() {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const savedMarkersRef = useRef([]);
    const tempMarkerRef = useRef(null);

    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const [manualPin, setManualPin] = useState(null);
    const [manualName, setManualName] = useState("");
    const [manualAddress, setManualAddress] = useState("");
    const [showManualSave, setShowManualSave] = useState(false);

    useEffect(() => {
        let isMounted = true;

        async function initializeMapPage() {
            try {
                setLoading(true);
                setErrorMessage("");

                await loadGoogleMaps();

                if (!mapRef.current) {
                    return;
                }

                const map = new window.google.maps.Map(mapRef.current, {
                    center: { lat: 49.2827, lng: -123.1207 },
                    zoom: 12,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                });

                mapInstanceRef.current = map;

                map.addListener("click", (event) => {
                    if (!event.latLng) return;

                    const lat = event.latLng.lat();
                    const lng = event.latLng.lng();

                    placeTemporaryMarker({ lat, lng });

                    setManualPin({ lat, lng });
                    setManualName("");
                    setManualAddress("");
                    setShowManualSave(true);
                });

                const restaurantRows = await fetchRestaurants();

                if (!isMounted) return;

                setRestaurants(restaurantRows);
                renderSavedMarkers(restaurantRows, map);
            } catch (error) {
                console.error(error);
                setErrorMessage(error.message || "Failed to load map page.");
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        initializeMapPage();

        return () => {
            isMounted = false;
        };
    }, []);

    function renderSavedMarkers(restaurantRows, map) {
        savedMarkersRef.current.forEach((marker) => marker.setMap(null));

        savedMarkersRef.current = restaurantRows.map((restaurant) => {
            return new window.google.maps.Marker({
                map,
                position: {
                    lat: restaurant.lat,
                    lng: restaurant.lng,
                },
                title: restaurant.name,
            });
        });
    }

    function placeTemporaryMarker(position) {
        if (!mapInstanceRef.current) return;

        if (tempMarkerRef.current) {
            tempMarkerRef.current.setMap(null);
        }

        tempMarkerRef.current = new window.google.maps.Marker({
            map: mapInstanceRef.current,
            position,
        });

        mapInstanceRef.current.panTo(position);
    }

    function clearTemporaryMarker() {
        if (tempMarkerRef.current) {
            tempMarkerRef.current.setMap(null);
            tempMarkerRef.current = null;
        }
    }

    async function handleSaveManualRestaurant() {
        if (!manualPin) return;

        if (!manualName.trim()) {
            alert("Please enter a restaurant name.");
            return;
        }

        try {
            const newRestaurant = await createManualRestaurant({
                name: manualName.trim(),
                address: manualAddress.trim(),
                lat: manualPin.lat,
                lng: manualPin.lng,
            });

            const updatedRestaurants = [newRestaurant, ...restaurants];
            setRestaurants(updatedRestaurants);

            if (mapInstanceRef.current) {
                renderSavedMarkers(updatedRestaurants, mapInstanceRef.current);
            }

            handleCancelManualSave();
        } catch (error) {
            console.error(error);
            alert(error.message || "Failed to save restaurant.");
        }
    }

    function handleCancelManualSave() {
        setShowManualSave(false);
        setManualPin(null);
        setManualName("");
        setManualAddress("");
        clearTemporaryMarker();
    }

    return (
        <div>
            <div className="mb-4">
                <p className="text-sm text-stone-500">
                    Click anywhere on the map to add a restaurant manually.
                </p>

                {loading && (
                    <p className="mt-2 text-sm text-stone-500">Loading map...</p>
                )}

                {errorMessage && (
                    <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
                )}
            </div>

            <div
                ref={mapRef}
                className="h-[500px] w-full rounded-xl border border-stone-300"
            />

            {showManualSave && (
                <div className="mt-4 max-w-md rounded-xl border border-stone-300 bg-white p-4 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-stone-800">
                        Save Restaurant
                    </h2>

                    <div className="mb-3">
                        <label className="mb-1 block text-sm text-stone-600">
                            Restaurant Name
                        </label>
                        <input
                            type="text"
                            value={manualName}
                            onChange={(e) => setManualName(e.target.value)}
                            className="w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-stone-500"
                            placeholder="Enter restaurant name"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="mb-1 block text-sm text-stone-600">
                            Address (optional)
                        </label>
                        <input
                            type="text"
                            value={manualAddress}
                            onChange={(e) => setManualAddress(e.target.value)}
                            className="w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-stone-500"
                            placeholder="Enter address"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleSaveManualRestaurant}
                            className="rounded-lg bg-stone-800 px-4 py-2 text-sm text-white hover:bg-stone-700"
                        >
                            Confirm Save
                        </button>

                        <button
                            onClick={handleCancelManualSave}
                            className="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}