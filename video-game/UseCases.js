import route from "next/router";

import { useEffect, useMemo, useRef } from "react";
import {
  Box3,
  DirectionalLight,
  DoubleSide,
  Line3,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
  Raycaster,
  Vector2,
  Vector3,
} from "three";
import { FBXLoader, GLTFLoader, SkeletonUtils } from "three-stdlib";
import { MeshBVH } from "three-mesh-bvh";
// import { MeshBVHVisualizer } from "three-mesh-bvh";
import { useFrame, useThree } from "@react-three/fiber";
import { Now } from "./Now";
import { useFBX, useGLTF } from "@react-three/drei";
import { AnimationMixer } from "three";
// import { Assets } from "../Game3D/Assets";
import { getFire, onReady } from "./AppFirebase";
import { makeShallowStore } from "../vfx-runtime/ENUtils";
import { BoxBufferGeometry } from "three";
import { download } from "../vfx-runtime/ENUtils";
import { TextureLoader } from "three";
import { FileLoader } from "three";
import router from "next/router";
import { setChibiURL } from "../pages/avatar";

export const ResourceDB = [
  {
    url: "/font/Cronos-Pro-Light_12448.ttf",
    key: "cronosProFont",
    preload: true,
  },
];

export const Assets = new Proxy(
  {},
  {
    get: (obj, key) => {
      return ResourceDB.find((e) => e.key === key);
    },
  }
);

export function MapSimulation({
  //
  startAt = { x: 0, y: 0, z: 0 },
  floor,
  debugCollider = false,
}) {
  if (!floor) {
    throw new Error("no floor");
  }

  let { gl, camera } = useThree();

  let colliderRef = useRef();
  useEffect(() => {
    let BufferGeometryUtils =
      require("three/examples/jsm/utils/BufferGeometryUtils").BufferGeometryUtils;

    let environment = SkeletonUtils.clone(floor);

    let dirLight = new DirectionalLight(0xffffff, 0.3);
    dirLight.position.x = 20;
    dirLight.position.y = 20;
    dirLight.position.z = 20;
    dirLight.castShadow = true;
    dirLight.shadow.normalBias = 1e-2;
    dirLight.shadow.bias = -1e-3;
    dirLight.shadow.mapSize.setScalar(1024);
    dirLight.shadow.camera.top = 100;
    dirLight.shadow.camera.left = -100;
    dirLight.shadow.camera.bottom = -100;
    dirLight.shadow.camera.right = 100;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 1000;

    environment.add(dirLight);

    const geometries = [];

    environment.updateMatrixWorld();
    environment.traverse((c) => {
      if (c.geometry && !c.userData.skipFloorGen) {
        const cloned = c.geometry.clone();
        cloned.applyMatrix4(c.matrixWorld);

        for (const key in cloned.attributes) {
          if (key !== "position") {
            cloned.deleteAttribute(key);
          }
        }

        geometries.push(cloned);
      }
    });

    // create the merged geometry
    // import { BufferGeometryUtils } from "three/examples/jsm/utils/BufferGeometryUtils";
    //

    const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(
      geometries,
      false
    );

    mergedGeometry.boundsTree = new MeshBVH(mergedGeometry);

    const collider = new Mesh(
      mergedGeometry,
      new MeshBasicMaterial({ color: 0xffffff })
    );
    collider.material.wireframe = true;
    collider.material.opacity = 0.5;
    collider.material.transparent = true;
    collider.updateMatrixWorld();

    // invMat.copy(collider.matrixWorld).invert();

    // let visualizer = new MeshBVHVisualizer(collider, 10);
    colliderRef.current = collider;
  }, [floor]);

  let collider = colliderRef.current;

  useEffect(() => {
    if (!collider) {
      return;
    }
    const floorcaster = new Raycaster();
    const renderer = gl;
    const mouse = new Vector2();
    let x = 0;
    let y = 0;

    let h = {
      click: (e) => {
        mouse.x = (x / window.innerWidth) * 2 - 1;
        mouse.y = -(y / window.innerHeight) * 2 + 1;
        floorcaster.setFromCamera(mouse, camera);

        // floorcaster.ray.applyMatrix4(invMat);

        const hit = collider.geometry.boundsTree.raycastFirst(
          collider,
          floorcaster,
          floorcaster.ray
        );
        // console.log(hit.point);

        if (hit) {
          console.log(hit.point);
          Now.goingTo.copy(hit.point);
        }
      },
      goDown: (e) => {
        x = e.clientX;
        y = e.clientY;

        Now.isDown = true;
      },
      goUp: (e) => {
        x = e.clientX;
        y = e.clientY;

        Now.isDown = false;

        Now.needsSync = true;
      },
      goMove: (e) => {
        if (e) {
          x = e.clientX;
          y = e.clientY;
        }
        if (Now.isDown && !(x === 0 && y === 0)) {
          mouse.x = (x / window.innerWidth) * 2 - 1;
          mouse.y = -(y / window.innerHeight) * 2 + 1;
          floorcaster.setFromCamera(mouse, camera);

          const hit = collider.geometry.boundsTree.raycastFirst(
            collider,
            floorcaster,
            floorcaster.ray
          );

          if (hit) {
            Now.goingTo.copy(hit.point);
          }
        }
      },
    };

    renderer.domElement.addEventListener("pointerdown", h.goDown, {
      passive: false,
    });
    renderer.domElement.addEventListener("pointerup", h.click, {
      passive: false,
    });
    renderer.domElement.addEventListener("pointerup", h.goUp, {
      passive: false,
    });
    renderer.domElement.addEventListener("pointermove", h.goMove, {
      passive: false,
    });

    let rAFID = 0;
    let rAF = () => {
      rAFID = requestAnimationFrame(rAF);
      if (Now.isDown) {
        h.goMove(false);
      }
    };
    rAFID = requestAnimationFrame(rAF);

    return () => {
      cancelAnimationFrame(rAFID);
      renderer.domElement.removeEventListener("pointerdown", h.goDown);
      renderer.domElement.removeEventListener("pointerup", h.click);
      renderer.domElement.removeEventListener("pointerup", h.goUp);
      renderer.domElement.removeEventListener("pointermove", h.goMove);
    };
  }, [collider]);

  let playerRef = useRef();
  useEffect(() => {
    let RoundedBoxGeometry =
      require("three/examples/jsm/geometries/RoundedBoxGeometry.js").RoundedBoxGeometry;
    let scale = 1;
    let radius = 1 * scale;
    let width = 1 * scale;
    let height = 2 * scale;
    let depth = 1 * scale;
    let player = new Mesh(
      new RoundedBoxGeometry(width, height, depth, 8, radius),
      new MeshLambertMaterial({ transparent: true, opacity: 1 })
    );
    player.geometry.translate(0, -radius, 0);
    player.castShadow = true;

    player.capsuleInfo = {
      radius: radius,
      segment: new Line3(new Vector3(), new Vector3(0, -1.0, 0.0)),
    };

    player.position.copy(startAt);

    // player.castShadow = true;
    // player.receiveShadow = true;
    // player.material.shadowSide = 2;

    // let dir = new Mesh(
    // 	new BoxBufferGeometry(3, 3, 3),
    // 	new MeshLambertMaterial({ color: 0xff0000 })
    // );
    // player.dir = dir;
    // player.add(dir);

    player.geometry.computeBoundingBox();
    player.collider = new Box3().copy(player.geometry.boundingBox);

    playerRef.current = player;
  }, []);
  let player = playerRef.current;

  let avatarDir = new Vector3();
  let playerVelocity = new Vector3(0, 0, 0);
  // let upVector = new Vector3(0, 1, 0);
  let tempVector = new Vector3();
  let tempVector2 = new Vector3();
  let tempBox = new Box3();
  let tempMat = new Matrix4();
  let playerIsOnGround = true;
  let tempSegment = new Line3();
  let rotationCopier = new Object3D();

  function updatePlayer({ delta, player }) {
    // fall down
    playerVelocity.y += delta * -9.8;
    player.position.addScaledVector(playerVelocity, delta);

    if (player.position.y <= -50) {
      // player.position.y = 0;
      player.position.copy(startAt);
      Now.goingTo.copy(startAt);
      Now.goingTo.z += 1;
      playerVelocity.y = 0.0;
    }

    avatarDir.copy(Now.goingTo).sub(player.position);
    avatarDir.y = 0;
    let size = avatarDir.length();
    avatarDir.normalize();
    avatarDir.y = 0;

    if (size >= 0.1) {
      player.position.addScaledVector(avatarDir, 0.04);
      Now.avatarMode = "running";
    } else {
      Now.avatarMode = "standing";
    }

    player.updateMatrixWorld();

    // adjust player position based on collisions
    const capsuleInfo = player.capsuleInfo;
    tempBox.makeEmpty();
    tempMat.copy(collider.matrixWorld).invert();
    tempSegment.copy(capsuleInfo.segment);

    // get the position of the capsule in the local space of the collider
    tempSegment.start.applyMatrix4(player.matrixWorld).applyMatrix4(tempMat);
    tempSegment.end.applyMatrix4(player.matrixWorld).applyMatrix4(tempMat);

    // get the axis aligned bounding box of the capsule
    tempBox.expandByPoint(tempSegment.start);
    tempBox.expandByPoint(tempSegment.end);

    tempBox.min.addScalar(-capsuleInfo.radius);
    tempBox.max.addScalar(capsuleInfo.radius);

    collider.geometry.boundsTree.shapecast(collider, {
      intersectsBounds: (box) => box.intersectsBox(tempBox),

      intersectsTriangle: (tri) => {
        // check if the triangle is intersecting the capsule and adjust the
        // capsule position if it is.
        const triPoint = tempVector;
        const capsulePoint = tempVector2;

        const distance = tri.closestPointToSegment(
          tempSegment,
          triPoint,
          capsulePoint
        );
        if (distance < capsuleInfo.radius) {
          const depth = capsuleInfo.radius - distance;
          const direction = capsulePoint.sub(triPoint).normalize();

          tempSegment.start.addScaledVector(direction, depth);
          tempSegment.end.addScaledVector(direction, depth);
        }
      },
    });

    // get the adjusted position of the capsule collider in world space after checking
    // triangle collisions and moving it. capsuleInfo.segment.start is assumed to be
    // the origin of the player model.
    const newPosition = tempVector;
    newPosition.copy(tempSegment.start).applyMatrix4(collider.matrixWorld);

    // check how much the collider was moved
    const deltaVector = tempVector2;
    deltaVector.subVectors(newPosition, player.position);

    // adjust the player model
    player.position.copy(newPosition);
    Now.avatarAt.copy(player.position);
    Now.avatarAt.y += 0.3;

    rotationCopier.position.copy(player.position);
    rotationCopier.lookAt(
      //
      Now.goingTo.x,
      player.position.y,
      Now.goingTo.z
    );

    Now.avatarRot.x = rotationCopier.rotation.x;
    Now.avatarRot.y = rotationCopier.rotation.y;
    Now.avatarRot.z = rotationCopier.rotation.z;

    // if the player was primarily adjusted vertically we assume it's on something we should consider gound
    playerIsOnGround =
      deltaVector.y > Math.abs(delta * playerVelocity.y * 0.25);

    if (!playerIsOnGround) {
      deltaVector.normalize();
      playerVelocity.addScaledVector(
        deltaVector,
        -deltaVector.dot(playerVelocity)
      );
    } else {
      playerVelocity.set(0, 0, 0);
    }
  }

  let steps = 4;
  useFrame((st, dt) => {
    //
    if (dt >= 1 / 30) {
      dt = 1 / 30;
    }

    //
    for (let i = 0; i < steps; i++) {
      updatePlayer({ delta: dt / steps, player });
    }
  });

  // return {
  //   yourself: player,
  //   avatarDebugger: <primitive object={player}></primitive>,
  // };

  return (
    <group>
      <group visible={debugCollider}>
        {collider && <primitive object={collider}></primitive>}
      </group>
    </group>
  );
}

export function MainAvatarLogic({ profile, url }) {
  let ref = useRef();

  let raw = useFBX(profile.avatarURL);
  let gltf = useMemo(() => {
    let other = SkeletonUtils.clone(raw);

    other.traverse((item) => {
      if (item.material) {
        item.material = item.material.clone();
      }
    });

    return other;
  }, [raw]);

  gltf.scene = gltf;

  useEffect(() => {
    //
    if (profile.avatarTextureRefURL) {
      setChibiURL({ chibi: gltf.scene, refURL: profile.avatarTextureRefURL });
    }
  }, [profile.avatarTextureRefURL]);

  let model = useMemo(() => {
    let cloned = SkeletonUtils.clone(gltf.scene);

    cloned.scale.set(0.0075, 0.0075, 0.0075);
    cloned.traverse((item) => {
      if (item) {
        if (item.material) {
          item.castShadow = true;
          item.material.side = DoubleSide;
        }
      }
    });
    return cloned;
  }, []);

  let running = useFBX(
    `/chibi/actions-for-this/contorls/running-in-place-relax.fbx`
  );
  let standing = useFBX(`/chibi/actions-for-this/contorls/idle-breathing.fbx`);
  let mixer = useMemo(() => new AnimationMixer(), []);

  useEffect(() => {
    let lastAction = { current: false, mode: false };

    let runAction = () => {
      if (lastAction.mode === Now.avatarMode) {
        return;
      }
      lastAction.mode = Now.avatarMode;

      if (lastAction.current) {
        lastAction.current.fadeOut(0.3);
      }

      if (Now.avatarMode === "running") {
        //
        let clip = running.animations[0];
        let action = mixer.clipAction(clip, ref.current);
        action.reset();
        action.fadeIn(0.2);
        action.play();
        lastAction.current = action;
      }
      if (Now.avatarMode === "standing") {
        //300

        let clips = [standing.animations[0]];
        let clip = clips[Math.floor(clips.length * Math.random())];
        let action = mixer.clipAction(clip, ref.current);
        action.reset();
        action.fadeIn(0.2);
        action.play();
        lastAction.current = action;
      }
    };

    runAction();
    let clean = Now.onEventChangeKey("avatarMode", runAction);
    return () => {
      clean();
    };
  }, []);

  useFrame((st, dt) => {
    mixer.update(dt);
  });

  //
  //console.log(gltf);
  //

  useFrame(() => {
    if (ref.current) {
      Now.avatarAt.y += -2.0 - 0.25;
      ref.current.position.copy(Now.avatarAt);
    }
    if (ref.current) {
      ref.current.rotation.x = Now.avatarRot.x;
      ref.current.rotation.y = Now.avatarRot.y;
      ref.current.rotation.z = Now.avatarRot.z;
    }
  });

  return (
    <group ref={ref}>
      <group>
        <primitive name="avatar" object={model}></primitive>
      </group>
    </group>
  );
}

export function getRoomID() {
  let roomID = route.query.roomID || "multitude";
  return roomID;
}

export function SelfDataEmitter() {
  // let DBRef = false;
  // useEffect(() => {
  //   onReady().then(({ db, user }) => {
  //     var userData = db.ref(`rooms/${getRoomID()}/${user.uid}`);
  //     DBRef = userData;
  //   });
  // }, []);

  //

  let refresh = ({ avatarAt, goingTo }) => {
    onReady().then(({ db, user }) => {
      let DBRef = db.ref(`rooms/${getRoomID()}/${user.uid}`);
      if (Now.profile) {
        DBRef.update({
          avatarURL: Now.profile.avatarURL,
          avatarSignature: Now.profile.avatarSignature,
          avatarTextureRefURL: Now.profile.avatarTextureRefURL,
          //
          avatarAt: {
            x: avatarAt.x,
            y: avatarAt.y,
            z: avatarAt.z,
          },
          goingTo: {
            x: goingTo.x,
            y: goingTo.y,
            z: goingTo.z,
          },
        });
      }
    });
  };

  useEffect(() => {
    let last = false;
    let ttt = setInterval(() => {
      let signature =
        Now.goingTo.length().toFixed(1) + Now.avatarAt.length().toFixed(1);
      if (last !== signature || Now.needsSync) {
        Now.needsSync = false;
        last = signature;
        refresh({ goingTo: Now.goingTo, avatarAt: Now.avatarAt });
      }
    }, 200);
    //
    return () => {
      clearInterval(ttt);
    };
  }, []);

  return <group></group>;
}

export function GameDataReceiver() {
  useEffect(() => {
    let clean = () => {};

    Now.avatarAt.set(0, 0, 0);
    Now.goingTo.set(0, 0, 10);
    Now.avatarMode = "running";

    onReady().then(({ db, user, fire }) => {
      var myConnectionsRef = db.ref(`online/${getRoomID()}/${user.uid}/`);
      var lastOnlineRef = db.ref(`rooms/${getRoomID()}/${user.uid}/lastOnline`);
      var connectedRef = db.ref(".info/connected");
      var onlineList = db.ref(`online/${getRoomID()}`);
      var profile = db.ref(`profiles/${user.uid}`);

      onlineList.on("value", (snap) => {
        let val = snap.val();
        if (val) {
          Now.onlineUID = [...Object.keys(val)];
          Now.reload++;
        }
      });

      clean = () => {
        myConnectionsRef.remove();
        connectedRef.off();
        onlineList.off();
        profile.off();
        Now.onlineUID = [];
        Now.reload++;
      };

      connectedRef.on("value", (snap) => {
        if (snap.val() === true) {
          var con = myConnectionsRef;
          con.onDisconnect().remove();
          con.set(true);
          lastOnlineRef.onDisconnect().set(new Date().getTime());
        }
      });

      profile.once("value", (snap) => {
        let profile = snap.val();
        if (profile) {
          Now.profile = profile;
          Now.user = user;
        } else if (!snap || !profile) {
          //
          router.push("/");
        }
      });
    });

    return () => {
      clean();
    };
  }, [getRoomID()]);

  return <group></group>;
}

export function MainAvatarLoader() {
  Now.makeKeyReactive("profile");

  // let getURL = () => {
  //   let profile = Now.profile;
  //   if (profile.avatarURL) {
  //     let sig = `sig=${profile.avatarSignature}`;
  //     let url = `${profile.avatarURL}?${encodeURIComponent(sig)}`;
  //     return url;
  //   }
  // };

  return (
    <>
      {Now.profile && (
        <MainAvatarLogic
          profile={Now.profile}
          url={`/chibi/ChibiBase-rigged.fbx`}
        ></MainAvatarLogic>
      )}
    </>
  );
}

export function NoBloomRenderLoop() {
  let run = ({ gl, scene, camera }, dt) => {
    gl.autoClear = false;
    gl.clear();
    gl.render(scene, camera);
  };

  useFrame((state, dt) => {
    run(state, dt);
  }, 1000);

  return null;
}

export function DisplayOtherUsers() {
  Now.makeKeyReactive("onlineUID");
  Now.makeKeyReactive("reload");
  Now.makeKeyReactive("user");

  // console.log(Now.user);
  return (
    <group>
      {Now.onlineUID
        .filter((a) => {
          if (Now.user) {
            return a !== Now.user.uid;
          } else {
            return false;
          }
        })
        // .filter((a) => Now.players[a.connectionID])
        .map((uid) => {
          // console.log(uid);
          return (
            <OtherAvatarDisplay
              key={uid}
              uid={uid}
              roomID={getRoomID()}
            ></OtherAvatarDisplay>
          );
        })}
    </group>
  );
}

export let glbPipe = (onlineURL, signature = "") => {
  return download(
    GLTFLoader,
    onlineURL + `?sig=${encodeURIComponent(signature)}`
  );
};

export let fbxPipe = (onlineURL) => {
  return download(FBXLoader, onlineURL);
};

export let texPipe = (onlineURL) => {
  return download(TextureLoader, onlineURL);
};

export let filePipe = (onlineURL) => {
  return download(FileLoader, onlineURL);
};

// let loadAssets = async ({ avatarURL, avatarSignature }) => {
//   let [
//     //
//     avatar,
//     running,
//     standing,
//   ] = await Promise.all([
//     fbxPipe(avatarURL, avatarSignature).then((a) => {
//       a.scene = a;
//       return a;
//     }),
//     fbxPipe("/chibi/actions-for-this/contorls/running-in-place-relax.fbx"),
//     fbxPipe("/chibi/actions-for-this/contorls/idle-breathing.fbx"),
//   ]);

//   return { avatar, running, standing };
// };

export function OtherAvatarDisplay({ uid, roomID }) {
  let mixer = useRef();
  let playerRef = useRef();
  let gpRef = useRef();

  let raw = useFBX("/chibi/ChibiBase-rigged.fbx");
  let chibi = useMemo(() => {
    let other = SkeletonUtils.clone(raw);

    other.traverse((item) => {
      if (item.material) {
        item.material = item.material.clone();
      }
    });

    return other;
  }, [raw]);

  let running = useFBX(
    "/chibi/actions-for-this/contorls/running-in-place-relax.fbx"
  );
  let standing = useFBX("/chibi/actions-for-this/contorls/idle-breathing.fbx");

  const modeRef = useRef();

  //

  useEffect(() => {
    mixer.current = new AnimationMixer();

    modeRef.current = makeShallowStore({
      pose: "running",
    });

    getFire()
      .database()
      .ref(`rooms/${roomID}/${uid}`)
      .on("value", (snap) => {
        if (snap) {
          let val = snap.val();

          if (val) {
            playerRef.current = val;
          }

          if (val && val.avatarTextureRefURL) {
            setChibiURL({ chibi: chibi, refURL: val.avatarTextureRefURL });
          }
        }
      });
  }, []);

  let needsInit = true;
  let goingtoLerp = new Vector3(0, 0, 0);
  let at = new Vector3();

  useFrame((st, dt) => {
    mixer.current.update(dt);

    if (playerRef.current && gpRef.current && playerRef.current.avatarAt) {
      at.copy(playerRef.current.avatarAt);
      if (needsInit) {
        gpRef.current.position.copy(playerRef.current.avatarAt);
        goingtoLerp.copy(playerRef.current.avatarAt);
        goingtoLerp.z += 1;
        gpRef.current.lookAt(goingtoLerp.x, goingtoLerp.y, goingtoLerp.z);
        needsInit = false;
      } else {
        gpRef.current.position.lerp(playerRef.current.avatarAt, 0.05);
      }

      goingtoLerp.lerp(playerRef.current.goingTo, 0.03);

      gpRef.current.lookAt(goingtoLerp.x, goingtoLerp.y, goingtoLerp.z);

      if (gpRef.current.position.distanceTo(playerRef.current.avatarAt) < 1) {
        modeRef.current.pose = "standing";
        gpRef.current.rotation.x = 0.000001;
        gpRef.current.rotation.z = 0.000001;
      } else {
        modeRef.current.pose = "running";
      }
    }
  });

  useEffect(() => {
    let lastAction = { current: false, mode: false };
    modeRef.current.onEventChangeKey("pose", () => {
      if (lastAction.mdoe === modeRef.current.pose) {
        return;
      }
      lastAction.mdoe = modeRef.current.pose;

      if (lastAction.current) {
        lastAction.current.fadeOut(0.3);
      }

      if (
        modeRef.current.pose === "running" &&
        gpRef.current &&
        mixer.current
      ) {
        //
        let clip = running.animations[0];
        let action = mixer.current.clipAction(clip, gpRef.current);
        action.reset();
        action.fadeIn(0.1);
        action.play();
        lastAction.current = action;
      }
      if (
        modeRef.current.pose === "standing" &&
        gpRef.current &&
        mixer.current
      ) {
        //300

        let clips = [standing.animations[0]];
        let clip = clips[Math.floor(clips.length * Math.random())];
        let action = mixer.current.clipAction(clip, gpRef.current);
        action.reset();
        action.fadeIn(0.1);
        action.play();
        lastAction.current = action;
      }
    });
  }, []);

  return (
    <group>
      <group scale={0.0075} ref={gpRef}>
        <primitive object={chibi}></primitive>
      </group>
    </group>
  );
}

// export function OtherAvatarDisplay({ uid, roomID }) {
//   let { scene } = useThree();
//   let works = useRef({});

//   const mode = useMemo(() => {
//     return makeShallowStore({
//       pose: "running",
//     });
//   }, []);

//   let playerRef = useRef(false);

//   useEffect(() => {
//     let clean = () => {};
//     onReady().then(({ db }) => {
//       //

//       db.ref(`rooms/${roomID}/${uid}`).once("value", (snap) => {
//         let val = snap.val();
//         setupPlayer(val);

//         db.ref(`rooms/${roomID}/${uid}`).on("value", (snap) => {
//           let val = snap.val();
//           playerRef.current = val;
//         });
//       });

//       // db.ref(`rooms/${roomID}/${uid}/avatarSignature`).on("value", () => {
//       //   //
//       //   db.ref(`rooms/${roomID}/${uid}`).once("value", (snap) => {
//       //     let val = snap.val();
//       //     let playerObj = val;
//       //     if (playerObj) {
//       //       setupPlayer(playerObj);
//       //     }
//       //   });
//       // });

//       // db.ref(`rooms/${roomID}/${uid}/avatarSignature`).once("value", () => {
//       //   let val = snap.val();
//       //   if (player) {
//       //     setupPlayer(playerObj);
//       //   }
//       // });
//     });

//     let lastClean = () => {};
//     let setupPlayer = (playerObj) => {
//       lastClean();

//       let o3d = new Object3D();

//       scene.add(o3d);
//       clean = () => {
//         scene.remove(o3d);
//       };
//       lastClean = () => {
//         scene.remove(o3d);
//       };

//       let mixer = new AnimationMixer(o3d);

//       let loading = new Mesh(
//         new BoxBufferGeometry(3 / 10, 13 / 10, 3 / 10),
//         new MeshBasicMaterial({ color: 0xbababa })
//       );

//       //
//       if (playerObj.avatarAt) {
//         loading.position.copy(playerObj.avatarAt);
//       }
//       loading.position.y = 18 / 2;

//       //
//       works.current.avaloading = ({ dt }) => {
//         loading.rotation.y += dt;
//       };

//       o3d.add(loading);

//       //

//       loadAssets({
//         avatarSignature: playerObj.avatarSignature,
//         avatarURL: "/chibi/ChibiBase-rigged.fbx",
//       }).then(({ avatar, running, standing }) => {
//         let cloned = SkeletonUtils.clone(avatar.scene);
//         cloned.scale.set(0.0075, 0.0075, 0.0075);
//         cloned.traverse((item) => {
//           if (item.material) {
//             item.frustumCulled = false;
//           }
//         });

//         if (playerObj.avatarTextureRefURL) {
//           setChibiURL({ chibi: cloned, refURL: playerObj.avatarTextureRefURL });
//         }

//         o3d.remove(loading);

//         //
//         o3d.add(cloned);

//         let needsInit = true;
//         let goingtoLerp = new Vector3(0, 0, 0);
//         let at = new Vector3();
//         works.current.ava = ({ st, dt }) => {
//           if (playerRef.current && playerRef.current.avatarAt) {
//             at.copy(playerRef.current.avatarAt);
//             if (needsInit) {
//               o3d.position.copy(playerRef.current.avatarAt);
//               goingtoLerp.copy(playerRef.current.avatarAt);
//               goingtoLerp.z += 1;
//               o3d.lookAt(goingtoLerp.x, goingtoLerp.y, goingtoLerp.z);
//               needsInit = false;
//             } else {
//               o3d.position.lerp(playerRef.current.avatarAt, 0.05);
//             }

//             goingtoLerp.lerp(playerRef.current.goingTo, 0.03);

//             o3d.lookAt(goingtoLerp.x, goingtoLerp.y, goingtoLerp.z);

//             if (o3d.position.distanceTo(playerRef.current.avatarAt) < 1) {
//               mode.pose = "standing";
//               o3d.rotation.x = 0.000001;
//               o3d.rotation.z = 0.000001;
//             } else {
//               mode.pose = "running";
//             }

//             // ref.current.position.x = player.goingTo.x || 0;
//             // ref.current.position.y = player.goingTo.y || 0;
//             // ref.current.position.z = player.goingTo.z || 0;
//           }
//         };

//         works.current.avaMixer = ({ st, dt }) => {
//           mixer.update(dt);
//         };

//         let lastAction = { current: false, mode: false };

//         let runAction = () => {
//           if (lastAction.mdoe === mode.pose) {
//             return;
//           }
//           lastAction.mdoe = mode.pose;

//           if (lastAction.current) {
//             lastAction.current.fadeOut(0.3);
//           }

//           if (mode.pose === "running") {
//             //
//             let clip = running.animations[0];
//             let action = mixer.clipAction(clip, o3d);
//             action.reset();
//             action.fadeIn(0.2);
//             action.play();
//             lastAction.current = action;
//           }
//           if (mode.pose === "standing") {
//             //300

//             let clips = [standing.animations[0]];
//             let clip = clips[Math.floor(clips.length * Math.random())];
//             let action = mixer.clipAction(clip, o3d);
//             action.reset();
//             action.fadeIn(0.2);
//             action.play();
//             lastAction.current = action;
//           }
//         };

//         mode.onEventChangeKey("pose", runAction);
//       });
//     };

//     return () => {
//       clean();
//     };
//   }, []);

//   useFrame((st, dt) => {
//     Object.values(works.current).map((f) => f({ st, dt }));
//   });

//   return <group></group>;
// }
