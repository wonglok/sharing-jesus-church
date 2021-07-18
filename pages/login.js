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
                loginGoogle().then(
                  () => {
                    onReady().then(({ user, db, app }) => {
                      db.ref(`profiles/${user.uid}`).once("value", (snap) => {
                        if (snap.val()) {
                          router.push("/room/multitude");
                        } else {
                          router.push("/avatar");
                        }
                      });
                    });
                  },
                  () => {
                    setLoading(false);
                  }
                );
              }}
              className="uppercase px-10 block mb-6 w-full py-4 text-lg rounded-full text-white bg-blue-500 hover:bg-blue-600 focus:outline-none"
            >
              Login with Google
            </button>
            <button
              onClick={() => {
                setLoading(true);

                loginGuest().then(
                  () => {
                    onReady().then(({ user, db, app }) => {
                      db.ref(`profiles/${user.uid}`).once("value", (snap) => {
                        if (snap.val()) {
                          router.push("/room/multitude");
                        } else {
                          router.push("/avatar");
                        }
                      });
                    });
                  },
                  () => {
                    setLoading(false);
                  }
                );
              }}
              className="uppercase px-10 block w-full py-4 text-lg rounded-full text-white bg-gray-500 hover:bg-gray-600 focus:outline-none"
            >
              Play as Guest
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
          Loading....
        </div>
      )}
    </>
  );
}
