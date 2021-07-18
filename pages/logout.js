import { Plane } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import router from "next/router";
import { useEffect, useMemo, useState } from "react";
import { Color } from "three";
import {
  setup,
  loginGoogle,
  loginGuest,
  onReady,
  firebase,
} from "../video-game/AppFirebase";
import { ShaderCubeChromeDense } from "../vfx-library/ShaderCubeChromeDense";

function Content() {
  let { viewport, gl } = useThree();
  let rainbow = useMemo(() => {
    let rainbow = new ShaderCubeChromeDense({
      renderer: gl,
      res: 1024,
      color: new Color("#ffffff"),
    });
    return rainbow;
  });

  useFrame((st, dt) => {
    rainbow.compute({ time: st.clock.getElapsedTime() });
  });

  return (
    <group>
      {rainbow && (
        <Plane args={[viewport.width, viewport.height * 2, 2, 2]}>
          <meshBasicMaterial envMap={rainbow.out.envMap}></meshBasicMaterial>
        </Plane>
      )}
    </group>
  );
}

export default function page() {
  let [isLoading, setLoading] = useState(false);

  // let [loadingText, setLoading] = useState("");
  useEffect(() => {
    setup();
    firebase
      .auth()
      .signOut()
      .then(
        () => {
          window.location.assign("/");
          setLoading(false);
          // window.location.assign("/");
        },
        () => {
          window.location.assign("/");
          setLoading(false);
          // window.location.assign("/");
        }
      );
  }, []);

  return (
    <>
      <div className={"absolute top-0 right-0 w-full h-full"}>
        <Canvas
          className="h-full w-full "
          dpr={
            (typeof window !== "undefined" && window.devicePixelRatio) || 1.0
          }
        >
          <Content></Content>
        </Canvas>
      </div>

      <div className={"absolute top-0 right-0 w-full h-full"}>
        <div className="flex h-full w-full items-center justify-center">
          <div className="p-5 bg-white rounded-3xl shadow-inner">
            <button
              onClick={() => {
                setLoading(true);
                firebase
                  .auth()
                  .signOut()
                  .then(
                    () => {
                      window.location.assign("/");
                      setLoading(false);
                      // window.location.assign("/");
                    },
                    () => {
                      window.location.assign("/");
                      setLoading(false);
                      // window.location.assign("/");
                    }
                  );
              }}
              className="uppercase px-10 block  w-full py-4 text-lg rounded-full text-white bg-red-500 hover:bg-red-600 focus:outline-none"
            >
              Logout you out
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div
          className={
            "absolute top-0 right-0 w-full h-full flex items-center justify-center bg-white bg-opacity-90"
          }
        >
          Logging you out....
        </div>
      )}
    </>
  );
}
