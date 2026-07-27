import { useState, useEffect, useRef } from "react";
import useDebouncedValue from "../hooks/useDebouncedValue";
import { loadGoogleMaps } from "../lib/loadGoogleMaps";
import { getOrCreateRestaurantFromGooglePlace, getRestaurantById } from "../services/restaurant";
import { createDishEntryWithOptionalPhoto, updateDishEntryWithOptionalPhoto } from "../services/diary";
import { useNavigate } from "react-router-dom";
import useUserProfile from "../hooks/useUserProfile";
import { useSearchParams } from "react-router-dom";
import { invalidateHomePersonalCaches } from "../services/home";
import {
    validateDishEntry,
    sanitizePriceInput,
    getEndOfToday,
    PRICE_MIN,
    PRICE_MAX,
} from "../utils/dishEntryValidation";

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

export default function CreateDishEntry({
    mode = "create", // default create
    initialEntry = null, // for edit mode
    initialRestaurant = null, // for edit mode or prefilled rows
    onSuccess = null,
    onCancelOverride = null,
    isModal = false, // can work inside a modal or as a page
}) {
    const { user, loading: profileLoading, errorMessage: profileErrorMessage } = useUserProfile(); // gets current authenticated user
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();
    const restaurantId = mode === "create" ? searchParams.get("restaurantId") : null; //if there is a restaurantId
    const [searchValue, setSearchValue] = useState("");
    const debouncedSearchValue = useDebouncedValue(searchValue, 350); // slows down restaurant search so Google autocomplete isn’t called on every keystroke immediately

    const [suggestions, setSuggestions] = useState([]); // stores current autocomplete results
    const [sessionToken, setSessionToken] = useState(null); // stores google places autocomplete session token
    const [shouldFetchSuggestions, setShouldFetchSuggestions] = useState(true); // guard flag so autocomplete stops once a restaurant is selected
    const [userLocation, setUserLocation] = useState(null); //stores browser geolocation so autocomplete can bias nearby restaurants

    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [selectingRestaurant, setSelectingRestaurant] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [dateSelected, setDateSelected] = useState(undefined);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const datePickerRef = useRef(null);

    const [reviewInput, setReviewInput] = useState(""); // review textarea

    const [photoFile, setPhotoFile] = useState(null); // actual file object to upload
    const [photoPreviewUrl, setPhotoPreviewUrl] = useState(""); //browser display only
    const [isDragActive, setIsDragActive] = useState(false);
    const fileInputRef = useRef(null);
    const [removeExistingPhoto, setRemoveExistingPhoto] = useState(false); // remove from storage/db when removed in edit mode

    const [dishName, setDishName] = useState("");
    const [dishPrice, setDishPrice] = useState("");
    const [dishPrivacy, setDishPrivacy] = useState("public");
    const [rating, setRating] = useState(0);
    const [selectedTags, setSelectedTags] = useState([]);
    const [customTagInput, setCustomTagInput] = useState("");

    const [saveAction, setSaveAction] = useState(null);

    const topMessageRef = useRef(null);

    useEffect(() => {

        // Creates new autocomplete session token
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

        // get current geolocation
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
                // restaurant selected
                if (!shouldFetchSuggestions) {
                    setSuggestions([]);
                    return;
                }

                // empty search box
                if (!debouncedSearchValue.trim()) {
                    setSuggestions([]);
                    return;
                }

                // make sure code doesn't run before google places is loaded
                if (
                    !window.google ||
                    !window.google.maps ||
                    !window.google.maps.places
                ) {
                    return;
                }

                setLoadingSuggestions(true);
                setErrorMessage("");

                // use existing token if exists, otherwise create new
                const token =
                    sessionToken ||
                    new window.google.maps.places.AutocompleteSessionToken();

                const { AutocompleteSuggestion } =
                    await window.google.maps.importLibrary("places"); // the Places library

                // constructing the google autocomplete request
                const request = {
                    input: debouncedSearchValue, // what user typed
                    includedPrimaryTypes: ["restaurant"], // filters to restaurant results from google 
                    sessionToken: token,
                    locationBias: userLocation // nudges results towards the user's location if known
                        ? {
                            center: userLocation,
                            radius: 5000,
                        }
                        : undefined,
                };

                // Calling Google Places
                const response =
                    await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

                // format google's response into simple structure
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

    // revokes old object url when component unmounts or preview url changes; clean up effect
    // prevents lingering urls in memory and/or browser memory leaks
    useEffect(() => {
        return () => {
            if (photoPreviewUrl) {
                URL.revokeObjectURL(photoPreviewUrl);
            }
        };
    }, [photoPreviewUrl]);

    // ONLY IN EDIT MODE 
    // Preloads form state from the existing entry
    useEffect(() => {
        if (mode !== "edit" || !initialEntry) {
            return;
        }

        setSelectedRestaurant(initialRestaurant || null);
        setSearchValue(initialRestaurant?.name || "");
        setSuggestions([]);
        setShouldFetchSuggestions(false);

        setDateSelected(initialEntry.date_tried ? new Date(initialEntry.date_tried) : undefined);
        setReviewInput(initialEntry.review || "");
        setDishName(initialEntry.dish_name || "");
        setDishPrice(initialEntry.price ?? "");
        setDishPrivacy(initialEntry.privacy || "public");
        setRating(initialEntry.item_rating || 0);
        setSelectedTags(Array.isArray(initialEntry.tags) ? initialEntry.tags : []);
        setCustomTagInput("");

        setPhotoFile(null);
        setPhotoPreviewUrl(initialEntry.photoUrl || "");
        setRemoveExistingPhoto(false);
    }, [mode, initialEntry, initialRestaurant]);


    // close date picker on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (
                datePickerRef.current &&
                !datePickerRef.current.contains(event.target) // clicked outside
            ) {
                setIsDatePickerOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // prefill restaurant from URL params
    // clicking on 'add entry' from a restaurant inside MyDiary
    useEffect(() => {
        async function prefillRestaurant() {

            // only runs if restaurant id exists in the url
            if (!restaurantId) {
                return;
            }

            try {
                setSelectingRestaurant(true);
                setErrorMessage("");

                //fetch restaurant from db
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

    //auto clear success messages after 2.5 seconds
    useEffect(() => {
        if (!successMessage) return;

        const timeoutId = setTimeout(() => {
            setSuccessMessage("");
        }, 2500);

        return () => clearTimeout(timeoutId);
    }, [successMessage]);

    // called when suggestion is clicked
    async function handleSuggestionClick(suggestion) {
        try {
            setSelectingRestaurant(true);
            setErrorMessage("");
            setSuccessMessage("");
            setSuggestions([]);
            setShouldFetchSuggestions(false);

            // converts the google prediction into a full google place object
            const place = suggestion.placePrediction.toPlace();

            await place.fetchFields({
                fields: ["id", "displayName", "formattedAddress", "location"],
            });

            // checks to see if google place already exists in restaurants table, if not, create
            const restaurant = await getOrCreateRestaurantFromGooglePlace(place);

            setSelectedRestaurant(restaurant);
            setSearchValue(restaurant.name || "");
            setSessionToken(new window.google.maps.places.AutocompleteSessionToken()); //start fresh session token
        } catch (error) {
            console.error(error);
            setErrorMessage(error.message || "Failed to select restaurant.");
        } finally {
            setSelectingRestaurant(false);
        }
    }

    // resets the restaurant name / selected suggestion
    function handleClearSelectedRestaurant() {
        setSelectedRestaurant(null);
        setSearchValue("");
        setSuggestions([]);
        setShouldFetchSuggestions(true);
        setSuccessMessage("");

        if (window.google?.maps?.places) {
            setSessionToken(new window.google.maps.places.AutocompleteSessionToken());
        }
    }

    function handleDateSelect(date) {
        setDateSelected(date);
    }

    // strips characters the number input still allows (e, E, +, -) and
    // caps decimal places before the value reaches state
    function handlePriceChange(event) {
        setDishPrice(sanitizePriceInput(event.target.value));
    }

    // reads the first chosen file from the browser photo picker and passes it to the main photo-selection handler.
    function handlePhotoInputChange(event) {
        const file = event.target.files?.[0];
        handleSelectedPhoto(file);
    }

    function handleChooseFileClick() {
        fileInputRef.current?.click();
    }

    // stop the browser’s default drag-drop behavior and toggle drag styling
    function handleDragEnter(event) {
        event.preventDefault();
        setIsDragActive(true);
    }

    // stop the browser’s default drag-drop behavior and toggle drag styling
    function handleDragOver(event) {
        event.preventDefault();
        setIsDragActive(true);
    }

    // stop the browser’s default drag-drop behavior and toggle drag styling
    function handleDragLeave(event) {
        event.preventDefault();
        setIsDragActive(false);
    }

    // handles file drop into the drop zone
    function handleDrop(event) {
        event.preventDefault();
        setIsDragActive(false);

        const file = event.dataTransfer.files?.[0];
        handleSelectedPhoto(file); //pass to main handler again
    }

    function handleSelectedPhoto(file) {
        if (!file) return;

        // reject non-image files
        if (!file.type.startsWith("image/")) {
            setErrorMessage("Please upload an image file.");
            return;
        }

        setErrorMessage("");
        setSuccessMessage("");
        setPhotoFile(file);
        setRemoveExistingPhoto(false);

        // clean up old preview urls before replacing
        if (photoPreviewUrl) {
            URL.revokeObjectURL(photoPreviewUrl);
        }

        const previewUrl = URL.createObjectURL(file);
        setPhotoPreviewUrl(previewUrl);
    }


    // tag comparisons are case-insensitive
    function normalizeTag(tag) {
        return tag.trim().toLowerCase();
    }

    // toggles a suggested tag on/off
    function toggleTag(tagLabel) {
        const normalized = normalizeTag(tagLabel);

        setSelectedTags((prev) => {
            const alreadySelected = prev.some(
                (tag) => normalizeTag(tag) === normalized
            );

            // unselect if selected
            if (alreadySelected) {
                return prev.filter((tag) => normalizeTag(tag) !== normalized);
            }

            // add
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
        if (!trimmed) return; //empty

        const normalized = normalizeTag(trimmed); //ignore case/whitespace
        const alreadySelected = selectedTags.some(
            (tag) => normalizeTag(tag) === normalized
        );

        // add if new
        if (!alreadySelected) {
            setSelectedTags((prev) => [...prev, trimmed]);
        }

        // clear input
        setCustomTagInput("");
    }

    // Pressing Enter inside the custom tag input adds the tag instead of submitting the whole form
    function handleCustomTagKeyDown(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            handleAddCustomTag();
        }
    }

    // if a parent provided a custom cancel behavior, use that and stop.
    function handleCancel() {
        if (onCancelOverride) {
            onCancelOverride();
            return;
        }

        // if theres an id in params navigate back to that restaurant page
        if (selectedRestaurant?.id) {
            navigate(`/restaurant/${selectedRestaurant.id}`);
            return;
        }

        navigate("/diary");
    }

    // FOR BATCH SAVES 
    function resetDishFieldsForAnotherEntry() {
        setErrorMessage("");
        setSuccessMessage("");

        // ONLY CLEARING DISH-SPECIFIC INPUTS
        setDishName("");
        setDishPrice("");
        setRating(0);
        setReviewInput("");
        setSelectedTags([]);
        setCustomTagInput("");

        setPhotoFile(null);
        setRemoveExistingPhoto(false);

        if (photoPreviewUrl) {
            URL.revokeObjectURL(photoPreviewUrl);
        }

        setPhotoPreviewUrl("");
        setIsDragActive(false);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    // FULL RESET; AFTER NORMAL FINISHED SAVE
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
        setDishPrivacy("public");
        setRating(0);
        setSelectedTags([]);
        setCustomTagInput("");
        setRemoveExistingPhoto(false);
        setSuccessMessage("");

        if (window.google?.maps?.places) {
            setSessionToken(new window.google.maps.places.AutocompleteSessionToken());
        }
    }

    //scrolls the page to the message box
    function scrollToTopMessage() {
        if (topMessageRef.current) {
            topMessageRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
            return;
        }

        // just scroll to the top if the message box ref doesnt exist
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }

    async function handleSaveEntry(saveMode = "finish") {
        if (saveAction) return;

        setErrorMessage("");
        setSuccessMessage("");

        // shared rules, so create and edit modes validate identically
        const { firstError, isValid } = validateDishEntry({
            selectedRestaurant,
            dishName,
            rating,
            price: dishPrice,
            dateTried: dateSelected,
        });

        if (!isValid) {
            setErrorMessage(firstError);
            scrollToTopMessage();
            return;
        }

        try {
            // saveModes: edit, finish, addAnother 
            setSaveAction(mode === "edit" ? "edit" : saveMode);

            if (!user) {
                throw new Error("You must be logged in to save an entry.");
            }

            let savedEntry;

            // calls update service
            if (mode === "edit" && initialEntry) {
                savedEntry = await updateDishEntryWithOptionalPhoto({
                    entryId: initialEntry.id,
                    userId: user.id,
                    restaurantId: selectedRestaurant.id,
                    dateTried: dateSelected,
                    dishName,
                    itemRating: rating || null,
                    review: reviewInput,
                    privacy: dishPrivacy || "public",
                    price: dishPrice,
                    tags: selectedTags,
                    photoFile,
                    existingPhotoPath: initialEntry.photo_path,
                    removeExistingPhoto,
                });
            } else {
                // calls create service
                savedEntry = await createDishEntryWithOptionalPhoto({
                    userId: user.id,
                    restaurantId: selectedRestaurant.id,
                    dateTried: dateSelected,
                    dishName,
                    itemRating: rating || null,
                    review: reviewInput,
                    privacy: dishPrivacy || "public",
                    price: dishPrice,
                    tags: selectedTags,
                    photoFile,
                });
            }

            // invalidate home cache so that home page updates with fresh info after update
            invalidateHomePersonalCaches(user.id);

            if (onSuccess) {
                onSuccess(savedEntry);
                return;
            }

            if (mode === "edit") {
                navigate(`/restaurant/${selectedRestaurant.id}`);
                return;
            }

            // clear fields, keep current restaurant 
            if (saveMode === "addAnother") {
                const restaurantName = selectedRestaurant.name || "this restaurant";
                resetDishFieldsForAnotherEntry();
                setSuccessMessage(`Saved entry for ${restaurantName}. Add another dish.`);
                scrollToTopMessage();
                return;
            }

            resetForm();

            // if normal create -> go to the diary for this restaurant
            navigate(`/restaurant/${selectedRestaurant.id}`);
        } catch (error) {
            setErrorMessage(
                error.message || `Failed to ${mode === "edit" ? "update" : "save"} dish entry`
            );
            scrollToTopMessage();
        } finally {
            setSaveAction(null);
        }
    }

    // clear any newly selected file
    function handleRemovePhoto() {
        setPhotoFile(null); // clear file

        // clean up existing preview url
        if (photoPreviewUrl) {
            URL.revokeObjectURL(photoPreviewUrl);
        }

        setPhotoPreviewUrl("");
        setRemoveExistingPhoto(true);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    //loading and profile guard returns
    // ensures form doesnt render until the current user/profile state is ready
    if (profileLoading) {
        return <p>Loading...</p>;
    }

    if (profileErrorMessage) {
        return <p>{profileErrorMessage}</p>;
    }

    return (
        <div className={isModal ? "flex flex-col gap-6" : "mx-auto flex w-full max-w-3xl flex-col gap-6"}>
            <div className="flex flex-row justify-between items-start">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl text-stone-700">

                        {/* conditional render of title */}
                        {mode === "edit" ? "Edit Entry" : "New Entry"}
                    </h1>
                    <p className="text-[rgb(137,122,114)]">
                        {mode === "edit" ? "Update your dish entry" : "Log a dish you tried at a restaurant"}
                    </p>
                </div>
                <button
                    onClick={handleCancel}
                    type="button"
                    disabled={Boolean(saveAction)}
                    className="text-2xl text-stone-800 hover:cursor-pointer"
                >
                    x
                </button>
            </div>

            {/* show success and error message */}
            {(errorMessage || successMessage) && (
                <div
                    ref={topMessageRef}
                    className={`rounded-lg border px-4 py-3 ${errorMessage
                        ? "border-red-200 bg-red-50"
                        : "border-green-200 bg-green-50"
                        }`}
                >
                    <p
                        className={`text-sm ${errorMessage ? "text-red-700" : "text-green-700"
                            }`}
                    >
                        {errorMessage || successMessage}
                    </p>
                </div>
            )}

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveEntry("finish");
                }}
                className="flex flex-col gap-6"
            >
                {/* Restaurant */}
                <div className="bg-white py-6 px-6 rounded-lg border border-stone-200 flex flex-col gap-2">
                    <div className="flex flex-row items-center gap-1.5">
                        <IoLocationOutline size={20} className="relative text-[rgb(203,84,51)]" />
                        <label className="text-stone-800">
                            Restaurant <span className="text-red-500">*</span>
                        </label>
                    </div>

                    {!selectedRestaurant ? (
                        <>
                            <input
                                type="text"
                                value={searchValue}
                                onChange={(e) => {
                                    setSearchValue(e.target.value);
                                    setShouldFetchSuggestions(true);
                                    setSuccessMessage("");
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
                        maxDate={getEndOfToday()}
                    />
                </div>

                {/* Dish Name + Rating + Price */}
                <div className="bg-white py-6 px-6 rounded-lg border border-stone-200 flex flex-col gap-2">
                    <div className="mb-4 flex flex-col gap-2">
                        <div className="flex flex-row items-center gap-1.5">
                            <BiDish size={20} className="relative text-[rgb(203,84,51)]" />
                            <label className="text-stone-800">
                                Dish Name <span className="text-red-500">*</span>
                            </label>
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
                            <label className="text-stone-800">
                                Rating <span className="text-red-500">*</span>
                            </label>
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
                            onChange={handlePriceChange}
                            // block the characters a number input otherwise accepts
                            onKeyDown={(e) => {
                                if (["e", "E", "+", "-"].includes(e.key)) {
                                    e.preventDefault();
                                }
                            }}
                            type="number"
                            inputMode="decimal"
                            min={PRICE_MIN}
                            max={PRICE_MAX}
                            step="0.01"
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

                {/* Actions */}
                <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                        onClick={handleCancel}
                        type="button"
                        disabled={Boolean(saveAction)}
                        className="w-full sm:w-1/3 mb-4 h-10 rounded-md bg-white py-2 text-sm text-stone-800 hover:cursor-pointer border border-stone-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Cancel
                    </button>

                    {mode === "create" && (
                        <button
                            type="button"
                            disabled={Boolean(saveAction)}
                            onClick={() => handleSaveEntry("addAnother")}
                            className="w-full sm:w-1/3 mb-4 h-10 rounded-md border border-[rgb(203,84,51)] bg-white py-2 text-sm text-[rgb(203,84,51)] hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saveAction === "addAnother" ? "Saving..." : "Save & Add Another"}
                        </button>
                    )}

                    <button
                        type="submit"
                        disabled={Boolean(saveAction)}
                        className={`w-full ${mode === "create" ? "sm:w-1/3" : "sm:w-2/3"} mb-4 h-10 rounded-md bg-[rgb(203,84,51)] py-2 text-sm text-white hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                        {mode === "edit"
                            ? saveAction === "edit"
                                ? "Updating..."
                                : "Update Entry"
                            : saveAction === "finish"
                                ? "Saving..."
                                : "Save & Finish"}
                    </button>
                </div>
            </form>
        </div>
    );
}