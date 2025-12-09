// mobile-app/screens/profile/applyLeaveSuccess_screen.js
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ApplyLeaveSuccessScreen = ({ navigation, route }) => {
  // values passed from ApplyLeaveScreen
  const { startDate, endDate, reason } = route.params || {};

  const goToStatus = () => {
    navigation.navigate("LeaveStatus");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Apply Leave</Text>
        <View style={{ width: 20 }} />
      </View>

      <View style={styles.content}>
        {/* big circular placeholder */}
        <View style={styles.circle} />

        <Text style={styles.title}>
          Your leave application has been submitted!
        </Text>

        <Text style={styles.description}>
          The review process will take 2–3 working days.{"\n"}
          You may track the status on{" "}
          <Text style={styles.link}> Leaves Status</Text>.
        </Text>

        {/* tiny summary if params exist */}
        {startDate && (
          <Text style={[styles.description, { marginBottom: 16 }]}>
            From {startDate} to {endDate}
            {"\n"}
            Reason: {reason}
          </Text>
        )}

        <TouchableOpacity style={styles.button} onPress={goToStatus}>
          <Text style={styles.buttonText}>View Application Status</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ApplyLeaveSuccessScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#EAEAEA",
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backArrow: {
    fontSize: 24,
    color: "#333",
    fontWeight: "300",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  circle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#D9D9D9",
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 13,
    textAlign: "center",
    color: "#555",
    marginBottom: 24,
  },
  link: {
    textDecorationLine: "underline",
  },
  button: {
    backgroundColor: "#D9D9D9",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 4,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
