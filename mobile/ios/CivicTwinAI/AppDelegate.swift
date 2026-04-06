import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Firebase
import FirebaseMessaging
import UserNotifications

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Cấu hình Firebase
    FirebaseApp.configure()
    
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "CivicTwinAI",
      in: window,
      launchOptions: launchOptions
    )
    
    // Thiết lập delegate cho thông báo
    UNUserNotificationCenter.current().delegate = self
    
    // Đăng ký nhận thông báo từ xa
    application.registerForRemoteNotifications()
    
    return true
  }
  
  // Bắt buộc gán APNs token cho FCM khi tự implement didRegister... (tránh token FCM “ảo” / không nhận push)
  func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    Messaging.messaging().apnsToken = deviceToken
    print("APNs device token đã gán cho Firebase Messaging")
  }
  
  // Xử lý khi đăng ký thông báo từ xa thất bại
  func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    print("Lỗi khi đăng ký thông báo từ xa: \(error.localizedDescription)")
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}

// MARK: - UNUserNotificationCenterDelegate
extension AppDelegate {
  // Xử lý thông báo khi app đang chạy ở foreground
  func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    let userInfo = notification.request.content.userInfo

    // Bắt buộc: gán delegate = self đã thay Firebase/RN — phải báo cho FCM thì @react-native-firebase/messaging onMessage (JS) mới nhận khi app foreground
    Messaging.messaging().appDidReceiveMessage(userInfo)

    print("Thông báo nhận được ở foreground: \(userInfo)")

    if #available(iOS 14.0, *) {
      completionHandler([[.banner, .sound, .badge]])
    } else {
      completionHandler([[.alert, .sound, .badge]])
    }
  }

  // Xử lý khi người dùng nhấp vào thông báo
  func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
    let userInfo = response.notification.request.content.userInfo

    Messaging.messaging().appDidReceiveMessage(userInfo)

    print("Người dùng nhấp vào thông báo: \(userInfo)")

    completionHandler()
  }
}
