import  { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { createRoot } from "react-dom/client";
import "mapbox-gl/dist/mapbox-gl.css";

interface MapboxProps {
  location: [number, number]; // [latitude, longitude]
  name: string;
}
function Mapbox(props:MapboxProps) {
  // Explicitly typing mapContainerRef to allow it to be a reference to an HTMLDivElement or null
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    mapboxgl.accessToken =
      "pk.eyJ1IjoibWFudWFyZXJhYSIsImEiOiJjbTEwZDZkMXgwZjRhMmxzOGhvZmhhZnk0In0.NWYGUQwiqYsNXixuz43aMA";

    // Check that the map container reference is not null before initializing the map
    if (mapContainerRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current, // this will be an HTMLDivElement
        center: [props.location[1], props.location[0]], // lng, lat
        zoom: 10, // starting zoom
        minZoom: 4, // Locking zoom-out level (min zoom level)
        maxZoom: 22, // Optional, just in case to limit zoom-in level
      });

      // Add navigation control (zoom buttons)
      mapRef.current.addControl(new mapboxgl.NavigationControl());

      // Custom marker component as a function that returns JSX
      const CustomMarker = () => (
        <div className="relative flex flex-col items-center justify-center px-4 py-2 text-white bg-black rounded-lg">
          <p>{props.name}</p>
          {/* Triangle tip */}
          <div className="absolute w-0 h-0 border-t-8 border-l-8 border-r-8 border-l-transparent border-r-transparent border-t-black -bottom-2"></div>
        </div>
      );

      // Create a container element for the marker
      const markerDiv = document.createElement("div");

      // Ensure the DOM is ready for rendering
      const root = createRoot(markerDiv);
      root.render(<CustomMarker />);

      // Add the custom marker to the map
      new mapboxgl.Marker(markerDiv)
        .setLngLat([props.location[1], props.location[0]]) // lng, lat
        .addTo(mapRef.current);

      // Cleanup function to remove the map when the component unmounts
      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
        }
      };
    }
  }, [props.location, props.name]); // Depend on props.location and props.name

  return (
    <>
      <div
        style={{ height: "100%", borderRadius: "20px" }}
        ref={mapContainerRef} // mapContainerRef is a ref to an HTMLDivElement
        className="map-container"
      />
    </>
  );
}

export default Mapbox;
