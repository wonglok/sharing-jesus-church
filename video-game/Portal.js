import { Text } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { Sphere } from "three";
import { Color, DoubleSide, Vector3 } from "three";
import { enableBloom } from "../vfx-library/Bloomer";
// import { ShaderCubeChrome } from "../vfx-library/ShaderCubeChrome";
import { Now } from "./Now";
// import { lerp } from "";

export function Portal({
  bloom = false,
  magnify = 1.0,
  text = {
    ready: "Login",
    loading: "Opening Login...",
  },
  action = () => {},
  zone = {
    x: 0,
    y: 25 + 3,
    z: -80,
  },
}) {
  let { gl } = useThree();

  // Login Zone
  // {x: 98.95287541944776, y: 4.206666727900821e-15, z: 0.668955153139894}

  const ring1 = useRef();
  const ring2 = useRef();
  const ring3 = useRef();
  let pt = new Vector3().copy(zone);

  useEffect(() => {
    if (bloom) {
      enableBloom(ring1.current);
      enableBloom(ring2.current);
      enableBloom(ring3.current);

      ring1.current.material.color = new Color("#444444");
      ring2.current.material.color = new Color("#444444");
      ring3.current.material.color = new Color("#444444");
    }
  }, []);

  useFrame((st, dt) => {
    if (ring1.current) {
      ring1.current.getWorldPosition(pt);
    }

    if (ring1.current) {
      ring1.current.rotation.x += dt * 1;
      ring1.current.rotation.y += dt * 1;
      ring1.current.rotation.z += dt * 1;
    }
    if (ring2.current) {
      ring2.current.rotation.x += dt * 1;
      ring2.current.rotation.y += dt * 1;
      ring2.current.rotation.z += dt * 1;
    }
    if (ring3.current) {
      ring3.current.rotation.x += dt * 1;
      ring3.current.rotation.y += dt * 1;
      ring3.current.rotation.z += dt * 1;
    }
  });

  return (
    <group position-y={5.5}>
      <group position-x={zone.x} position-y={zone.y} position-z={zone.z}>
        <CountDownText
          ring={ring3}
          pt={pt}
          text={text}
          action={action}
          magnify={magnify}
        ></CountDownText>

        <mesh castShadow={true} ref={ring3}>
          <torusGeometry args={[25 * 0.15, 1.5 * 0.15, 16, 50]}></torusGeometry>
          <meshLambertMaterial color="#ffffff"></meshLambertMaterial>

          <mesh castShadow={true} ref={ring2} scale={0.8}>
            <torusGeometry
              args={[25 * 0.15, 1.5 * 0.15, 16, 50]}
            ></torusGeometry>

            <meshLambertMaterial color="#ffffff"></meshLambertMaterial>

            <mesh castShadow={true} ref={ring1} scale={0.8}>
              <torusGeometry
                args={[25 * 0.15, 1.5 * 0.15, 16, 50]}
              ></torusGeometry>

              <meshLambertMaterial color="#ffffff"></meshLambertMaterial>
            </mesh>
          </mesh>
        </mesh>
      </group>
    </group>
  );
}

function CountDownText({
  pt,

  ring,
  magnify = 1.0,
  text = {
    ready: "Login",
    loading: "Opening Login...",
  },
  action = () => {
    console.log("action");
  },
}) {
  let [label, setLabel] = useState(text.ready);
  let ticker = useRef(0);
  let total = 60 * 3;
  let sphere = new Sphere(pt, 10);

  // Hand.useChangeKey("overlay", () => {
  //   ticker.current = 0;
  // });

  let lerp = require("three/src/math/MathUtils").lerp;

  let did = useRef(false);
  let charge = useRef(false);
  useFrame(() => {
    sphere.center.copy(pt);
    if (sphere.containsPoint(Now.avatarAt)) {
      ticker.current = ticker.current || 0;

      ticker.current += 1;

      if (label !== text.loading) {
        setLabel(text.loading);
        // getVoicesAPI().charge.play();
      }

      if (!charge.current) {
        charge.current = true;
      }

      if (ticker.current >= total) {
        if (!did.current) {
          did.current = true;

          if (typeof action === "function") {
            action({ setLabel });
          }
          // getVoicesAPI().teleport.play();
        }
      }
    } else {
      ticker.current = 0;
      did.current = false;
      charge.current = false;

      if (label !== text.ready) {
        setLabel(text.ready);
      }
      //
    }

    if (ring.current) {
      let s = 1 + (ticker.current / total) * 10.0 * magnify;
      let cs = ring.current.scale.x;
      let ls = lerp(cs, s, 0.1);
      ring.current.scale.set(ls, ls, ls);
    }
  });

  return (
    <Text
      position-y={5 * 0.8 * 1.5}
      scale={80 * 2 * 0.2 * 0.5}
      font={`/font/Cronos-Pro-Light_12448.ttf`}
      color={"#ffffff"}
      outlineWidth={0.001}
      outlineColor={"#000000"}
      //
    >
      {label}
    </Text>
  );
}
