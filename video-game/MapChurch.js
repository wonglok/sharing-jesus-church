import {
  // useBVH,
  // useFBX,
  useCubeTexture,
  useFBX,
  useGLTF,
  useTexture,
} from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { SkeletonUtils } from "three-stdlib";
import { EnvMap } from "./EnvMap";
import {
  SelfDataEmitter,
  GameDataReceiver,
  MainAvatarLoader,
  MapSimulation,
  DisplayOtherUsers,
} from "./UseCases";
import { Color, DoubleSide, MeshBasicMaterial } from "three";

import { useFrame, useThree } from "@react-three/fiber";
// import { CameraRig } from "./CameraRig";
import { setup, firebase } from "./AppFirebase";
// import { Debug, Physics, useConvexPolyhedron } from "@react-three/cannon";
// import { Grapes } from "../Game3D/MapBubbles";
// import { sRGBEncoding } from "three";
import { Now } from "./Now";
// import { ShaderCubeChrome } from "../Shaders/ShaderCubeChrome";
// import { ENRuntime } from "../ENCloudSDK/ENRuntime";
import { Bloomer, enableBloom } from "../vfx-library/Bloomer";
import { ENMini } from "../vfx-runtime/ENMini";
// import { WiggleTrackerObject } from "../ENBatteries/museum/loklok";
// import { CameraRig } from "./CameraRig";
// import { RepeatWrapping } from "three";
// import { Sphere } from "@react-three/drei";
import { LightExpress, ShadowFloor } from "./ShadowLighting";

//
// import { ShaderCubeChromeGlass } from "../vfx-library/ShaderCubeChromeGlass";
//
// import { CameraRigOrbit } from "./CameraRigOrbit";
// import { CameraRigOrbitBirdView } from "./CameraRigOrbitBirdView";
//

import { CameraRigChurch } from "./CameraRigChurch";
import { RainbowFly } from "./RainbowFly";

function Background({}) {
  let texture = useTexture(`/texture/church-glass.jpg`);

  return (
    <group scale={13} position-y={100} position-z={-1500}>
      <mesh frustumCulled={false} rotation-x={Math.PI * -0.5 * 0.0}>
        <planeBufferGeometry args={[100, 100, 24]}></planeBufferGeometry>
        <meshBasicMaterial
          // color={"red"}
          map={texture}
          side={DoubleSide}
        ></meshBasicMaterial>
      </mesh>
    </group>
  );
}

function MapFloor() {
  let { gl, scene } = useThree();

  let map = useGLTF("/map/cahterdral.glb");

  let { floor } = useMemo(() => {
    let src = SkeletonUtils.clone(map.scene);

    src.scale.set(10, 10, 10);
    // src.rotation.y = Math.PI * 0.25;

    src.position.y = -2;
    src.traverse((item) => {
      if (item.material) {
        // item.receiveShadow = true;
        // item.castShadow = true;

        if (item.name !== "Plane") {
          item.userData.useRainbow = true;

          item.material = new MeshBasicMaterial({
            side: DoubleSide,
            flatShading: false,
          });
        }

        //
      }
    });

    return { floor: src };
  }, []);

  //

  let startAt = {
    x: 0.45129372677891655,
    y: 0,
    z: 68.12215458593136,
  };

  useFrame(() => {
    if (floor) {
      floor.getObjectByName("door");
    }
  });

  useEffect(() => {
    Now.avatarAt.copy(startAt);
    Now.goingTo.copy(startAt);
  }, [startAt]);

  return (
    <>
      {floor && (
        <>
          <primitive object={floor}></primitive>
          <Suspense>
            <Background></Background>
          </Suspense>
          <MapSimulation
            startAt={startAt}
            debugCollider={false}
            floor={floor}
          ></MapSimulation>

          <SelfDataEmitter></SelfDataEmitter>

          <group position-y={5}>
            <Floating>
              {/* <Sphere
                onUpdate={(s) => {
                  enableBloom(s);
                }}
                args={[3, 32, 32]}
              >
                <meshBasicMaterial
                  transparent={true}
                  opacity={0.5}
                  color="#777777"
                ></meshBasicMaterial>
              </Sphere> */}
            </Floating>
          </group>

          <Suspense fallback={null}>
            <MainAvatarLoader></MainAvatarLoader>

            <MyWiggles></MyWiggles>

            <Suspense fallback={null}>
              <GameDataReceiver></GameDataReceiver>
              <DisplayOtherUsers></DisplayOtherUsers>
            </Suspense>
          </Suspense>

          <RainbowFly></RainbowFly>

          <LightExpress></LightExpress>
          <ShadowFloor></ShadowFloor>
        </>
      )}
    </>
  );
}

function Floating({ children }) {
  let ref = useRef();
  useEffect(() => {
    //
  }, []);
  let time = 0;
  useFrame((st, dt) => {
    if (dt >= 1 / 60) {
      dt = 1 / 60;
    }
    time += dt;
    ref.current.position.y = Math.sin(time) * 5.0;
  });
  return <group ref={ref}>{children}</group>;
}

// let loadBattriesInFolder = () => {
//   let enBatteries = [];
//   let reqq = require.context(
//     "../../pages-code/ENBatteries/",
//     true,
//     /\.js$/,
//     "lazy"
//   );

//   let keys = reqq.keys();

//   keys.forEach((key) => {
//     let title = key;

//     title = title.replace("./", "");
//     title = title.replace("/", ".");
//     title = title.replace(".js", "");

//     if (title.indexOf(".index") !== -1) {
//       return;
//     }

//     enBatteries.push({
//       title,
//       effect: (node) => {
//         reqq(key).then(({ effect }) => {
//           if (typeof effect === "function") {
//             effect(node);
//           }
//         });
//       },
//     });
//   });

//   return enBatteries;
// };

function MyWiggles() {
  let three = useThree();
  let mini = useMemo(() => {
    let engine = new ENMini({});
    for (let kn in three) {
      engine.set(kn, three[kn]);
    }

    return engine;
  }, []);

  useEffect(() => {
    return () => {
      mini.clean();
    };
  }, []);

  useFrame((st) => {
    mini.work();
  });

  // useEffect(() => {
  //   new WiggleTrackerObject({
  //     node: mini,
  //   });

  //   let tracker = new Vector3().copy(Now.avatarAt);
  //   mini.onLoop(() => {
  //     tracker.copy(Now.avatarAt);
  //     tracker.y += 2.3;
  //   });

  //   mini.set("tracker", tracker);
  // }, []);

  return null;
}

export function MapScene() {
  useEffect(() => {
    setup();
    firebase.auth().onAuthStateChanged((st) => {
      if (st && st.uid) {
      } else {
        window.location.assign("/");
      }
    });
  }, []);

  return (
    <>
      <CameraRigChurch></CameraRigChurch>
      {/* <CameraRigOrbitBirdView></CameraRigOrbitBirdView> */}

      <Bloomer></Bloomer>
      {/* <NoBloomRenderLoop></NoBloomRenderLoop> */}
      {/*
      <directionalLight
        intensity={0.7}
        position={[10, 10, 10]}
      ></directionalLight>
 */}

      <directionalLight
        intensity={0.15}
        position={[0, 10, 0]}
      ></directionalLight>

      <directionalLight
        intensity={0.15}
        position={[-10, 10, 0]}
      ></directionalLight>

      <Suspense fallback={null}>
        {/* <gridHelper args={[1000, 100, "white", "white"]}></gridHelper> */}

        <EnvMap></EnvMap>
        <MapFloor></MapFloor>
        <group position-z={-30} position-y={30}>
          {/* <Floating> */}
          <Cross></Cross>
          {/* </Floating> */}
        </group>
      </Suspense>
    </>
  );
}

function Cross() {
  let fbx = useFBX(`/church/holy-cross.fbx`);

  useEffect(() => {
    fbx.traverse((it) => {
      if (it.material) {
        // enableBloom(it);
        it.castShadow = true;
        it.material.color = new Color("#121212");
      }
    });
  }, [fbx]);
  return (
    <group scale={0.09}>
      <primitive
        position-x={-15}
        position-y={15}
        rotation-y={Math.PI * (0.25 + 0.5 + 0.1)}
        rotation-x={Math.PI * -0.5}
        object={fbx}
      ></primitive>
    </group>
  );
}
