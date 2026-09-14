import {
  Blur,
  Canvas,
  Group,
  matchFont,
  Paint,
  Path,
  Skia,
  SkPoint,
  Text,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { Platform, useWindowDimensions } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import {
  cancelAnimation,
  clamp,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const DRAWER_WIDTH_RATIO = 3 / 4;
const MENU_COLOR = "teal";
const SHADOW_BLUR = 10;
const DRAG_CLAMP = 10;
const SWIPE_THRESHOLD = 100;
const TAP_DURATION_MS = 130;

const FONT_SIZE = 16;
const LINE_HEIGHT = 24; // vertical distance between item baselines
const ITEMS_TOP_PADDING = 60; // baseline of the first item
const ITEMS_LEFT_PADDING = 16;
const LABEL_COLOR = "white";

type MenuProps = {
  items: string[];
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

  useAnimatedReaction(
    () => isMenuOpen.value,
    (open) => {
      startPoint.set(withSpring(startTarget(open)));
      endPoint.set(withSpring(endTarget(open)));
      controlPointPos.set(withSpring(controlTarget(open)));
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

  const font = useMemo(
    () =>
      matchFont({
        fontFamily: Platform.select({
          ios: "Helvetica",
          android: "sans-serif",
          default: "sans-serif",
        }),
        fontSize: FONT_SIZE,
        fontStyle: "normal",
        fontWeight: "normal",
      }),
    [],
  );

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
      <Canvas style={{ width, height }}>
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
        <Group clip={animatedPath}>
          {items.map((item, idx) => (
            <Text
              key={item}
              text={item}
              font={font}
              x={ITEMS_LEFT_PADDING}
              y={ITEMS_TOP_PADDING + LINE_HEIGHT * idx}
              color={LABEL_COLOR}
            />
          ))}
        </Group>
      </Canvas>
    </GestureDetector>
  );
};

export default Menu;
