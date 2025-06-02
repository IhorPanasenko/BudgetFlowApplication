import BackButton from "@/components/BackButton";
import Button from "@/components/Button";
import Header from "@/components/Header";
import ModalWrapper from "@/components/ModalWrapper";
import Typo from "@/components/Typo";
import { colors, radius, spacingX, spacingY } from "@/contansts/theme";
import { useAuth } from "@/context/authContext";
import useFetchData from "@/hooks/useFetchData";
import { generateAndSharePDFReport } from "@/services/reportService";
import { WalletType } from "@/types";
import { scale, verticalScale } from "@/utilts/styling";
import DateTimePicker from "@react-native-community/datetimepicker";
import { orderBy, where } from "firebase/firestore";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
// import your PDF library here

const DownloadReportModal = () => {
  const { user } = useAuth();
  const {
    data: wallets,
    loading: walletsLoading,
    error: fetchWalletsError,
  } = useFetchData<WalletType>("wallets", [
    where("uid", "==", user?.uid),
    orderBy("created", "desc"),
  ]);
  const [transactionType, setTransactionType] = useState<
    "Both" | "Expense" | "Income"
  >("Both");

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const onFromDateChange = (event: any, selectedDate: any) => {
    const currentDate = selectedDate || fromDate;
    setFromDate(currentDate);
    setShowFromPicker(Platform.OS == "ios" ? true : false);
  };

  const onToDateChange = (event: any, selectedDate: any) => {
    const currentDate = selectedDate || toDate;
    setToDate(currentDate);
    setShowToPicker(Platform.OS == "ios" ? true : false);
  };

  const [selectedWallets, setSelectedWallets] = useState<string[]>(
    wallets.map((w) => w.id!)
  );
  const [fromDate, setFromDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );
  const [toDate, setToDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const toggleWallet = (id: string) => {
    setSelectedWallets((prev) =>
      prev.includes(id) ? prev.filter((wid) => wid !== id) : [...prev, id]
    );
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
       await generateAndSharePDFReport({
        walletIds: selectedWallets,
        transactionType,
        fromDate,
        toDate,
        userId: user?.uid || '',
      });
    } catch (e) {
      console.log("Error from generateAndSharePdfReport ", e);
      Alert.alert("Error", "Failed to generate PDF report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper style={{ padding: verticalScale(10) }}>
      <Header
        title="Download Report"
        leftIcon={<BackButton />}
        style={{ marginBottom: spacingY._10 }}
      />
      <ScrollView
        contentContainerStyle={styles.form}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inputContainer}>
          <Typo color={colors.neutral200} size={16}>
            Select Wallets
          </Typo>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                {
                  backgroundColor:
                    selectedWallets.length === wallets.length
                      ? colors.primary
                      : colors.neutral800,
                  borderColor:
                    selectedWallets.length === wallets.length
                      ? colors.primary
                      : colors.neutral500,
                },
              ]}
              onPress={() => setSelectedWallets(wallets.map((w) => w.id!))}
            >
              <Typo color={colors.white}>All</Typo>
            </TouchableOpacity>
            {wallets.map((w) => (
              <TouchableOpacity
                key={w.id}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: selectedWallets.includes(w.id!)
                      ? colors.primary
                      : colors.neutral800,
                    borderColor: selectedWallets.includes(w.id!)
                      ? colors.primary
                      : colors.neutral500,
                  },
                ]}
                onPress={() => toggleWallet(w.id!)}
              >
                <Typo color={colors.white}>{w.name}</Typo>
                <Typo
                  color={colors.white}
                  size={verticalScale(10)}
                  style={{ textAlign: "center" }}
                >
                  ${w.amount || 0}
                </Typo>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.inputContainer}>
          <Typo color={colors.neutral200} size={16}>
            Transaction Type
          </Typo>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {["Both", "Expense", "Income"].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor:
                      transactionType === type
                        ? colors.primary
                        : colors.neutral800,
                    borderColor:
                      transactionType === type
                        ? colors.primary
                        : colors.neutral500,
                  },
                ]}
                onPress={() =>
                  setTransactionType(type as "Both" | "Expense" | "Income")
                }
              >
                <Typo color={colors.white}>
                  {type === "Both" ? "Both" : type}
                </Typo>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.inputContainer}>
          <Typo color={colors.neutral200} size={16}>
            From Date
          </Typo>
          {!showFromPicker && (
            <Pressable
              style={styles.dateInput}
              onPress={() => setShowFromPicker(true)}
            >
              <Typo size={14}>{fromDate.toLocaleDateString()}</Typo>
            </Pressable>
          )}
          {showFromPicker && (
            <View style={Platform.OS == "ios" && styles.iosDateOicker}>
              <DateTimePicker
                themeVariant="dark"
                value={fromDate}
                textColor={colors.white}
                mode="date"
                display={Platform.OS == "ios" ? "spinner" : "default"}
                onChange={onFromDateChange}
              />
              {Platform.OS === "ios" && (
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowFromPicker(false)}
                >
                  <Typo size={15} fontWeight={"500"} color={colors.white}>
                    Ok
                  </Typo>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        <View style={styles.inputContainer}>
          <Typo color={colors.neutral200} size={16}>
            To Date
          </Typo>
          {!showToPicker && (
            <Pressable
              style={styles.dateInput}
              onPress={() => setShowToPicker(true)}
            >
              <Typo size={14}>{toDate.toLocaleDateString()}</Typo>
            </Pressable>
          )}
          {showToPicker && (
            <View style={Platform.OS == "ios" && styles.iosDateOicker}>
              <DateTimePicker
                themeVariant="dark"
                value={toDate}
                textColor={colors.white}
                mode="date"
                display={Platform.OS == "ios" ? "spinner" : "default"}
                onChange={onToDateChange}
              />
              {Platform.OS === "ios" && (
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowToPicker(false)}
                >
                  <Typo size={15} fontWeight={"500"} color={colors.white}>
                    Ok
                  </Typo>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button style={{ flex: 1 }} loading={loading} onPress={handleDownload}>
          <Typo color={colors.black} fontWeight="700">
            Download PDF
          </Typo>
        </Button>
      </View>
    </ModalWrapper>
  );
};

export default DownloadReportModal;

const styles = StyleSheet.create({
  form: {
    gap: spacingY._20,
    paddingVertical: spacingY._15,
    paddingBottom: spacingY._40,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: spacingX._20,
    gap: scale(12),
    paddingTop: spacingY._15,
    borderTopColor: colors.neutral700,
    marginBottom: spacingY._5,
    borderTopWidth: 1,
  },
  inputContainer: {
    gap: spacingY._10,
  },
  dateInput: {
    flexDirection: "row",
    height: verticalScale(54),
    alignItems: "center",
    borderWidth: 1,
    justifyContent: "space-between",
    borderColor: colors.neutral500,
    borderRadius: radius._17,
    borderCurve: "continuous",
    paddingHorizontal: spacingX._15,
  },
  iosDateOicker: {},
  datePickerButton: {
    backgroundColor: colors.neutral700,
    alignSelf: "flex-end",
    padding: spacingY._7,
    marginRight: spacingX._7,
    paddingHorizontal: spacingY._15,
    borderRadius: radius._10,
  },
  optionButton: {
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 2,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
  },
});
