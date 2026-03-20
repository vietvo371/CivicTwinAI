# Mobile — React Native CLI

> Citizen App + Emergency Services App

## Apps

| App | Actor | Chức năng |
|-----|-------|-----------|
| **Citizen** | Người dân | Báo cáo sự cố, nhận cảnh báo push, xem traffic map |
| **Emergency** | Cứu hộ | Request priority route, navigation realtime |

## Setup

```bash
npm install

# iOS
cd ios && pod install && cd ..
npx react-native run-ios

# Android
npx react-native run-android
```

## Cấu trúc

```
mobile/
├── src/
│   ├── screens/
│   ├── components/
│   ├── navigation/
│   ├── hooks/
│   ├── services/
│   ├── stores/
│   └── types/
├── android/
├── ios/
└── package.json
```
