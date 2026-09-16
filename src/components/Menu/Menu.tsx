import {
  Blur,
  Canvas,
  Group,
  Paint,
  Path,
  Skia,
  SkPoint,
} from "@shopify/react-native-skia";
import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  clamp,
  FadeInLeft,
  FadeOutLeft,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import {
  Lucide,
  type LucideIconName,
} from "@react-native-vector-icons/lucide/static";

const DRAWER_WIDTH_RATIO = 3 / 4;
const MENU_COLOR = "teal";
const SHADOW_BLUR = 10;
const DRAG_CLAMP = 10;
const SWIPE_THRESHOLD = 100;
const TAP_DURATION_MS = 130;

type MenuProps = {
  items: {
    label: string;
    iconName: LucideIconName;
  }[];
};

const Menu = ({ items }: MenuProps) => {
  const { width, height } = useWindowDimensions();
  const drawerWidth = width * DRAWER_WIDTH_RATIO;

  const controlPointPos = useSharedValue<SkPoint>({ x: 0, y: 0 });
  const startPoint = useSharedValue<SkPoint>({ x: 0, y: 0 });
  const endPoint = useSharedValue<SkPoint>({ x: 0, y: height });
  const isMenuOpen = useSharedValue(false);

  type AnimPoint = SkPoint & Record<string, number>;
  const startTarget = (open: boolean): AnimPoint => {
    "worklet";
    return { x: open ? drawerWidth : 0, y: 0 };
  };
  const endTarget = (open: boolean): AnimPoint => {
    "worklet";
    return { x: open ? drawerWidth : 0, y: height };
  };
  const controlTarget = (open: boolean): AnimPoint => {
    "worklet";
    return open ? { x: drawerWidth, y: height / 2 } : { x: 0, y: 0 };
  };
  const [isActive, setIsActive] = useState(false);
  const { top: topInset } = useSafeAreaInsets();

  useAnimatedReaction(
    () => isMenuOpen.value,
    (open) => {
      startPoint.set(withSpring(startTarget(open)));
      endPoint.set(withSpring(endTarget(open)));
      controlPointPos.set(withSpring(controlTarget(open)));
      scheduleOnRN(setIsActive, open);
    },
  );

  const pan = usePanGesture({
    minDistance: 20,
    maxPointers: 1,
    onActivate: ({ x, y }) => {
      cancelAnimation(controlPointPos);
      controlPointPos.set(
        withTiming(
          {
            x: clamp(
              x,
              startPoint.get().x - DRAG_CLAMP,
              startPoint.get().x + DRAG_CLAMP,
            ),
            y,
          },
          { duration: TAP_DURATION_MS },
        ),
      );
    },
    onUpdate: ({ changeX, y }) => {
      controlPointPos.set(({ x: currX }) => ({ x: currX + changeX, y }));
    },
    onDeactivate: ({ translationX }) => {
      if (translationX > SWIPE_THRESHOLD) {
        isMenuOpen.set(true);
        return;
      }
      if (translationX < -SWIPE_THRESHOLD) {
        isMenuOpen.set(false);
        return;
      }
      controlPointPos.set(withSpring(controlTarget(isMenuOpen.get())));
    },
  });

  const animatedPath = useDerivedValue(() => {
    const path = Skia.PathBuilder.Make();
    path.moveTo(startPoint.get().x, startPoint.get().y);
    path.quadTo(
      controlPointPos.get().x,
      controlPointPos.get().y,
      endPoint.get().x,
      endPoint.get().y,
    );
    path.lineTo(0, height);
    path.lineTo(0, 0);
    return path.build();
  });

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.edgeStrip} />
      {isActive && (
        <View
          style={[
            styles.items,
            { paddingVertical: topInset, width: width * 0.3 },
          ]}
        >
          {items.map((item, idx) => (
            <Animated.View
              entering={FadeInLeft.delay(idx * 100)}
              exiting={FadeOutLeft}
              key={item.label}
              style={styles.item}
            >
              <Pressable
                style={styles.itemContent}
                onPress={() => Alert.alert("Hi")}
              >
                <Text style={styles.label}>{item.label}</Text>
                <Text>
                  <Lucide name={item.iconName} color="white" />
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      )}
      <Canvas
        style={{ width, height, pointerEvents: isActive ? "auto" : "none" }}
      >
        <Group
          layer={
            <Paint>
              <Blur blur={SHADOW_BLUR} />
            </Paint>
          }
        >
          <Path path={animatedPath} style="fill" color={MENU_COLOR} />
        </Group>
        <Path path={animatedPath} style="fill" color={MENU_COLOR} />
      </Canvas>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  edgeStrip: {
    position: "absolute",
    height: "100%",
    width: 30,
    zIndex: 10,
  },
  items: {
    position: "absolute",
    paddingLeft: 16,
    zIndex: 2,
    height: "100%",
    gap: 16,
  },
  item: {
    width: "100%",
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    color: "white",
  },
});

export default Menu;
