import BackButton from "@/components/BackButton";
import Button from "@/components/Button";
import Header from "@/components/Header";
import ImageUpload from "@/components/ImageUpload";
import Input from "@/components/Input";
import ModalWrapper from "@/components/ModalWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/contansts/theme";
import { useAuth } from "@/context/authContext";
import { createUpdateWallet, deleteWallet } from "@/services/walletService";
import { WalletType } from "@/types";
import { scale, verticalScale } from "@/utilts/styling";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Icons from "phosphor-react-native";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

const WalletModal = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [wallet, setWallet] = useState<WalletType>({
    name: "",
    image: null,
    amount: 0,
  });

  const [loading, setLoading] = useState(false);

  const oldWallet: Partial<{ name: string; image: string; amount: string | number; id: string }> =
    useLocalSearchParams();

  useEffect(() => {
    if (oldWallet.id) {
      setWallet({
        name: oldWallet.name ?? "",
        image: oldWallet.image,
        id: oldWallet.id,
        amount: oldWallet.amount ? Number(oldWallet.amount) : 0,
      });
    }
  }, []);

  const onSubmit = async () => {
    let { name, image, amount } = wallet;
    if (!name.trim()) {
      Alert.alert("Wallet", "Name cannot be empty");
      return;
    }

    if (!image) {
      Alert.alert("Wallet", "Please, upload an image");
      return;
    }

    if (!amount || amount < 0) {
      Alert.alert("Wallet", "You can't set amount lower than 0");
      return
    }

    const data: WalletType = {
      name,
      image,
      amount: Number(amount),
      uid: user?.uid,
    };

    console.log('waleltData:', data);
    if (wallet.id) data.id = wallet.id;

    setLoading(true);
    const res = await createUpdateWallet(data);
    setLoading(false);

    if (res.success) {
      router.back();
    } else {
      Alert.alert("Wallet", res.msg || "Something went wrong");
    }
  };

  const onDelete = async () => {
    if (!wallet.id) return;
    setLoading(true);
    const res = await deleteWallet(wallet.id);
    setLoading(false);
    if (res.success) {
      router.back();
    } else {
      Alert.alert("Wallet", res.msg);
    }
  };

  const deleteAlert = () => {
    Alert.alert(
      "Confirm",
      "Are you sure you want to do this?\nThis action will remove all the transactions related to the wallet",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Delete"),
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: () => onDelete(),
          style: "destructive",
        },
      ]
    );
  };
  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header
          title={wallet.id ? "Update Wallet" : "New Wallet"}
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />

        {/* form */}
        <ScrollView contentContainerStyle={styles.form}>
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Wallet Name</Typo>
            <Input
              placeholder="Salary"
              value={wallet?.name}
              onChangeText={(value) => {
                setWallet({ ...wallet, name: value });
              }}
            />
          </View>
           <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Amount</Typo>
            <Input
              placeholder="0"
              value={wallet?.amount?.toString() ?? ""}
              onChangeText={(value) => {
                setWallet({ ...wallet, amount: Number(value) });
              }}
            />
          </View>
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Wallet Icon</Typo>
            {/* image picker */}
            <ImageUpload
              file={wallet?.image}
              onClear={() => setWallet({ ...wallet, image: null })}
              onSelect={(file) => setWallet({ ...wallet, image: file })}
              placeholder="Upload Image"
            ></ImageUpload>
          </View>
        </ScrollView>
      </View>

      <View style={styles.footer}>
        {wallet.id && !loading && (
          <Button
            onPress={deleteAlert}
            style={{
              backgroundColor: colors.rose,
              paddingHorizontal: spacingX._15,
            }}
          >
            <Icons.Trash
              color={colors.white}
              size={verticalScale(24)}
              weight="bold"
            />
          </Button>
        )}
        <Button loading={loading} onPress={onSubmit} style={{ flex: 1 }}>
          <Typo color={colors.black} fontWeight={"700"}>
            {wallet.id ? "Update Wallet" : "Add Wallet"}
          </Typo>
        </Button>
      </View>
    </ModalWrapper>
  );
};

export default WalletModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacingY._20,
  },
  userInfo: {
    marginTop: verticalScale(20),
    alignItems: "center",
    gap: spacingY._15,
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
  form: {
    gap: spacingY._30,
    marginTop: spacingY._15,
  },
  avatarContainer: {
    position: "relative",
    alignSelf: "center",
  },
  avatar: {
    alignSelf: "center",
    backgroundColor: colors.neutral300,
    height: verticalScale(135),
    width: verticalScale(135),
    borderRadius: 200,
    borderWidth: 1,
    borderColor: colors.neutral500,
    // overflow: 'hidden',
    // position: 'relative',
  },
  editIcon: {
    position: "absolute",
    bottom: spacingY._5,
    right: spacingY._7,
    borderRadius: 100,
    backgroundColor: colors.neutral100,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    padding: spacingY._7,
  },
  inputContainer: {
    gap: spacingY._10,
  },
});
