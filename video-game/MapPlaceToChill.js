import {
  // useBVH,
  // useFBX,
  useCubeTexture,
  useFBX,
  useTexture,
} from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { SkeletonUtils } from "three-stdlib";
import { EnvMap } from "./EnvMap";
import {
  //
  SelfDataEmitter,
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
  Vector3,
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
import { LightExpress } from "./ShadowLighting";
import { Portal } from "./Portal";

function MapFloor() {
  let { gl, scene } = useThree();

  let list = ["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"];
  const cubeMap = useCubeTexture(list, { path: "/cubemaps/galaxy/" });

  useEffect(() => {
    scene.background = cubeMap;
    return () => {
      scene.background = null;
    };
  });

  cubeMap.mapping = CubeRefractionMapping;
  cubeMap.mapping = CubeReflectionMapping;

  let map = useFBX("/map/place-to-chill.fbx");
  map.scene = map;

  let waterdudv = useTexture(`/texture/waternormals-works.jpg`);
  waterdudv.repeat.set(3, 3);
  waterdudv.wrapS = RepeatWrapping;
  waterdudv.wrapT = RepeatWrapping;

  let { floor } = useMemo(() => {
    let src = SkeletonUtils.clone(map.scene);

    src.scale.set(0.05, 0.05, 0.05);
    src.rotation.y = Math.PI * 0.25;

    src.position.y = -2;
    src.traverse((item) => {
      if (item.material) {
        item.castShadow = true;

        item.material = new MeshStandardMaterial({
          roughness: 0.0,
          metalness: 1.0,
          side: DoubleSide,
          flatShading: true,
          color: new Color("#999999"),
        });

        if (item.name === "Circle") {
          item.material.roughness = 1.0;
          item.material.side = FrontSide;
          item.receiveShadow = true;
          item.scale.set(75, 75, 75);
          item.material.normalMap = waterdudv;
        }

        if (item.name === "door") {
          item.userData.skipFloorGen = true;
          item.material.color = new Color("#333333");
          enableBloom(item);
        }

        if (item.name === "pillar-screw") {
          item.userData.skipFloorGen = true;
          item.material.color = new Color("#333333");
          enableBloom(item);
        }
        if (item.name === "dome") {
          item.userData.skipFloorGen = true;
          item.material.color = new Color("#333333");
          enableBloom(item);
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

          <Portal
            text={{
              ready: "SkyCity",
              loading: "Teleporting...",
            }}
            action={() => {
              Now.restoreAt = new Vector3().copy({
                x: -64.81612330398461,
                y: 11.783265512142165,
                z: -0.06740962023805253,
              });

              //

              let router = require("next/router").default;
              router.push({
                pathname: "/room/heavenly",
              });
            }}
            //
            zone={{
              x: 25.787964312387036,
              y: -1.9999917996758967,
              z: 45.45996913120548,
            }}
          ></Portal>

          <MapSimulation
            startAt={startAt}
            debugCollider={false}
            floor={floor}
          ></MapSimulation>
          <SelfDataEmitter></SelfDataEmitter>

          <group position-y={5}>
            <Floating>
              <LightExpress lightPosition={[0, 30, 0]}></LightExpress>
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

      <Bloomer></Bloomer>

      <directionalLight
        intensity={0.3}
        position={[0, 10, 10]}
      ></directionalLight>

      <Suspense fallback={null}>
        <EnvMap></EnvMap>
        <MapFloor></MapFloor>
        <group position-y={20}>
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
      if (it.name === "BezierCurve") {
        it.visible = false;
      }
    });
  });

  useEffect(() => {
    fbx.traverse((it) => {
      if (it.material) {
        it.castShadow = true;
        enableBloom(it);
        it.material = new MeshStandardMaterial({
          roughness: 0.3,
          metalness: 1,
        });
        it.material.color = new Color("#777777");
      }
    });
  }, [fbx]);
  return (
    <group position-z={-0.3} rotation-x={Math.PI * -0.05} scale={0.08}>
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
