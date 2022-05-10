/**
 * Convert seconds to hours.
 */
function converrtSecondsToHours(secondsFocused) {
	return Math.floor(secondsFocused / 3600);
}

/**
 * Setup firebase.
 */
function setupFirebase() {
    // Configuration of firebase.
    const firebaseConfig = {
      apiKey: "AIzaSyDp73X5Dv95oRglSHSbsdeC67iykPH0bx8",
      authDomain: "holodoro-4d629.firebaseapp.com",
      databaseURL: "https://holodoro-4d629-default-rtdb.firebaseio.com",
      projectId: "holodoro-4d629",
      storageBucket: "holodoro-4d629.appspot.com",
      messagingSenderId: "644743674668",
      appId: "1:644743674668:web:399d42bfa528290a6dca89",
      measurementId: "G-FW5WR4HL00"
    };
  
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        userLoggedIn = true;
        // User logged in already or has just logged in.
        console.log(user.uid);
        userID = user.uid;
  
        // Read DB.
        readDB();
      }
    });
  }


/**
 * Reduce the credit whenever the user uses the water command.
 */
function reduceCredit() {
  ref = database.ref('users').child(userID)

  credit = credit - 1;
  ref.child('credit').set(credit);
}