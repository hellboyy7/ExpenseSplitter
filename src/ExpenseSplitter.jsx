import React, { useState } from "react";
import { Trash2, PlusCircle, RefreshCw, ArrowRight } from "lucide-react";

const ExpenseSplitter = () => {
  const [expenses, setExpenses] = useState([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  // 1. Add Expense
  const addExpense = (e) => {
    e.preventDefault();
    if (!name || !amount) return;
    const newExpense = {
      id: Date.now(),
      name: name,
      amount: parseFloat(amount),
    };
    setExpenses([...expenses, newExpense]);
    setName("");
    setAmount("");
  };

  // 2. Remove Expense
  const removeExpense = (id) => {
    setExpenses(expenses.filter((expense) => expense.id !== id));
  };

  // 3. Reset
  const handleReset = () => {
    setExpenses([]);
    setName("");
    setAmount("");
  };

  // --- CORE LOGIC ---
  const totalAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const splitAmount = expenses.length > 0 ? totalAmount / expenses.length : 0;

  // This function calculates exactly who pays whom
  const calculateSettlements = () => {
    // 1. Calculate net balance for everyone (Paid - FairShare)
    let balances = expenses.map((e) => ({
      ...e,
      balance: e.amount - splitAmount,
    }));

    // 2. Separate into Debtors (Negative) and Creditors (Positive)
    let debtors = balances
      .filter((b) => b.balance < -0.01)
      .sort((a, b) => a.balance - b.balance);
    let creditors = balances
      .filter((b) => b.balance > 0.01)
      .sort((a, b) => b.balance - a.balance);

    const transactions = [];
    let i = 0; // debtor index
    let j = 0; // creditor index

    // 3. Match them up
    while (i < debtors.length && j < creditors.length) {
      let debtor = debtors[i];
      let creditor = creditors[j];

      // The amount to settle is the minimum of what debtor owes vs what creditor is owed
      let amountToSettle = Math.min(Math.abs(debtor.balance), creditor.balance);

      // Create the transaction record
      transactions.push({
        from: debtor.name,
        to: creditor.name,
        amount: amountToSettle,
      });

      // Update balances
      debtor.balance += amountToSettle;
      creditor.balance -= amountToSettle;

      // Move pointers if settled (using a small epsilon for float precision)
      if (Math.abs(debtor.balance) < 0.01) i++;
      if (creditor.balance < 0.01) j++;
    }

    return transactions;
  };

  const settlements = calculateSettlements();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">FairShare Calculator</h1>
            <p className="text-blue-100 text-sm">Split bills & settle debts</p>
          </div>
          <button
            onClick={handleReset}
            className="p-2 bg-blue-500 hover:bg-blue-700 rounded-full transition"
          >
            <RefreshCw size={20} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT SIDE: Inputs & List */}
          <div className="space-y-6">
            <form
              onSubmit={addExpense}
              className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200"
            >
              <h2 className="font-semibold text-gray-700">Add Person</h2>
              <div className="flex flex-col space-y-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  type="number"
                  placeholder="Amount Paid"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <PlusCircle size={18} /> Add
              </button>
            </form>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex justify-between items-center bg-white p-3 border rounded shadow-sm"
                >
                  <div>
                    <span className="font-bold text-gray-700 capitalize">
                      {expense.name}
                    </span>
                    <div className="text-xs text-gray-500">
                      Paid: Rs {expense.amount.toFixed(2)}
                    </div>
                  </div>
                  <button
                    onClick={() => removeExpense(expense.id)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE: Results */}
          <div className="flex flex-col gap-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded border text-center">
                <div className="text-xs text-gray-500 uppercase">Total</div>
                <div className="text-xl font-bold text-blue-600">
                  Rs {totalAmount.toFixed(2)}
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded border text-center">
                <div className="text-xs text-gray-500 uppercase">
                  Each Person
                </div>
                <div className="text-xl font-bold text-green-600">
                  Rs {splitAmount.toFixed(2)}
                </div>
              </div>
            </div>

            {/* --- NEW SECTION: Net Balance Summary (The View from your screenshot) --- */}
            <div className="bg-slate-50 p-4 rounded border">
              <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase">
                Net Balance
              </h3>
              <div className="space-y-2">
                {expenses.map((expense) => {
                  const balance = expense.amount - splitAmount;
                  if (Math.abs(balance) < 0.01) return null; // Skip if settled
                  const isReceiver = balance > 0;
                  return (
                    <div
                      key={expense.id}
                      className={`flex justify-between p-2 rounded text-sm ${
                        isReceiver
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      <span className="font-medium">{expense.name}</span>
                      <span>
                        {isReceiver ? "Gets" : "Pays"} Rs{" "}
                        {Math.abs(balance).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* --- NEW SECTION: Final Settlement Plan (Who pays Whom) --- */}
            <div className="bg-blue-50 p-5 rounded-lg border border-blue-100 flex-grow">
              <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                <RefreshCw size={16} /> Settlement Plan
              </h3>

              <div className="space-y-3">
                {expenses.length < 2 ? (
                  <p className="text-gray-400 text-sm italic text-center py-4">
                    Add at least 2 people to calculate.
                  </p>
                ) : settlements.length === 0 ? (
                  <p className="text-green-600 text-center font-medium">
                    All settled! No debts.
                  </p>
                ) : (
                  settlements.map((tx, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white p-3 rounded shadow-sm border border-blue-100"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-red-600 capitalize">
                          {tx.from}
                        </span>
                        <span className="text-xs text-gray-400">pays</span>
                        <span className="font-bold text-green-600 capitalize">
                          {tx.to}
                        </span>
                      </div>
                      <div className="font-bold text-gray-800">
                        Rs {tx.amount.toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseSplitter;
