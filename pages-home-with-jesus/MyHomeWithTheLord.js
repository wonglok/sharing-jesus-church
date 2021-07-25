import { Suspense, useEffect, useRef } from "react";
import { CameraRigFPAdaptive } from "../video-game/CameraRigFPAdaptive";

import { CubeCamera, useCubeTexture, useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import { SkeletonUtils } from "three-stdlib";
import { Now } from "../video-game/Now";
import { MainAvatarLogic, MapSimulation } from "../video-game/UseCases";
import { act, createPortal, useFrame, useThree } from "@react-three/fiber";
// import { EnvMap } from "../video-game/EnvMap";
import { CubeMap } from "../video-game/CubeMap";
import { enableBloom, Bloomer } from "../vfx-library/Bloomer";
import {
  Color,
  CubeReflectionMapping,
  CubeRefractionMapping,
  DoubleSide,
  Vector3,
} from "three";
import { Portal } from "../video-game/Portal";
import { Sphere } from "three";
import {
  loginGoogle,
  loginGuest,
  onReady,
  setUpFirebase,
} from "../video-game/AppFirebase";

export function MyHomeWithTheLord() {
  let startAt = useMemo(() => {
    return {
      x: 0,
      y: 14.807240279333058 + 10,
      z: 257.6796410375871,
    };
  }, []);

  return (
    <group>
      <Suspense fallback={null}>
        <AvatarStuff startAt={startAt}></AvatarStuff>
      </Suspense>
      <Suspense fallback={null}>
        <MapStuff startAt={startAt}></MapStuff>
        <CameraRigFPAdaptive></CameraRigFPAdaptive>
      </Suspense>
    </group>
  );
}

function AvatarStuff({ startAt }) {
  useEffect(() => {
    // simulate loading of avatar
    setTimeout(() => {
      Now.profile = {
        avatarAt: startAt,
        avatarSignature: "",
        avatarTextureRefURL: "",
        avatarURL: "/chibi/ChibiBase-rigged.fbx",
        goingTo: startAt,
        lastOnline: 1626274791390,
      };
      Now.avatarAt.copy(startAt);
      Now.goingTo.copy(startAt);
    }, 1000);
  }, [startAt]);

  return (
    <>
      {Now.profile && (
        <group visible={false}>
          <MainAvatarLogic profile={Now.profile}></MainAvatarLogic>
        </group>
      )}
    </>
  );
}

function useCubeMap({ path = `/cubemap/`, type = "png" }) {
  let list = ["px", "nx", "py", "ny", "pz", "nz"].map((e) => `${e}.${type}`);
  const cubeMap = useCubeTexture(list, { path });
  return cubeMap;
}

function MapStuff({ startAt }) {
  let { get } = useThree();
  let ref = useRef();
  let mapURL = `/map/detailed-glass-house9.glb`;
  let raw = useGLTF(mapURL);
  let refraction = useCubeMap({ path: `/cubemaps/lake/`, type: "png" });
  refraction.mapping = CubeRefractionMapping;

  let reflection = useCubeMap({ path: `/cubemaps/lake/`, type: "png" });
  reflection.mapping = CubeReflectionMapping;

  let floor = useMemo(() => {
    let cloned = SkeletonUtils.clone(raw.scene);
    cloned.scale.set(2, 2, 2);
    cloned.traverse((it) => {
      if (it.material) {
        it.material = it.material.clone();

        console.log(it.material.name, it.name);

        it.userData.hoverable = true;

        if (it.material.name === "leaves") {
          it.userData.hoverable = false;
        }
        if (it.material.name === "trunk") {
          it.userData.hoverable = false;
        }

        if (it.name === "slope") {
          it.userData.hoverable = false;
        }

        if (it.name === "connect") {
          enableBloom(it);
          it.userData.hoverable = false;
        }
        if (it.name === "connect-base") {
          enableBloom(it);
        }

        it.geometry.computeVertexNormals();

        it.material.roughness = 0.0;
        it.material.metalness = 1;
        it.material.side = DoubleSide;

        it.material.envMap = refraction;

        if (it.material.name === "leaves") {
          it.material.roughness = 0;
          it.material.metalness = 1;
        }
        if (it.material.name === "trunk") {
          it.material.roughness = 0;
          it.material.metalness = 1;
        }

        // if (it.name.toLowerCase().indexOf("icosphere") !== -1) {
        //   it.material.envMap = reflection;
        //   it.userData.rotationY = Math.random() * 2.0 - 1.0;

        //   it.material.roughness = 0.1;
        //   it.material.metalness = 1;
        //   it.material.flatShading = true;
        //   it.material.side = DoubleSide;
        //   it.material.flatShading = true;
        // } else {

        // }
      }
    });
    return cloned;
  }, [mapURL]);

  useEffect(() => {
    if (ref.current) {
      ref.current.add(floor);
    }
    return () => {
      if (ref.current) {
        ref.current.remove(floor);
      }
    };
  }, []);

  let pos = useRef(Now.avatarAt.toArray());

  useFrame((st, dt) => {
    floor.traverse((it) => {
      if (it.userData && typeof it.userData.rotationY !== "undefined") {
        it.rotation.y += it.userData.rotationY * dt;
      }
    });

    if (pos.current) {
      pos.current[0] = Now.avatarAt.x;
      pos.current[1] = Now.avatarAt.y;
      pos.current[2] = Now.avatarAt.z;
    }
  });

  // floor.getObjectByName("connect")

  return (
    <>
      <Portal
        bloom={true}
        text={{
          ready: "Plase as Guest",
          loading: "Teleporting...",
        }}
        action={({ setLabel }) => {
          // let router = require("next/router").default;
          // router.push("/room/chill");
          // setUpFirebase();
          loginGuest().then(
            () => {
              onReady().then(({ user, db, app }) => {
                db.ref(`profiles/${user.uid}`).once("value", (snap) => {
                  if (snap.val()) {
                    window.location.assign("/room/heavenly");
                  } else {
                    window.location.assign("/avatar");
                  }
                });
              });
            },
            () => {
              setLabel("login failed...");
            }
          );
        }}
        zone={{
          x: -34.48357929577177,
          y: 40.5634749531852,
          z: 54.45510810955399,
        }}
      ></Portal>

      <Portal
        bloom={true}
        text={{
          ready: "Login / Register",
          loading: "Going There...",
        }}
        action={({ setLabel }) => {
          // let router = require("next/router").default;
          // router.push("/login");

          //
          window.location.assign("/login");
          // setUpFirebase();
          // loginGoogle().then(
          //   () => {
          //     onReady().then(({ user, db, app }) => {
          //       db.ref(`profiles/${user.uid}`).once("value", (snap) => {
          //         if (snap.val()) {
          //           window.location.assign("/room/heavenly");
          //         } else {
          //           window.location.assign("/avatar");
          //         }
          //       });
          //     });
          //   },
          //   () => {
          //     setLabel("login failed");
          //   }
          // );
        }}
        zone={{
          x: -19.545532327531284,
          y: 40.563474555127634,
          z: 55.185233488124396,
        }}
      ></Portal>
      <directionalLight position={[10, 10, 0]}></directionalLight>
      <directionalLight position={[-10, 10, 0]}></directionalLight>
      <MapSimulation
        floor={floor}
        debugCollider={false}
        startAt={startAt}
      ></MapSimulation>

      {/* <CubeCamera near={0.1} far={1024} frames={1} position={pos.current}>
        {(texture) => {
          floor.traverse((it) => {
            if (it.material) {
              it.material.envMap = texture;
            }
          });
          return ;
        }}
      </CubeCamera> */}

      <group ref={ref}></group>

      <Bloomer></Bloomer>

      <CubeMap path="/cubemaps/lake/"></CubeMap>
    </>
  );
}

function DetectArea({
  preload = () => {},
  loading = () => {},
  reset = () => {},
  action = () => {},
}) {
  let ref = useRef();

  let count = 0;
  let exec = false;
  let worldPos = new Vector3();

  let sphere = useRef(new Sphere(worldPos, 20));
  useFrame((st, dt) => {
    //
    if (ref.current) {
      sphere.current.center.copy(worldPos);
      ref.current.getWorldPosition(worldPos);

      if (sphere.current.containsPoint(Now.avatarAt)) {
        if (count === 0) {
          preload();
        }

        loading(count);
        if (!exec) {
          count++;
        }

        if (count >= 60 * 2) {
          //
          exec = true;
          action();
          //
        }
      } else {
        count = 0;
        exec = false;
        reset(count);
      }
    }
  });
  return (
    <group ref={ref}>
      {/*  */}
      {/*  */}
      {/*  */}
    </group>
  );
}
