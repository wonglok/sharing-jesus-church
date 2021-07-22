import { useEffect } from "react";
import { getFire } from "../video-game/AppFirebase";
import router from "next/router";
export default function Page() {
  useEffect(() => {
    let clean = getFire()
      .auth()
      .onAuthStateChanged((s) => {
        if (s && s.uid) {
          router.push("/room/heavenly");
        } else {
          router.push("/login");
        }
      });
    return () => {
      clean();
    };
  });

  return <div></div>;
}
