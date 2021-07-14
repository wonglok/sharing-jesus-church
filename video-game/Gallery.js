import { useEffect, useRef, useState } from "react";
import { getID, makeShallowStore } from "../vfx-runtime/ENUtils";
import { getFire } from "./AppFirebase";

export const CState = makeShallowStore({
  refreshGallery: 0,
  panel: ``,
});

// export function getPanelHeight() {
//   if (typeof window === "undefined") {
//     return 275;
//   }
//   let h = window.innerHeight * 0.25;
//   if (h > 275) {
//     h = 275;
//   }
//   return h;
// }

export const getURLByRefURL = async (refURL) => {
  let fireRef = getFire().storage().ref(refURL);
  return await fireRef.getDownloadURL();
};

export function Gallery({ onPick = () => {} }) {
  return (
    <div
      className="absolute left-0 top-0 w-full overflow-scroll bg-yellow-100"
      style={{
        height: `calc(100%)`,
      }}
    >
      <div className="realative w-full h-12 flex justify-start items-center pl-3 text-lg">
        Gallery <div className="mx-3"> / </div>
        <UploadButton></UploadButton>
        {/*  */}
        <div className=" absolute top-0 right-0 m-3">
          <svg
            width="24"
            height="24"
            xmlns="http://www.w3.org/2000/svg"
            fillRule="evenodd"
            clipRule="evenodd"
            onClick={() => {
              CState.panel = "";
            }}
          >
            <path d="M12 11.293l10.293-10.293.707.707-10.293 10.293 10.293 10.293-.707.707-10.293-10.293-10.293 10.293-.707-.707 10.293-10.293-10.293-10.293.707-.707 10.293 10.293z" />
          </svg>
        </div>
      </div>
      <div className="w-full border-b border-black"></div>
      <GalleryItems onPick={onPick}></GalleryItems>
    </div>
  );
}

function GalleryItems({ onPick = () => {} }) {
  //
  CState.makeKeyReactive("refreshGallery");

  let [gallery, setGallery] = useState([]);
  useEffect(() => {
    let uid = getFire().auth().currentUser?.uid;
    if (uid) {
      let fireRef = getFire().storage().ref(`/avatars/${uid}/`);
      fireRef.listAll().then((res) => {
        let allItems = res.items.map((itemRef) => {
          return new Promise(async (resolve) => {
            let itemURL = await itemRef.getDownloadURL();
            // let meta = await itemRef.getMetadata();

            resolve({
              key: itemRef.name,
              itemURL,
              refURL: `/avatars/${uid}/${itemRef.name}`,
            });
          });
        });
        Promise.all(allItems).then((v) => {
          setGallery(v);
        });
      });
    }
  }, [CState.refreshGallery]);

  return (
    <div>
      {gallery.map((e) => {
        return (
          <GalleryOneItem key={e.key} data={e} onPick={onPick}></GalleryOneItem>
        );
      })}
    </div>
  );
}

function GalleryOneItem({ data = {}, onPick = () => {} }) {
  //

  return (
    <div className="inline-block hover:bg-yellow-300 cursor-pointer  p-2 m-2 ">
      <img className="h-32 w-32 object-contain" src={data.itemURL} />

      <div
        onClick={() => {
          onPick({ data });
        }}
        className="m-1 mt-2 p-1 px-3 rounded-full text-sm inline-flex items-center justify-center bg-white hover:bg-yellow-500"
      >
        Pick
      </div>

      <div
        onClick={() => {
          //
          if (window.confirm("remove image?")) {
            //
            //

            let uid = getFire().auth().currentUser?.uid;
            if (uid) {
              let fireRef = getFire().storage().ref(`/avatars/${uid}/`);
              fireRef
                .child(data.key)
                .delete()
                .then(() => {
                  CState.refreshGallery++;
                });
            }
          }
        }}
        className="m-1 mt-2 p-1 px-3 rounded-full text-sm inline-flex items-center justify-center bg-red-100 hover:bg-red-500"
      >
        Remove
      </div>
    </div>
  );
}

function UploadButton() {
  let ref = useRef();
  let [txt, setTxt] = useState("");

  let left = false;

  useEffect(() => {
    return () => {
      left = true;
    };
  });
  return (
    <>
      <input className="hidden" ref={ref} type="file"></input>
      <button
        className="inline-block underline text-sm"
        onClick={() => {
          //
          ref.current.onchange = (ev) => {
            let files = ev.target.files;
            //
            let first = files[0];
            if (first) {
              //
              if (!left) {
                setTxt("resizing....");
              }
              let Pica = require("pica");

              const pica = new Pica({
                tile: 512,
              });

              // Resize from Canvas/Image to another Canvas
              let to = document.createElement("canvas");

              let img = document.createElement("img");
              img.src = URL.createObjectURL(first);
              img.onload = () => {
                let a = img.width / img.height;

                if (a >= 1) {
                  to.width = 512;
                  to.height = 512 / a;
                } else {
                  to.width = 512 * a;
                  to.height = 512;
                }

                pica
                  .resize(img, to, {
                    alpha: true,
                    // - //

                    //

                    // unsharpAmount: 160,
                    // unsharpRadius: 0.6,
                    // unsharpThreshold: 1

                    //
                  })
                  .then((result) => pica.toBlob(result, "image/jpeg", 0.9))
                  .then((blob) => {
                    //
                    if (!left) {
                      setTxt("uploading....");
                    }

                    console.log("resized to canvas & created blob!");

                    let uid = getFire().auth().currentUser?.uid;
                    if (uid) {
                      let fireRef = getFire().storage().ref(`/avatars/${uid}/`);
                      fireRef
                        .child(getID())
                        .put(blob)
                        .then((snap) => {
                          CState.refreshGallery++;
                          console.log("Uploaded a blob or file!");
                          setTxt("reloading....");

                          setTimeout(() => {
                            if (!left) {
                              setTxt("");
                            }
                          }, 1000);
                        });
                    }

                    //
                  });
              };
            }
          };
          ref.current.click();
        }}
      >
        Upload Texture {txt}
      </button>
    </>
  );
}
