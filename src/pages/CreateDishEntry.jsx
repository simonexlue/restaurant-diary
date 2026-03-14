import useDebouncedValue from "../hooks/useDebouncedValue";
import { useState, useEffect, useRef } from "react";
import { loadGoogleMaps } from "../lib/loadGoogleMaps";
import { getOrCreateRestaurantFromGooglePlace } from "../services/restaurant";
import { DayPicker } from "react-day-picker";
import { IoGlobeOutline } from "react-icons/io5";
import { MdPeopleOutline } from "react-icons/md";
import { IoLockClosedOutline } from "react-icons/io5";
import { IoLocationOutline } from "react-icons/io5";
import { MdOutlineCalendarToday } from "react-icons/md";
import { BiDish } from "react-icons/bi";
import { FaRegStar } from "react-icons/fa";
import { MdAttachMoney } from "react-icons/md";
import { MdOutlineAddPhotoAlternate } from "react-icons/md";
import { RiBookOpenLine } from "react-icons/ri";
import { IoPricetagsOutline } from "react-icons/io5";


export default function CreateDishEntry() {
    const [searchValue, setSearchValue] = useState("");
    const debouncedSearchValue = useDebouncedValue(searchValue, 350);

    const [suggestions, setSuggestions] = useState([]);
    const [sessionToken, setSessionToken] = useState(null);
    const [shouldFetchSuggestions, setShouldFetchSuggestions] = useState(true);
    const [userLocation, setUserLocation] = useState(null);

    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [selectingRestaurant, setSelectingRestaurant] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [dateSelected, setDateSelected] = useState(undefined)
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const datePickerRef = useRef(null)

    const [reviewInput, setReviewInput] = useState("")

    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
    const [isDragActive, setIsDragActive] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        async function initializeGoogle() {
            try {
                await loadGoogleMaps();
                setSessionToken(new window.google.maps.places.AutocompleteSessionToken());
            } catch (error) {
                console.error(error);
                setErrorMessage("Failed to load Google Maps.");
            }
        }

        initializeGoogle();
    }, []);

    useEffect(() => {
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
            },
            (error) => {
                console.error("Geolocation error:", error);
            }
        );
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

                if (
                    !window.google ||
                    !window.google.maps ||
                    !window.google.maps.places
                ) {
                    return;
                }

                setLoadingSuggestions(true);
                setErrorMessage("");

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
                setErrorMessage("Failed to load restaurant suggestions.");
            } finally {
                setLoadingSuggestions(false);
            }
        }

        fetchAutocompleteSuggestions();
    }, [debouncedSearchValue, sessionToken, shouldFetchSuggestions, userLocation]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                datePickerRef.current && !datePickerRef.current.contains(event.target)
            ) {
                setIsDatePickerOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside)

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    useEffect(() => {
        return () => {
            if (photoPreviewUrl) {
                URL.revokeObjectURL(photoPreviewUrl);
            }
        };
    }, [photoPreviewUrl]);

    async function handleSuggestionClick(suggestion) {
        try {
            setSelectingRestaurant(true);
            setErrorMessage("");
            setSuggestions([]);
            setShouldFetchSuggestions(false);

            const place = suggestion.placePrediction.toPlace();

            await place.fetchFields({
                fields: ["id", "displayName", "formattedAddress", "location"],
            });

            const restaurant = await getOrCreateRestaurantFromGooglePlace(place);

            setSelectedRestaurant(restaurant);
            setSearchValue(restaurant.name || "");
            setSessionToken(new window.google.maps.places.AutocompleteSessionToken());
        } catch (error) {
            console.error(error);
            setErrorMessage(error.message || "Failed to select restaurant.");
        } finally {
            setSelectingRestaurant(false);
        }
    }

    function handleClearSelectedRestaurant() {
        setSelectedRestaurant(null);
        setSearchValue("");
        setSuggestions([]);
        setShouldFetchSuggestions(true);

        if (window.google?.maps?.places) {
            setSessionToken(new window.google.maps.places.AutocompleteSessionToken());
        }
    }

    function handleDateSelect(date) {
        setDateSelected(date);
        setIsDatePickerOpen(false);
    }

    function handleSelectedPhoto(file) {
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setErrorMessage("Please upload an image file.");
            return;
        }

        setErrorMessage("");
        setPhotoFile(file);

        if (photoPreviewUrl) {
            URL.revokeObjectURL(photoPreviewUrl);
        }

        const previewUrl = URL.createObjectURL(file);
        setPhotoPreviewUrl(previewUrl);
    }

    function handlePhotoInputChange(event) {
        const file = event.target.files?.[0];
        handleSelectedPhoto(file);
    }

    function handleDragOver(event) {
        event.preventDefault();
        setIsDragActive(true);
    }

    function handleDragLeave(event) {
        event.preventDefault();
        setIsDragActive(false);
    }

    function handleDrop(event) {
        event.preventDefault();
        setIsDragActive(false);

        const file = event.dataTransfer.files?.[0];
        handleSelectedPhoto(file);
    }

    function handleChooseFileClick() {
        fileInputRef.current?.click();
    }

    function handleRemovePhoto() {
        setPhotoFile(null);

        if (photoPreviewUrl) {
            URL.revokeObjectURL(photoPreviewUrl);
        }

        setPhotoPreviewUrl("");

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl text-stone-700">New Entry</h1>
                <p className="text-[rgb(137,122,114)]">Log a dish you tried at a restaurant</p>
            </div>

            {/* Form */}
            <form className="flex flex-col gap-6">
                {/* Restaurant */}
                <div className="bg-white py-6 px-6 rounded-lg border border-stone-200 flex flex-col gap-2">
                    <div className="flex flex-row items-center gap-1.5">
                        <IoLocationOutline size={20} className="relative text-[rgb(203,84,51)]" />
                        <label className="text-stone-800">Restaurant</label>
                    </div>
                    {!selectedRestaurant ? (
                        <>
                            <input
                                type="text"
                                value={searchValue}
                                onChange={(e) => {
                                    setSearchValue(e.target.value);
                                    setShouldFetchSuggestions(true);
                                }}
                                placeholder="Search restaurant..."
                                className="h-10 w-full rounded-lg border border-gray-300 px-3 bg-[rgb(248,245,242)] focus:outline-[rgb(203,84,51)] "
                            />

                            {loadingSuggestions && (
                                <p>Loading suggestions...</p>
                            )}

                            {suggestions.length > 0 && (
                                <div className="mt-2 overflow-hidden rounded-xl border border-stone-300 bg-white shadow-md">
                                    {suggestions.map((suggestion, index) => (
                                        <button
                                            key={`${suggestion.placeId}-${index}`}
                                            type="button"
                                            onClick={() => { handleSuggestionClick(suggestion), console.log(suggestion) }}
                                            className="block w-full border-b border-stone-200 px-4 py-3 text-left text-sm text-stone-700 hover:bg-stone-50 last:border-b-0"
                                        >
                                            {suggestion.text}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div>
                            <div>
                                <div>
                                    <p>
                                        {selectedRestaurant.name}
                                    </p>
                                    <p>
                                        {selectedRestaurant.address || "No address provided"}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleClearSelectedRestaurant}
                                >
                                    Change
                                </button>
                            </div>
                        </div>
                    )}

                    {selectingRestaurant && (
                        <p>Selecting restaurant...</p>
                    )}

                    {errorMessage && (
                        <p>{errorMessage}</p>
                    )}
                </div>

                {/* {selectedRestaurant && (
                    <div>
                        Selected restaurant id: {selectedRestaurant.id}
                    </div>
                )} */}

                {/* Date Vistied */}
                <div className="bg-white py-6 px-6 rounded-lg border border-stone-200 flex flex-col gap-2">
                    <div className="flex flex-row items-center gap-1.5">
                        <MdOutlineCalendarToday size={16} className="relative text-[rgb(203,84,51)]" />
                        <label className="text-stone-800">Date Visited</label>
                    </div>

                    <div ref={datePickerRef} className="relative">
                        <button
                            type="button"
                            className={`w-full border border-gray-300 rounded-lg py-2 flex items-start px-3 bg-[rgb(248,245,242)] ${dateSelected ? "text-stone-800" : "text-stone-400"
                                }`}
                            onClick={() => setIsDatePickerOpen((prev) => !prev)}
                        >
                            {dateSelected ? dateSelected.toLocaleDateString() : "Pick a date"}
                        </button>

                        {isDatePickerOpen && (
                            <div className="absolute left-0 top-full mt-2 z-20">
                                <DayPicker
                                    animate
                                    mode="single"
                                    selected={dateSelected}
                                    onSelect={setDateSelected}
                                    className="w-90 bg-white shadow-lg rounded-lg p-5 border border-gray-200"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Dish Name + Rating + Price  */}
                <div className="bg-white py-6 px-6 rounded-lg border border-stone-200 flex flex-col gap-2">
                    <div className="mb-4 flex flex-col gap-2">
                        <div className="flex flex-row items-center gap-1.5">
                            <BiDish size={20} className="relative text-[rgb(203,84,51)]" />
                            <label className="text-stone-800">Dish Name</label>
                        </div>
                        <input
                            type="text"
                            placeholder="e.g., Spicy Tuna Roll"
                            className="h-10 w-full rounded-lg border border-gray-300 px-3 bg-[rgb(248,245,242)] focus:outline-[rgb(203,84,51)] "
                        />
                    </div>

                    <div className="mb-4 flex flex-col gap-2">
                        <div className="flex flex-row items-center gap-1.5">
                            <FaRegStar size={18} className="relative text-[rgb(203,84,51)]" />
                            <label className="text-stone-800">Rating</label>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex flex-row items-center gap-1.5">
                            <MdAttachMoney size={20} className="relative text-[rgb(203,84,51)]" />
                            <label className="text-stone-800">Price</label>
                        </div>
                        <input
                            type="number"
                            placeholder="0.00"
                            className="h-10 w-full rounded-lg border border-gray-300 px-3 bg-[rgb(248,245,242)] focus:outline-[rgb(203,84,51)] "
                        />
                    </div>
                </div>

                {/* Dish Photo */}
                <div className="bg-white py-6 px-6 rounded-lg border border-stone-200 flex flex-col gap-3">
                    <div className="flex flex-row items-center gap-1.5">
                        <MdOutlineAddPhotoAlternate size={18} className="relative text-[rgb(203,84,51)]" />
                        <label className="text-stone-800">Dish Photo</label>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoInputChange}
                        className="hidden"
                    />

                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`rounded-lg border-2 border-dashed px-4 py-8 text-center transition ${isDragActive
                            ? "border-[rgb(203,84,51)] bg-[rgb(253,246,244)]"
                            : "border-stone-300 bg-[rgb(248,245,242)]"
                            }`}
                    >
                        {!photoPreviewUrl ? (
                            <div className="flex flex-col items-center gap-3">
                                <MdOutlineAddPhotoAlternate size={32} className="text-[rgb(203,84,51)]" />
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm text-stone-700">
                                        Drag and drop an image here
                                    </p>
                                    <p className="text-xs text-[rgb(137,122,114)]">
                                        PNG, JPG, WEBP, etc.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleChooseFileClick}
                                    className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm text-stone-700 hover:cursor-pointer"
                                >
                                    Choose File
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <img
                                    src={photoPreviewUrl}
                                    alt="Dish preview"
                                    className="max-h-64 w-full rounded-lg object-cover"
                                />

                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm text-stone-800">
                                            {photoFile?.name}
                                        </p>
                                        <p className="text-xs text-[rgb(137,122,114)]">
                                            {photoFile ? `${Math.round(photoFile.size / 1024)} KB` : ""}
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleChooseFileClick}
                                            className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 hover:cursor-pointer"
                                        >
                                            Change
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleRemovePhoto}
                                            className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 hover:cursor-pointer"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Review  */}
                <div className="bg-white py-6 px-6 rounded-lg border border-stone-200 flex flex-col gap-2">
                    <div className="flex flex-row items-center gap-1.5">
                        <RiBookOpenLine size={18} className="relative text-[rgb(203,84,51)]" />
                        <label className="text-stone-800">Review</label>
                    </div>
                    <textarea
                        value={reviewInput}
                        onChange={(e) => setReviewInput(e.target.value)}
                        placeholder="How was the dish? Share your thoughts..."
                        rows={5}
                        className="rounded-lg border border-gray-300 px-3 py-2 bg-[rgb(248,245,242)] focus:outline-[rgb(203,84,51)]" />
                </div>

                {/* Tags  */}
                <div className="bg-white py-6 px-6 rounded-lg border border-stone-200 flex flex-col gap-2">
                    <div className="flex flex-row items-center gap-1.5">
                        <IoPricetagsOutline size={18} className="relative text-[rgb(203,84,51)]" />
                        <label className="text-stone-800">Tags</label>
                    </div>
                </div>

                {/* Privacy  */}
                <div className="bg-white py-6 px-6 rounded-lg border border-stone-200 flex flex-col gap-2">
                    <div className="flex flex-row items-center gap-1.5">
                        <IoLockClosedOutline size={16} className="relative text-[rgb(203,84,51)] top-[-1px]" />
                        <label className="text-stone-800">Privacy</label>
                    </div>
                    <div className="flex flex-row justify-between gap-3">
                        <div className="flex flex-col gap-2 items-center py-5 border border-stone-300 w-1/3 rounded-lg hover:border-[rgb(203,84,51)] hover:bg-[rgb(253,246,244)] hover:cursor-pointer">
                            <IoGlobeOutline size={24} color="rgb(137,122,114)" />
                            <p className="text-sm text-[rgb(137,122,114)]">Public</p>
                            <p className="text-xs text-[rgb(137,122,114)]">Everyone</p>
                        </div>

                        <div className="flex flex-col gap-2 items-center py-5 border border-stone-300 w-1/3 rounded-lg hover:border-[rgb(203,84,51)] hover:bg-[rgb(253,246,244)] hover:cursor-pointer">
                            <MdPeopleOutline size={24} color="rgb(137,122,114)" />
                            <p className="text-sm text-[rgb(137,122,114)]">Friends</p>
                            <p className="text-xs text-[rgb(137,122,114)]">Friends only</p>
                        </div>

                        <div className="flex flex-col gap-2 items-center py-5 border border-stone-300 w-1/3 rounded-lg hover:border-[rgb(203,84,51)] hover:bg-[rgb(253,246,244)] hover:cursor-pointer">
                            <IoLockClosedOutline size={24} color="rgb(137,122,114)" />
                            <p className="text-sm text-[rgb(137,122,114)]">Private</p>
                            <p className="text-xs text-[rgb(137,122,114)]">Only you</p>
                        </div>
                    </div>
                </div>

                {/* Cancel and Save Buttons */}
                <div className="flex gap-2">
                    <button className="w-1/2 mb-4 h-10 rounded-md bg-white py-2 text-sm text-stone-800 hover:cursor-pointer border border-stone-200">Cancel</button>
                    <button className="w-1/2 mb-4 h-10 rounded-md bg-[rgb(203,84,51)] py-2 text-sm text-white hover:cursor-pointer">Save Entry</button>
                </div>
            </form >
        </div >
    )
}