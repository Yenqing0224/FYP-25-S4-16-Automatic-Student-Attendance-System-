// mobile-app/screens/student/newsevent/newsevent_detail_screen.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const COLORS = {
  primary: "#3A7AFE",
  background: "#F5F7FB",
  card: "#FFFFFF",
  textDark: "#111827",
  textMuted: "#6B7280",
  chipBg: "#E7F0FF",
};

// ✅ Local helper (no shared import)
const toText = (v, fallback = "-") => {
  if (v == null) return fallback;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map((x) => toText(x, "")).filter(Boolean).join(", ") || fallback;
  if (typeof v === "object") return String(v.name ?? v.code ?? v.title ?? v.label ?? v.id ?? fallback);
  return fallback;
};

const NewsEventDetailScreen = ({ route, navigation }) => {
  const item = route.params?.item || {};

  const getFormattedDate = () => {
    const dateString = item.news_date || item.event_date || item.date_sent;
    if (!dateString) return "Date not available";

    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const typeLabel = item.news_date ? "News" : item.event_date ? "Event" : "Announcement";

  const title = toText(item.title, "Untitled");
  const subtitle = toText(item.message || item.description, "");
  const body = toText(item.description || item.message, "No additional details.");
  const venue = toText(item.venue, "");
  const organizer = toText(item.organizer, "");

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView edges={["top"]} style={styles.topSafeArea} />

      <View style={styles.contentContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>{"<"}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>News & Events</Text>
          <View style={{ width: 20 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Card */}
          <View style={styles.card}>
            {/* Image */}
            {item.image_url ? (
              <View style={styles.heroWrapper}>
                <Image source={{ uri: item.image_url }} style={styles.heroImage} resizeMode="cover" />
              </View>
            ) : (
              <View style={[styles.heroWrapper, styles.imagePlaceholder]} />
            )}

            {/* Type + Date */}
            <View style={styles.metaRow}>
              <View style={styles.typeChip}>
                <Text style={styles.typeChipText}>{typeLabel}</Text>
              </View>
              <Text style={styles.dateText}>{getFormattedDate()}</Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Subtitle */}
            {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

            {/* Separator */}
            <View style={styles.divider} />

            {/* Body */}
            <Text style={styles.bodyText}>{body}</Text>

            {/* Extra Details */}
            {(!!venue || !!organizer) && (
              <View style={styles.extraDetails}>
                {!!venue && (
                  <Text style={styles.detailLabel}>
                    Venue: <Text style={styles.detailValue}>{venue}</Text>
                  </Text>
                )}
                {!!organizer && (
                  <Text style={styles.detailLabel}>
                    Organizer: <Text style={styles.detailValue}>{organizer}</Text>
                  </Text>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.background },
  topSafeArea: { flex: 0, backgroundColor: COLORS.background },
  contentContainer: { flex: 1, backgroundColor: COLORS.background },

  header: {
    backgroundColor: COLORS.background,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backArrow: { fontSize: 24, color: COLORS.textDark, fontWeight: "300" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: COLORS.textDark },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 24 },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 18,
    marginTop: 10,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },

  heroWrapper: { borderRadius: 18, overflow: "hidden", marginBottom: 16 },
  heroImage: { width: "100%", height: 200, backgroundColor: "#D1D5DB" },
  imagePlaceholder: { backgroundColor: "#CBD5F5", height: 200 },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: COLORS.chipBg,
    borderRadius: 999,
  },
  typeChipText: { fontSize: 11, fontWeight: "600", color: COLORS.primary },
  dateText: { fontSize: 13, color: COLORS.textMuted, fontStyle: "italic" },

  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.textMuted,
    marginBottom: 12,
    lineHeight: 22,
  },

  divider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 8 },

  bodyText: {
    fontSize: 15,
    color: COLORS.textDark,
    lineHeight: 24,
    marginTop: 4,
  },

  extraDetails: {
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  detailValue: { fontWeight: "500", color: COLORS.textMuted },
});

export default NewsEventDetailScreen;
