import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadGoogleMaps } from "../lib/loadGoogleMaps";
import {
    fetchSavedRestaurantsForUser,
    createManualRestaurantForUser,
    saveGoogleRestaurantForUser,
    fetchFriendRestaurantPins,
} from "../services/restaurant";
import useDebouncedValue from "../hooks/useDebouncedValue";
import useUserProfile from "../hooks/useUserProfile";
import PinModal from "../components/map/PinModal";
import SaveRestaurantModal from "../components/map/SaveRestaurantModal";
import {
    clearMarkers,
    renderUnifiedMarkers,
} from "../utils/mapMarkers";

function mergeRestaurantPins(savedRestaurants, friendRestaurants) {
    const mergedMap = new Map();

    for (const restaurant of savedRestaurants || []) {
        mergedMap.set(restaurant.id, {
            restaurantId: restaurant.id,
            google_place_id: restaurant.google_place_id || null,
            name: restaurant.name,
            address: restaurant.address,
            lat: restaurant.lat,
            lng: restaurant.lng,
            source: restaurant.source,
            isSavedByUser: true,
            currentUserEntryCount: 0,
            friends: [],
            averageRating: null,
        });
    }

    for (const restaurant of friendRestaurants || []) {
        const existing = mergedMap.get(restaurant.restaurantId);

        if (existing) {
            mergedMap.set(restaurant.restaurantId, {
                ...existing,
                google_place_id:
                    existing.google_place_id || restaurant.google_place_id || null,
                friends: restaurant.friends || [],
                currentUserEntryCount: restaurant.currentUserEntryCount || 0,
                averageRating: restaurant.averageRating ?? existing.averageRating ?? null,
            });
        } else {
            mergedMap.set(restaurant.restaurantId, {
                restaurantId: restaurant.restaurantId,
                google_place_id: restaurant.google_place_id || null,
                name: restaurant.name,
                address: restaurant.address,
                lat: restaurant.lat,
                lng: restaurant.lng,
                source: "friends",
                isSavedByUser: false,
                currentUserEntryCount: restaurant.currentUserEntryCount || 0,
                friends: restaurant.friends || [],
                averageRating: restaurant.averageRating ?? null,
            });
        }
    }

    return Array.from(mergedMap.values());
}

function upsertSavedRestaurantIntoMerged(existingRestaurants, savedRestaurant) {
    const existingIndex = existingRestaurants.findIndex(
        (restaurant) => restaurant.restaurantId === savedRestaurant.id
    );

    if (existingIndex === -1) {
        return [
            {
                restaurantId: savedRestaurant.id,
                google_place_id: savedRestaurant.google_place_id || null,
                name: savedRestaurant.name,
                address: savedRestaurant.address,
                lat: savedRestaurant.lat,
                lng: savedRestaurant.lng,
                source: savedRestaurant.source,
                isSavedByUser: true,
                currentUserEntryCount: 0,
                friends: [],
                averageRating: null,
            },
            ...existingRestaurants,
        ];
    }

    const updatedRestaurants = [...existingRestaurants];
    const existing = updatedRestaurants[existingIndex];

    updatedRestaurants[existingIndex] = {
        ...existing,
        restaurantId: savedRestaurant.id,
        google_place_id: savedRestaurant.google_place_id || existing.google_place_id || null,
        name: savedRestaurant.name,
        address: savedRestaurant.address,
        lat: savedRestaurant.lat,
        lng: savedRestaurant.lng,
        source: savedRestaurant.source,
        isSavedByUser: true,
    };

    return updatedRestaurants;
}

export default function MapPage() {
    const navigate = useNavigate();
    const { user, errorMessage: userErrorMessage } = useUserProfile();

    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const tempMarkerRef = useRef(null);
    const infoWindowRef = useRef(null);
    const isDropPinModeRef = useRef(false);

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

    const [isDropPinMode, setIsDropPinMode] = useState(false);
    const [showFriendPins, setShowFriendPins] = useState(true);

    const [selectedPin, setSelectedPin] = useState(null);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [currentUserEntryCount, setCurrentUserEntryCount] = useState(0);

    useEffect(() => {
        isDropPinModeRef.current = isDropPinMode;
    }, [isDropPinMode]);

    useEffect(() => {
        if (!user) return;

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
                    clickableIcons: true,
                });

                mapInstanceRef.current = map;
                infoWindowRef.current = new window.google.maps.InfoWindow();

                setTimeout(() => {
                    if (mapInstanceRef.current) {
                        window.google.maps.event.trigger(mapInstanceRef.current, "resize");
                    }
                }, 100);

                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const lat = position.coords.latitude;
                            const lng = position.coords.longitude;
                            const coords = { lat, lng };

                            if (!isMounted) return;

                            setUserLocation(coords);

                            if (mapInstanceRef.current) {
                                window.google.maps.event.trigger(mapInstanceRef.current, "resize");
                                mapInstanceRef.current.setCenter(coords);
                                mapInstanceRef.current.setZoom(13);
                            }
                        },
                        (error) => {
                            console.error("Geolocation error:", error);
                        }
                    );
                }

                setSessionToken(
                    new window.google.maps.places.AutocompleteSessionToken()
                );

                map.addListener("click", (event) => {
                    if (!isDropPinModeRef.current) return;
                    if (!event.latLng) return;

                    const lat = event.latLng.lat();
                    const lng = event.latLng.lng();

                    openManualPinFlow(lat, lng);
                });

                map.addListener("click", (event) => {
                    if (isDropPinModeRef.current) return;
                    if (!event.placeId) return;

                    event.stop();

                    const service = new window.google.maps.places.PlacesService(map);

                    service.getDetails(
                        {
                            placeId: event.placeId,
                            fields: ["place_id", "name", "formatted_address", "geometry"],
                        },
                        (place, status) => {
                            if (
                                status !== window.google.maps.places.PlacesServiceStatus.OK ||
                                !place ||
                                !place.geometry ||
                                !place.geometry.location
                            ) {
                                return;
                            }

                            const lat = place.geometry.location.lat();
                            const lng = place.geometry.location.lng();

                            const normalizedPlace = {
                                id: place.place_id,
                                displayName: place.name || "",
                                formattedAddress: place.formatted_address || "",
                                location: {
                                    lat: () => lat,
                                    lng: () => lng,
                                },
                            };

                            closeInfoWindow();
                            placeTemporaryMarker({ lat, lng });

                            setSelectedGooglePlace(normalizedPlace);
                            setGoogleName(normalizedPlace.displayName || "");
                            setGoogleAddress(normalizedPlace.formattedAddress || "");
                            setShowManualSave(false);
                            setShowGoogleSave(false);
                            setSuggestions([]);
                            setShouldFetchSuggestions(false);
                            setSearchValue(normalizedPlace.displayName || "");

                            if (mapInstanceRef.current) {
                                mapInstanceRef.current.setCenter({ lat, lng });
                                mapInstanceRef.current.setZoom(15);
                            }

                            openSelectedPlaceInfoWindow(normalizedPlace);
                        }
                    );
                });

                const [savedRestaurantRows, friendRestaurantRows] = await Promise.all([
                    fetchSavedRestaurantsForUser(user.id),
                    fetchFriendRestaurantPins(user.id),
                ]);

                if (!isMounted) return;

                setRestaurants(
                    mergeRestaurantPins(savedRestaurantRows, friendRestaurantRows)
                );
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
            clearMarkers(markersRef);

            if (tempMarkerRef.current) {
                tempMarkerRef.current.setMap(null);
            }

            if (infoWindowRef.current) {
                infoWindowRef.current.close();
            }
        };
    }, [user]);

    useEffect(() => {
        if (!mapInstanceRef.current) return;

        const visibleRestaurants = showFriendPins
            ? restaurants
            : restaurants.filter((restaurant) => restaurant.isSavedByUser);

        renderUnifiedMarkers({
            restaurantRows: visibleRestaurants,
            map: mapInstanceRef.current,
            markersRef,
            onMarkerClick: (restaurant) => {
                setSelectedPin(restaurant);
                setSelectedFriend(null);
                setCurrentUserEntryCount(restaurant.currentUserEntryCount || 0);
            },
        });
    }, [restaurants, showFriendPins]);

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

                if (
                    !window.google ||
                    !window.google.maps ||
                    !window.google.maps.places
                ) {
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
    }, [debouncedSearchValue, sessionToken, shouldFetchSuggestions, userLocation]);

    useEffect(() => {
        function handleQuickAddClick(event) {
            const quickAddButton = event.target.closest(
                "[data-quick-add-google-place]"
            );

            if (!quickAddButton) return;
            if (!selectedGooglePlace) return;

            setGoogleName(selectedGooglePlace.displayName || "");
            setGoogleAddress(selectedGooglePlace.formattedAddress || "");
            setShowGoogleSave(true);
            closeInfoWindow();
        }

        document.addEventListener("click", handleQuickAddClick);

        return () => {
            document.removeEventListener("click", handleQuickAddClick);
        };
    }, [selectedGooglePlace]);

    function closeInfoWindow() {
        if (infoWindowRef.current) {
            infoWindowRef.current.close();
        }
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

    function openManualPinFlow(lat, lng) {
        closeInfoWindow();
        placeTemporaryMarker({ lat, lng });

        setManualPin({ lat, lng });
        setManualName("");
        setManualAddress("");
        setShowManualSave(true);

        setShowGoogleSave(false);
        setSelectedGooglePlace(null);
        setSuggestions([]);
        setShouldFetchSuggestions(false);
    }

    function openSelectedPlaceInfoWindow(place) {
        if (!mapInstanceRef.current || !tempMarkerRef.current || !infoWindowRef.current) {
            return;
        }

        const content = `
            <div style="min-width: 240px; padding: 0; margin: 0; font-family: Arial, sans-serif;">
                <div style="padding: 0; margin: 0;">
                    <div style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; line-height: 1.25;">
                        ${place.displayName || "Selected restaurant"}
                    </div>
                    <p style="margin: 0 0 12px 0; font-size: 14px; color: #444; line-height: 1.4;">
                        ${place.formattedAddress || "No address available"}
                    </p>
                    <button
                        data-quick-add-google-place="true"
                        style="
                            display: inline-block;
                            background: rgb(203,84,51);
                            color: white;
                            border: none;
                            border-radius: 8px;
                            padding: 10px 14px;
                            font-size: 13px;
                            font-weight: 600;
                            cursor: pointer;
                        "
                    >
                        Quick Add
                    </button>
                </div>
            </div>
        `;

        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open({
            anchor: tempMarkerRef.current,
            map: mapInstanceRef.current,
        });
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

            closeInfoWindow();
            placeTemporaryMarker({ lat, lng });

            if (mapInstanceRef.current) {
                mapInstanceRef.current.setCenter({ lat, lng });
                mapInstanceRef.current.setZoom(15);
            }

            setSelectedGooglePlace(place);
            setGoogleName(place.displayName || "");
            setGoogleAddress(place.formattedAddress || "");
            setShowManualSave(false);
            setShowGoogleSave(false);
            setSearchValue(place.displayName || "");
            setSessionToken(new window.google.maps.places.AutocompleteSessionToken());

            openSelectedPlaceInfoWindow(place);
        } catch (error) {
            console.error(error);
            alert("Failed to load place details.");
        }
    }

    async function handleSaveGoogleRestaurant() {
        if (!selectedGooglePlace || !user) return;

        const google_place_id = selectedGooglePlace.id;
        const lat = selectedGooglePlace.location?.lat();
        const lng = selectedGooglePlace.location?.lng();

        if (!google_place_id || lat == null || lng == null) {
            alert("Missing place details.");
            return;
        }

        try {
            const alreadySavedByUser = restaurants.some(
                (restaurant) =>
                    restaurant.restaurantId === selectedGooglePlace.id ||
                    (restaurant.google_place_id === google_place_id &&
                        restaurant.isSavedByUser)
            );

            const result = await saveGoogleRestaurantForUser({
                userId: user.id,
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

            const alreadySavedNow = restaurants.some(
                (restaurant) =>
                    restaurant.restaurantId === result.restaurant.id &&
                    restaurant.isSavedByUser
            );

            if (alreadySavedByUser || alreadySavedNow) {
                alert("You already have this restaurant pinned.");
                handleCancelGoogleSave();
                return;
            }

            setRestaurants((prev) =>
                upsertSavedRestaurantIntoMerged(prev, result.restaurant)
            );

            handleCancelGoogleSave();
        } catch (error) {
            console.error(error);
            alert(error.message || "Failed to save restaurant.");
        }
    }

    async function handleSaveManualRestaurant() {
        if (!manualPin || !user) return;

        if (!manualName.trim()) {
            alert("Please enter a restaurant name.");
            return;
        }

        try {
            const newRestaurant = await createManualRestaurantForUser({
                userId: user.id,
                name: manualName.trim(),
                address: manualAddress.trim(),
                lat: manualPin.lat,
                lng: manualPin.lng,
            });

            setRestaurants((prev) =>
                upsertSavedRestaurantIntoMerged(prev, newRestaurant)
            );

            handleCancelManualSave();
            setIsDropPinMode(false);
        } catch (error) {
            console.error(error);
            alert(error.message || "Failed to save restaurant.");
        }
    }

    function handleToggleDropPinMode() {
        closeInfoWindow();
        setSelectedPin(null);
        setSelectedFriend(null);
        setSuggestions([]);
        setShouldFetchSuggestions(false);
        setShowGoogleSave(false);
        setShowManualSave(false);
        clearTemporaryMarker();
        setManualPin(null);
        setManualName("");
        setManualAddress("");
        setIsDropPinMode((prev) => !prev);
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
        closeInfoWindow();
    }

    function handleClosePinModal() {
        setSelectedPin(null);
        setSelectedFriend(null);
    }

    function handleViewDiary() {
        if (!selectedPin) return;

        if (selectedFriend) {
            navigate(
                `/friends/${selectedFriend.id}/restaurants/${selectedPin.restaurantId}`
            );
            return;
        }

        if (selectedPin.isSavedByUser) {
            navigate(`/restaurant/${selectedPin.restaurantId}`);
            return;
        }

        alert("Select a friend or create an entry first.");
    }

    function handleAddEntry() {
        if (!selectedPin) return;

        navigate(`/diary/new?restaurantId=${selectedPin.restaurantId}`);
    }

    if (userErrorMessage) {
        return <p>{userErrorMessage}</p>;
    }

    return (
        <div className="relative h-full w-full overflow-hidden">
            {errorMessage && (
                <div className="absolute top-4 left-6 z-30">
                    <p className="mt-2 rounded-md bg-white/90 px-3 py-2 text-sm text-red-600 shadow">
                        {errorMessage}
                    </p>
                </div>
            )}

            <div className="absolute top-4 left-4 right-4 z-20 lg:top-6 lg:left-6 lg:right-auto lg:w-[560px]">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => {
                            setSearchValue(e.target.value);
                            setShouldFetchSuggestions(true);
                        }}
                        placeholder="Search restaurants or places..."
                        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 shadow-lg outline-none focus:border-[rgb(203,84,51)]"
                    />

                    <button
                        type="button"
                        onClick={() => {
                            const nextValue = !showFriendPins;

                            if (!nextValue && selectedPin && !selectedPin.isSavedByUser) {
                                setSelectedPin(null);
                                setSelectedFriend(null);
                            }

                            setShowFriendPins(nextValue);
                        }}
                        className={`shrink-0 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${showFriendPins
                            ? "bg-[rgb(203,84,51)] text-white"
                            : "bg-white text-stone-700"
                            }`}
                    >
                        {showFriendPins ? "Hide Friends" : "Show Friends"}
                    </button>
                </div>

                {suggestions.length > 0 && (
                    <div className="mt-2 overflow-hidden rounded-xl border border-stone-300 bg-white shadow-xl">
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

            <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 lg:top-6 lg:right-6 lg:left-auto lg:bottom-auto lg:translate-x-0">
                <button
                    onClick={handleToggleDropPinMode}
                    className={`rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${isDropPinMode
                        ? "bg-white text-stone-700"
                        : "bg-[rgb(203,84,51)] text-white"
                        }`}
                >
                    {isDropPinMode ? "Cancel Drop Pin" : "Enable Drop Pin"}
                </button>
            </div>

            <div ref={mapRef} className="h-full w-full" />

            <PinModal
                isOpen={!!selectedPin}
                onClose={handleClosePinModal}
                restaurant={selectedPin}
                isFriendView={Boolean(selectedPin?.friends?.length)}
                onAddEntry={handleAddEntry}
                onViewDiary={handleViewDiary}
                currentUserEntryCount={currentUserEntryCount}
                selectedFriendId={selectedFriend?.id}
                onSelectFriend={setSelectedFriend}
            />

            {showGoogleSave && (
                <SaveRestaurantModal
                    title="Save Restaurant"
                    name={googleName}
                    address={googleAddress}
                    setName={setGoogleName}
                    setAddress={setGoogleAddress}
                    onConfirm={handleSaveGoogleRestaurant}
                    onCancel={handleCancelGoogleSave}
                />
            )}

            {showManualSave && (
                <SaveRestaurantModal
                    title="Save Manual Restaurant"
                    name={manualName}
                    address={manualAddress}
                    setName={setManualName}
                    setAddress={setManualAddress}
                    onConfirm={handleSaveManualRestaurant}
                    onCancel={handleCancelManualSave}
                />
            )}
        </div>
    );
}