import { Vector3 } from "three";
import { makeShallowStore } from "../vfx-runtime/ENUtils";

export const Now = makeShallowStore({
  //
  isUnLocked: true,
  enableFloorCursor: true,
  keyW: false,
  keyA: false,
  keyS: false,
  keyD: false,

  speed: 1.0,

  moved: 0,
  isDown: false,
  goingTo: new Vector3(),
  camAt: new Vector3(),
  avatarAt: new Vector3(),
  avatarHead: new Vector3(),
  avatarRot: new Vector3(),
  avatarFaceLook: new Vector3(),
  avatarLoading: true,
  avatarMode: "standing",

  // avatarAtPhy: new Vector3(),

  camMode: "auto",
  // camMode: "first",

  overlay: "",

  profile: false,
  user: false,

  reload: [],
  onlineUID: [],
});
