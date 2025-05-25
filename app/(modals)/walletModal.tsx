import BackButton from "@/components/BackButton";
import Button from "@/components/Button";
import Header from "@/components/Header";
import ImageUpload from "@/components/ImageUpload";
import Input from "@/components/Input";
import ModalWrapper from "@/components/ModalWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/contansts/theme";
import { useAuth } from "@/context/authContext";
import { createUpdateWallet } from "@/services/walletService";
import { WalletType } from "@/types";
import { scale, verticalScale } from "@/utilts/styling";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

const WalletModal = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [wallet, setWallet] = useState<WalletType>({
    name: "",
    image: null,
  });

  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    let { name, image } = wallet;
    if (!name.trim()) {
      Alert.alert("User", "Name cannot be empty");
      return;
    }

    if (!image) {
      Alert.alert("User", "Please, upload an image");
      return;
    }

    const data: WalletType = {
      name,
      image,
      uid: user?.uid,
    };

    setLoading(true);
    const res = await createUpdateWallet(data);
    setLoading(false);

    if (res.success) {
      router.back();
    } else {
      Alert.alert("Wallet", res.msg || "Something went wrong");
    }
  };
  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header
          title="New Wallet"
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
        <Button loading={loading} onPress={onSubmit} style={{ flex: 1 }}>
          <Typo color={colors.black} fontWeight={"700"}>
            { wallet.id ? "Update" : "Add wallet" }
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
