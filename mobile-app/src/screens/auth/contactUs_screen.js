import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const ContactUsScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ width: 24 }} />
                <Text style={styles.title}>Contact Support</Text>

                <TouchableOpacity
                    onPress={() => {
                        navigation.reset({
                            index: 0,
                            routes: [{ name: "Login" }],
                        });
                    }}
                >
                    <Ionicons name="close" size={24} color="#111827" />
                </TouchableOpacity>

            </View>


            {/* Main Card */}
            <View style={styles.card}>
                <Ionicons
                    name="help-circle-outline"
                    size={56}
                    color="#3A7AFE"
                />

                <Text style={styles.heading}>Need Help?</Text>

                <Text style={styles.description}>
                    If you're unable to log in or facing technical issues with Attendify,
                    our support team will be happy to assist you.
                </Text>

                {/* Email Support */}
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() =>
                        Linking.openURL("mailto:support@attendify.com")
                    }
                >
                    <Ionicons name="mail-outline" size={18} color="#fff" />
                    <Text style={styles.primaryText}>Email Support</Text>
                </TouchableOpacity>

                {/* WhatsApp Support */}
                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() =>
                        Linking.openURL("https://wa.me/6591234567")
                    }
                >
                    <Ionicons
                        name="logo-whatsapp"
                        size={18}
                        color="#16A34A"
                    />
                    <Text style={styles.secondaryText}>WhatsApp Support</Text>
                </TouchableOpacity>

                {/* Footer note */}
                <Text style={styles.footerText}>
                    Typical response time: within 24 hours
                </Text>
            </View>
        </SafeAreaView >
    );
};

export default ContactUsScreen;
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F7FB",
        padding: 20,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 28,
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        paddingVertical: 32,
        paddingHorizontal: 26,
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 14,
        elevation: 5,
    },
    heading: {
        fontSize: 20,
        fontWeight: "700",
        marginTop: 16,
        color: "#111827",
    },
    description: {
        fontSize: 14,
        color: "#6B7280",
        textAlign: "center",
        marginTop: 12,
        marginBottom: 22,
        lineHeight: 20,
    },
    primaryButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#3A7AFE",
        paddingVertical: 14,
        borderRadius: 12,
        width: "100%",
        justifyContent: "center",
    },
    primaryText: {
        color: "#FFFFFF",
        fontWeight: "700",
        marginLeft: 8,
        fontSize: 15,
    },
    secondaryButton: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#D1D5DB",
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 14,
        width: "100%",
        justifyContent: "center",
    },
    secondaryText: {
        marginLeft: 8,
        fontWeight: "600",
        fontSize: 15,
        color: "#16A34A",
    },
    footerText: {
        marginTop: 18,
        fontSize: 12,
        color: "#9CA3AF",
    },
});
