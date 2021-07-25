import { Now } from "./Now";

export function FPCursor() {
  Now.makeKeyReactive("enableFloorCursor");
  return (
    <>
      {!Now.enableFloorCursor && (
        <>
          <div
            style={{
              position: "absolute",
              top: `calc(50% - 8px)`,
              left: `calc(50% - 1px)`,
              width: "1px",
              height: "15px",
              backgroundColor: "rgba(255,255,255,1.0)",
              backdropFilter: `inverse(100%)`,
              filter: `inverse(100%)`,
              zIndex: "100000",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              top: `calc(50% - 1px)`,
              left: `calc(50% - 8px)`,
              width: "15px",
              height: "1px",
              backgroundColor: "rgba(255,255,255,1.0)",
              backdropFilter: `inverse(100%)`,
              filter: `inverse(100%)`,
              zIndex: "100000",
            }}
          ></div>
        </>
      )}
    </>
  );
}
