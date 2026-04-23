let loadingPromise = null;

export function loadGoogleMaps() {
  //already loaded: already resolved promise
  if (window.google && window.google.maps) {
    return Promise.resolve();
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = new Promise((resolve, reject) => { 
    //Look in the DOM for a script tag that has been previously inserted
    const existingScript = document.querySelector(
      'script[data-google-maps="true"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve());
      existingScript.addEventListener("error", () =>
        reject(new Error("Google Maps failed to load"))
      );
      return;
    }

    // if no script exists yet create new script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    }&v=weekly&libraries=places`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = "true";

    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps failed to load"));

    document.head.appendChild(script);
  });

  return loadingPromise;
}