# 📱 WhatsApp-like Contact Integration

This document explains how the contact integration works in your React Native chat app, allowing users to open chats directly from their Android contacts.

## 🎯 How It Works

1. **User opens Android Contacts app**
2. **Taps on a contact's phone number or "Message" button**
3. **Selects your app from the list**
4. **App opens directly to chat with that contact**

## 🔧 Implementation Overview

### Android Manifest Configuration

The app registers itself as a messaging option through intent filters in `AndroidManifest.xml`:

```xml
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
```

### Native Android Handler

`MainActivity.kt` handles incoming intents and extracts phone numbers:

```kotlin
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
```

### React Native Integration

The app listens for contact intents and navigates to the chat screen:

```javascript
// App.jsx
useEffect(() => {
  const subscription = listenForContactIntent(phoneNumber => {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    navigationRef.current.navigate('IndividualChat', {
      phoneNumber: normalizedPhone,
      chatName: normalizedPhone,
      fromContactIntent: true,
    });
  });
  return () => subscription?.remove();
}, []);
```

### Phone Number Resolution

When a chat is opened via phone number:

1. **Normalize the phone number** (remove formatting)
2. **Look up the user** in your backend by phone number
3. **Create or get existing chat** between users
4. **Navigate to chat screen** with proper context

## 🔍 Key Features

### ✅ No Permissions Required

- Uses Android's built-in intent system
- No need to request contacts permission
- No syncing or storing contacts locally

### ✅ Smart Phone Number Matching

- Handles different phone number formats
- Normalizes numbers for consistent matching
- Supports international numbers

### ✅ User Experience

- Shows loading state while resolving phone number
- Handles unregistered users gracefully
- Provides invite functionality for non-users

### ✅ WhatsApp-like Behavior

- Appears in contacts "Message" options
- Direct navigation to chat
- Seamless integration with existing chat system

## 📁 File Structure

```
AwesomeProject/
├── android/app/src/main/
│   ├── AndroidManifest.xml          # Intent filters
│   └── java/com/awesomeproject/
│       └── MainActivity.kt          # Intent handling
├── src/
│   ├── native/
│   │   └── ContactIntent.ts         # Event listener
│   ├── utils/
│   │   └── phoneUtils.js           # Phone number utilities
│   └── screens/
│       └── IndividualChatScreen.js  # Enhanced chat screen
└── App.jsx                         # Main app with listener

ChatBackend/
├── controllers/
│   └── chatController.js           # Phone-based chat creation
└── routes/
    └── chatRoutes.js              # New /by-phone endpoint
```

## 🚀 Testing

### Manual Testing

1. Install the app on Android device
2. Open Contacts app
3. Find any contact with a phone number
4. Tap the phone number or "Message" button
5. Select your app from the list
6. Verify it opens the chat screen

### Automated Testing

Run the phone utils tests:

```bash
npm test -- phoneUtils.test.js
```

## 🔧 Configuration

### Backend Setup

Ensure your backend has the new phone-based chat endpoint:

```javascript
// POST /api/chats/by-phone
{
  "phoneNumber": "+1234567890"
}
```

### Phone Number Format Support

The system supports various formats:

- `(555) 123-4567`
- `+1 555 123 4567`
- `555.123.4567`
- `5551234567`

## 🎨 Customization

### Invite Non-Users

Modify the invite functionality in `IndividualChatScreen.js`:

```javascript
{
  text: 'Invite',
  onPress: () => {
    // Implement your invite logic here
    // Could open SMS, email, or share dialog
  }
}
```

### Phone Number Display

Customize formatting in `phoneUtils.js`:

```javascript
export const formatPhoneNumber = phone => {
  // Add your custom formatting logic
};
```

## 🐛 Troubleshooting

### App Not Appearing in Contacts

- Check AndroidManifest.xml intent filters
- Verify app is installed and not disabled
- Test with different contact apps

### Phone Number Not Resolving

- Check backend `/by-phone` endpoint
- Verify phone number normalization
- Check user registration in database

### Navigation Issues

- Ensure navigation ref is properly set
- Check route parameters match screen expectations
- Verify navigation timing (use setTimeout if needed)

## 🔒 Security Considerations

- Phone numbers are normalized before backend lookup
- No contacts data is stored locally
- Uses secure HTTPS API calls
- Validates phone number format before processing

## 📈 Future Enhancements

- **Contact Sync**: Optional contact syncing for better UX
- **Group Chats**: Support for group messaging from contacts
- **Rich Invites**: Send app download links to non-users
- **Contact Cards**: Show contact info in chat headers
- **Favorites**: Quick access to frequently contacted users
