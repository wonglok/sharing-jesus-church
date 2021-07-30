import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
// import { usePinch } from "react-use-gesture";
import { RingBufferGeometry } from "three";
import { AdditiveBlending } from "three";
import { CircleBufferGeometry } from "three";
// import { ConeBufferGeometry, Quaternion, Vector2 } from "three";
import { Camera, Vector3 } from "three";
// import { OrbitControls } from ;
import { Now } from "./Now";

const useAutoEvent = function (ev, fnc, settings = { passive: false }, dom) {
  useEffect(() => {
    dom = dom || window;
    dom.addEventListener(ev, fnc, settings);
    return () => {
      dom = dom || window;
      dom.removeEventListener(ev, fnc);
    };
  }, []);
};

const applyAutoEvent = function (dom, ev, fnc, settings = { passive: false }) {
  dom = dom || window;
  dom.addEventListener(ev, fnc, settings);
  return () => {
    dom = dom || window;
    dom.removeEventListener(ev, fnc);
  };
};

export function CameraRigFirstPersonView() {
  let { get, gl } = useThree();
  let works = useRef({});

  useAutoEvent(
    `touchstart`,
    (ev) => {
      ev.preventDefault();
    },
    { passive: false }
  );

  useAutoEvent(
    `touchmove`,
    (ev) => {
      ev.preventDefault();
    },
    { passive: false }
  );

  useAutoEvent(
    `touchend`,
    (ev) => {
      ev.preventDefault();
    },
    { passive: false }
  );

  useEffect(() => {
    // let orig = Now.camMode;
    // Now.camMode = Words.firstPerson;
    Now.speed = 3.5;
    return () => {
      Now.speed = 1;
      // Now.camMode = orig;
    };
  });
  //

  useAutoEvent("keydown", (ev) => {
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
  useAutoEvent("keyup", (ev) => {
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

  useEffect(() => {
    let camera = get().camera;
    camera.near = 0.1;
    camera.far = 10000;
    camera.fov = 45;
    camera.updateProjectionMatrix();

    let {
      OrbitControls,
    } = require("three/examples/jsm/controls/OrbitControls");

    let fakeCam = new Camera();
    fakeCam.position.z = 5;
    let orbit = new OrbitControls(fakeCam, gl.domElement);
    orbit.enableRotate = true;
    orbit.enablePan = false;
    orbit.enableZoom = false;

    orbit.enableDamping = true;
    orbit.rotateSpeed = 0.5;

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
    let isUsing = false;
    manager.on("start move dir plain", function (evt, nipple) {
      if (nipple?.angle?.radian) {
        orbit.enableRotate = false;
        forward.set(0, 0, -1);
        forward.applyAxisAngle(
          up,
          orbit.getAzimuthalAngle() + nipple?.angle?.radian - Math.PI * 0.5 ||
            0.0
        );
        isUsing = true;
        Now.isDown = true;

        clearTimeout(ttt);
        ttt = setTimeout(() => {
          isUsing = false;
        }, 100);
      }
    });

    manager.on("end", () => {
      forward.multiplyScalar(0);
      Now.isDown = false;
      orbit.enableRotate = true;
      isUsing = false;
    });

    let cte = applyAutoEvent(
      gl.domElement.parentElement,
      `touchend`,
      (ev) => {
        if (!isUsing) {
          orbit.enableRotate = true;
        }
      },
      { passive: false }
    );
    let cts = applyAutoEvent(
      gl.domElement.parentElement,
      `touchstart`,
      (ev) => {
        if (!isUsing) {
          orbit.enableRotate = true;
        }
      },
      { passive: false }
    );

    let keyBoardForward = new Vector3(0, 0, 1);
    works.current.ctrl2 = () => {
      //

      // controls.getDirection(dir);

      if (Now.keyW) {
        keyBoardForward.set(0, 0, -1);
        keyBoardForward.applyEuler(camera.rotation);
        keyBoardForward.y = 0.0;

        Now.avatarAt.add(keyBoardForward);
      } else if (Now.keyA) {
        keyBoardForward.set(-1, 0, 0);
        keyBoardForward.applyEuler(camera.rotation);
        keyBoardForward.y = 0.0;

        Now.avatarAt.add(keyBoardForward);
      } else if (Now.keyS) {
        keyBoardForward.set(0, 0, 1);
        keyBoardForward.applyEuler(camera.rotation);
        keyBoardForward.y = 0.0;

        Now.avatarAt.add(keyBoardForward);
      } else if (Now.keyD) {
        keyBoardForward.set(1, 0, 0);
        keyBoardForward.applyEuler(camera.rotation);
        keyBoardForward.y = 0.0;

        Now.avatarAt.add(keyBoardForward);
      }

      Now.goingTo.copy(Now.avatarAt);
      // if (!(Now.keyW || Now.keyA || Now.keyS || Now.keyD)) {
      //   Now.avatarAt.copy(Now.avatarAt);
      // }
    };

    // grid of raycaster

    works.current.ctrl3 = () => {
      let newType = "floor";

      // let upness = Now.cursorNormal.y || 0;
      if (Now.cursorType !== newType) {
        Now.cursorType = newType;
      }
    };

    works.current.ctrl = () => {
      orbit.update();

      Now.goingTo.add(forward);

      camera.position.x = Now.avatarAt.x;
      camera.position.y = Now.avatarAt.y + 1;
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
      cte();
      cts();
    };
  }, []);

  useFrame(() => {
    Object.values(works.current).forEach((e) => e());
  });
  return (
    <group>
      {createPortal(
        <group>
          <FloatingCursor></FloatingCursor>
        </group>,
        get().scene
      )}
    </group>
  );
}

function FloatingCursor() {
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
