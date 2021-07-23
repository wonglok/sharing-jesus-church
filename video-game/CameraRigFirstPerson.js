import { Html, Text } from "@react-three/drei";
import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, createPortal as reactPortal } from "react";
import { usePinch } from "react-use-gesture";
import { Vector3 } from "three";
import { OrbitControls, PointerLockControls } from "three-stdlib";
import { Now } from "./Now";

export function CameraRigFirstPerson() {
  let { camera, gl } = useThree();
  let works = useRef({});
  Now.makeKeyReactive("camMode");
  let zoom = useRef(2);

  usePinch(
    (state) => {
      const {
        da, // [d,a] absolute distance and angle of the two pointers
        vdva, // momentum of the gesture of distance and rotation
        origin, // coordinates of the center between the two touch event
      } = state;

      // console.log(vdva[0]);
      // console.log(vdva[0]);

      zoom.current += vdva[0] * -0.1;

      if (zoom.current <= 0.45) {
        zoom.current -= vdva[0] * -0.1;
      }
      if (zoom.current < 0.45) {
        zoom.current = 0.45;
      }

      if (zoom.current >= 6.5) {
        zoom.current -= vdva[0] * -0.1;
      }

      if (zoom.current > 6.5) {
        zoom.current = 6.5;
      }
    },
    {
      domTarget: gl.domElement,
      eventOptions: {
        passive: false,
      },
    }
  );

  useEffect(() => {
    gl.domElement.addEventListener(
      "touchstart",
      (ev) => {
        ev.preventDefault();
      },
      { passive: false }
    );

    gl.domElement.addEventListener(
      "touchmove",
      (ev) => {
        ev.preventDefault();
      },
      { passive: false }
    );

    gl.domElement.addEventListener(
      "touchstart",
      (ev) => {
        ev.preventDefault();
      },
      { passive: false }
    );
  }, []);

  useEffect(() => {
    Now.speed = 10;
    return () => {
      Now.speed = 1;
    };
  }, []);

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
      },
      { passive: false }
    );

    camera.position.y = 300 / 10;
    camera.position.z = 300 / 10;

    // let orbit = new OrbitControls(camera, gl.domElement);
    // orbit.enableDamping = true;
    // orbit.enableRotate = true;
    // orbit.enablePan = false;
    // orbit.enableZoom = false;

    // pointer locker control //
    // pointer locker control //

    // let up = new Vector3(0, 1, 0);
    // let forwad = new Vector3(0, 0, 0.1);
    const controls = new PointerLockControls(camera, gl.domElement);
    // camera.position.copy(Now.avatarAt);
    // camera.position.y += 10;
    // camera.position.z += 10;

    // add event listener to show/hide a UI (e.g. the game's menu)

    // camera.rotation;
    controls.addEventListener("lock", function () {
      // menu.style.display = "none";
    });

    controls.addEventListener("unlock", function () {
      // menu.style.display = "block";
    });

    gl.domElement.addEventListener("click", () => {
      if (Now.isUnLocked) {
        controls.lock();
      }
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

    let forward = new Vector3(0, 0, 1);
    works.current.ctrl = () => {
      if (Now.isUnLocked !== !controls.isLocked) {
        Now.isUnLocked = !controls.isLocked;
      }

      camera.position.x = Now.avatarAt.x;
      camera.position.y = Now.avatarAt.y + 10;
      camera.position.z = Now.avatarAt.z;
      // controls.getDirection(dir);

      if (Now.keyW) {
        forward.set(0, 0, -1);
        forward.applyEuler(camera.rotation);
        forward.y = 0.0;

        Now.goingTo.add(forward);
      } else if (Now.keyA) {
        forward.set(-1, 0, 0);
        forward.applyEuler(camera.rotation);
        forward.y = 0.0;

        Now.goingTo.add(forward);
      } else if (Now.keyS) {
        forward.set(0, 0, 1);
        forward.applyEuler(camera.rotation);
        forward.y = 0.0;

        Now.goingTo.add(forward);
      } else if (Now.keyD) {
        forward.set(1, 0, 0);
        forward.applyEuler(camera.rotation);
        forward.y = 0.0;

        Now.goingTo.add(forward);
      }

      if (!(Now.keyW || Now.keyA || Now.keyS || Now.keyD)) {
        Now.goingTo.copy(Now.avatarAt);
      }

      //
    };
    return () => {};
  }, []);

  useFrame(() => {
    Object.values(works.current).forEach((e) => e());
  });
  Now.makeKeyReactive("isUnLocked");

  let { viewport } = useThree();
  return (
    <group>
      {createPortal(
        <group
          scale={0.7}
          visible={Now.isUnLocked}
          position-y={0.5}
          position-z={-10}
        >
          <Text
            font={`/font/Cronos-Pro-Light_12448.ttf`}
            fontSize={0.5}
            position-y={0.1}
            outlineWidth={0.01}
          >
            Click the screen to begin.
          </Text>
          <group position-y={-0.5}>
            <Text
              font={`/font/Cronos-Pro-Light_12448.ttf`}
              fontSize={0.25}
              outlineWidth={0.01}
            >
              Use W A S D keyborad to move around.
            </Text>
            <Text
              position-y={-0.5}
              font={`/font/Cronos-Pro-Light_12448.ttf`}
              fontSize={0.25}
              outlineWidth={0.01}
            >
              Pan around to rotate view
            </Text>
            <Text
              position-y={-1}
              font={`/font/Cronos-Pro-Light_12448.ttf`}
              fontSize={0.2}
              outlineWidth={0.01}
            >
              Press [Esc] to show your cursor.
            </Text>
          </group>
        </group>,
        camera
      )}
    </group>
  );
}

// a
