import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import backgroundAudio from "../../assets/audio/background.mp3";
import aveMariaAudio from "../../assets/audio/ave-Maria.mp3";

const AudioControls = forwardRef(
  function AudioControls(
    {
      onPrayerEnd,
    },
    ref
  ) {
    const backgroundRef = useRef(null);
    const prayerRef = useRef(null);

    const [backgroundPlaying, setBackgroundPlaying] =
      useState(false);

    const [prayerPlaying, setPrayerPlaying] =
      useState(false);

    const [prayerMuted, setPrayerMuted] =
      useState(false);

    const [currentPrayerTitle, setCurrentPrayerTitle] =
      useState("Ave Maria");

    useEffect(() => {
      if (backgroundRef.current) {
        backgroundRef.current.volume = 0.18;
      }

      if (prayerRef.current) {
        prayerRef.current.volume = 0.8;
      }
    }, []);

    async function startPrayer({
      audio = aveMariaAudio,
      title = "Ave Maria",
    } = {}) {
      const prayer = prayerRef.current;
      const background = backgroundRef.current;

      if (!prayer || prayerPlaying) {
        return;
      }

      try {
        prayer.pause();

        prayer.src = audio;
        prayer.currentTime = 0;
        prayer.volume = 0.8;

        setCurrentPrayerTitle(title);
        setPrayerMuted(false);

        if (
          background &&
          !background.paused
        ) {
          background.volume = 0.06;
        }

        const playPromise = prayer.play();

        setPrayerPlaying(true);

        await playPromise;
      } catch (error) {
        setPrayerPlaying(false);

        console.error(
          `Não foi possível reproduzir ${title}:`,
          error
        );
      }
    }

    useImperativeHandle(
      ref,
      () => ({
        startPrayer,
      })
    );

    async function toggleBackground() {
      const background =
        backgroundRef.current;

      if (!background) {
        return;
      }

      try {
        if (background.paused) {
          await background.play();

          setBackgroundPlaying(true);
        } else {
          background.pause();

          setBackgroundPlaying(false);
        }
      } catch (error) {
        console.error(
          "Não foi possível reproduzir o áudio ambiente:",
          error
        );
      }
    }

    function togglePrayerMute() {
      const prayer = prayerRef.current;

      if (!prayer || !prayerPlaying) {
        return;
      }

      if (prayerMuted) {
        prayer.volume = 0.8;
        setPrayerMuted(false);
      } else {
        prayer.volume = 0;
        setPrayerMuted(true);
      }
    }

    function handlePrayerEnded() {
      setPrayerPlaying(false);
      setPrayerMuted(false);

      const background =
        backgroundRef.current;

      if (
        background &&
        !background.paused
      ) {
        background.volume = 0.18;
      }

      onPrayerEnd?.();
    }

    return (
      <div className="audio-controls">
        <audio
          ref={backgroundRef}
          src={backgroundAudio}
          loop
          preload="metadata"
        />

        <audio
          ref={prayerRef}
          src={aveMariaAudio}
          preload="metadata"
          onEnded={handlePrayerEnded}
        />

        <button
          type="button"
          className={`audio-control-button ${
            backgroundPlaying
              ? "active"
              : ""
          }`}
          onClick={toggleBackground}
          title={
            backgroundPlaying
              ? "Desligar música ambiente"
              : "Ouvir música ambiente"
          }
          aria-label={
            backgroundPlaying
              ? "Desligar música ambiente"
              : "Ouvir música ambiente"
          }
        >
          {backgroundPlaying
            ? "🔊"
            : "🔈"}

          <span className="audio-control-label">
            Ambiente
          </span>
        </button>

        <button
          type="button"
          className={`audio-control-button ${
            prayerPlaying
              ? "active"
              : ""
          }`}
          onClick={togglePrayerMute}
          disabled={!prayerPlaying}
          title={
            !prayerPlaying
              ? "A oração começa ao ser oferecida"
              : prayerMuted
                ? "Ouvir a oração"
                : "Silenciar a oração"
          }
          aria-label={
            !prayerPlaying
              ? "A oração começa ao ser oferecida"
              : prayerMuted
                ? "Ouvir a oração"
                : "Silenciar a oração"
          }
        >
          {prayerPlaying
            ? prayerMuted
              ? "🔇"
              : "🔊"
            : "♪"}

          <span className="audio-control-label">
            {prayerPlaying
              ? prayerMuted
                ? "Ouvir oração"
                : `Silenciar ${currentPrayerTitle}`
              : "Som da oração"}
          </span>
        </button>
      </div>
    );
  }
);

export default AudioControls;