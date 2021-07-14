import {
  // useBVH,
  // useFBX,
  useCubeTexture,
  useFBX,
} from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { SkeletonUtils } from "three-stdlib";
import { EnvMap } from "./EnvMap";
import {
  //
  DataEmitter,
  GameDataReceiver,
  MainAvatarLoader,
  MapSimulation,
  // NoBloomRenderLoop,
  DisplayOtherUsers,
} from "./UseCases";
import {
  BackSide,
  Color,
  CubeReflectionMapping,
  CubeRefractionMapping,
  DoubleSide,
  FrontSide,
  MeshStandardMaterial,
} from "three";

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
import { CameraRig } from "./CameraRig";
import { RepeatWrapping } from "three";
import { Sphere } from "@react-three/drei";

//
import { CameraRigOrbit } from "./CameraRigOrbit";
import { CameraRigOrbitBirdView } from "./CameraRigOrbitBirdView";

function MapFloor() {
  let { gl, scene } = useThree();

  //
  let list = ["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"];
  const cubeMap = useCubeTexture(list, { path: "/cubemaps/galaxy/" });

  // const ball = useTexture(`/texture/ball.jpg`);
  // ball.wrapS = RepeatWrapping;
  // ball.wrapT = RepeatWrapping;
  // ball.repeat.x = 1 * 2;
  // ball.repeat.y = 2 * 2;
  // ball.needsUpdate = true;

  // const px = useTexture(`/cubemaps/galaxy/px.png`);

  // const envMap = useMemo(() => {
  //   const pmremGenerator = new PMREMGenerator(gl);
  //   pmremGenerator.compileEquirectangularShader();
  //   let envMap = pmremGenerator.fromEquirectangular(ball).texture;
  //   envMap.encoding = sRGBEncoding;
  //   return envMap;
  // }, []);

  // /map/multitudes.glb

  useEffect(() => {
    scene.background = cubeMap;
    return () => {
      scene.background = null;
    };
  });

  //   let rainbow = new ShaderCubeChrome({
  //     renderer: gl,
  //     res: 64,
  //     color: new Color("#ffffff"),
  //   });

  //   rainbow.compute({ time: 0.4 });
  //   return rainbow;
  // });

  cubeMap.mapping = CubeRefractionMapping;
  cubeMap.mapping = CubeReflectionMapping;

  // useEffect(() => {
  //   // scene.background = cubeMap;
  // }, [cubeMap]);

  let map = useFBX("/map/place-to-chill.fbx");
  map.scene = map;

  // let matcapSilverA = useTexture(`/texture/detection.png`);

  // useEffect(() => {
  //   scene.add(newFloor);

  //   return () => {
  //     scene.remove(newFloor);
  //   };
  // }, []);

  let { floor } = useMemo(() => {
    let src = SkeletonUtils.clone(map.scene);

    src.scale.set(0.05, 0.05, 0.05);
    src.rotation.y = Math.PI * 0.25;

    src.position.y = -2;
    src.traverse((item) => {
      if (item.material) {
        item.receiveShadow = true;
        item.castShadow = true;

        item.material = new MeshStandardMaterial({
          roughness: 1,
          metalness: 0.0,
          side: DoubleSide,
          flatShading: true,
          color: new Color("#999999"),
        });

        console.log(item.name);
        if (item.name === "Circle") {
          //
          item.material.side = FrontSide;
        }

        if (item.name === "door") {
          item.userData.skipFloorGen = true;
        }

        if (item.name === "pillar-screw") {
          item.userData.skipFloorGen = true;
        }
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

          <MapSimulation
            startAt={startAt}
            debugCollider={false}
            floor={floor}
          ></MapSimulation>
          <DataEmitter></DataEmitter>

          <group position-y={5}>
            <Floating>
              <pointLight
                position-y={30}
                distance={1200}
                color={`#555555`}
                castShadow={true}
                intensity={10}
                shadow-radius={3.5}
                shadow-camera-near={0.1}
                shadow-camera-far={250}
                shadow-camera-top={250}
                shadow-camera-bottom={-250}
                shadow-camera-left={-250}
                shadow-camera-right={250}
                shadow-mapSize-x={512}
                shadow-mapSize-y={512}
              ></pointLight>

              <Sphere
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
              </Sphere>
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
      <CameraRig></CameraRig>
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
        intensity={0.3}
        position={[0, 10, 10]}
      ></directionalLight>
      <Suspense fallback={null}>
        <EnvMap></EnvMap>
        <MapFloor></MapFloor>
      </Suspense>
    </>
  );
}
