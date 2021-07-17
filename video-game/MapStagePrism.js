import {
  CubeCamera,
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
  CubeReflectionMapping,
  CubeRefractionMapping,
  FrontSide,
  PlaneBufferGeometry,
  CircleBufferGeometry,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
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
// import { Sphere } from "@react-three/drei";

//
// import { CameraRigOrbit } from "./CameraRigOrbit";
// import { CameraRigOrbitBirdView } from "./CameraRigOrbitBirdView";
import { LightExpress, ShadowFloor } from "./ShadowLighting";
import { ShaderCubeChromeDense } from "../vfx-library/ShaderCubeChromeDense";
import { VolumeVisualiser } from "../vfx-library/VolumeVisualiser";

function MapFloor({ cubeCam }) {
  let { gl, scene } = useThree();

  let list = ["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"];
  // const cubeMap = useCubeTexture(list, { path: "/cubemaps/galaxy/" });

  // useEffect(() => {
  //   scene.background = cubeMap;
  //   return () => {
  //     scene.background = null;
  //   };
  // });

  // cubeMap.mapping = CubeRefractionMapping;
  // cubeMap.mapping = CubeReflectionMapping;

  let map = useGLTF("/map/stage-prism.glb");

  // let waterdudv = useTexture(`/texture/waternormals-works.jpg`);
  // waterdudv.repeat.set(3, 3);
  // waterdudv.wrapS = RepeatWrapping;
  // waterdudv.wrapT = RepeatWrapping;

  let rainbow = useMemo(() => {
    return new ShaderCubeChromeDense({ renderer: gl });
  }, [gl]);

  useFrame((st) => {
    let time = st.clock.getElapsedTime();
    rainbow.compute({ time });
  });

  let { floor } = useMemo(() => {
    let src = SkeletonUtils.clone(map.scene);

    let floorGeo = new CircleBufferGeometry(400, 32);
    floorGeo.rotateX(Math.PI * -0.5);
    let floorMat = new MeshBasicMaterial({});
    let floor = new Mesh(floorGeo, floorMat);
    src.add(floor);

    src.scale.set(1, 1, 1);
    src.position.y = -2 * 4;

    src.traverse((item) => {
      if (item.material) {
        console.log(item.name);
        item.castShadow = true;

        item.material = new MeshStandardMaterial({
          roughness: 0.0,
          metalness: 1.0,
          side: DoubleSide,
          flatShading: true,
          color: new Color("#ffffff"),
        });

        if (item.name === "base-floor") {
          item.material.metalness = 1;
          item.material.roughness = 0.1;
          item.material.side = DoubleSide;
          item.scale.set(1, 1, 1);
          item.material.map = rainbow.out.texture;
        }

        if (item.name === "scatter") {
          item.material = new MeshBasicMaterial({
            color: new Color("#ffffff"),
            map: rainbow.out.texture,
            envMap: rainbow.out.envMap,
            side: DoubleSide,
          });
          item.userData.skipFloorGen = true;
          item.position.y = 5;
        }
      }
    });

    return { floor: src };
  }, []);

  //

  let startAt = {
    x: 0,
    y: 0,
    z: 0,
  };

  useFrame(() => {
    if (floor) {
      floor.getObjectByName("door");
    }
    if (floor) {
      floor.getObjectByName("scatter").rotation.y += 0.001;
    }
  });

  useEffect(() => {
    Now.avatarAt.copy(startAt);
    Now.goingTo.copy(startAt);
  }, [startAt]);

  //
  return (
    <>
      <group>
        <primitive object={floor}></primitive>
      </group>

      {floor && (
        <>
          {/* <CubeCamera>
            {(texture) => {
              texture.mapping = CubeRefractionMapping;

              let scatter = floor.getObjectByName("scatter");

              if (scatter) {
                scatter.material.envMap = texture;
              }

              return null;
            }}
          </CubeCamera> */}
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
  let ref = useRef();
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
    if (ref.current) {
      mini.set("mounter", ref.current);
    }
    mini.work();
  });

  useEffect(() => {
    let api = new VolumeVisualiser({ mini: mini });
    mini.onLoop(() => {
      if (api.compute) {
        api.compute();
      }
    });
    // new WiggleTrackerObject({
    //   node: mini,
    // });
    // let tracker = new Vector3().copy(Now.avatarAt);
    // mini.onLoop(() => {
    //   tracker.copy(Now.avatarAt);
    //   tracker.y += 2.3;
    // });
    // mini.set("tracker", tracker);
  }, [mini]);

  return <group scale={1} ref={ref}></group>;
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
      <MyWiggles></MyWiggles>
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
          {/* <Cross></Cross> */}
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
