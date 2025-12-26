// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  const Animated = require('react-native').Animated;

  return {
    default: {
      View: Animated.View,
      ScrollView: require('react-native').ScrollView,
      createAnimatedComponent: component => component,
    },
    View: Animated.View,
    ScrollView: require('react-native').ScrollView,
    useSharedValue: jest.fn(value => ({ value })),
    useAnimatedStyle: jest.fn(callback => ({})),
    withSpring: jest.fn(value => value),
    withTiming: jest.fn((value, config, callback) => {
      if (callback) callback();
      return value;
    }),
    runOnJS: jest.fn(callback => callback),
    Easing: {
      bezier: jest.fn(() => {}),
      ease: jest.fn(() => {}),
      elastic: jest.fn(() => {}),
      linear: jest.fn(() => {}),
      quad: jest.fn(() => {}),
      sin: jest.fn(() => {}),
    },
  };
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: require('react-native').ScrollView,
    Slider: require('react-native').View,
    Switch: require('react-native').Switch,
    TextInput: require('react-native').TextInput,
    ToolbarAndroid: require('react-native').View,
    ViewPagerAndroid: require('react-native').View,
    DrawerLayoutAndroid: require('react-native').View,
    WebView: require('react-native').View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: require('react-native').FlatList,
    gestureHandlerRootHOC: jest.fn(component => component),
    Directions: {},
  };
});

// Mock react-native-svg
jest.mock('react-native-svg', () => {
  const React = require('react');
  const View = require('react-native').View;

  return {
    default: View,
    Svg: View,
    Circle: View,
    Ellipse: View,
    G: View,
    Text: View,
    TSpan: View,
    TextPath: View,
    Path: View,
    Polygon: View,
    Polyline: View,
    Line: View,
    Rect: View,
    Use: View,
    Image: View,
    Symbol: View,
    Defs: View,
    LinearGradient: View,
    RadialGradient: View,
    Stop: View,
    ClipPath: View,
    Pattern: View,
    Mask: View,
  };
});
