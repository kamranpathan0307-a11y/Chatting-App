📱 React Native Android
Contacts → Direct Chat Integration (Documentation)
🎯 Objective

Enable users to:

Open Android Contacts

Tap Message

Select your React Native app

Open chat directly with the contact’s phone number

✔ No Contacts permission
✔ No syncing contacts
✔ Uses Android’s official intent system

🧱 High-Level Flow
Contacts App
   ↓
Intent (tel: / smsto:)
   ↓
MainActivity (Android Native)
   ↓
Emit Event to React Native
   ↓
Navigate to Chat Screen

📁 Project Structure (Android Side)
android/
└── app/
    └── src/main/
        ├── AndroidManifest.xml
        └── java/com/yourapp/
            └── MainActivity.kt

1️⃣ AndroidManifest.xml
Register Your App as a Messaging Option

📍 android/app/src/main/AndroidManifest.xml

<activity
    android:name=".MainActivity"
    android:launchMode="singleTask"
    android:exported="true"
    android:configChanges="keyboard|keyboardHidden|orientation|screenSize">

    <!-- Message option in Contacts -->
    <intent-filter>
        <action android:name="android.intent.action.SENDTO" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="smsto" />
    </intent-filter>

    <!-- Phone number tap -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="tel" />
    </intent-filter>

</activity>

✅ Result

Your app automatically appears in:

Contacts → Message → Select App

2️⃣ Handle Incoming Intents (Kotlin)

📍 android/app/src/main/java/com/yourapp/MainActivity.kt

import android.content.Intent
import com.facebook.react.ReactActivity
import com.facebook.react.modules.core.DeviceEventManagerModule

class MainActivity : ReactActivity() {

    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        super.onCreate(savedInstanceState)
        handleIncomingIntent(intent)
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        handleIncomingIntent(intent)
    }

    private fun handleIncomingIntent(intent: Intent?) {
        val data = intent?.data ?: return

        val phoneNumber = when (data.scheme) {
            "tel" -> data.schemeSpecificPart
            "smsto" -> data.schemeSpecificPart
            else -> null
        }

        phoneNumber?.let {
            reactInstanceManager
                .currentReactContext
                ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit("OPEN_CHAT", it)
        }
    }

    override fun getMainComponentName(): String {
        return "YourAppName"
    }
}

🔍 What This Does

Extracts phone number from tel: / smsto:

Sends it to React Native as an event

3️⃣ React Native Event Listener

📍 src/native/ContactIntent.ts

import { NativeEventEmitter, NativeModules } from 'react-native';

const emitter = new NativeEventEmitter(
  NativeModules.DeviceEventManagerModule
);

export const listenForContactIntent = (
  callback: (phoneNumber: string) => void
) => {
  emitter.addListener('OPEN_CHAT', callback);
};

4️⃣ Register Listener in App Root

📍 App.tsx

import { useEffect } from 'react';
import { listenForContactIntent } from './src/native/ContactIntent';

export default function App() {

  useEffect(() => {
    listenForContactIntent((phoneNumber) => {
      console.log('Opening chat with:', phoneNumber);
      navigation.navigate('Chat', { phoneNumber });
    });
  }, []);

  return <NavigationContainer>{/* Screens */}</NavigationContainer>;
}

5️⃣ Chat Screen Example

📍 src/screens/ChatScreen.tsx

const ChatScreen = ({ route }) => {
  const { phoneNumber } = route.params;

  useEffect(() => {
    openChatSession(phoneNumber);
  }, []);

  return <ChatUI phone={phoneNumber} />;
};

🔐 Best Practices
Phone Number Normalization
const normalize = (phone: string) =>
  phone.replace(/[^0-9+]/g, '');

Verify User Before Chat

Check phone exists in backend

Otherwise show Invite to App