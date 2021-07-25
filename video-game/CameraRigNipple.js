import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { usePinch } from "react-use-gesture";
import { RingBufferGeometry } from "three";
import { AdditiveBlending } from "three";
import { CircleBufferGeometry } from "three";
import { ConeBufferGeometry, Quaternion, Vector2 } from "three";
import { Camera, Vector3 } from "three";
import { OrbitControls } from "three-stdlib";
import { Now } from "./Now";

export function CameraRigNipple() {
  let { camera, get, gl } = useThree();
  let works = useRef({});
  Now.makeKeyReactive("camMode");
  let zoom = useRef(1);

  // usePinch(
  //   (state) => {
  //     const {
  //       da, // [d,a] absolute distance and angle of the two pointers
  //       vdva, // momentum of the gesture of distance and rotation
  //       origin, // coordinates of the center between the two touch event
  //     } = state;

  //     // console.log(vdva[0]);
  //     // console.log(vdva[0]);

  //     zoom.current += vdva[0] * -0.1;

  //     if (zoom.current <= 0.45) {
  //       zoom.current -= vdva[0] * -0.1;
  //     }

  //     if (zoom.current < 0.45) {
  //       zoom.current = 0.45;
  //     }

  //     if (zoom.current >= 6.5) {
  //       zoom.current -= vdva[0] * -0.1;
  //     }

  //     if (zoom.current > 6.5) {
  //       zoom.current = 6.5;
  //     }
  //   },
  //   {
  //     domTarget: gl.domElement,
  //     eventOptions: {
  //       passive: false,
  //     },
  //   }
  // );

  useEffect(() => {
    gl.domElement.parentElement.addEventListener(
      "touchstart",
      (ev) => {
        ev.preventDefault();
      },
      { passive: false }
    );

    gl.domElement.parentElement.addEventListener(
      "touchmove",
      (ev) => {
        ev.preventDefault();
      },
      { passive: false }
    );

    gl.domElement.parentElement.addEventListener(
      "touchstart",
      (ev) => {
        ev.preventDefault();
      },
      { passive: false }
    );
  }, []);

  useEffect(() => {
    Now.enableFloorCursor = false;
    Now.speed = 10;
    return () => {
      Now.speed = 1;
      Now.enableFloorCursor = true;
    };
  });
  //

  useEffect(() => {
    camera.near = 0.1;
    camera.far = 10000;
    camera.fov = 45;
    camera.updateProjectionMatrix();

    gl.domElement.addEventListener(
      "wheel",
      (ev) => {
        ev.preventDefault();

        zoom.current += ev.deltaY * 0.0005;
        if (zoom.current <= 0.45) {
          zoom.current -= ev.deltaY * 0.0005;
        }
        //
      },
      { passive: false }
    );

    // camera.position
    //   .copy({
    //     x: 0,
    //     y: 3,
    //     z: 15,
    //   })
    //   .multiplyScalar(2 * 3);

    let fakeCam = new Camera();
    fakeCam.position.z = 5;
    let orbit = new OrbitControls(fakeCam, gl.domElement);
    orbit.enableRotate = true;
    orbit.enablePan = false;
    orbit.enableZoom = false;

    orbit.enableDamping = true;
    orbit.rotateSpeed = 0.5;

    // orbit.enableDamping = true;
    // orbit.minPolarAngle = Math.PI * 0.0;
    // orbit.maxPolarAngle = Math.PI * 0.5;
    // orbit.minAzimuthAngle = Math.PI * -0.5;
    // orbit.maxAzimuthAngle = Math.PI * 0.5;

    let joystick = document.createElement("div");

    document.body.appendChild(joystick);
    joystick.style.cssText = `
      position: absolute;
      bottom: 30px;
      left: 30px;
      width: 80px;
      height: 80px;
      color: white;
      user-select: none;
      z-index: 20;
    `;

    let note = document.createElement("div");
    document.body.appendChild(note);
    note.style.cssText = `
      position: absolute;
      bottom: 50px;
      left: 50px;
      width: 80px;
      height: 80px;
      color: white;
      user-select: none;
      z-index: 10;
      text-align: center;
      opacity: 0.4;
    `;
    note.innerHTML = `Walk Around JoyStick`;

    let nipplejs = require("nipplejs");
    var manager = nipplejs.create({
      zone: joystick,
      color: "white",
      mode: "static",
      position: { left: "60px", bottom: "60px" },
    });

    let forward = new Vector3(0, 0, 0);
    let up = new Vector3(0, 1, 0);

    let ttt = 0;
    manager.on("start move dir plain", function (evt, nipple) {
      if (nipple?.angle?.radian) {
        orbit.enabled = false;
        forward.set(0, 0, -1);
        forward.applyAxisAngle(
          up,
          orbit.getAzimuthalAngle() + nipple?.angle?.radian - Math.PI * 0.5 ||
            0.0
        );
        Now.isDown = true;

        clearTimeout(ttt);
        ttt = setTimeout(() => {
          orbit.enabled = true;
        }, 100);
      }
    });

    manager.on("end hidden removed", () => {
      forward.multiplyScalar(0);
      Now.isDown = false;
      orbit.enabled = true;

      clearTimeout(ttt);
      ttt = setTimeout(() => {
        orbit.update();
      }, 100);
    });

    window.addEventListener("keydown", (ev) => {
      // console.log(ev.key);

      if (ev.key === "w") {
        Now.keyW = true;
      }
      if (ev.key === "a") {
        Now.keyA = true;
      }
      if (ev.key === "s") {
        Now.keyS = true;
      }
      if (ev.key === "d") {
        Now.keyD = true;
      }
    });
    window.addEventListener("keyup", (ev) => {
      // console.log(ev.key);

      if (ev.key === "w") {
        Now.keyW = false;
      }
      if (ev.key === "a") {
        Now.keyA = false;
      }
      if (ev.key === "s") {
        Now.keyS = false;
      }
      if (ev.key === "d") {
        Now.keyD = false;
      }
    });

    let keyBoardForward = new Vector3(0, 0, 1);
    works.current.ctrl2 = () => {
      //

      // controls.getDirection(dir);

      if (Now.keyW) {
        keyBoardForward.set(0, 0, -1);
        keyBoardForward.applyEuler(camera.rotation);
        keyBoardForward.y = 0.0;

        Now.goingTo.add(keyBoardForward);
      } else if (Now.keyA) {
        keyBoardForward.set(-1, 0, 0);
        keyBoardForward.applyEuler(camera.rotation);
        keyBoardForward.y = 0.0;

        Now.goingTo.add(keyBoardForward);
      } else if (Now.keyS) {
        keyBoardForward.set(0, 0, 1);
        keyBoardForward.applyEuler(camera.rotation);
        keyBoardForward.y = 0.0;

        Now.goingTo.add(keyBoardForward);
      } else if (Now.keyD) {
        keyBoardForward.set(1, 0, 0);
        keyBoardForward.applyEuler(camera.rotation);
        keyBoardForward.y = 0.0;

        Now.goingTo.add(keyBoardForward);
      }

      if (!(Now.keyW || Now.keyA || Now.keyS || Now.keyD)) {
        Now.goingTo.copy(Now.avatarAt);
      }
    };

    // grid of raycaster

    works.current.ctrl3 = () => {
      let newType = "floor";

      let upness = Now.cursorNormal.y || 0;
      if (Now.cursorType !== newType) {
        Now.cursorType = newType;
      }

      // hover();
    };

    works.current.ctrl = () => {
      orbit.update();

      Now.goingTo.add(forward);

      camera.position.x = Now.avatarAt.x;
      camera.position.y = Now.avatarAt.y + 5;
      camera.position.z = Now.avatarAt.z;

      camera.rotation.copy(fakeCam.rotation);
    };

    Now.enableFloorCursor = false;
    return () => {
      Now.enableFloorCursor = true;
      manager.off("start move end dir plain");
      manager.destroy();
      document.body.removeChild(joystick);

      joystick.remove();
      note.remove();
    };
  }, []);

  useFrame(() => {
    Object.values(works.current).forEach((e) => e());
  });
  return (
    <group>
      {createPortal(
        <group>
          <MyCursor></MyCursor>
        </group>,
        get().scene
      )}
    </group>
  );
}

function MyCursor() {
  let cursor = useRef();

  let t1 = new Vector3();
  let t2 = new Vector3();
  let time = 0;
  useFrame((st, dt) => {
    //
    time += dt;
    if (cursor.current) {
      let mouse = cursor.current;

      mouse.position.copy(Now.cursorPos).addScaledVector(Now.cursorNormal, 0.1);
      mouse.lookAt(
        Now.cursorPos.x + Now.cursorNormal.x,
        Now.cursorPos.y + Now.cursorNormal.y,
        Now.cursorPos.z + Now.cursorNormal.z
      );

      // mouse.rotation.x = Now.cursorNormal.x;
      // mouse.rotation.y = Now.cursorNormal.y;
      // mouse.rotation.z = Now.cursorNormal.z;

      if (Now.cursorType === "hide") {
        mouse.visible = false;
      } else {
        mouse.visible = true;
      }
    }
  });
  //

  let { circle, ring } = useMemo(() => {
    let ring = new RingBufferGeometry(1.3, 1.5, 32, 32);
    // ring.rotateX(Math.PI * -0.5);
    let circle = new CircleBufferGeometry(1, 32);
    // circle.rotateX(Math.PI * -0.5);
    return {
      ring,
      circle,
    };
  }, []);
  return (
    <group ref={cursor}>
      <HideGate>
        <group position={[0, 0.1, 0.0]}>
          <Floating offset={0}>
            <mesh geometry={circle} position-z={0.0}>
              <meshBasicMaterial
                blending={AdditiveBlending}
                color={"white"}
              ></meshBasicMaterial>
            </mesh>
          </Floating>

          <Floating offset={0.1}>
            <mesh geometry={ring} position-z={0.0}>
              <meshBasicMaterial
                blending={AdditiveBlending}
                color={"white"}
              ></meshBasicMaterial>
            </mesh>
          </Floating>
        </group>
      </HideGate>
    </group>
  );
}

function HideGate({ children }) {
  Now.makeKeyReactive("cursorType");

  return <>{Now.cursorType !== "hide" && children}</>;
}

function Floating({ offset = 0, children }) {
  let ref = useRef();

  useEffect(() => {
    //
    //
    //
  }, []);

  let time = 0;
  useFrame((st, dt) => {
    time += dt;
    if (ref.current) {
      ref.current.position.z = 1 + 0.5 * Math.sin(time * 3 + offset);
    }
  });

  return <group ref={ref}>{children}</group>;
}
