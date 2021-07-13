import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { usePinch } from "react-use-gesture";
import { Vector3 } from "three";
import { OrbitControls } from "three-stdlib";
import { Now } from "./Now";

export function CameraRigOrbitBirdView() {
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
      },
      { passive: false }
    );

    camera.position
      .copy({
        x: 0,
        y: 3,
        z: 15,
      })
      .multiplyScalar(2 * 3);

    camera.lookAt(0, 0, 0);

    let orbit = new OrbitControls(camera, gl.domElement);
    orbit.enableRotate = false;
    orbit.enablePan = false;
    orbit.enableZoom = false;

    let orbitAt = new Vector3();

    works.current.ctrl = () => {
      orbit.update();

      // let pos = nowAt.sub(origin).normalize().multiplyScalar(50);

      orbit.target.lerp(Now.avatarAt, 0.1);

      orbitAt.copy(Now.avatarAt);

      let zoomer = Math.pow(zoom.current, 0.9);

      //
      orbitAt.x *= 0.75 + zoomer;
      orbitAt.z *= 0.75 + zoomer;
      orbitAt.y += 28 / zoomer;

      orbit.object.position.lerp(orbitAt, 0.1);

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
    return () => {};
  }, []);

  useFrame(() => {
    Object.values(works.current).forEach((e) => e());
  });
  return <group></group>;
}
