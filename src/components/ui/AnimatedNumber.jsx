import React, { useEffect, useRef, useState } from "react";
import { useMotionValue, animate } from "framer-motion";

export function AnimatedNumber({ value, format = (v) => Math.round(v).toLocaleString(), duration = 0.9 }) {
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(format(0));
  const started = useRef(false);

  useEffect(() => {
    const controls = animate(mv, value, {
      duration: started.current ? duration : 1.1,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(format(v)),
    });
    started.current = true;
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span className="mono">{display}</span>;
}

export default AnimatedNumber;
