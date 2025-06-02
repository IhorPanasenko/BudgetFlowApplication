import { firestore } from "@/config/firebase"; // Assuming this is your Firebase config
import { CategoryType, TransactionType, WalletType } from "@/types"; // Assuming these types are defined
import * as Print from "expo-print"; // For PDF generation (Expo)
import * as Sharing from "expo-sharing"; // For sharing PDF (Expo)
import {
  collection,
  documentId,
  getDocs,
  or,
  orderBy,
  query,
  QueryFieldFilterConstraint,
  QueryOrderByConstraint,
  Timestamp,
  where,
} from "firebase/firestore";

// --- Helper Functions ---
const formatCurrency = (amount: number) =>
  "$" + Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 });

const formatDateStandard = (date: Date): string => {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

interface TransactionWithDetails extends TransactionType {
  date: Date; // Ensure date is always a JS Date for processing
  walletName: string;
  categoryName: string;
  before: number;
  after: number;
}

// --- Main Function ---
export async function generateAndSharePDFReport({
  walletIds,
  transactionType,
  fromDate,
  toDate,
  userId,
}: {
  walletIds: string[];
  transactionType: "Both" | "Expense" | "Income";
  fromDate: Date;
  toDate: Date;
  userId: string;
}) {
  if (!walletIds || walletIds.length === 0) {
    console.warn("No wallet IDs provided for the report.");
    const { uri } = await Print.printToFileAsync({
        html: "<html><body><h1>No wallets selected for the report.</h1></body></html>"
    });
    await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
    return;
  }

  // 1. Fetch Wallets
  const walletsSnap = await getDocs(
    query(
      collection(firestore, "wallets"),
      where("uid", "==", userId),
      where(documentId(), "in", walletIds)
    )
  );
  const wallets = walletsSnap.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as WalletType)
  );

  if (wallets.length === 0) {
    console.warn("Selected wallets not found or access denied.");
     const { uri } = await Print.printToFileAsync({
        html: "<html><body><h1>Selected wallets could not be found.</h1></body></html>"
    });
    await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
    return;
  }

  // 2. Fetch Categories
  const categoriesSnap = await getDocs(
    query(
      collection(firestore, "categories"),
      or(where("uid", "==", userId), where("uid", "==", null))
    )
  );
  const categories = categoriesSnap.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as CategoryType)
  );
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id!, c]));
  const walletMap = Object.fromEntries(wallets.map((w) => [w.id!, w]));

  // 3. Calculate Starting Balances for each wallet at `fromDate`
  // This uses the wallet's current `amount` and rolls back transactions that occurred ON or AFTER `fromDate`.
  const startingPeriodBalances: Record<string, number> = {};
  for (const wallet of wallets) {
    let balanceAtFromDate = wallet.amount; // Start with the wallet's current balance

    // Fetch transactions that occurred on or after fromDate for this wallet
    const txsAffectingCurrentBalanceQuery = query(
      collection(firestore, "transactions"),
      where("uid", "==", userId),
      where("walletId", "==", wallet.id!),
      where("date", ">=", fromDate) // Transactions on or after fromDate
    );

    const txsAffectingCurrentBalanceSnap = await getDocs(txsAffectingCurrentBalanceQuery);

    txsAffectingCurrentBalanceSnap.docs.forEach((doc) => {
      const tx = doc.data() as TransactionType; // No need to convert date here, only type and amount used
      if (tx.type === "Income") {
        balanceAtFromDate! -= tx.amount; // Reverse the income
      } else { // Expense
        balanceAtFromDate! += tx.amount; // Reverse the expense
      }
    });

    startingPeriodBalances[wallet.id!] = balanceAtFromDate || 0;
  }

  // 4. Fetch Transactions for the reporting period (fromDate to toDate)
  const baseConstraints: (
    | QueryFieldFilterConstraint
    | QueryOrderByConstraint
  )[] = [
    where("uid", "==", userId),
    where("walletId", "in", walletIds),
    where("date", ">=", fromDate),
    where("date", "<=", toDate),
    orderBy("date", "asc"), // Crucial: oldest first for running balance
  ];

  if (transactionType !== "Both") {
    baseConstraints.push(where("type", "==", transactionType.toLowerCase()));
  }

  const txQuery = query(
    collection(firestore, "transactions"),
    ...baseConstraints
  );
  const txSnap = await getDocs(txQuery);

  let transactionsInPeriod = txSnap.docs.map((doc) => {
    const data = doc.data();
    let jsDate: Date;
    if (data.date instanceof Timestamp) {
      jsDate = data.date.toDate();
    } else if (data.date && typeof data.date.seconds === 'number' && typeof data.date.nanoseconds === 'number') {
      jsDate = new Date(data.date.seconds * 1000);
    } else if (data.date instanceof Date) {
      jsDate = data.date;
    } else if (typeof data.date === 'string' || typeof data.date === 'number') {
      jsDate = new Date(data.date);
    } else {
      console.warn(`Transaction ${doc.id} has an invalid date format:`, data.date, `. Using current date as fallback.`);
      jsDate = new Date();
    }
    return {
      id: doc.id,
      ...data,
      date: jsDate,
    } as TransactionType & { date: Date };
  });


  // 5. Calculate running balances and detailed transaction info
  const runningBalances = { ...startingPeriodBalances }; // Initialize with balances at fromDate
  let totalIncome = 0;
  let totalExpense = 0;

  const walletStats: Record<
    string,
    { income: number; expense: number; initial: number; final: number; netChange: number }
  > = {};

  wallets.forEach((w) => {
    const initialBalance = startingPeriodBalances[w.id!] !== undefined ? startingPeriodBalances[w.id!] : 0;
    walletStats[w.id!] = {
      income: 0,
      expense: 0,
      initial: initialBalance,
      final: initialBalance, // Will be updated by transactions within the period
      netChange: 0,
    };
  });

  const txsWithBalances: TransactionWithDetails[] = transactionsInPeriod.map((tx) => {
    const walletId = tx.walletId;
    // runningBalances[walletId] is guaranteed to exist here because it's initialized
    // from startingPeriodBalances which covers all wallets in the 'wallets' array,
    // and transactions are filtered by walletIds from that array.
    const before = runningBalances[walletId];

    const after =
      tx.type === "Income" ? before + tx.amount : before - tx.amount;
    runningBalances[walletId] = after; // Update running balance for the next transaction of this wallet

    const categoryName = categoryMap[tx.categoryId]?.label || "Uncategorized";
    const walletName = walletMap[walletId]?.name || "Unknown Wallet";

    if (tx.type === "Income") {
      totalIncome += tx.amount;
      if (walletStats[walletId]) walletStats[walletId].income += tx.amount;
    } else { // Expense
      totalExpense += tx.amount;
      if (walletStats[walletId]) walletStats[walletId].expense += tx.amount;
    }
    
    if (walletStats[walletId]) {
        walletStats[walletId].final = after; // Update final balance for this wallet after this transaction
    }

    return {
      ...(tx as TransactionType & { date: Date }),
      walletName,
      categoryName,
      before,
      after,
    };
  });
  
  Object.keys(walletStats).forEach(walletId => {
    walletStats[walletId].netChange = walletStats[walletId].final - walletStats[walletId].initial;
  });

  const displayTxs = [...txsWithBalances].reverse(); // Newest first for display

  // 6. Generate HTML for PDF (this part remains the same as the previous correct version)
  const overallInitialBalance = wallets.reduce((sum, w) => sum + (walletStats[w.id!]?.initial || 0), 0);
  const overallFinalBalance = wallets.reduce((sum, w) => sum + (walletStats[w.id!]?.final || 0), 0);
  const overallNetChange = totalIncome - totalExpense;

  let html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; margin: 20px; }
          h1, h2, h3 { color: #1e293b; }
          h1 { font-size: 24px; text-align: center; margin-bottom: 10px; }
          h2 { font-size: 18px; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;}
          h3 { font-size: 16px; margin-top: 15px; margin-bottom: 5px; color: #334155; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f1f5f9; font-weight: bold; }
          .summary-section, .params-section { margin-bottom: 25px; padding: 15px; background-color: #f9fafb; border-radius: 8px; }
          .params-section p, .summary-details div { margin-bottom: 5px; font-size: 13px; }
          .params-section strong, .summary-details b { color: #475569; }
          .summary-details hr { border:0; border-top: 1px solid #eee; margin: 10px 0; }
          .total-row td { font-weight: bold; background-color: #f8fafc; }
          .income-amount { color: #16a34a; /* Green */ }
          .expense-amount { color: #dc2626; /* Red */ }
          .net-positive { color: #16a34a; }
          .net-negative { color: #dc2626; }
          .footer { text-align: center; font-size: 10px; color: #777; margin-top: 30px; }
        </style>
      </head>
      <body>
        <h1>BudgetFlow Transaction Report</h1>

        <div class="params-section">
          <h2>Report Parameters</h2>
          <p><strong>Generated on:</strong> ${formatDateStandard(new Date())}</p>
          <p><strong>Wallets:</strong> ${wallets.map(w => w.name).join(', ')}</p>
          <p><strong>Period:</strong> ${formatDateStandard(fromDate)} - ${formatDateStandard(toDate)}</p>
          <p><strong>Transaction Type:</strong> ${transactionType}</p>
        </div>

        ${displayTxs.length > 0 ? `
        <div class="transactions-section">
          <h2>Transactions</h2>
          <table>
            <tr>
              <th>Date</th>
              <th>Wallet</th>
              <th>Description</th>
              <th>Category</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Balance Before</th>
              <th>Balance After</th>
            </tr>
            ${displayTxs
              .map(
                (tx) => `
              <tr>
                <td>${formatDateStandard(tx.date)}</td>
                <td>${tx.walletName}</td>
                <td>${tx.description || ""}</td>
                <td>${tx.categoryName}</td>
                <td>${tx.type}</td>
                <td class="${tx.type === 'Income' ? 'income-amount' : 'expense-amount'}">${formatCurrency(tx.amount)}</td>
                <td>${formatCurrency(tx.before)}</td>
                <td>${formatCurrency(tx.after)}</td>
              </tr>
            `
              )
              .join("")}
          </table>
        </div>
        ` : `<p>No transactions found for the selected criteria.</p>`}

        <div class="summary-section">
          <h2>Wallet Summaries</h2>
          ${wallets
            .map((w) => {
                const stats = walletStats[w.id!];
                if (!stats) return '';
                const netChangeClass = stats.netChange >= 0 ? 'net-positive' : 'net-negative';
                return `
                <div class="summary-details">
                  <h3>${w.name}</h3>
                  Balance at Period Start (${formatDateStandard(fromDate)}): ${formatCurrency(stats.initial)}<br/>
                  Total Income: <span class="income-amount">${formatCurrency(stats.income)}</span><br/>
                  Total Expense: <span class="expense-amount">${formatCurrency(stats.expense)}</span><br/>
                  Net Change for Period: <span class="${netChangeClass}">${formatCurrency(stats.netChange)}</span><br/>
                  Balance at Period End (${formatDateStandard(toDate)}): ${formatCurrency(stats.final)}
                  <hr/>
                </div>`;
            })
            .join("")}
        </div>
        
        <div class="summary-section">
          <h2>Overall Totals for Selected Period</h2>
          <div class="summary-details">
            <b>Starting Balance (all wallets at ${formatDateStandard(fromDate)}):</b> ${formatCurrency(overallInitialBalance)}<br/>
            <b>Total Income:</b> <span class="income-amount">${formatCurrency(totalIncome)}</span><br/>
            <b>Total Expense:</b> <span class="expense-amount">${formatCurrency(totalExpense)}</span><br/>
            <b>Net Change (Overall):</b> <span class="${overallNetChange >= 0 ? 'net-positive' : 'net-negative'}">${formatCurrency(overallNetChange)}</span><br/>
            <b>Ending Balance (all wallets at ${formatDateStandard(toDate)}):</b> ${formatCurrency(overallFinalBalance)}
          </div>
        </div>

        <div class="footer">
          Report generated by BudgetFlow
        </div>
      </body>
    </html>
  `;

  // 7. Generate and Share PDF
  try {
    const { uri } = await Print.printToFileAsync({ html });
    console.log("PDF generated at:", uri);
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Share BudgetFlow Report" });
  } catch (error) {
    console.error("Error generating or sharing PDF:", error);
    throw new Error("Failed to generate or share PDF report.");
  }
}