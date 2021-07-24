import { Canvas } from "@react-three/fiber";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
// import { PCFShadowMap, PCFSoftShadowMap } from "three";
import { setup } from "./AppFirebase.js";
import { Now } from "./Now.js";
import { UIWatchTV } from "./UIWatchTV.js";
import { useAutoEvent } from "../vfx-runtime/ENUtils.js";
// import { Text } from "@react-three/drei";
import { getGPUTier } from "detect-gpu";
import { FPCursor } from "./FPCursor.js";

// function MyScene({ children }) {
//   return (
//     <group>
//       {/*  */}
//       {children}
//       {/*  */}
//     </group>
//   );
// }

let Pages = [
  {
    name: "loklok",
    Component: dynamic(() =>
      import(/* webpackPrefetch: true */ "./MapLokLok.js").then(
        (e) => e.MapScene
      )
    ),
  },
  {
    name: "multitude",
    Component: dynamic(() =>
      import(/* webpackPrefetch: true */ "./MapMultitude.js").then(
        (e) => e.MapScene
      )
    ),
  },
  {
    name: "chill",
    Component: dynamic(() =>
      import(/* webpackPrefetch: true */ "./MapPlaceToChill.js").then(
        (e) => e.MapScene
      )
    ),
  },
  {
    name: "church",
    Component: dynamic(() =>
      import(/* webpackPrefetch: true */ "./MapChurch.js").then(
        (e) => e.MapScene
      )
    ),
  },
  //
  {
    name: "prism",
    Component: dynamic(() =>
      import(/* webpackPrefetch: true */ "./MapStagePrism.js").then(
        (e) => e.MapScene
      )
    ),
  },
  //
  {
    name: "heavenly",
    Component: dynamic(() =>
      import(/* webpackPrefetch: true */ "./MapHeavenly.js").then(
        (e) => e.MapScene
      )
    ),
  },

  //
  {
    name: "bread",
    Component: dynamic(() =>
      import(/* webpackPrefetch: true */ "./MapBread.js").then(
        (e) => e.MapScene
      )
    ),
  },
  {
    name: "tv",
    Component: dynamic(() =>
      import(/* webpackPrefetch: true */ "./MapTV.js").then((e) => e.MapScene)
    ),
  },
  {
    name: "home",
    Component: dynamic(() =>
      import(/* webpackPrefetch: true */ "./MapHome.js").then((e) => e.MapScene)
    ),
  },
  //

  // MapPlaceToChill
];

export function NewGame3D() {
  let route = useRouter();
  let [found, setFound] = useState(null);
  let [dpr, setDPR] = useState([1, 3]);

  //
  useEffect(() => {
    setup();

    let roomID = route.query.roomID;

    let game = Pages.find(
      (e) => e.name.toLowerCase() === `${roomID}`.toLowerCase()
    );

    if (game) {
      setFound(game);
    }
  }, [route.query.roomID]);

  //
  return (
    <>
      <div className="w-full h-full">
        {typeof found === "object" && found !== null ? (
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
            {/* <MyScene> */}
            {/* <Suspense
                fallback={
                  <Text
                    rotation-x={Math.PI * -0.25}
                    position={[0, 1, 0]}
                    color={"#000000"}
                    fontSize={1.0}
                    maxWidth={200}
                    lineHeight={1}
                    textAlign={"center"}
                    font="/font/Cronos-Pro-Light_12448.ttf"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.04}
                    outlineColor="#ffffff"
                  >
                    Loading...
                  </Text>
                }
              > */}
            <found.Component></found.Component>
            {/* </Suspense> */}
            {/* </MyScene> */}
          </Canvas>
        ) : found === null ? (
          <div className="w-full h-full flex items-center justify-center">
            Loading...
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            Not Found
          </div>
        )}
        <FPCursor></FPCursor>
      </div>
      <Overlays></Overlays>
    </>
  );
}

function Overlays() {
  Now.makeKeyReactive(`overlay`);

  useAutoEvent("keydown", (ev) => {
    if (ev.key.toLowerCase() === "escape") {
      Now.overlay = "";
    }
  });
  return (
    <>
      {Now.overlay === "watch" && (
        <div className="w-full h-full absolute top-0 left-0 bg-white bg-opacity-80">
          <UIWatchTV />
        </div>
      )}

      {Now.overlay && (
        <div
          className="absolute top-0 right-0 m-4 cursor-pointer"
          onClick={() => {
            Now.overlay = "";
          }}
          onTouchStart={() => {
            Now.overlay = "";
          }}
        >
          <svg
            width="24"
            height="24"
            xmlns="http://www.w3.org/2000/svg"
            fillRule="evenodd"
            clipRule="evenodd"
          >
            <path d="M12 11.293l10.293-10.293.707.707-10.293 10.293 10.293 10.293-.707.707-10.293-10.293-10.293 10.293-.707-.707 10.293-10.293-10.293-10.293.707-.707 10.293 10.293z" />
          </svg>
        </div>
      )}
    </>
  );
}
