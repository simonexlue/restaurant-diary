export function clearMarkers(markersRef) {
    if (!markersRef?.current) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
}

export function renderUnifiedMarkers({
    restaurantRows,
    map,
    markersRef,
    onMarkerClick,
}) {
    clearMarkers(markersRef);

    markersRef.current = restaurantRows.map((restaurant) => {
        const marker = new window.google.maps.Marker({
            map,
            position: {
                lat: restaurant.lat,
                lng: restaurant.lng,
            },
            title: restaurant.name,
            icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 9,
                fillColor: restaurant.isSavedByUser
                    ? "rgb(203,84,51)"
                    : "#22c55e",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
            },
        });

        marker.addListener("click", () => {
            onMarkerClick?.(restaurant);
        });

        return marker;
    });
}