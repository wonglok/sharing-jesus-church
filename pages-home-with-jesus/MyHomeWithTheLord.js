import { Suspense, useEffect, useRef } from "react";
import { CameraRigFPAdaptive } from "../video-game/CameraRigFPAdaptive";

import { CubeCamera, useCubeTexture, useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import { SkeletonUtils } from "three-stdlib";
import { Now } from "../video-game/Now";
import { MainAvatarLogic, MapSimulation } from "../video-game/UseCases";
import { useFrame } from "@react-three/fiber";
// import { EnvMap } from "../video-game/EnvMap";
import { CubeMap } from "../video-game/CubeMap";
import { enableBloom, Bloomer } from "../vfx-library/Bloomer";
import {
  CubeReflectionMapping,
  CubeRefractionMapping,
  DoubleSide,
} from "three";

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
  let ref = useRef();
  let mapURL = `/map/detailed-glass-house8.glb`;
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
          it.userData.skipFloorGen = true;
        }

        if (it.name === "login-area") {
          enableBloom(it);
          it.material.opacity = 0.5;
          it.userData.skipFloorGen = true;
        }

        it.geometry.computeVertexNormals();

        it.material.roughness = 0.0;
        it.material.metalness = 1;
        it.material.side = DoubleSide;

        it.material.envMap = refraction;

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
    ref.current.add(floor);
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

  return (
    <>
      <MapSimulation
        floor={floor}
        debugCollider={false}
        startAt={startAt}
      ></MapSimulation>

      <CubeCamera near={0.1} far={1024} frames={1} position={pos.current}>
        {(texture) => {
          floor.traverse((it) => {
            if (it.material) {
              it.material.envMap = texture;
            }
          });
          return <group ref={ref}></group>;
        }}
      </CubeCamera>
      <Bloomer></Bloomer>

      <CubeMap path="/cubemaps/lake/"></CubeMap>
    </>
  );
}
