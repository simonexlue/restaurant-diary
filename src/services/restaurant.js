import { supabase } from "../lib/supabase";

export async function fetchRestaurants() {
    const {data, error} = await supabase
        .from("restaurants")
        .select("*")
        .order("created_at", {ascending: false})

    if(error) {
        throw error
    }

    return data || []
}

export async function findRestaurantByGooglePlaceId(googlePlaceId) {
    const {data, error} = await supabase
        .from("restaurants")
        .select("*")
        .eq("google_place_id", googlePlaceId)
        .maybeSingle();

    if(error) {
        throw error
    }

    return data;
}

export async function createGoogleRestaurant({
  google_place_id,
  name,
  address,
  lat,
  lng,
}) {
  const { data, error } = await supabase
    .from("restaurants")
    .insert({
      google_place_id,
      name,
      address: address || null,
      lat,
      lng,
      source: "google",
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createManualRestaurant({ name, address, lat, lng }) {
  const { data, error } = await supabase
    .from("restaurants")
    .insert({
      google_place_id: null,
      name,
      address: address || null,
      lat,
      lng,
      source: "manual",
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function saveGoogleRestaurantIfNotExists({
  google_place_id,
  name,
  address,
  lat,
  lng,
}) {
  const existingRestaurant = await findRestaurantByGooglePlaceId(google_place_id);

  if (existingRestaurant) {
    return {
      restaurant: existingRestaurant,
      alreadyExists: true,
    };
  }

  const newRestaurant = await createGoogleRestaurant({
    google_place_id,
    name,
    address,
    lat,
    lng,
  });

  return {
    restaurant: newRestaurant,
    alreadyExists: false,
  };
}

export async function getOrCreateRestaurantFromGooglePlace(place) {
  const google_place_id = place.id;
  const lat = place.location?.lat();
  const lng = place.location?.lng();

  if (!google_place_id || lat == null || lng == null) {
    throw new Error("Missing Google place details.");
  }

  const result = await saveGoogleRestaurantIfNotExists({
    google_place_id,
    name: place.displayName || "Unnamed restaurant",
    address: place.formattedAddress || null,
    lat,
    lng,
  });

  return result.restaurant;
}