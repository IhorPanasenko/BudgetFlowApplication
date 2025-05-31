import { firestore } from "@/config/firebase";
import { CategoryType } from "@/types";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

export function useCategories(uid?: string, onlyUserCategories = false) {
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    let unsubUser: (() => void) | undefined;
    let unsubGlobal: (() => void) | undefined;

    setLoading(true);

    if (onlyUserCategories) {
      const q = query(collection(firestore, "categories"), where("uid", "==", uid));
      unsubUser = onSnapshot(q, (snap) => {
        setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CategoryType)));
        setLoading(false);
      });
    } else {
      const userQuery = query(collection(firestore, "categories"), where("uid", "==", uid));
      const globalQuery = query(collection(firestore, "categories"), where("uid", "==", null));
      unsubUser = onSnapshot(userQuery, (userSnap) => {
        unsubGlobal = onSnapshot(globalQuery, (globalSnap) => {
          setCategories([
            ...userSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CategoryType)),
            ...globalSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CategoryType)),
          ]);
          setLoading(false);
        });
      });
    }

    return () => {
      unsubUser && unsubUser();
      unsubGlobal && unsubGlobal();
    };
  }, [uid, onlyUserCategories]);

  return { categories, loading };
}