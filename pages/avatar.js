// import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
// import {
//   // getProfileData,
//   // getProfileID,
//   // saveProfileData,
// } from "../pages-code/Game3D/GameState";
import router from "next/router";
import { getID, makeShallowStore } from "../vfx-runtime/ENUtils";
import { setup, onReady, firebase, getFire } from "../video-game/AppFirebase";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Plane, Text, useFBX } from "@react-three/drei";
import { AnimationMixer, DoubleSide, TextureLoader } from "three";
import { Gallery, getURLByRefURL } from "../video-game/Gallery";

let AvaState = makeShallowStore({
  panel: "",
  avatarTextureRefURL: "",
  loading: false,
});

// /texture/waternormals-works.jpg

export let setChibiURL = async ({ chibi, refURL }) => {
  if (refURL !== null) {
    AvaState.loading = true;
    let link = await getURLByRefURL(refURL);

    chibi.traverse((k) => {
      if (k.material) {
        new TextureLoader().load(
          link,
          (tex) => {
            k.material.map = tex;
            k.material.needsUpdate = true;
            AvaState.loading = false;
          },
          () => {},
          () => {
            AvaState.loading = false;
          }
        );
      }
    });
  } else if (refURL === "") {
    chibi.traverse((k) => {
      if (k.material) {
        k.material.map = null;
      }
    });
  }
};

function AvatarChooser({
  goReady = (v) => {
    console.log(v);
  },
}) {
  AvaState.makeKeyReactive("panel");
  // const iframe = useRef();

  // useEffect(() => {
  //   function receiveMessage(event) {
  //     setTimeout(() => {
  //       console.log(event.data);
  //       if (typeof event.data === "string") {
  //         function validURL(str) {
  //           var pattern = new RegExp(
  //             "^(https?:\\/\\/)?" + // protocol
  //               "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
  //               "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
  //               "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
  //               "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
  //               "(\\#[-a-z\\d_]*)?$",
  //             "i"
  //           ); // fragment locator
  //           return !!pattern.test(str);
  //         }

  //         if (validURL(event.data)) {
  //           onReady(event.data);
  //         }
  //       }

  //       //
  //       //
  //       // https://d1a370nemizbjq.cloudfront.net/283ab29b-5ed6-4063-bf4c-a9739a7465bb.glb
  //     }, 0);
  //   }

  //   window.addEventListener("message", receiveMessage, false);
  //   return () => {
  //     window.removeEventListener("message", receiveMessage);
  //   };
  // }, []);

  return (
    <div className="w-full h-full bg-white">
      <Canvas dpr={[1, 3]}>
        <Suspense fallback={<Text>Loading Avatar...</Text>}>
          <Chibi></Chibi>
        </Suspense>
      </Canvas>

      {AvaState.panel === "gallery" && (
        <Gallery
          onClose={(v) => {
            //
            AvaState.panel = "";
          }}
          onPick={(v) => {
            let refURL = v.data.refURL;
            AvaState.avatarTextureRefURL = refURL;
            AvaState.panel = "";

            onReady().then(({ db, user }) => {
              db.ref(`profiles/${user.uid}/avatarURL`).set(
                `/chibi/ChibiBase-rigged.fbx`
              );
              db.ref(`profiles/${user.uid}/avatarSignature`).set(getID());
            });

            if (refURL !== null) {
              onReady().then(({ db, user }) => {
                db.ref(`profiles/${user.uid}/avatarTextureRefURL`).set(refURL);
              });
            }
            // goReady(refURL);

            // getFire().database().ref(`/`);
          }}
        ></Gallery>
      )}
    </div>
  );
}

function Chibi() {
  let chibi = useFBX(`/chibi/ChibiBase-rigged.fbx`);
  let idle = useFBX(`/chibi/actions-for-this/contorls/idle-happy.fbx`);

  let three = useThree((s) => {
    chibi.traverse((k) => {
      if (k.material) {
        k.material.side = DoubleSide;
      }
    });

    let mixer = new AnimationMixer();
    let action = mixer.clipAction(idle.animations[0], chibi);
    action.play();

    s.mixer = mixer;
    // mixer
    return s;
  });
  useFrame((st, dt) => {
    three.mixer.update(dt);
  });

  useEffect(() => {
    if (AvaState.avatarTextureRefURL) {
      setChibiURL({ chibi, refURL: AvaState.avatarTextureRefURL });
    }
  }, [AvaState.avatarTextureRefURL]);
  AvaState.useReactiveKey("avatarTextureRefURL", (url) => {
    setChibiURL({ chibi, refURL: url });
  });

  useEffect(() => {
    onReady().then(({ db, user }) => {
      db.ref(`profiles/${user.uid}/avatarTextureRefURL`).once("value", (s) => {
        if (s) {
          let v = s.val();
          if (v) {
            setChibiURL({ chibi, refURL: v });
          }
        }
      });
    });
  }, []);

  //
  // useEffect((s) => {
  //   if (s) {
  //     let { camera } = s;

  //     let head = chibi.getObjectByName("mixamorigHead");
  //     if (head) {
  //       head.getWorldPosition(camera.position);
  //       camera.position.z -= 5;
  //       camera.lookAt(
  //         camera.position.x,
  //         camera.position.y + 15,
  //         camera.position.z - 5
  //       );
  //     }
  //   }

  //   return () => {
  //     //
  //   };
  // }, []);

  AvaState.makeKeyReactive("loading");

  return (
    <group>
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 130, 100]}></pointLight>

      {AvaState.loading && (
        <Text
          fontSize={0.2}
          font={`/font/Cronos-Pro-Light_12448.ttf`}
          color="#232323"
          position-y={5.5}
        >
          Loading Clothes...
        </Text>
      )}

      <Text
        fontSize={0.5}
        font={`/font/Cronos-Pro-Light_12448.ttf`}
        color="#232323"
        position-y={0}
        onClick={() => {
          AvaState.panel = "gallery";
        }}
      >
        Choose Clothes
      </Text>

      <primitive
        onClick={() => {
          AvaState.panel = "gallery";
        }}
        position-y={0.5}
        scale={0.0075}
        object={chibi}
      ></primitive>

      <OrbitControls
        ref={(orbit) => {
          let head = chibi.getObjectByName("mixamorigHead");
          if (orbit && head && !orbit.configrued) {
            orbit.configrued = true;
            head.getWorldPosition(orbit.target);
            orbit.target.y += 0.5;
            orbit.object.position.copy(orbit.target);

            orbit.object.position.y += 1;
            orbit.object.position.z += 5;

            orbit.object.position.y -= 1;
            orbit.target.y -= 1;
          }
        }}
      ></OrbitControls>

      {/*  */}
    </group>
  );
}

function AvatarLayer() {
  let [isLoading, setLoading] = useState(false);
  useEffect(() => {
    setup();
  }, []);

  //
  let goPlayGame = ({ refURL = null }) => {
    onReady().then(({ user, db, app }) => {
      db.ref(`profiles/${user.uid}/avatarURL`).set(
        `/chibi/ChibiBase-rigged.fbx`
      );
      db.ref(`profiles/${user.uid}/avatarSignature`).set(getID());

      if (refURL !== null) {
        db.ref(`profiles/${user.uid}/avatarTextureRefURL`).set(refURL);
      }

      router.push("/room/loklok");
    });
  };

  return (
    <div className="absolute top-0 left-0 bg-white w-full h-full">
      <div
        className="flex justify-between items-center text-lg bg-blue-500 text-white"
        style={{ height: `calc(50px)` }}
      >
        <div
          className="inline-flex justify-start items-center"
          style={{ width: "20%" }}
        >
          {/* aaaaa */}
          <div
            onClick={() => {
              window.history.go(-1);
            }}
          >
            <div
              className={
                "p-3 inline-flex justify-start items-center cursor-pointer"
              }
            >
              <svg
                className="mr-3"
                width="24"
                height="24"
                xmlns="http://www.w3.org/2000/svg"
                fillRule="evenodd"
                clipRule="evenodd"
              >
                <path
                  fill="white"
                  d="M2.117 12l7.527 6.235-.644.765-9-7.521 9-7.479.645.764-7.529 6.236h21.884v1h-21.883z"
                />
              </svg>
              Back
            </div>
          </div>
          {/* aaaaa */}
        </div>

        <div
          className="inline-flex justify-center items-center"
          style={{ width: "60%" }}
        >
          <div className={"p-3 hidden lg:block"}>Game Avatar Setup</div>
          <div className={"p-3 block lg:hidden text-sm"}>Game Avatar Setup</div>
        </div>

        <div
          className="inline-flex justify-end items-center"
          style={{ width: "20%" }}
        >
          <div
            className={
              "p-3 inline-flex justify-start items-center cursor-pointer"
            }
            onClick={() => {
              goPlayGame({ refURL: null });
            }}
          >
            Done
          </div>
        </div>
      </div>

      <div className="w-full" style={{ height: `calc(100% - 50px)` }}>
        <AvatarChooser
          //
          goReady={(link) => {
            // let profileID = getProfileID();
            // let data = getProfileData({ profileID });
            // data.avatarURL = link;
            // data.avatarSignature = getID();
            // saveProfileData({ profileID, data });

            // function validURL(str) {
            //   var pattern = new RegExp(
            //     "^(https?:\\/\\/)?" + // protocol
            //       "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
            //       "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
            //       "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
            //       "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
            //       "(\\#[-a-z\\d_]*)?$",
            //     "i"
            //   ); // fragment locator
            //   return !!pattern.test(str);
            // }

            setLoading(true);

            goPlayGame({ refURL: link });

            /*

            let refURL = v.data.refURL;
            onReady().then(({ user, db, app }) => {
              db.ref(`profiles/${user.uid}`).set({
                avatarURL: `/chibi/ChibiBase-rigged.fbx`,
                avatarSignature: getID(),
                avatarTextureRefURL: refURL,
              });
              // router.push("/room/loklok");
            });
            */

            // getFire().database.ref('players/' + FBStore.user.uid)
          }}
        ></AvatarChooser>
      </div>

      {isLoading ? (
        <div className="absolute top-0 left-0 flex text-lg items-center justify-center w-full h-full bg-white bg-opacity-90">
          Loading....
        </div>
      ) : (
        <div></div>
      )}
    </div>
  );
}

export default function Home() {
  return <AvatarLayer></AvatarLayer>;
}
