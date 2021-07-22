import { Canvas } from "@react-three/fiber";
import router, { useRouter } from "next/router";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
// import { PCFShadowMap, PCFSoftShadowMap } from "three";
import { setup, firebase } from "./AppFirebase.js";
import { Now } from "./Now.js";

function MyScene({ children }) {
  return (
    <group>
      {/*  */}
      {children}
      {/*  */}
    </group>
  );
}

let Pages = [
  {
    name: "loklok",
    Component: dynamic(() => import("./MapLokLok.js").then((e) => e.MapScene)),
  },
  {
    name: "multitude",
    Component: dynamic(() =>
      import("./MapMultitude.js").then((e) => e.MapScene)
    ),
  },
  {
    name: "chill",
    Component: dynamic(() =>
      import("./MapPlaceToChill.js").then((e) => e.MapScene)
    ),
  },
  {
    name: "church",
    Component: dynamic(() => import("./MapChurch.js").then((e) => e.MapScene)),
  },
  //
  {
    name: "prism",
    Component: dynamic(() =>
      import("./MapStagePrism.js").then((e) => e.MapScene)
    ),
  },
  //
  {
    name: "heavenly",
    Component: dynamic(() =>
      import("./MapHeavenly.js").then((e) => e.MapScene)
    ),
  },

  //
  {
    name: "bread",
    Component: dynamic(() => import("./MapBread.js").then((e) => e.MapScene)),
  },
  {
    name: "tv",
    Component: dynamic(() => import("./MapTV.js").then((e) => e.MapScene)),
  },
  //

  // MapPlaceToChill
];

export function NewGame3D() {
  let route = useRouter();
  let [found, setFound] = useState(null);

  //
  useEffect(() => {
    setup();

    let roomID = route.query.roomID;

    let game = Pages.find(
      (e) => e.name.toLowerCase() === `${roomID}`.toLowerCase()
    );

    if (game) {
      setFound(game);
    } else {
      // setFound(false);
      // router.push('/room/heavenly')
      // fetch network or stuff...
    }
  }, [route.query.roomID]);
  return (
    <div className="w-full h-full">
      {typeof found === "object" && found !== null ? (
        <Canvas
          dpr={
            (typeof window !== "undefined" && window.devicePixelRatio) || 1.0
          }
        >
          {/* <MyScene> */}
          <found.Component></found.Component>
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
      <Cursor></Cursor>
    </div>
  );
}

function Cursor() {
  Now.makeKeyReactive("isUnLocked");
  return (
    <>
      {!Now.isUnLocked && (
        <>
          <div
            style={{
              position: "absolute",
              top: `calc(50% - 8px)`,
              left: `calc(50% - 1px)`,
              width: "1px",
              height: "15px",
              backgroundColor: "rgba(25,25,25,1.0)",
              backdropFilter: `inverse(100%)`,
              zIndex: "100000",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              top: `calc(50% - 1px)`,
              left: `calc(50% - 8px)`,
              width: "15px",
              height: "1px",
              backgroundColor: "rgba(25,25,25,1.0)",
              backdropFilter: `inverse(100%)`,
              zIndex: "100000",
            }}
          ></div>
        </>
      )}
    </>
  );
}
