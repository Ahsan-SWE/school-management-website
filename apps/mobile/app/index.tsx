import { NativeSurface } from "@school-platform/ui-native";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <NativeSurface>
        <Text style={styles.eyebrow}>WP-001 FOUNDATION</Text>
        <Text style={styles.title}>School Platform</Text>
        <Text style={styles.body}>
          Expo mobile shell is ready for authentication, tenant selection, and offline attendance.
        </Text>
      </NativeSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f5f7fb",
  },
  eyebrow: {
    color: "#3154c7",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
  },
  title: {
    marginTop: 12,
    color: "#14213d",
    fontSize: 36,
    fontWeight: "800",
  },
  body: {
    marginTop: 16,
    color: "#52617b",
    fontSize: 17,
    lineHeight: 26,
  },
});
