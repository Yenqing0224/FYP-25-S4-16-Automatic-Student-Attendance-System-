import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const COLORS = {
  primary: "#3A7AFE",
  background: "#F5F7FB",
  card: "#FFFFFF",
  textDark: "#111827",
  textMuted: "#6B7280",
};

const ApplyLeaveSuccessScreen = ({ navigation, route }) => {
  const { startDate, endDate, reason } = route.params || {};

  const goToStatus = () => {
    navigation.navigate("LeaveStatus");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Apply Leave</Text>
        <View style={{ width: 20 }} />
      </View>

      {/* Content */}
      <View style={styles.contentWrapper}>
        <View style={styles.card}>
          {/* Circle with tick */}
          <View style={styles.circle}>
            <Text style={styles.tick}>✓</Text>
          </View>

          <Text style={styles.title}>
            Your leave application has been submitted!
          </Text>

          <Text style={styles.description}>
            The review process will take 2–3 working days.{"\n"}
            You may track the status under{" "}
            <Text style={styles.link} onPress={goToStatus}>
              Leaves Status
            </Text>
            .
          </Text>

          {startDate && (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>
                <Text style={styles.summaryLabel}>Date: </Text>
                {startDate} – {endDate}
              </Text>
              <Text style={styles.summaryText}>
                <Text style={styles.summaryLabel}>Reason: </Text>
                {reason}
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.button} onPress={goToStatus}>
            <Text style={styles.buttonText}>View Application Status</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    backgroundColor: COLORS.background,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  backArrow: {
    fontSize: 24,
    color: COLORS.textDark,
    fontWeight: "300",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textDark,
  },

  contentWrapper: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  circle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#E0ECFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  tick: {
    fontSize: 52,
    color: COLORS.primary,
    fontWeight: "800",
  },

  title: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    color: COLORS.textDark,
    marginBottom: 10,
  },
  description: {
    fontSize: 13,
    textAlign: "center",
    color: COLORS.textMuted,
    marginBottom: 18,
    lineHeight: 20,
  },
  link: {
    textDecorationLine: "underline",
    color: COLORS.primary,
    fontWeight: "600",
  },

  summaryBox: {
    width: "100%",
    backgroundColor: "#F3F4FF",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 18,
  },
  summaryText: {
    fontSize: 13,
    color: COLORS.textDark,
    marginBottom: 4,
  },
  summaryLabel: {
    fontWeight: "700",
  },

  button: {
    marginTop: 4,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 999,
    alignItems: "center",
    alignSelf: "stretch",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
});

export default ApplyLeaveSuccessScreen;