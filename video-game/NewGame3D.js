import { Canvas } from "@react-three/fiber";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { PCFShadowMap } from "three";
import { setup, firebase } from "./AppFirebase.js";

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
      // fetch network or stuff...
    }
  }, [route.query.roomID]);
  return (
    <div className="w-full h-full">
      {typeof found === "object" && found !== null ? (
        <Canvas
          shadowMap={PCFShadowMap}
          dpr={
            (typeof window !== "undefined" && window.devicePixelRatio) || 1.0
          }
        >
          <MyScene>
            <found.Component></found.Component>
          </MyScene>
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
    </div>
  );
}
