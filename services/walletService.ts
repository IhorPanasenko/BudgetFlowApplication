import { firestore } from "@/config/firebase";
import { ResponseType, WalletType } from "@/types";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
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
      : doc(collection(firestore, "wallets"));

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

export const deleteWallet = async (walletId: string): Promise<ResponseType> => {
  try {
    const walletRef = doc(firestore, "wallets", walletId);
    await deleteDoc(walletRef);

    deleteTransactionsFromWallet(walletId);

    return { success: true, msg: "Wallet deleted successfully" };
  } catch (error: any) {
    console.error("Error deleting the wallet: ", error);
    return { success: false, msg: error.message };
  }
};

export const deleteTransactionsFromWallet = async (
  walletId: string
): Promise<ResponseType> => {
  try {
    let hasMoreTransactions = true;

    while (hasMoreTransactions) {
      const transactionQuery = query(
        collection(firestore, "transactions"),
        where("walletId", "==", walletId)
      );

      const transactionSnapshot = await getDocs(transactionQuery);

      if (transactionSnapshot.size == 0) {
        hasMoreTransactions = false;
        break;
      }

      const batch = writeBatch(firestore);
      transactionSnapshot.forEach((transactionDoc) => {
        batch.delete(transactionDoc.ref);
      });

      await batch.commit();
    }

    return { success: true, msg: "All the  transactions deleted" };
  } catch (error: any) {
    console.error("Error deleting the wallet: ", error);
    return { success: false, msg: error.message };
  }
};
