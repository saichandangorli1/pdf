import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import React, { useRef } from "react";

const Loading = () => {
  const loadRef = useRef(null);
  useGSAP(() => {
    gsap.from(loadRef.current, {
      opacity: 0,
      duration: 1.2,
      repeat: -1,
      ease: "none",
    });
  }, []);
  return (
    <div className="flex justify-center items-center font-bold text-4xl h-screen bg-[#161616] text-white">
      PDF
      <span className="inline-block text-[#e34133]" ref={loadRef}>
        .
      </span>
    </div>
  );
};

export default Loading;
