import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import {
  Mesh,
  PCFSoftShadowMap,
  PlaneGeometry,
  PointLight,
  ShadowMaterial,
} from "three";

export function LightExpress({ lightPosition = [0, 150, 10] }) {
  let ref = useRef();
  let { get } = useThree();
  useEffect(() => {
    get().gl.shadowMap.enabled = true;
    get().gl.shadowMap.type = PCFSoftShadowMap;

    //Create a PointLight and turn on shadows for the light
    const light = new PointLight(0xffffff, 1, 2000);
    light.position.fromArray(lightPosition);
    light.castShadow = true; // default false
    ref.current.add(light);

    //Set up shadow properties for the light
    light.shadow.mapSize.width = 512; // default
    light.shadow.mapSize.height = 512; // default
    light.shadow.camera.near = 0.5; // default
    light.shadow.camera.far = 1024; // default

    return () => {
      if (ref.current) {
        ref.current.remove(light);
      }
    };
  }, [lightPosition]);

  return <group ref={ref}></group>;
}

export function ShadowFloor({ position = [0, -2.0 + 0.1, 0] }) {
  let { gl, scene } = useThree();
  let ref = useRef();

  useEffect(() => {
    let renderer = gl;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
  }, []);

  useEffect(() => {
    const geometry = new PlaneGeometry(2000, 2000);
    geometry.rotateX(-Math.PI / 2);

    const material = new ShadowMaterial();
    material.opacity = 0.2;

    const plane = new Mesh(geometry, material);
    plane.position.fromArray(position);
    plane.receiveShadow = true;
    scene.add(plane);

    return () => {
      scene.remove(plane);
    };
  }, [position]);

  return (
    <group>
      <group ref={ref}></group>
    </group>
  );
}
