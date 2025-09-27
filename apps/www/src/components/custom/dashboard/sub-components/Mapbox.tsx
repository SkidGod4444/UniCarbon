import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface Property {
  name: string;
  id: number;
  type: string;
  price: number;
  status: string;
  available_shares: number;
  propertyName: string;
  location: string;
  yourShares: number;
  latitude?: number;
  longitude?: number;
}

interface MapboxProps {
  properties: Property[];
}

const Mapbox: React.FC<MapboxProps> = ({ properties }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [spinEnabled] = useState(true);
  let userInteracting = false;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken =
      "pk.eyJ1IjoibWFudWFyZXJhYSIsImEiOiJjbHVua3JhcHAxNjRkMmpwN2p1a2VwcTZlIn0.M7SLaBn_r3ldw0KuawrZbA";

    const map = new mapboxgl.Map({
      container: mapContainerRef.current!,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-74.5, 40], // Default center position
      zoom: 1,
      maxZoom: 15,
      projection: "globe",
    });

    mapRef.current = map;

    properties.forEach((property) => {
      const { latitude, longitude,  propertyName, yourShares } = property;

      if (!latitude || !longitude) {
        console.error(`Invalid coordinates for ${propertyName}`);
        return;
      }

      const el = document.createElement("div");
      el.className = "custom-marker";
      el.innerHTML = `
        <div class="marker-content bg-black text-white p-2 rounded-lg text-sm">
          <strong>${propertyName}</strong>
          ${yourShares ? `<br /><span>${yourShares} shares</span>` : ""}
        </div>
      `;
      new mapboxgl.Marker(el).setLngLat([longitude, latitude]).addTo(map);
     
    });

    const spinGlobe = () => {
      if (!map || !spinEnabled || userInteracting) return;
      const zoom = map.getZoom();
      const maxSpinZoom = 5;
      const slowSpinZoom = 3;
      let distancePerSecond = 360 / 60;

      if (zoom > slowSpinZoom) {
        const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
        distancePerSecond *= zoomDif;
      }

      const center = map.getCenter();
      center.lng -= distancePerSecond;
      map.easeTo({ center, duration: 1000, easing: (n) => n });

      map.once("moveend", spinGlobe);
    };

    const stopSpinOnInteraction = () => {
      userInteracting = true;
    };

    const resumeSpinAfterInteraction = () => {
      userInteracting = false;
      spinGlobe();
    };

    map.on("mousedown", stopSpinOnInteraction);
    map.on("mouseup", resumeSpinAfterInteraction);
    map.on("dragend", resumeSpinAfterInteraction);
    map.on("pitchend", resumeSpinAfterInteraction);
    map.on("rotateend", resumeSpinAfterInteraction);

    spinGlobe();

    return () => {
      map.remove();
    };
  }, [properties, spinEnabled]);

  return <div ref={mapContainerRef} className="map-container w-full h-full rounded-xl" />;
};

export default Mapbox;
