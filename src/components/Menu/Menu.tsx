import {
  Blur,
  Canvas,
  Group,
  Paint,
  Path,
  Skia,
  SkPoint,
} from "@shopify/react-native-skia";
import { useWindowDimensions } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import {
  cancelAnimation,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const Menu = () => {
  const { width, height } = useWindowDimensions();
  const pos = useSharedValue<SkPoint>({ x: 0, y: 0 });
  const startPoint = useSharedValue<SkPoint>({ x: 0, y: 0 });
  const endPoint = useSharedValue<SkPoint>({ x: 0, y: height });
  const pan = usePanGesture({
    maxPointers: 1,
    onBegin: ({ x, y }) => {
      cancelAnimation(pos);
      pos.set(withTiming({ x, y }, { duration: 130 }));
    },
    onUpdate: ({ x, y }) => {
      pos.set({ x, y });
    },
    onDeactivate: ({ translationX }) => {
      if (translationX > 100) {
        startPoint.set(withSpring({ x: width / 2, y: 0 }));
        endPoint.set(withSpring({ x: width / 2, y: height }));
      } else {
        startPoint.set(withSpring({ x: 0, y: 0 }));
        endPoint.set(withSpring({ x: 0, y: height }));
        pos.set(withSpring({ x: 0, y: 0 }));
      }
    },
  });

  const animatedPath = useDerivedValue(() => {
    const path = Skia.PathBuilder.Make();
    path.moveTo(startPoint.get().x, startPoint.get().y);
    path.quadTo(pos.get().x, pos.get().y, endPoint.get().x, endPoint.get().y);
    path.lineTo(0, height);
    path.lineTo(0, 0);
    return path.build();
  });

  return (
    <GestureDetector gesture={pan}>
      <Canvas style={{ width, height }}>
        <Group>
          <Group
            layer={
              <Paint>
                <Blur blur={10} />
              </Paint>
            }
          >
            <Path path={animatedPath} style="fill" color="teal" />
          </Group>
          <Path path={animatedPath} style="fill" color="teal" />
        </Group>
      </Canvas>
    </GestureDetector>
  );
};

export default Menu;
