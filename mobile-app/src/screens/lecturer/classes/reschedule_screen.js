//screen/lecturer/classes/reschedule_screen.js
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import api from "../../../api/api_client";

const COLORS = {
    primary: "#6D5EF5",
    background: "#F6F5FF",
    card: "#FFFFFF",
    textDark: "#111827",
    textMuted: "#6B7280",
    border: "#E5E7EB",
    soft: "#ECE9FF",
};

const toText = (v, fallback = "") => {
    if (v == null) return fallback;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
    if (typeof v === "object") return String(v.name ?? v.code ?? v.title ?? v.id ?? fallback);
    return fallback;
};

export default function LecturerRescheduleScreen({ route, navigation }) {
    const cls = route?.params?.cls;

    const [loadingSlots, setLoadingSlots] = useState(true);
    const [slots, setSlots] = useState([]);

    const [date, setDate] = useState(toText(cls?.date, "")); // YYYY-MM-DD
    const [startTime, setStartTime] = useState(toText(cls?.startISO, "").slice(11, 16)); // HH:MM
    const [endTime, setEndTime] = useState(toText(cls?.endISO, "").slice(11, 16));
    const [venue, setVenue] = useState(toText(cls?.venue, "TBA"));

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (!cls?.id) return;

            setLoadingSlots(true);
            try {
                // ✅ if you have this endpoint
                const res = await api.get(`/reschedule-availability/?session_id=${cls.id}`);
                const raw = res?.data?.available_slots;
                setSlots(Array.isArray(raw) ? raw : []);
            } catch (e) {
                setSlots([]); // fallback: manual mode
            } finally {
                setLoadingSlots(false);
            }
        };
        load();
    }, [cls?.id]);

    const pickSlot = (s) => {
        setDate(toText(s?.date, ""));
        setStartTime(toText(s?.start_time, ""));
        setEndTime(toText(s?.end_time, ""));
        setVenue(toText(s?.venue, venue));
    };
    const cleanText = (v, max = 100) => {
        const s = String(v ?? "").trim().replace(/\s+/g, " "); // remove newlines / extra spaces
        return s.length > max ? s.slice(0, max) : s;
    };

    const cleanTime = (t) => {
        // keep only HH:MM
        const s = String(t ?? "").trim();
        return s.length >= 5 ? s.slice(0, 5) : s;
    };

    const cleanDate = (d) => {
        // keep only YYYY-MM-DD
        const s = String(d ?? "").trim();
        return s.length >= 10 ? s.slice(0, 10) : s;
    };

    const canSubmit = useMemo(() => {
        return !!date && !!startTime && !!endTime && !!venue;
    }, [date, startTime, endTime, venue]);

    const submit = async () => {
        if (!cls?.id) return Alert.alert("Missing", "No session id found.");

        const payload = {
            session_id: String(cls.id),
            action: "reschedule",
            new_date: cleanDate(date),
            new_start_time: cleanTime(startTime),
            new_end_time: cleanTime(endTime),
            new_venue: cleanText(venue, 100), // ✅ max 100
        };

        if (!payload.new_date || !payload.new_start_time || !payload.new_end_time || !payload.new_venue) {
            return Alert.alert("Missing", "Please fill in date/time/venue.");
        }

        // optional: warn if user typed too long
        if (String(venue ?? "").trim().length > 100) {
            Alert.alert("Venue too long", "Venue must be 100 characters or less. It was shortened.");
        }

        setSubmitting(true);
        try {
            await api.post("/reschedule-class/", payload);

            Alert.alert("Done", "Session rescheduled.");

            const parent = navigation.getParent?.();
            if (parent) {
                parent.navigate("LSessions", {
                    screen: "LecturerSessionsMain",
                    params: { tab: "Upcoming", refreshKey: Date.now(), targetDate: `${payload.new_date}T${payload.new_start_time}` },
                });
            } else {
                navigation.navigate("LecturerSessionsMain", {
                    tab: "Upcoming",
                    refreshKey: Date.now(),
                    targetDate: `${payload.new_date}T${payload.new_start_time}`,
                });
            }
        } catch (e) {
            console.log("reschedule error payload:", payload);
            console.log("reschedule error:", e?.response?.status, e?.response?.data);
            Alert.alert("Error", e?.response?.data?.message ?? "Could not reschedule session.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={26} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Reschedule</Text>
                <View style={{ width: 30 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.module}>{toText(cls?.module, "MOD")}</Text>
                    <Text style={styles.title}>{toText(cls?.title, "Class")}</Text>
                    <Text style={styles.sub}>Original: {toText(cls?.date, "-")} • {toText(cls?.time, "-")}</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Suggested slots</Text>

                    {loadingSlots ? (
                        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 12 }} />
                    ) : slots.length === 0 ? (
                        <Text style={styles.muted}>No suggested slots (manual input below).</Text>
                    ) : (
                        slots.slice(0, 8).map((s, idx) => (
                            <TouchableOpacity key={idx} style={styles.slotBtn} onPress={() => pickSlot(s)}>
                                <Text style={styles.slotText}>
                                    {toText(s.date, "")} • {toText(s.start_time, "")}-{toText(s.end_time, "")} • {toText(s.venue, "")}
                                </Text>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Manual reschedule</Text>

                    <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
                    <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="2026-01-25" />

                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Start (HH:MM)</Text>
                            <TextInput style={styles.input} value={startTime} onChangeText={setStartTime} placeholder="10:00" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>End (HH:MM)</Text>
                            <TextInput style={styles.input} value={endTime} onChangeText={setEndTime} placeholder="12:00" />
                        </View>
                    </View>

                    <Text style={styles.label}>Venue</Text>
                    <TextInput style={styles.input} value={venue} onChangeText={setVenue} placeholder="LT19" />

                    <TouchableOpacity
                        style={[styles.primaryBtn, (!canSubmit || submitting) && { opacity: 0.7 }]}
                        onPress={submit}
                        disabled={!canSubmit || submitting}
                    >
                        {submitting ? <ActivityIndicator color="#fff" /> : <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />}
                        <Text style={styles.primaryBtnText}>Confirm reschedule</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 24 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { paddingVertical: 14, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: COLORS.border },
    backBtn: { width: 30 },
    headerTitle: { fontSize: 20, fontWeight: "900", color: COLORS.textDark },

    content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
    card: { backgroundColor: COLORS.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },

    module: { fontWeight: "900", color: COLORS.primary },
    title: { marginTop: 4, fontSize: 18, fontWeight: "900", color: COLORS.textDark },
    sub: { marginTop: 6, color: COLORS.textMuted, fontWeight: "700" },

    cardTitle: { fontSize: 16, fontWeight: "900", color: COLORS.textDark },
    muted: { marginTop: 10, color: COLORS.textMuted, fontWeight: "700" },

    slotBtn: { marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: COLORS.soft, borderWidth: 1, borderColor: COLORS.border },
    slotText: { fontWeight: "900", color: COLORS.primary },

    label: { marginTop: 12, color: COLORS.textMuted, fontWeight: "800" },
    input: { marginTop: 6, backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, fontWeight: "800", color: COLORS.textDark },

    primaryBtn: { marginTop: 16, backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
    primaryBtnText: { color: "#fff", fontWeight: "900" },
});
