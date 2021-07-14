import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB-tfIbfq6okbv1tYReo585t_r4zFvf-rI",
  authDomain: "effectnode.firebaseapp.com",
  databaseURL: "https://sharing-jesus-church.firebaseio.com/",
  projectId: "effectnode",
  storageBucket: "gs://sharing-jesus",
  messagingSenderId: "316567530740",
  appId: "1:316567530740:web:765ff986a897b0e05242a1",
};

export { firebase };

export const getFire = () => {
  setup();
  return firebase;
};

export const FireCache = new Map();
export function setup() {
  if (!FireCache.has("app")) {
    FireCache.set("app", firebase.initializeApp(firebaseConfig));
  }

  if (!FireCache.has("database")) {
    FireCache.set("database", firebase.database());
  }

  if (!FireCache.has("setup-listen-login")) {
    FireCache.set("setup-listen-login", true);
    FireCache.get("app")
      .auth()
      .onAuthStateChanged((user) => {
        if (user) {
          // User is signed in, see docs for a list of available properties
          // https://firebase.google.com/docs/reference/js/firebase.User
          FireCache.set("user", user);
          // ...
        } else {
          // User is signed out
          // ...
          FireCache.delete("user");
        }
      });
  }
  if (!FireCache.has("setup-do-login")) {
    FireCache.set("setup-do-login", true);

    // FireCache.get("app")
    //   .auth()
    //   .signInAnonymously()
    //   .then((singin) => {
    //     // Signed in..
    //     FireCache.set("user", singin.user);
    //   })
    //   .catch((error) => {
    //     var errorCode = error.code;
    //     var errorMessage = error.message;
    //     // ...
    //     console.log(errorCode, errorMessage);

    //     return Promise.reject(new Error(errorMessage));
    //   });
  }

  return FireCache.get("app");
}

export const onReady = () => {
  setup();
  return new Promise((resolve) => {
    let tt = setInterval(() => {
      if (FireCache.has("user")) {
        clearInterval(tt);
        resolve({
          firebase,
          user: FireCache.get("user"),
          fire: FireCache.get("app"),
          db: FireCache.get("database"),
          logout: () => {
            return FireCache.get("app").auth().signOut();
          },
        });
      }
    });
  });
};

export const loginGuest = async () => {
  return firebase.auth().signInAnonymously();
};

export const loginGoogle = () => {
  var provider = new firebase.auth.GoogleAuthProvider();

  return firebase.auth().signInWithPopup(provider);
};
