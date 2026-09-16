import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Menu from "@components/Menu";

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView>
        <Menu
          items={[
            { iconName: "house", label: "Home" },
            { iconName: "person-standing", label: "Profile" },
            { iconName: "cog", label: "Settings" },
          ]}
        />
        <StatusBar style="auto" />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
