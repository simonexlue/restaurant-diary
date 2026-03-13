import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "../lib/loadGoogleMaps";
import { fetchRestaurants, createManualRestaurant, saveGoogleRestaurantIfNotExists } from "../services/restaurant";
import useDebouncedValue from "../hooks/useDebouncedValue";

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

    const [searchValue, setSearchValue] = useState("");
    const debouncedSearchValue = useDebouncedValue(searchValue, 350);
    const [suggestions, setSuggestions] = useState([]);
    const [sessionToken, setSessionToken] = useState(null);
    const [shouldFetchSuggestions, setShouldFetchSuggestions] = useState(true);

    const [selectedGooglePlace, setSelectedGooglePlace] = useState(null);
    const [googleName, setGoogleName] = useState("");
    const [googleAddress, setGoogleAddress] = useState("");
    const [showGoogleSave, setShowGoogleSave] = useState(false);
    const [userLocation, setUserLocation] = useState(null);

    useEffect(() => {
        let isMounted = true;

        async function initializeMapPage() {
            try {
                setLoading(true);
                setErrorMessage("");

                await loadGoogleMaps();

                if (!mapRef.current) return;

                const map = new window.google.maps.Map(mapRef.current, {
                    center: { lat: 49.2827, lng: -123.1207 },
                    zoom: 12,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                });

                mapInstanceRef.current = map;

                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const lat = position.coords.latitude;
                            const lng = position.coords.longitude;

                            const coords = { lat, lng };
                            setUserLocation(coords);

                            if (mapInstanceRef.current) {
                                mapInstanceRef.current.setCenter(coords);
                                mapInstanceRef.current.setZoom(13);
                            }
                        },
                        (error) => {
                            console.error("Geolocation error:", error);
                        }
                    );
                }

                setSessionToken(new window.google.maps.places.AutocompleteSessionToken());

                map.addListener("click", (event) => {
                    if (!event.latLng) return;

                    const lat = event.latLng.lat();
                    const lng = event.latLng.lng();

                    placeTemporaryMarker({ lat, lng });

                    setManualPin({ lat, lng });
                    setManualName("");
                    setManualAddress("");
                    setShowManualSave(true);

                    setShowGoogleSave(false);
                    setSelectedGooglePlace(null);
                    setSuggestions([]);
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

    useEffect(() => {
        async function fetchAutocompleteSuggestions() {
            try {
                if (!shouldFetchSuggestions) {
                    setSuggestions([]);
                    return;
                }

                if (!debouncedSearchValue.trim()) {
                    setSuggestions([]);
                    return;
                }

                if (!window.google || !window.google.maps || !window.google.maps.places) {
                    return;
                }

                const token =
                    sessionToken ||
                    new window.google.maps.places.AutocompleteSessionToken();

                const { AutocompleteSuggestion } =
                    await window.google.maps.importLibrary("places");

                const request = {
                    input: debouncedSearchValue,
                    includedPrimaryTypes: ["restaurant"],
                    sessionToken: token,
                    locationBias: userLocation
                        ? {
                            center: userLocation,
                            radius: 5000,
                        }
                        : undefined,
                };

                const response =
                    await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

                const formattedSuggestions = (response.suggestions || [])
                    .filter((item) => item.placePrediction)
                    .map((item) => ({
                        placePrediction: item.placePrediction,
                        text: item.placePrediction.text.toString(),
                        placeId: item.placePrediction.placeId,
                    }));

                setSuggestions(formattedSuggestions);
                setSessionToken(token);
            } catch (error) {
                console.error(error);
            }
        }

        fetchAutocompleteSuggestions();
    }, [debouncedSearchValue, sessionToken, shouldFetchSuggestions]);

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

    async function handleSuggestionClick(suggestion) {
        try {
            setSuggestions([]);
            setShouldFetchSuggestions(false);

            const place = suggestion.placePrediction.toPlace();

            await place.fetchFields({
                fields: ["id", "displayName", "formattedAddress", "location"],
            });

            const lat = place.location?.lat();
            const lng = place.location?.lng();

            if (lat == null || lng == null) {
                alert("Could not load restaurant location.");
                return;
            }

            placeTemporaryMarker({ lat, lng });

            if (mapInstanceRef.current) {
                mapInstanceRef.current.setCenter({ lat, lng });
                mapInstanceRef.current.setZoom(15);
            }

            setSelectedGooglePlace(place);
            setGoogleName(place.displayName || "");
            setGoogleAddress(place.formattedAddress || "");
            setShowGoogleSave(true);

            setShowManualSave(false);
            setSearchValue(place.displayName || "");
            setSessionToken(new window.google.maps.places.AutocompleteSessionToken());
        } catch (error) {
            console.error(error);
            alert("Failed to load place details.");
        }
    }

    async function handleSaveGoogleRestaurant() {
        if (!selectedGooglePlace) return;

        const google_place_id = selectedGooglePlace.id;
        const lat = selectedGooglePlace.location?.lat();
        const lng = selectedGooglePlace.location?.lng();

        if (!google_place_id || lat == null || lng == null) {
            alert("Missing place details.");
            return;
        }

        try {
            const result = await saveGoogleRestaurantIfNotExists({
                google_place_id,
                name:
                    googleName.trim() ||
                    selectedGooglePlace.displayName ||
                    "Unnamed restaurant",
                address:
                    googleAddress.trim() ||
                    selectedGooglePlace.formattedAddress ||
                    null,
                lat,
                lng,
            });

            if (result.alreadyExists) {
                alert("You already have this restaurant pinned.");
                handleCancelGoogleSave();
                return;
            }

            const updatedRestaurants = [result.restaurant, ...restaurants];
            setRestaurants(updatedRestaurants);

            if (mapInstanceRef.current) {
                renderSavedMarkers(updatedRestaurants, mapInstanceRef.current);
            }

            handleCancelGoogleSave();
        } catch (error) {
            console.error(error);
            alert(error.message || "Failed to save restaurant.");
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

    function handleCancelGoogleSave() {
        setShowGoogleSave(false);
        setSelectedGooglePlace(null);
        setGoogleName("");
        setGoogleAddress("");
        clearTemporaryMarker();
    }

    return (
        <div className="px-4 py-6 lg:px-6">
            <div className="mb-4">
                <h1 className="text-2xl font-semibold text-stone-800">Map</h1>
                <p className="text-sm text-stone-500">
                    Search for a restaurant or click anywhere on the map to add one manually.
                </p>

                {loading && <p className="mt-2 text-sm text-stone-500">Loading map...</p>}
                {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}
            </div>

            <div className="relative mb-4 max-w-xl">
                <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => {
                        setSearchValue(e.target.value);
                        setShouldFetchSuggestions(true);
                    }}
                    placeholder="Search for a restaurant"
                    className="w-full rounded-lg border border-stone-300 px-4 py-3 outline-none focus:border-stone-500"
                />

                {suggestions.length > 0 && (
                    <div className="absolute z-20 mt-2 w-full rounded-xl border border-stone-300 bg-white shadow-lg">
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={`${suggestion.placeId}-${index}`}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="block w-full border-b border-stone-200 px-4 py-3 text-left text-sm text-stone-700 hover:bg-stone-50 last:border-b-0"
                            >
                                {suggestion.text}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div
                ref={mapRef}
                className="h-[500px] w-full rounded-xl border border-stone-300"
            />

            {showGoogleSave && (
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
                            value={googleName}
                            onChange={(e) => setGoogleName(e.target.value)}
                            className="w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-stone-500"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="mb-1 block text-sm text-stone-600">
                            Address
                        </label>
                        <input
                            type="text"
                            value={googleAddress}
                            onChange={(e) => setGoogleAddress(e.target.value)}
                            className="w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-stone-500"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleSaveGoogleRestaurant}
                            className="rounded-lg bg-stone-800 px-4 py-2 text-sm text-white hover:bg-stone-700"
                        >
                            Confirm Save
                        </button>

                        <button
                            onClick={handleCancelGoogleSave}
                            className="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {showManualSave && (
                <div className="mt-4 max-w-md rounded-xl border border-stone-300 bg-white p-4 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-stone-800">
                        Save Manual Restaurant
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