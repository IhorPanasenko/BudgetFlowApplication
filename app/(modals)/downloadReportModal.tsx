import BackButton from "@/components/BackButton";
import Button from "@/components/Button";
import Header from "@/components/Header";
import ModalWrapper from "@/components/ModalWrapper";
import Typo from "@/components/Typo";
import { colors, spacingY } from "@/contansts/theme";
import { useAuth } from "@/context/authContext";
import useFetchData from "@/hooks/useFetchData";
import { TransactionType, WalletType } from "@/types";
import { orderBy, where } from "firebase/firestore";
import React, { useState } from "react";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";
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
  const {
    data: transactions,
    loading: transactionsLoading,
    error: fetchTransactionsError,
  } = useFetchData<TransactionType>("transactions", [
    where("uid", "==", user?.uid),
    orderBy("date", "desc"),
  ]);

  const [selectedWallets, setSelectedWallets] = useState<string[]>(
    wallets.map((w) => w.id!)
  );
  const [fromDate, setFromDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );
  const [toDate, setToDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  // Toggle wallet selection
  const toggleWallet = (id: string) => {
    setSelectedWallets((prev) =>
      prev.includes(id) ? prev.filter((wid) => wid !== id) : [...prev, id]
    );
  };

  // Filter transactions by selected wallets and date range
  const filteredTxs = transactions
    .filter(
      (tx) =>
        selectedWallets.includes(tx.walletId) &&
        new Date(tx.date) >= fromDate &&
        new Date(tx.date) <= toDate
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate balances before/after for each transaction
  const getWalletTxsWithBalances = (walletId: string) => {
    const wallet = wallets.find((w) => w.id === walletId);
    if (!wallet) return [];
    const txs = filteredTxs.filter((tx) => tx.walletId === walletId);
    let balance = wallet.amount;
    const txsWithBalances = txs.map((tx) => {
      const after = balance;
      const before =
        tx.type === "Income" ? after - tx.amount : after + tx.amount;
      balance = before;
      return { ...tx, before, after };
    });
    return txsWithBalances;
  };

  // PDF generation logic
  const handleDownload = async () => {
    setLoading(true);
    try {
      // 1. Prepare data for PDF
      // 2. Generate PDF (use your PDF library)
      // 3. Save PDF to device (expo-file-system)
      // 4. Show success or error
      Alert.alert(
        "Report",
        "PDF report generation is not implemented in this scaffold."
      );
    } catch (e) {
      Alert.alert("Error", "Failed to generate PDF report.");
    }
    setLoading(false);
  };

  return (
    <ModalWrapper>
      <Header
        title="Download Report"
        leftIcon={<BackButton />}
        style={{ marginBottom: spacingY._10 }}
      />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Typo size={16} fontWeight="700" style={{ marginBottom: 8 }}>
          Select Wallets
        </Typo>
        <View
          style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 12 }}
        >
          <TouchableOpacity
            style={{
              backgroundColor:
                selectedWallets.length === wallets.length
                  ? colors.primary
                  : colors.neutral800,
              padding: 8,
              borderRadius: 8,
              marginRight: 8,
              marginBottom: 8,
            }}
            onPress={() => setSelectedWallets(wallets.map((w) => w.id))}
          >
            <Typo color={colors.white}>All</Typo>
          </TouchableOpacity>
          {wallets.map((w) => (
            <TouchableOpacity
              key={w.id}
              style={{
                backgroundColor: selectedWallets.includes(w.id)
                  ? colors.primary
                  : colors.neutral800,
                padding: 8,
                borderRadius: 8,
                marginRight: 8,
                marginBottom: 8,
              }}
              onPress={() => toggleWallet(w.id)}
            >
              <Typo color={colors.white}>{w.name}</Typo>
            </TouchableOpacity>
          ))}
        </View>
        {/* <Typo size={16} fontWeight="700" style={{ marginBottom: 8 }}>
          Date Range
        </Typo>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <DateTimePicker
            value={fromDate}
            mode="date"
            onChange={(_, d) => d && setFromDate(d)}
          />
          <Typo style={{ marginHorizontal: 8 }}>to</Typo>
          <DateTimePicker
            value={toDate}
            mode="date"
            onChange={(_, d) => d && setToDate(d)}
          />
        </View> */}
        <Button loading={loading} onPress={handleDownload}>
          <Typo color={colors.white} fontWeight="700">
            Download PDF
          </Typo>
        </Button> 
      </ScrollView>
    </ModalWrapper>
  );
};

export default DownloadReportModal;
