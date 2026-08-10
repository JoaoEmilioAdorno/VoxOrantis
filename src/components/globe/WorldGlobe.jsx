import {
  useEffect,
  useRef,
  useState,
} from "react";

import Globe from "react-globe.gl";

export default function WorldGlobe({
  points = [],
}) {
  const globeRef = useRef(null);
  const containerRef = useRef(null);

  const [dimensions, setDimensions] =
    useState({
      width: 0,
      height: 0,
    });

  /*
   * Mede o espaço realmente disponível
   * para o globo.
   *
   * Isso permite que o componente funcione
   * corretamente tanto no desktop quanto
   * no celular.
   */
  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    function updateDimensions() {
      const width = container.clientWidth;
      const height = container.clientHeight;

      setDimensions({
        width,
        height,
      });
    }

    updateDimensions();

    const resizeObserver =
      new ResizeObserver(updateDimensions);

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  /*
   * Configuração da câmera e rotação.
   */
  useEffect(() => {
    if (!globeRef.current) {
      return;
    }

    const controls =
      globeRef.current.controls();

    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;

    controls.enablePan = false;
    controls.enableZoom = true;

    /*
     * No celular afastamos um pouco mais
     * a câmera para o planeta caber melhor.
     */
    const isMobile =
      dimensions.width <= 640;

    globeRef.current.pointOfView(
      {
        altitude: isMobile ? 2.6 : 2.2,
      },
      0
    );
  }, [dimensions.width]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        zIndex: 0,
      }}
    >
      {dimensions.width > 0 &&
        dimensions.height > 0 && (
          <Globe
            ref={globeRef}

            width={dimensions.width}
            height={dimensions.height}

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
        )}
    </div>
  );
}