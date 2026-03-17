import { useState, useEffect, useRef } from "react";
import useDebouncedValue from "../hooks/useDebouncedValue";
import { loadGoogleMaps } from "../lib/loadGoogleMaps";
import { getOrCreateRestaurantFromGooglePlace, getRestaurantById } from "../services/restaurant";
import { createDishEntryWithOptionalPhoto } from "../services/diary";
import { useNavigate } from "react-router-dom";
import useUserProfile from "../hooks/useUserProfile";
import { useSearchParams } from "react-router-dom";

import { IoPricetagsOutline, IoLockClosedOutline, IoLocationOutline } from "react-icons/io5";
import { BiDish } from "react-icons/bi";
import { MdAttachMoney, MdOutlineAddPhotoAlternate, MdOutlineCalendarToday } from "react-icons/md";
import { RiBookOpenLine } from "react-icons/ri";
import { FaRegStar } from "react-icons/fa";

import DateVisitedPicker from "../components/diary/DateVisitedPicker";
import RatingSelector from "../components/diary/RatingSelector";
import PhotoUploader from "../components/diary/PhotoUploader";
import PrivacySelector from "../components/diary/PrivacySelector";
import TagsSelector from "../components/diary/TagsSelector";
import SelectedRestaurantCard from "../components/diary/SelectedRestaurantCard";

export default function CreateDishEntry() {
    const { user, loading: profileLoading, errorMessage: profileErrorMessage } = useUserProfile();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams()
    const restaurantId = searchParams.get("restaurantId");
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

    const [dateSelected, setDateSelected] = useState(undefined);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const datePickerRef = useRef(null);

    const [reviewInput, setReviewInput] = useState("");

    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
    const [isDragActive, setIsDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const [dishName, setDishName] = useState("");
    const [dishPrice, setDishPrice] = useState("");
    const [dishPrivacy, setDishPrivacy] = useState(null);

    const [rating, setRating] = useState(0);

    const [selectedTags, setSelectedTags] = useState([]);
    const [customTagInput, setCustomTagInput] = useState("");

    const [savingEntry, setSavingEntry] = useState(false);

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

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                datePickerRef.current &&
                !datePickerRef.current.contains(event.target)
            ) {
                setIsDatePickerOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        async function prefillRestaurant() {
            if (!restaurantId) {
                return;
            }

            try {
                setSelectingRestaurant(true);
                setErrorMessage("");

                const restaurant = await getRestaurantById(restaurantId);

                setSelectedRestaurant(restaurant);
                setSearchValue(restaurant.name || "");
                setSuggestions([]);
                setShouldFetchSuggestions(false);
            } catch (error) {
                setErrorMessage(error.message || "Failed to load selected restaurant.");
            } finally {
                setSelectingRestaurant(false);
            }
        }

        prefillRestaurant();
    }, [restaurantId]);

    function handleDateSelect(date) {
        setDateSelected(date);
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

    function handleDragEnter(event) {
        event.preventDefault();
        setIsDragActive(true);
    }

    function handleChooseFileClick() {
        fileInputRef.current?.click();
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

    function normalizeTag(tag) {
        return tag.trim().toLowerCase();
    }

    function toggleTag(tagLabel) {
        const normalized = normalizeTag(tagLabel);

        setSelectedTags((prev) => {
            const alreadySelected = prev.some(
                (tag) => normalizeTag(tag) === normalized
            );

            if (alreadySelected) {
                return prev.filter((tag) => normalizeTag(tag) !== normalized);
            }

            return [...prev, tagLabel.trim()];
        });
    }

    function removeTag(tagLabel) {
        const normalized = normalizeTag(tagLabel);

        setSelectedTags((prev) =>
            prev.filter((tag) => normalizeTag(tag) !== normalized)
        );
    }

    function handleAddCustomTag() {
        const trimmed = customTagInput.trim();
        if (!trimmed) return;

        const normalized = normalizeTag(trimmed);
        const alreadySelected = selectedTags.some(
            (tag) => normalizeTag(tag) === normalized
        );

        if (!alreadySelected) {
            setSelectedTags((prev) => [...prev, trimmed]);
        }

        setCustomTagInput("");
    }

    function handleCustomTagKeyDown(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            handleAddCustomTag();
        }
    }

    function handleCancel() {
        navigate("/diary")
    }

    async function handleSaveEntry(e) {
        e.preventDefault()
        if (savingEntry) return;

        setErrorMessage("")
        if (!selectedRestaurant) {
            setErrorMessage("Please select a restaurant.")
            return;
        }

        if (!dateSelected) {
            setErrorMessage("Please select a date visited.")
            return;
        }

        if (!dishName.trim()) {
            setErrorMessage("Please enter a dish name.");
            return
        }

        try {
            setSavingEntry(true)

            if (!user) {
                throw new Error("You must be logged in to save an entry.");
            }

            await createDishEntryWithOptionalPhoto({
                userId: user.id,
                restaurantId: selectedRestaurant.id,
                dateTried: dateSelected,
                dishName,
                itemRating: rating || null,
                review: reviewInput,
                privacy: dishPrivacy || "private",
                price: dishPrice,
                tags: selectedTags,
                photoFile,
            });

            resetForm();
            navigate(`/restaurant/${selectedRestaurant.id}`);
        } catch (error) {
            setErrorMessage(error.message || "Failed to save dish entry")
        } finally {
            setSavingEntry(false);
        }
    }

    function resetForm() {
        setSearchValue("");
        setSuggestions([]);
        setShouldFetchSuggestions(true);
        setSelectedRestaurant(null);

        setDateSelected(undefined);
        setIsDatePickerOpen(false);

        setReviewInput("");

        setPhotoFile(null);

        if (photoPreviewUrl) {
            URL.revokeObjectURL(photoPreviewUrl);
        }

        setPhotoPreviewUrl("");
        setIsDragActive(false);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        setDishName("");
        setDishPrice("");
        setDishPrivacy(null);
        setRating(0);
        setSelectedTags([]);
        setCustomTagInput("");

        if (window.google?.maps?.places) {
            setSessionToken(new window.google.maps.places.AutocompleteSessionToken());
        }
    }

    if (profileLoading) {
        return <p>Loading...</p>;
    }

    if (profileErrorMessage) {
        return <p>{profileErrorMessage}</p>;
    }

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl text-stone-700">New Entry</h1>
                <p className="text-[rgb(137,122,114)]">Log a dish you tried at a restaurant</p>
            </div>

            <form onSubmit={handleSaveEntry} className="flex flex-col gap-6">
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
                                className="h-10 w-full rounded-lg border border-gray-300 px-3 bg-[rgb(248,245,242)] focus:outline-[rgb(203,84,51)]"
                            />

                            {loadingSuggestions && <p>Loading suggestions...</p>}

                            {suggestions.length > 0 && (
                                <div className="mt-2 overflow-hidden rounded-xl border border-stone-300 bg-white shadow-md">
                                    {suggestions.map((suggestion, index) => (
                                        <button
                                            key={`${suggestion.placeId}-${index}`}
                                            type="button"
                                            onClick={() => handleSuggestionClick(suggestion)}
                                            className="block w-full border-b border-stone-200 px-4 py-3 text-left text-sm text-stone-700 hover:bg-stone-50 last:border-b-0"
                                        >
                                            {suggestion.text}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <SelectedRestaurantCard
                            restaurant={selectedRestaurant}
                            onClear={handleClearSelectedRestaurant}
                        />
                    )}

                    {selectingRestaurant && <p>Selecting restaurant...</p>}

                    {errorMessage && <p>{errorMessage}</p>}
                </div>

                {/* Date Visited */}
                <div className="bg-white py-6 px-6 rounded-lg border border-stone-200 flex flex-col gap-2">
                    <div className="flex flex-row items-center gap-1.5">
                        <MdOutlineCalendarToday size={16} className="relative text-[rgb(203,84,51)]" />
                        <label className="text-stone-800">Date Visited</label>
                    </div>

                    <DateVisitedPicker
                        value={dateSelected}
                        onSelect={handleDateSelect}
                        isOpen={isDatePickerOpen}
                        onToggle={() => setIsDatePickerOpen((prev) => !prev)}
                        datePickerRef={datePickerRef}
                    />
                </div>

                {/* Dish Name + Rating + Price */}
                <div className="bg-white py-6 px-6 rounded-lg border border-stone-200 flex flex-col gap-2">
                    <div className="mb-4 flex flex-col gap-2">
                        <div className="flex flex-row items-center gap-1.5">
                            <BiDish size={20} className="relative text-[rgb(203,84,51)]" />
                            <label className="text-stone-800">Dish Name</label>
                        </div>
                        <input
                            value={dishName}
                            onChange={(e) => setDishName(e.target.value)}
                            type="text"
                            placeholder="e.g., Spicy Tuna Roll"
                            className="h-10 w-full rounded-lg border border-gray-300 px-3 bg-[rgb(248,245,242)] focus:outline-[rgb(203,84,51)]"
                        />
                    </div>

                    <div className="mb-4 flex flex-col gap-2">
                        <div className="flex flex-row items-center gap-1.5">
                            <FaRegStar size={18} className="relative text-[rgb(203,84,51)]" />
                            <label className="text-stone-800">Rating</label>
                        </div>

                        <RatingSelector value={rating} onChange={setRating} />
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex flex-row items-center gap-1.5">
                            <MdAttachMoney size={20} className="relative text-[rgb(203,84,51)]" />
                            <label className="text-stone-800">Price</label>
                        </div>
                        <input
                            value={dishPrice}
                            onChange={(e) => setDishPrice(e.target.value)}
                            type="number"
                            placeholder="0.00"
                            className="h-10 w-full rounded-lg border border-gray-300 px-3 bg-[rgb(248,245,242)] focus:outline-[rgb(203,84,51)]"
                        />
                    </div>
                </div>

                {/* Dish Photo */}
                <div className="bg-white py-6 px-6 rounded-lg border border-stone-200 flex flex-col gap-3">
                    <div className="flex flex-row items-center gap-1.5">
                        <MdOutlineAddPhotoAlternate size={18} className="relative text-[rgb(203,84,51)]" />
                        <label className="text-stone-800">Dish Photo</label>
                    </div>

                    <PhotoUploader
                        photoFile={photoFile}
                        photoPreviewUrl={photoPreviewUrl}
                        isDragActive={isDragActive}
                        onDragEnter={handleDragEnter}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onFileChange={handlePhotoInputChange}
                        onChooseFileClick={handleChooseFileClick}
                        onRemove={handleRemovePhoto}
                        fileInputRef={fileInputRef}
                    />
                </div>

                {/* Review */}
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
                        className="rounded-lg border border-gray-300 px-3 py-2 bg-[rgb(248,245,242)] focus:outline-[rgb(203,84,51)]"
                    />
                </div>

                {/* Tags */}
                <div className="bg-white py-6 px-6 rounded-lg border border-stone-200 flex flex-col gap-4">
                    <div className="flex flex-row items-center gap-1.5">
                        <IoPricetagsOutline size={18} className="relative text-[rgb(203,84,51)]" />
                        <label className="text-stone-800">Tags</label>
                    </div>

                    <TagsSelector
                        selectedTags={selectedTags}
                        customTagInput={customTagInput}
                        setCustomTagInput={setCustomTagInput}
                        onToggleSuggestedTag={toggleTag}
                        onAddCustomTag={handleAddCustomTag}
                        onRemoveTag={removeTag}
                        onCustomTagKeyDown={handleCustomTagKeyDown}
                    />
                </div>

                {/* Privacy */}
                <div className="bg-white py-6 px-6 rounded-lg border border-stone-200 flex flex-col gap-2">
                    <div className="flex flex-row items-center gap-1.5">
                        <IoLockClosedOutline size={16} className="relative text-[rgb(203,84,51)] top-[-1px]" />
                        <label className="text-stone-800">Privacy</label>
                    </div>

                    <PrivacySelector value={dishPrivacy} onChange={setDishPrivacy} />
                </div>

                {/* Cancel and Save Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={handleCancel}
                        type="button"
                        disabled={savingEntry}
                        className="w-1/2 mb-4 h-10 rounded-md bg-white py-2 text-sm text-stone-800 hover:cursor-pointer border border-stone-200"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={savingEntry}
                        className="w-1/2 mb-4 h-10 rounded-md bg-[rgb(203,84,51)] py-2 text-sm text-white hover:cursor-pointer"
                    >
                        {savingEntry ? "Saving..." : "Save Entry"}
                    </button>
                </div>
            </form>
        </div>
    );
}