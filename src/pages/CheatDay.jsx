import { useEffect, useRef, useState } from "react";
import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";
import {
  createTodayCheatDayResult,
  getMonthlyWinningDays,
  getTodayCheatDayResult,
} from "../services/cheatDayService";
import "../styles/CheatDay.css";

const WHEEL_SEGMENTS = [
  { label: "CSALÓNAP", winning: true },
  { label: "Tarts ki!" },
  { label: "Majdnem!" },
  { label: "Holnap újra!" },
  { label: "Csak így tovább!" },
  { label: "Még ne add fel!" },
];

const CONFETTI_PIECES = Array.from({ length: 36 }, (_, index) => ({
  id: index,
  left: `${(index * 37) % 100}%`,
  delay: `${(index % 9) * 0.08}s`,
  rotation: `${(index * 47) % 180}deg`,
  color: ["#cfa34b", "#f1d278", "#6ca879", "#fff1b9"][index % 4],
}));

function CheatDay() {
  const savedResult = getTodayCheatDayResult();
  const [result, setResult] = useState(savedResult);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(
    savedResult ? -savedResult.segmentIndex * 60 : 0
  );
  const [showConfetti, setShowConfetti] = useState(false);
  const spinTimerRef = useRef();
  const confettiTimerRef = useRef();

  useEffect(() => {
    getMonthlyWinningDays();
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(spinTimerRef.current);
      clearTimeout(confettiTimerRef.current);
    };
  }, []);

  const handleSpin = () => {
    if (result || isSpinning) {
      return;
    }

    const nextResult = createTodayCheatDayResult();
    const currentRotation = ((wheelRotation % 360) + 360) % 360;
    const targetRotation = (-nextResult.segmentIndex * 60 + 360) % 360;
    const rotationToTarget = (targetRotation - currentRotation + 360) % 360;

    setIsSpinning(true);
    setWheelRotation((rotation) => rotation + 2160 + rotationToTarget);

    spinTimerRef.current = setTimeout(() => {
      setResult(nextResult);
      setIsSpinning(false);

      if (nextResult.isWinner) {
        setShowConfetti(true);
        confettiTimerRef.current = setTimeout(() => setShowConfetti(false), 3600);
      }
    }, 4200);
  };

  const hasWinner = result?.isWinner;

  return (
    <div className="cheat-day-page">
      <Header title="Csalónap" />

      <main className="cheat-day-container">
        <section className="cheat-day-intro">
          <p className="cheat-day-eyebrow">HAVONTA 4 KÜLÖNLEGES NAP</p>
          <h1>Ma rád mosolyog a szerencse?</h1>
          <p>
            Naponta egyszer pörgethetsz. A csalónapok titokban várnak rád.
          </p>
        </section>

        <section className={`wheel-panel ${hasWinner ? "wheel-panel-winner" : ""}`}>
          <div className="wheel-stage" aria-label="Csalónap szerencsekerék">
            <div className="wheel-pointer" aria-hidden="true" />
            <div
              className={`cheat-wheel ${isSpinning ? "cheat-wheel-spinning" : ""}`}
              style={{ transform: `rotate(${wheelRotation}deg)` }}
            >
              {WHEEL_SEGMENTS.map((segment, index) => (
                <span
                  className={`wheel-label ${segment.winning ? "wheel-label-winning" : ""}`}
                  key={segment.label}
                  style={{ "--segment": index }}
                >
                  {segment.label}
                </span>
              ))}
              <div className="wheel-center">RF</div>
            </div>
          </div>

          <button
            className="spin-button"
            type="button"
            onClick={handleSpin}
            disabled={isSpinning || Boolean(result)}
          >
            {isSpinning ? "PÖRÖG..." : "PÖRGETÉS"}
          </button>

          {result && (
            <div className={`cheat-day-result ${hasWinner ? "cheat-day-result-winner" : ""}`}>
              <h2>
                {hasWinner ? "🎉 CSALÓNAP! 🎉" : "Ma még nem jött el a csalónap…"}
              </h2>
              <p>
                {hasWinner
                  ? "Ma bármit ehetsz! Élvezd ki, megérdemled! 🍔🍕🍰"
                  : "Tarts ki! 💪 A következő pörgetés holnap vár."}
              </p>
              <span className="cheat-day-status">A mai pörgetésed elmentve</span>
            </div>
          )}
        </section>
      </main>

      {showConfetti && (
        <div className="confetti" aria-hidden="true">
          {CONFETTI_PIECES.map((piece) => (
            <span
              className="confetti-piece"
              key={piece.id}
              style={{
                "--left": piece.left,
                "--delay": piece.delay,
                "--rotation": piece.rotation,
                "--confetti-color": piece.color,
              }}
            />
          ))}
        </div>
      )}

      <BottomNavigation />
    </div>
  );
}

export default CheatDay;
