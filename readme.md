# RiggingTips

The project "RiggingTips" a web page designed to showcase and save different tips for rigging in the animation industry. It utilizes a Firebase database to store the information. The project provides a template for others to create their own rigging projects and share tips with their friends in productions and studios.

## Getting Started

Test how it works.
[Link to the Demo webpage](https://pabloemmanueldeleo.github.io/RiggingTips/)

Show and save different tips for rigging through a web page for the rigging community.
You can use this project as a template for your own project to get started and use for all your friends in productions and studios.

### Prerequisites

I used the Firebase database to store the information, and you need to set up Firebase for the project to work correctly. Follow the steps below:

1. Create a Firebase project: [Firebase Console](https://console.firebase.google.com/)
2. Create a web app in the Firebase project.
3. Copy the Firebase configuration object from your project settings.
4. Create a file named `config.js` in your project and paste the configuration object as shown below:

```javascript
// Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
```