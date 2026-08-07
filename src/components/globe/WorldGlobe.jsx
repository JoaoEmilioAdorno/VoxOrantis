import { useEffect, useRef } from "react";
import Globe from "react-globe.gl";

export default function WorldGlobe({ points = [] }) {
  const globeRef = useRef();

  useEffect(() => {
    if (!globeRef.current) return;

    const controls = globeRef.current.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;

    globeRef.current.pointOfView(
      {
        altitude: 2.2,
      },
      0
    );
  }, []);

  return (
    <Globe
      ref={globeRef}
      width={600}
      height={400}
      globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
      backgroundColor="#000000"
      pointsData={points}
      pointLat="lat"
      pointLng="lng"
      pointAltitude={0.01}
      pointRadius="size"
      pointColor="color"
    />
  );
}