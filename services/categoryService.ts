import { firestore } from "@/config/firebase";
import { CategoryType, ResponseType } from "@/types";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    query,
    updateDoc,
    where,
} from "firebase/firestore";

export const createUpdateCategory = async (
  category: Partial<CategoryType> & {
    label: string;
    value: string;
    icon: string;
    bgColor: string;
    type: "Expense" | "Income";
    uid?: string | null;
    id?: string;
  }
): Promise<ResponseType> => {
  try {
    if (category.id) {
      // Update
      const categoryRef = doc(firestore, "categories", category.id);
      const existing = await getDoc(categoryRef);
      if (!existing.exists()) {
        return { success: false, msg: "Category not found." };
      }
      const existingType = existing.data().type;
      if (existingType !== category.type) {
        return {
          success: false,
          msg: "Cannot change category type from Income to Expense or vice versa.",
        };
      }
      await updateDoc(categoryRef, {
        label: category.label,
        icon: category.icon,
        bgColor: category.bgColor,
      });
      return { success: true, msg: "Category updated successfully" };
    } else {
      await addDoc(collection(firestore, "categories"), {
        label: category.label,
        icon: category.icon,
        bgColor: category.bgColor,
        type: category.type,
        uid: category.uid ?? null,
      });
      return { success: true, msg: "Category created successfully" };
    }
  } catch (error: any) {
    console.error("Error creating/updating the category: ", error);
    return { success: false, msg: error.message };
  }
};

export const deleteCategory = async (
  categoryId: string
): Promise<ResponseType> => {
  try {
    const transactionsRef = collection(firestore, "transactions");
    const q = query(
      transactionsRef,
      where("categoryId", "==", categoryId),
      limit(1)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return {
        success: false,
        msg: "Cannot delete category: There are transactions linked to this category.",
      };
    }

    const categoryRef = doc(firestore, "categories", categoryId);
    await deleteDoc(categoryRef);

    return { success: true, msg: "Category deleted successfully" };
  } catch (error: any) {
    console.error("Error deleting the category: ", error);
    return { success: false, msg: error.message };
  }
};
