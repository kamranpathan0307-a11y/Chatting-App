package com.awesomeproject

import android.content.Intent
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.modules.core.DeviceEventManagerModule

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "AwesomeProject"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

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
      // Wait for React context to be available
      reactInstanceManager
        .currentReactContext
        ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        ?.emit("OPEN_CHAT", it)
    }
  }
}
