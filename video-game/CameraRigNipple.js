import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { usePinch } from "react-use-gesture";
import { Camera, Vector3 } from "three";
import { OrbitControls } from "three-stdlib";
import { Now } from "./Now";

export function CameraRigNipple() {
  let { camera, gl } = useThree();
  let works = useRef({});
  Now.makeKeyReactive("camMode");
  let zoom = useRef(1);

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
    orbit.rotateSpeed = 0.1;

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
    `;
    let nipplejs = require("nipplejs");
    var manager = nipplejs.create({
      zone: joystick,
      color: "white",
      mode: "static",
      position: { left: "60px", bottom: "60px" },
    });

    let forward = new Vector3(0, 0, 0);
    let up = new Vector3(0, 1, 0);

    manager.on("start move end dir plain", function (evt, nipple) {
      if (nipple?.angle?.radian) {
        forward.set(0, 0, -1);
        forward.applyAxisAngle(
          up,
          nipple?.angle?.radian - Math.PI * 0.5 || 0.0
        );
        Now.isDown = true;
      }
    });
    manager.on("end", () => {
      forward.multiplyScalar(0);
      Now.isDown = false;
    });

    works.current.ctrl = () => {
      orbit.update();

      Now.goingTo.add(forward);

      camera.position.x = Now.avatarAt.x;
      camera.position.y = Now.avatarAt.y + 10;
      camera.position.z = Now.avatarAt.z;

      camera.rotation.copy(fakeCam.rotation);

      // orbit.object.position.copy(Now.avatarAt);
      // orbit.object.position.y += 15;
      // orbit.target.copy(Now.avatarAt);
      // orbit.target.y += 15;
      // Now.goingTo.add(forward);
      // camera.position.copy(Now.avatarAt);
      // camera.position.y += 15;
      // orbit.update();
      // // let pos = nowAt.sub(origin).normalize().multiplyScalar(50);
      // orbit.target.lerp(Now.avatarAt, 0.1);
      // orbitAt.copy(Now.avatarAt);
      // let zoomer = Math.pow(zoom.current, 0.9);
      // //
      // orbitAt.x *= 0.75 + zoomer;
      // orbitAt.z *= 0.75 + zoomer;
      // orbitAt.y += 8 - 2 / zoomer;
      // orbit.object.position.lerp(orbitAt, 0.1);
      // camera.lookAt(0, Now.avatarAt.y + 30, 0);
      // orbit.object.lookAt({ x: 0, y: Now.avatarAt.y, z: 0 });
      // let sub = new Vector3();
      // sub.copy(Now.avatarAt).sub({ x: 0, y: Now.avatarAt.y, z: 0 }).normalize();
      // orbit.object.position.y = Now.avatarAt.y + 5;
      // orbit.object.lookAt(Now.avatarAt);
      // orbit.object.position.lerp(sub.multiply(1), 0.05);
      // orbit.object.position.y +=
      //   (300 / 30) * 0.025 * Math.pow(zoom.current, 1);
      // orbit.object.position.z +=
      //   (1000 / 30) * 0.025 * Math.pow(zoom.current, 0.9);
    };

    Now.enableFloorCursor = false;
    return () => {
      Now.enableFloorCursor = true;
      manager.off("start move end dir plain");
      manager.destroy();
      document.body.removeChild(joystick);
    };
  }, []);

  useFrame(() => {
    Object.values(works.current).forEach((e) => e());
  });
  return <group></group>;
}
