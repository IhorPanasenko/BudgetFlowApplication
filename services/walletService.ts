import { firestore } from "@/config/firebase";
import { ResponseType, WalletType } from "@/types";
import { collection, doc, setDoc } from "firebase/firestore";
import { uploadFileToCloudinary } from "./imageService";

export const createUpdateWallet = async (
  walletData: Partial<WalletType>
): Promise<ResponseType> => {
  try {
    let walletToSave = { ...walletData };

    if (walletData.image && typeof walletData.image?.uri) {
      const imageUploadRes = await uploadFileToCloudinary(
        walletData.image,
        "wallets"
      );

      if (!imageUploadRes.success) {
        return {
          success: false,
          msg: imageUploadRes.msg || "Failed to upload the wallet icon",
        };
      }

      walletToSave.image = imageUploadRes.data;
    }

    if (!walletData?.id) {
      // new wallet
      walletToSave.amount = 0;
      walletToSave.totalIncome = 0;
      walletToSave.totalExpenses = 0;
      walletToSave.created = new Date();
    }

    const walletRef = walletData?.id
      ? doc(firestore, "wallets", walletData.id)
      : doc(collection(firestore, "walelts"));

    await setDoc(walletRef, walletToSave, { merge: true });
    return {
      success: true,
      data: { ...walletToSave, id: walletRef.id },
      msg: "Wallet created or updated successfully",
    };
  } catch (error: any) {
    console.error("error creating or updating a wallet: ", error);
    return { success: false, msg: error.message || "Failed" };
  }
};
