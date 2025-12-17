//src/navigation/role_select_screen.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RoleSelectScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Login as</Text>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.navigate("Login", { role: "student" })}
      >
        <Text style={styles.btnText}>Student</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.navigate("LecturerLogin", { role: "lecturer" })}
      >
        <Text style={styles.btnText}>Lecturer</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  title: { fontSize: 22, fontWeight: "700" },
  btn: { width: "75%", padding: 14, borderRadius: 10, backgroundColor: "#3A7AFE" },
  btnText: { color: "white", textAlign: "center", fontWeight: "700" },
});
