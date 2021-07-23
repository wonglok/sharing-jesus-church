import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { usePinch } from "react-use-gesture";
import { Vector3 } from "three";
import { OrbitControls } from "three-stdlib";
import { Now } from "./Now";

export function CameraRig({ zoomInit = 2 }) {
  let { camera, gl } = useThree();
  let works = useRef({});
  Now.makeKeyReactive("camMode");
  let zoom = useRef(zoomInit);

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
    camera.near = 0.1;
    camera.far = 10000;
    camera.fov = 45;
    camera.updateProjectionMatrix();

    gl.domElement.addEventListener(
      "wheel",
      (ev) => {
        ev.preventDefault();

        zoom.current += ev.deltaY * 0.0005 * 5.0;
        if (zoom.current <= 0.45) {
          zoom.current -= ev.deltaY * 0.0005 * 5.0;
        }
      },
      { passive: false }
    );

    camera.position.y = 300 / 10;
    camera.position.z = 300 / 10;

    let orbit = new OrbitControls(camera, gl.domElement);
    orbit.enableRotate = false;
    orbit.enablePan = false;
    orbit.enableZoom = false;

    works.current.ctrl = () => {
      orbit.update();

      orbit.target.lerp(Now.avatarAt, 0.05);
      orbit.target.y += 1.8 / 10;

      //
      orbit.object.position.lerp(Now.avatarAt, 0.05);

      orbit.object.position.y +=
        (300 / 30) * 0.025 * Math.pow(zoom.current, 1.5) + 1.8 / 10;
      orbit.object.position.z +=
        (1000 / 30) * 0.025 * Math.pow(zoom.current, 0.9);
    };

    return () => {};
  }, []);

  useFrame(() => {
    Object.values(works.current).forEach((e) => e());
  });
  return <group></group>;
}
