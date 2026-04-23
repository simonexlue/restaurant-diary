export function clearMarkers(markersRef) {
    if (!markersRef?.current) return;

    markersRef.current.forEach((marker) => marker.setMap(null)); // remove all markers first from map whenever something changes
    markersRef.current = [];
}

export function renderUnifiedMarkers({
    restaurantRows,
    map,
    markersRef,
    onMarkerClick,
}) {
    clearMarkers(markersRef); // remove existing markers before drawing new markers -> fresh

    markersRef.current = restaurantRows.map((restaurant) => {
        const marker = new window.google.maps.Marker({
            map,
            //place markers at restaurant coords
            position: {
                lat: restaurant.lat,
                lng: restaurant.lng,
            },
            title: restaurant.name,
            icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 9,
                fillColor: restaurant.isSavedByUser
                    ? "#22c55e" //green: saved by user
                    : "rgb(203,84,51)", //orage: friend-only
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
            },
        });

        //opens modal on click
        marker.addListener("click", () => {
            onMarkerClick?.(restaurant);
        });

        return marker;
    });
}