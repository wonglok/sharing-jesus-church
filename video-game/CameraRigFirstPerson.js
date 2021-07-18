import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
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
    window.addEventListener(
      "touchstart",
      (ev) => {
        ev.preventDefault();
      },
      { passive: false }
    );

    window.addEventListener(
      "touchmove",
      (ev) => {
        ev.preventDefault();
      },
      { passive: false }
    );

    window.addEventListener(
      "touchstart",
      (ev) => {
        ev.preventDefault();
      },
      { passive: false }
    );
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
    camera.position.copy(Now.avatarAt);
    camera.position.y += 10;
    camera.position.z += 10;

    // add event listener to show/hide a UI (e.g. the game's menu)

    // camera.rotation;
    controls.addEventListener("lock", function () {
      // menu.style.display = "none";
    });

    controls.addEventListener("unlock", function () {
      // menu.style.display = "block";
    });

    gl.domElement.addEventListener("click", () => {
      controls.lock();
    });

    let forward = new Vector3();
    let up = new Vector3(0, 1, 0);
    let dir = new Vector3();
    works.current.ctrl = () => {
      camera.position.x = Now.avatarAt.x;
      camera.position.y = Now.avatarAt.y + 5;
      camera.position.z = Now.avatarAt.z;

      if (Now.isDown) {
        controls.getDirection(dir);

        dir.normalize();
        dir.y = 0;
        dir.multiplyScalar(10);

        Now.goingTo.add(dir);

        // camera.position.copy(Now.avatarAt);
        // camera.position.y += 10;
        // camera.position.z += 10;
      } else {
        Now.goingTo.copy(Now.avatarAt);
      }

      //
      //
      //
      // orbit.update();
      // orbit.target.copy(Now.goingTo);
      // orbit.target.y += 10;
      // orbit.target.z += 10;
      // if (Now.isDown && Now.camMode === "first") {
      //   let a = orbit.getAzimuthalAngle();
      //   a = a;
      //   forwad.set(0, 0, -1).applyAxisAngle(up, a);
      //   Now.avatarAt.add(forwad);
      // }
      // camera.position.lerp(
      //   {
      //     x: Now.avatarAt.x,
      //     y: Now.avatarAt.y + 10,
      //     z: Now.avatarAt.z - 10,
      //   },
      //   0.01
      // );
      // orbit.target.lerp(
      //   {
      //     x: Now.goingTo.x,
      //     y: Now.goingTo.y + 10,
      //     z: Now.goingTo.z,
      //   },
      //   0.01
      // );
      // orbit.update();
      // orbit.object.position.copy(Now.avatarAt);
      // orbit.object.lookAt(Now.goingTo);
      // orbit.target.lerp(Now.avatarAt, 0.05);
      // orbit.target.y += 1.8 / 10;
      // //
      // orbit.object.position.lerp(Now.avatarAt, 0.05);
      // orbit.object.position.y +=
      //   (300 / 30) * 0.025 * Math.pow(zoom.current, 1.5) + 1.8 / 10;
      // orbit.object.position.z +=
      //   (1000 / 30) * 0.025 * Math.pow(zoom.current, 0.9);
    };
    return () => {};
  }, []);

  useFrame(() => {
    Object.values(works.current).forEach((e) => e());
  });
  return <group></group>;
}
