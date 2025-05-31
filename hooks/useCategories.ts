import { firestore } from "@/config/firebase";
import { CategoryType } from "@/types";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

export function useCategories(
  userId?: string,
  onlyUserCategories: boolean = false
) {
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    async function fetchCategories() {
      setLoading(true);

      if (onlyUserCategories) {
        const q = query(
          collection(firestore, "categories"),
          where("uid", "==", userId)
        );
        const snap = await getDocs(q);
        setCategories(
          snap.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as CategoryType)
          )
        );
        setLoading(false);
        return;
      } else {
        const userQuery = query(
          collection(firestore, "categories"),
          where("uid", "==", userId)
        );
        const globalQuery = query(
          collection(firestore, "categories"),
          where("uid", "==", null)
        );
        const [userSnap, globalSnap] = await Promise.all([
          getDocs(userQuery),
          getDocs(globalQuery),
        ]);
        setCategories([
          ...userSnap.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as unknown as CategoryType)
          ),
          ...globalSnap.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as unknown as CategoryType)
          ),
        ]);
        setLoading(false);
      }
    }

    fetchCategories();
  }, [userId, onlyUserCategories]);

  return { categories, loading };
}
