import { NavigationContainer } from "@react-navigation/native";
import RootNavigator from "./src/navigation/root_navigator";

export default function App() {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}
