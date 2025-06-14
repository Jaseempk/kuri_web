import { useEffect, useState } from "react";
import ReactConfetti from "react-confetti";

interface ConfettiProps {
  duration?: number;
  particleCount?: number;
  colors?: string[];
}

export const Confetti = ({
  duration = 5000,
  particleCount = 200,
  colors = ["#C84E31", "#B8860B", "#F5F5DC", "#228B22"],
}: ConfettiProps) => {
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [show, setShow] = useState(true);

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    const timer = setTimeout(() => {
      setShow(false);
    }, duration);

    return () => {
      window.removeEventListener("resize", updateDimensions);
      clearTimeout(timer);
    };
  }, [duration]);

  if (!show) return null;

  return (
    <ReactConfetti
      width={dimensions.width}
      height={dimensions.height}
      numberOfPieces={particleCount}
      colors={colors}
      recycle={false}
      gravity={0.2}
      initialVelocityY={10}
    />
  );
};
