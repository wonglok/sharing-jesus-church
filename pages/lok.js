import { Canvas } from "@react-three/fiber";
import { getGPUTier } from "detect-gpu";
import { MyHomeWithTheLord } from "../pages-home-with-jesus/MyHomeWithTheLord";
import { useState } from "react";
// import { FPCursor } from "../video-game/FPCursor";
// import { LockScreenHTML } from "../video-game/LockScreenHTML";

export default function Home() {
  return (
    <div className="w-full h-full">
      {/*  */}
      {/*  */}
      {/*  */}
      {/*  */}
      {/*  */}
      {/*  */}

      <CanvasArea></CanvasArea>
      {/* <FPCursor></FPCursor> */}
      {/* <LockScreenHTML></LockScreenHTML> */}
    </div>
  );
}

function CanvasArea() {
  let [dpr, setDPR] = useState([1, 3]);

  return (
    <Canvas
      // dpr={
      //   (typeof window !== "undefined" && window.devicePixelRatio) || 1.0
      // }

      onCreated={({ gl }) => {
        //
        getGPUTier({ glContext: gl.getContext() }).then((v) => {
          // ipad
          if (v.gpu === "apple a9x gpu") {
            setDPR([1, 1]);
            return;
          }
          if (v.fps < 30) {
            setDPR([1, 1]);
            return;
          }

          if (v.tier >= 3) {
            setDPR([1, 3]);
          } else if (v.tier >= 2) {
            setDPR([1, 2]);
          } else if (v.tier >= 1) {
            setDPR([1, 1]);
          } else if (v.tier < 1) {
            setDPR([1, 0.75]);
          }
        });
      }}
      dpr={dpr}
    >
      <MyHomeWithTheLord></MyHomeWithTheLord>
    </Canvas>
  );
}
