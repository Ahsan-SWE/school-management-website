import type { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

export function NativeSurface({ children }: PropsWithChildren) {
  return <View style={styles.surface}>{children}</View>;
}

const styles = StyleSheet.create({
  surface: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#dfe5f0",
    backgroundColor: "#ffffff",
    padding: 24,
  },
});
