import { useCubeTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
// import { CubeRefractionMapping } from "three";

export function CubeMap({ path = "/cubemaps/lake/", type = "png" }) {
  let list = ["px", "nx", "py", "ny", "pz", "nz"].map((e) => `${e}.${type}`);
  const cubeMap = useCubeTexture(list, { path });

  let { get } = useThree();
  useEffect(() => {
    get().scene.background = cubeMap;
    get().scene.environment = cubeMap;

    return () => {
      get().scene.background = null;
      get().scene.environment = null;
    };
  }, []);
  return <group></group>;
}
