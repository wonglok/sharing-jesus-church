import {
  Html,
  Plane,
  useFBO,
  useFBX,
  useTexture,

  //
  useGLTF,
  Text,
} from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { SkeletonUtils } from "three-stdlib";
// import { EnvMap } from "./EnvMap";
import {
  SelfDataEmitter,
  GameDataReceiver,
  MainAvatarLoader,
  MapSimulation,
  DisplayOtherUsers,
  NoBloomRenderLoop,
} from "./UseCases";

import {
  Color,
  DoubleSide,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshPhongMaterial,
  MeshStandardMaterial,
  ShadowMaterial,
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
// import { Bloomer, enableBloom } from "../vfx-library/Bloomer";
// import { ENMini } from "../vfx-runtime/ENMini";
// import { WiggleTrackerObject } from "../ENBatteries/museum/loklok";
// import { CameraRig } from "./CameraRig";
// import { RepeatWrapping } from "three";
// import { Sphere } from "@react-three/drei";
import { LightExpress } from "./ShadowLighting";

// import { RainbowClassic } from "./RainbowClassic";
// import { CameraRigFirstPerson } from "./CameraRigFirstPerson";
// import { CameraRigNipple } from "./CameraRigNipple";
// import { CameraRigFPAdaptive } from "./CameraRigFPAdaptive";

import { CameraRig } from "./CameraRig";
import { Portal } from "./Portal";

// https://www.youtube.com/watch?v=rLbX-4uTwyM

function MapFloor() {
  let { scene } = useThree();
  let map = useGLTF("/map/home.glb");

  useEffect(() => {
    //
    let orig = scene.background;

    scene.background = new Color("#75b4d4").offsetHSL(0, 0.3, -0.43);
    return () => {
      scene.background = orig;
    };
  });

  // let grassNormal = useTexture(`/texture/normal-grass.jpg`);

  let { floor, shadow } = useMemo(() => {
    let shadow = SkeletonUtils.clone(map.scene);

    let scale = 1;
    shadow.scale.set(scale, scale, scale);

    shadow.position.y = -1 * scale;
    shadow.traverse((item) => {
      if (item.material) {
        item.material = new MeshLambertMaterial({
          color: item.material.color,
        });
        // item.castShadow = true;
        item.receiveShadow = true;
      }
    });
    return { floor: shadow, shadow };
  }, []);

  let startAt = {
    x: 0.0,
    y: 0,
    z: 30.0,
  };

  useFrame(() => {
    // if (floor) {
    //   floor.getObjectByName("door");
    // }
  });

  useEffect(() => {
    Now.avatarAt.copy(startAt);
    Now.goingTo.copy(startAt);
  }, [startAt]);

  return (
    <group>
      {floor && (
        <group>
          {/* <primitive object={floor}></primitive> */}
          <primitive object={shadow}></primitive>

          {/* <TV floor={floor}></TV> */}
          {/* <Youtube floor={floor}></Youtube> */}

          <Portal
            text={{
              ready: "SkyCity",
              loading: "Teleporting...",
            }}
            action={() => {
              Now.avatarAt.set(0, 0, 30);
              Now.goingTo.set(0, 0, 30);
              let router = require("next/router").default;
              router.push("/room/heavenly");
            }}
            zone={{
              x: 1.6356034957476053,
              y: -28.59659129339514,
              z: -2.7695245453934163,
            }}
          ></Portal>

          <MapSimulation
            startAt={startAt}
            debugCollider={false}
            floor={floor}
          ></MapSimulation>

          <SelfDataEmitter></SelfDataEmitter>

          <Suspense fallback={null}>
            <group visible={Now.enableFloorCursor}>
              <MainAvatarLoader></MainAvatarLoader>
            </group>

            {/* <MyWiggles></MyWiggles> */}

            <Suspense fallback={null}>
              <GameDataReceiver></GameDataReceiver>
              <DisplayOtherUsers></DisplayOtherUsers>
            </Suspense>
          </Suspense>

          {/* <RainbowClassic></RainbowClassic> */}

          <ambientLight intensity={0.1}></ambientLight>
          <directionalLight
            intensity={0.15}
            position={[0, 10, 0]}
            castShadow={true}
          ></directionalLight>

          <directionalLight
            intensity={0.15}
            position={[-10, 10, 0]}
            castShadow={true}
          ></directionalLight>

          <LightExpress lightPosition={[0, 0, 0]}></LightExpress>
          {/* <ShadowFloor></ShadowFloor> */}
        </group>
      )}
    </group>
  );
}

// function Youtube({ floor }) {
//   let scale = 1;
//   return (
//     <>
//       {createPortal(
//         <Html
//           style={{
//             width: `${334 * scale}px`,
//             height: `${216 * scale}px`,
//             background: "white",
//           }}
//           //
//           rotation-x={-Math.PI / 2}
//           position={[0, 0.05, -0.09]}
//           scale={1 / scale}
//           transform
//           occlude
//         >
//           <iframe
//             width={`${334 * scale}`}
//             height={`${216 * scale}`}
//             src=""
//             title="YouTube video player"
//             frameBorder="0"
//             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//             allowFullScreen
//           ></iframe>
//         </Html>,
//         floor.getObjectByName("wallpaper") || new Object3D()
//       )}
//     </>
//   );
// }

// function TV({ floor }) {
//   Now.makeKeyReactive("isUnLocked");
//   return (
//     <>
//       {createPortal(
//         !Now.isUnLocked ? (
//           <mesh
//             geometry={floor.getObjectByName("wallpaper").geometry.clone()}
//             rotation-x={(-Math.PI / 2) * 0.0}
//             position={[0, 0.05, 0.0]}
//           >
//             <meshBasicMaterial></meshBasicMaterial>
//           </mesh>
//         ) : (
//           <group></group>
//         ),
//         floor.getObjectByName("wallpaper") || new Object3D()
//       )}
//     </>
//   );
// }

// function LaydownGuy({ poseURL = `/chibi/avatar-rpm/watchtv/lay-1.fbx` }) {
//   let raw = useFBX(`/chibi/avatar-rpm/base-rig-for-rpm.fbx`);
//   let person = useMemo(() => {
//     raw.traverse((it) => {
//       if (it.material) {
//         it.material = new MeshStandardMaterial({
//           metalness: 0.8,
//           roughness: 0.4,
//         });
//         it.frustumCulled = false;
//       }
//     });

//     return SkeletonUtils.clone(raw);
//   }, []);
//   let lay = useFBX(poseURL);

//   let refMixer = useRef();
//   useEffect(() => {
//     let mixer;
//     refMixer.current = mixer = new AnimationMixer(person);

//     let act = mixer.clipAction(lay.animations[0]);
//     act.play();
//   }, []);

//   useFrame((st, dt) => {
//     if (refMixer.current) {
//       refMixer.current.update(dt);
//     }
//   });

//   return (
//     <group scale={8} position={[0, -7, 0]} rotation={[0, Math.PI, 0]}>
//       <primitive object={person} />
//     </group>
//   );
// }

// function Floating({ children }) {
//   let ref = useRef();
//   useEffect(() => {
//     //
//   }, []);
//   let time = 0;
//   useFrame((st, dt) => {
//     if (dt >= 1 / 60) {
//       dt = 1 / 60;
//     }
//     time += dt;
//     ref.current.position.y = Math.sin(time) * 5.0;
//   });
//   return <group ref={ref}>{children}</group>;
// }

// function MyWiggles() {
//   let three = useThree();
//   let mini = useMemo(() => {
//     let engine = new ENMini({});
//     for (let kn in three) {
//       engine.set(kn, three[kn]);
//     }

//     return engine;
//   }, []);

//   useEffect(() => {
//     return () => {
//       mini.clean();
//     };
//   }, []);

//   useFrame((st) => {
//     mini.work();
//   });

//   // useEffect(() => {
//   //   new WiggleTrackerObject({
//   //     node: mini,
//   //   });

//   //   let tracker = new Vector3().copy(Now.avatarAt);
//   //   mini.onLoop(() => {
//   //     tracker.copy(Now.avatarAt);
//   //     tracker.y += 2.3;
//   //   });

//   //   mini.set("tracker", tracker);
//   // }, []);

//   return null;
// }

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
      {/*  */}
      {/*  */}
      {/*  */}
      {/* <Bloomer></Bloomer> */}
      {/* <NoBloomRenderLoop></NoBloomRenderLoop> */}
      {/*
      <directionalLight
        intensity={0.7}
        position={[10, 10, 10]}
      ></directionalLight>
      */}

      {/*  */}
      <Suspense fallback={null}>
        {/* <gridHelper args={[1000, 100, "white", "white"]}></gridHelper> */}

        {/* <EnvMap></EnvMap> */}
        <MapFloor></MapFloor>
        <group
          rotation-x={Math.PI * 0.0}
          position-x={5}
          position-z={-330}
          position-y={40}
          scale={1.5}
        >
          {/* <Floating> */}
          {/* <Cross></Cross> */}
          {/* </Floating> */}
        </group>
      </Suspense>

      {/* <CameraRigFPAdaptive></CameraRigFPAdaptive> */}

      <CameraRig></CameraRig>
      {/* <LookatMeCloud></LookatMeCloud> */}
    </>
  );
}

// function Cross() {
//   let fbx = useFBX(`/church/holy-cross.fbx`);

//   useEffect(() => {
//     fbx.traverse((it) => {
//       if (it.material) {
//         // enableBloom(it);
//         // it.castShadow = true;
//         it.material.color = new Color("#121212");

//         if (it.name === "BezierCurve") {
//           it.visible = false;
//         }
//       }
//     });
//   }, [fbx]);

//   //

//   return (
//     <group scale={0.09}>
//       <primitive
//         position-x={-15}
//         position-y={15}
//         rotation-y={Math.PI * (0.25 + 0.5 + 0.1)}
//         rotation-x={Math.PI * -0.5}
//         object={fbx}
//       ></primitive>
//     </group>
//   );
// }

// function LookatMeCloud() {
//   let { gl, camera, scene } = useThree();
//   let myScene = useMemo(() => {
//     return new Scene();
//   }, []);

//   let myCam = useMemo(() => {
//     return new Camera();
//   }, []);

//   let mat = useMemo(() => {
//     return new ShaderMaterial({
//       uniforms: {
//         time: { value: 0 },
//         uCamPos: { value: camera.position },
//         uCamRot: { value: camera.rotation },
//       },
//       transparent: true,
//       depthWrite: false,
//       // blending: AdditiveBlending,
//       vertexShader: `
//       //

//       varying vec2 vUv;
//       varying vec3 vPos;
//       varying vec3 vCamPos;
//       uniform vec3 uCamPos;

//       void main (void) {
//         //
//         vec4 iPos = vec4(position, 1.0);
//         gl_Position = projectionMatrix * modelViewMatrix * iPos;

//         vCamPos = uCamPos;
//         vPos = iPos.xyz;
//         vUv = uv;
//       }
//       `,

//       fragmentShader: `

//       uniform float time;
//       varying vec2 vUv;
//       varying vec3 vCamPos;
//       varying vec3 vPos;
//       uniform vec3 uCamRot;

//         //  Simplex 3D Noise
//         //  by Ian McEwan, Ashima Arts
//         //
//         vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
//         vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

//         float snoise(vec3 v){
//         const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
//         const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

//         // First corner
//         vec3 i  = floor(v + dot(v, C.yyy) );
//         vec3 x0 =   v - i + dot(i, C.xxx) ;

//         // Other corners
//         vec3 g = step(x0.yzx, x0.xyz);
//         vec3 l = 1.0 - g;
//         vec3 i1 = min( g.xyz, l.zxy );
//         vec3 i2 = max( g.xyz, l.zxy );

//         //  x0 = x0 - 0. + 0.0 * C
//         vec3 x1 = x0 - i1 + 1.0 * C.xxx;
//         vec3 x2 = x0 - i2 + 2.0 * C.xxx;
//         vec3 x3 = x0 - 1. + 3.0 * C.xxx;

//         // Permutations
//         i = mod(i, 289.0 );
//         vec4 p = permute( permute( permute(
//                     i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
//                   + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
//                   + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

//         // Gradients
//         // ( N*N points uniformly over a square, mapped onto an octahedron.)
//         float n_ = 1.0/7.0; // N=7
//         vec3  ns = n_ * D.wyz - D.xzx;

//         vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

//         vec4 x_ = floor(j * ns.z);
//         vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

//         vec4 x = x_ *ns.x + ns.yyyy;
//         vec4 y = y_ *ns.x + ns.yyyy;
//         vec4 h = 1.0 - abs(x) - abs(y);

//         vec4 b0 = vec4( x.xy, y.xy );
//         vec4 b1 = vec4( x.zw, y.zw );

//         vec4 s0 = floor(b0)*2.0 + 1.0;
//         vec4 s1 = floor(b1)*2.0 + 1.0;
//         vec4 sh = -step(h, vec4(0.0));

//         vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
//         vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

//         vec3 p0 = vec3(a0.xy,h.x);
//         vec3 p1 = vec3(a0.zw,h.y);
//         vec3 p2 = vec3(a1.xy,h.z);
//         vec3 p3 = vec3(a1.zw,h.w);

//         // Normalise gradients
//         vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
//         p0 *= norm.x;
//         p1 *= norm.y;
//         p2 *= norm.z;
//         p3 *= norm.w;

//         // Mix final noise value
//         vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
//         m = m * m;
//         return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
//                                       dot(p2,x2), dot(p3,x3) ) );
//         }

//           float surface3( vec3 coord ){
//             float height	= 0.0;
//             coord	*= 0.8;
//             height	+= abs(snoise(coord      )) * 1.0;
//             height	+= abs(snoise(coord * 2.0)) * 0.5;
//             height	+= abs(snoise(coord * 4.0)) * 0.25;
//             height	+= abs(snoise(coord * 8.0)) * 0.125;
//             height	+= abs(snoise(coord * 35.0)) * 0.035;
//             return height;
//           }

//           vec4 mainImage (float depth) {
//             vec4 outC = vec4(0.0);

//             vec3 coord	= vec3( vUv, depth );
//             coord.x += time * -0.05;

//             float height	= surface3( uCamRot.yyx * 0.1 + coord + (pow(length(vCamPos), 0.7) / 700.0 ) + vec3(0.0, 0.0, depth) );

//             height = clamp(height, 0.0, 1.0);
//             height = pow(height, 3.5);

//             outC = vec4(vec3(height), height);

//             return outC;
//           }

//         void main (void) {
//           vec4 cloud = vec4(0.0);

//           for (int i = 0; i < 4;i++) {
//             cloud += mainImage(float(i) / 3.0) / 2.0;
//           }

//           cloud.rgb *= 0.7;

//           gl_FragColor = cloud;
//         }
//       `,
//     });
//   });
//   let fbo = useFBO(256, 256);

//   useEffect(() => {
//     myCam.position.z = 1;

//     return () => {};
//   });

//   useFrame((st, dt) => {
//     dt = dt >= 1 / 30 ? 1 / 30 : dt;

//     mat.uniforms.time.value += dt;

//     let orig = gl.getRenderTarget();
//     gl.setRenderTarget(fbo);

//     gl.clear();

//     gl.render(myScene, myCam);

//     gl.setRenderTarget(orig);
//   });

//   useEffect(() => {
//     scene.add(camera);
//     return () => {
//       scene.remove(camera);
//     };
//   }); //

//   //
//   return (
//     <group>
//       {createPortal(
//         <mesh material={mat}>
//           <planeBufferGeometry args={[2, 2]}></planeBufferGeometry>
//         </mesh>,
//         myScene
//       )}

//       {createPortal(
//         <mesh frustumCulled={false} scale={50} position-z={-2000}>
//           <planeBufferGeometry args={[100, 100]}></planeBufferGeometry>
//           <meshBasicMaterial
//             transparent={true}
//             map={fbo.texture}
//             blending={AdditiveBlending}
//           ></meshBasicMaterial>
//         </mesh>,
//         camera
//       )}
//     </group>
//   );
// }
