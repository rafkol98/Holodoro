// Create a new firebaseui.auth instance.
const ui = new firebaseui.auth.AuthUI(firebase.auth())

// These are our configurations.
const uiConfig = {
  callbacks: {
    signInSuccessWithAuthResult(authResult, redirectUrl) {
      return true
    },
    uiShown() {
      document.getElementById("loader").style.display = "none"
    },
  },
  signInFlow: "popup",
  signInSuccessUrl: "./setup.html",
  signInOptions: [
    firebase.auth.EmailAuthProvider.PROVIDER_ID,
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
  ],
}
ui.start("#firebaseui-auth-container", uiConfig)