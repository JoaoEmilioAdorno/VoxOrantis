import { useEffect, useRef } from "react";
import Globe from "react-globe.gl";

export default function WorldGlobe({ points = [] }) {
  const globeRef = useRef(null);

  useEffect(() => {
    if (!globeRef.current) return;

    const controls = globeRef.current.controls();

    controls.autoRotate = false;
    controls.autoRotateSpeed = 0.0;
    controls.enablePan = false;
    controls.enableZoom = true;

    globeRef.current.pointOfView(
      {
        altitude: 2.2,
      },
      0
    );
  }, []);

  return (
    <div
      style={{
        // position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        // overflow: "hidden",
        zIndex: 0,
      }}
    >
      <Globe
        ref={globeRef}
        width={window.innerWidth}
        height={window.innerHeight}
        pointsTransitionDuration={1200}
        backgroundColor="rgba(0, 0, 0, 0)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        showAtmosphere={true}
        atmosphereColor="#4da6ff"
        atmosphereAltitude={0.15}
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointRadius="size"
        pointResolution={16}
        pointsMerge={false}
      />
    </div>
  );
}