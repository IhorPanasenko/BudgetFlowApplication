import { CategoryType, TransactionType, WalletType } from "@/types";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

// Helper to format currency
const formatCurrency = (amount: number) =>
  "$" + Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 });

export async function generateAndSharePDFReport({
  wallets,
  filteredTxs,
  categories,
}: {
  wallets: WalletType[];
  filteredTxs: TransactionType[];
  categories: CategoryType[];
}) {
  // Prepare wallet lookup
  const walletMap = Object.fromEntries(wallets.map((w) => [w.id, w]));
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  // Sort transactions by date descending
  const sortedTxs = [...filteredTxs].sort(
    (a, b) =>
      new Date(b.date as Date).getTime() - new Date(a.date as Date).getTime()
  );

  // Prepare running balances per wallet
  const walletBalances: Record<string, number> = {};
  wallets.forEach((w) => {
    walletBalances[w.id!] = w.amount || 0;
  });

  // To calculate before/after for each transaction, process in reverse (oldest to newest)
  const txsWithBalances = [...sortedTxs].reverse().map((tx) => {
    const walletId = tx.walletId;
    const after = walletBalances[walletId];
    const before = tx.type === "Income" ? after - tx.amount : after + tx.amount;
    walletBalances[walletId] = before;
    const categoryName = categoryMap[tx.categoryId]?.label || "";
    return {
      ...tx,
      walletName: walletMap[walletId]?.name || "",
      categoryName,
      before,
      after,
    };
  });

  // Now reverse back to latest-to-oldest for printing
  txsWithBalances.reverse();

  // Calculate totals
  let totalIncome = 0;
  let totalExpense = 0;
  let walletStats: Record<
    string,
    { income: number; expense: number; initial: number; final: number }
  > = {};
  wallets.forEach((w) => {
    walletStats[w.id!] = {
      income: 0,
      expense: 0,
      initial: walletBalances[w.id!], // after all txs processed, this is the initial
      final: w.amount || 0,
    };
  });

  txsWithBalances.forEach((tx) => {
    if (tx.type === "Income") {
      totalIncome += tx.amount;
      walletStats[tx.walletId].income += tx.amount;
    }
    if (tx.type === "Expense") {
      totalExpense += tx.amount;
      walletStats[tx.walletId].expense += tx.amount;
    }
  });

  // HTML content
  let html = `
    <html>
      <head>
        <style>
          body { font-family: Arial; color: #222; }
          h1, h2 { color: #1e293b; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th, td { border: 1px solid #ddd; padding: 6px 4px; font-size: 12px; }
          th { background: #f1f5f9; }
          .summary { margin-bottom: 24px; }
        </style>
      </head>
      <body>
        <h1>BudgetFlow Report</h1>
        <div class="summary">
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
            ${txsWithBalances
              .map(
                (tx) => `
              <tr>
                <td>${new Date(tx.date as Date).toLocaleDateString()}</td>
                <td>${tx.walletName}</td>
                <td>${tx.description || ""}</td>
                <td>${tx.categoryName || ""}</td>
                <td>${tx.type}</td>
                <td>${formatCurrency(tx.amount)}</td>
                <td>${formatCurrency(tx.before)}</td>
                <td>${formatCurrency(tx.after)}</td>
              </tr>
            `
              )
              .join("")}
          </table>
        </div>
        <div class="summary">
          <h2>Wallet Summaries</h2>
          ${wallets
            .map(
              (w) => `
            <div>
              <b>${w.name}</b><br/>
              Total Income: ${formatCurrency(walletStats[w.id!].income)}<br/>
              Total Expense: ${formatCurrency(walletStats[w.id!].expense)}<br/>
              Net Change: ${formatCurrency(
                walletStats[w.id!].final - walletStats[w.id!].initial
              )}
            </div>
            <br/>
          `
            )
            .join("")}
          <h2>Overall Totals</h2>
          <div>
            <b>Total Income:</b> ${formatCurrency(totalIncome)}<br/>
            <b>Total Expense:</b> ${formatCurrency(totalExpense)}<br/>
            <b>Net Change:</b> ${formatCurrency(
              wallets.reduce(
                (sum, w) =>
                  sum + (walletStats[w.id!].final - walletStats[w.id!].initial),
                0
              )
            )}
          </div>
        </div>
      </body>
    </html>
  `;

  // Generate PDF
  const { uri } = await Print.printToFileAsync({ html });
  // Share PDF
  await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
}
