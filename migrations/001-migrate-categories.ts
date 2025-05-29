import "dotenv/config";
import { addDoc, collection } from "firebase/firestore";
//import firestore from "./firebase/config";

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);

const categories = [
  {
    label: "Groceries",
    value: "groceries",
    icon: "ShoppingCart",
    bgColor: "#4B5563",
    type: "Expense",
    uid: null,
  },
  {
    label: "Rent",
    value: "rent",
    icon: "House",
    bgColor: "#075985", // Dark Blue
    type: "Expense",
    uid: null,
  },
  {
    label: "Utilities",
    value: "utilities",
    icon: "Lightbulb",
    bgColor: "#ca8a04", // Dark Golden Brown
    type: "Expense",
    uid: null,
  },
  {
    label: "Transportation",
    value: "transportation",
    icon: "Car",
    bgColor: "#b45309", // Dark Orange-Red
    type: "Expense",
    uid: null,
  },
  {
    label: "Entertainment",
    value: "entertainment",
    icon: "FilmStrip",
    bgColor: "#0f766e", // Darker Red-Brown
    type: "Expense",
    uid: null,
  },
  {
    label: "Dining",
    value: "dining",
    icon: "ForkKnife",
    bgColor: "#be185d", // Dark Red
    type: "Expense",
    uid: null,
  },
  {
    label: "Health",
    value: "health",
    icon: "Heart",
    bgColor: "#e11d48", // Dark Purple
    type: "Expense",
    uid: null,
  },
  {
    label: "Insurance",
    value: "insurance",
    icon: "ShieldCheck",
    bgColor: "#404040", // Dark Gray
    type: "Expense",
    uid: null,
  },
  {
    label: "Savings",
    value: "savings",
    icon: "PiggyBank",
    bgColor: "#065F46", // Deep Teal Green
    type: "Expense",
    uid: null,
  },
  {
    label: "Clothing",
    value: "clothing",
    icon: "TShirt",
    bgColor: "#7c3aed", // Dark Indigo
    type: "Expense",
    uid: null,
  },
  {
    label: "Personal",
    value: "personal",
    icon: "User",
    bgColor: "#a21caf", // Deep Pink
    type: "Expense",
    uid: null,
  },
  {
    label: "Others",
    value: "others",
    icon: "DotsThreeOutline",
    bgColor: "#525252", // Neutral Dark Gray
    type: "Expense",
    uid: null,
  },
  {
    label: "Paycheck",
    value: "paycheck",
    icon: "PiggyBank",
    bgColor: "#a21caf",
    type: "Income",
    uid: null,
  },
    {
    label: "Gifts",
    value: "gift",
    icon: "Gift",
    bgColor: "#7c3aed",
    type: "Income",
    uid: null,
  },
];

async function migrate() {
  const ref = collection(firestore, "categories");
  for (const cat of categories) {
    await addDoc(ref, cat);
    console.log(`Added: ${cat.label}`);
  }
  console.log("Migration complete");
  process.exit(0);
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
