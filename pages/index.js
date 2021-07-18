import { useEffect } from "react";

export default function Page() {
  useEffect(() => {
    window.location.assign("/login");
  });

  return <div></div>;
}
