import React, { useState } from "react";
import {
  Trash2,
  Plus,
  RotateCcw,
  ArrowRight,
  Receipt,
  FileDown,
  X,
} from "lucide-react";
import { jsPDF } from "jspdf";

const ExpenseSplitter = () => {
  const [expenses, setExpenses] = useState([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);
  const invoiceDate = new Date();
  const invoiceNo = `FS-${invoiceDate.getFullYear()}${String(invoiceDate.getMonth() + 1).padStart(2, "0")}${String(invoiceDate.getDate()).padStart(2, "0")}`;

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

  const removeExpense = (id) => {
    setExpenses(expenses.filter((expense) => expense.id !== id));
  };

  const handleReset = () => {
    setExpenses([]);
    setName("");
    setAmount("");
  };

  const totalAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const splitAmount = expenses.length > 0 ? totalAmount / expenses.length : 0;

  const calculateSettlements = () => {
    let balances = expenses.map((e) => ({
      ...e,
      balance: e.amount - splitAmount,
    }));

    let debtors = balances
      .filter((b) => b.balance < -0.01)
      .sort((a, b) => a.balance - b.balance);
    let creditors = balances
      .filter((b) => b.balance > 0.01)
      .sort((a, b) => b.balance - a.balance);

    const transactions = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      let debtor = debtors[i];
      let creditor = creditors[j];

      let amountToSettle = Math.min(Math.abs(debtor.balance), creditor.balance);

      transactions.push({
        from: debtor.name,
        to: creditor.name,
        amount: amountToSettle,
      });

      debtor.balance += amountToSettle;
      creditor.balance -= amountToSettle;

      if (Math.abs(debtor.balance) < 0.01) i++;
      if (creditor.balance < 0.01) j++;
    }

    return transactions;
  };

  const settlements = calculateSettlements();
  const initials = (n) => n.trim().slice(0, 2).toUpperCase();
  const fmt = (n) => `Rs ${n.toFixed(2)}`;
  const dateLabel = invoiceDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const downloadInvoice = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = 595;
    const marginX = 56;
    let y = 64;

    const ink = [21, 25, 30];
    const muted = [92, 100, 112];
    const teal = [15, 139, 108];
    const clay = [199, 93, 77];
    const hair = [225, 222, 212];

    // Masthead
    doc.setFont("times", "bold");
    doc.setFontSize(26);
    doc.setTextColor(...ink);
    doc.text("Fair Share", marginX, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...muted);
    doc.text("SPLIT COSTS  ·  SETTLE THE LEDGER", marginX, y + 16);

    doc.setFontSize(10);
    doc.setTextColor(...ink);
    doc.text(`Invoice ${invoiceNo}`, pageW - marginX, y - 6, {
      align: "right",
    });
    doc.setTextColor(...muted);
    doc.text(dateLabel, pageW - marginX, y + 10, { align: "right" });

    y += 30;
    doc.setDrawColor(...hair);
    doc.setLineWidth(1);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(marginX, y, pageW - marginX, y);
    doc.setLineDashPattern([], 0);
    y += 36;

    // Totals strip
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...muted);
    doc.text("TOTAL SPENT", marginX, y);
    doc.text("FAIR SHARE / PERSON", marginX + 220, y);
    y += 22;
    doc.setFont("times", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...ink);
    doc.text(fmt(totalAmount), marginX, y);
    doc.setTextColor(...teal);
    doc.text(fmt(splitAmount), marginX + 220, y);
    y += 30;

    doc.setDrawColor(...hair);
    doc.setLineWidth(0.75);
    doc.line(marginX, y, pageW - marginX, y);
    y += 28;

    // Who paid
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...muted);
    doc.text("WHO PAID", marginX, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    expenses.forEach((expense) => {
      doc.setTextColor(...ink);
      doc.text(
        expense.name.charAt(0).toUpperCase() + expense.name.slice(1),
        marginX,
        y,
      );
      doc.setTextColor(...muted);
      doc.text(fmt(expense.amount), pageW - marginX, y, { align: "right" });
      y += 20;
    });

    y += 8;
    doc.setDrawColor(...hair);
    doc.line(marginX, y, pageW - marginX, y);
    y += 28;

    // Net balance
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...muted);
    doc.text("NET BALANCE", marginX, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    expenses.forEach((expense) => {
      const balance = expense.amount - splitAmount;
      if (Math.abs(balance) < 0.01) return;
      const isReceiver = balance > 0;
      doc.setTextColor(...ink);
      doc.text(
        expense.name.charAt(0).toUpperCase() + expense.name.slice(1),
        marginX,
        y,
      );
      doc.setTextColor(...(isReceiver ? teal : clay));
      doc.text(
        `${isReceiver ? "+ " : "\u2212 "}${fmt(Math.abs(balance))}`,
        pageW - marginX,
        y,
        { align: "right" },
      );
      y += 20;
    });

    y += 8;
    doc.setDrawColor(...hair);
    doc.setLineWidth(1);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(marginX, y, pageW - marginX, y);
    doc.setLineDashPattern([], 0);
    y += 28;

    // Settlement plan
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...muted);
    doc.text("SETTLEMENT PLAN", marginX, y);
    y += 18;

    if (settlements.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(...teal);
      doc.text("Everyone's settled. No transfers needed.", marginX, y);
      y += 20;
    } else {
      settlements.forEach((tx) => {
        doc.setDrawColor(...hair);
        doc.setLineWidth(0.75);
        doc.roundedRect(marginX, y - 14, pageW - marginX * 2, 30, 2, 2);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...clay);
        const fromText = tx.from.charAt(0).toUpperCase() + tx.from.slice(1);
        doc.text(fromText, marginX + 14, y + 5);
        const fromW = doc.getTextWidth(fromText);

        doc.setTextColor(...muted);
        doc.text("\u2192", marginX + 14 + fromW + 10, y + 5);

        doc.setTextColor(...teal);
        doc.text(
          tx.to.charAt(0).toUpperCase() + tx.to.slice(1),
          marginX + 14 + fromW + 26,
          y + 5,
        );

        doc.setFont("times", "bold");
        doc.setTextColor(...ink);
        doc.text(fmt(tx.amount), pageW - marginX - 14, y + 5, {
          align: "right",
        });

        y += 38;
      });
    }

    y += 16;
    doc.setDrawColor(...hair);
    doc.setLineWidth(1);
    doc.line(marginX, y, pageW - marginX, y);
    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...muted);
    doc.text("Generated with Fair Share", marginX, y);

    doc.save(`fair-share-${invoiceNo}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#15191E] flex items-center justify-center p-6 font-[Inter,sans-serif]">
      <div className="max-w-4xl w-full bg-[#FBF9F3] rounded-sm shadow-2xl overflow-hidden border border-black/5">
        {/* Header — ledger masthead */}
        <div className="px-8 pt-7 pb-6 border-b-2 border-dashed border-[#15191E]/15 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0F8B6C] flex items-center justify-center shrink-0">
              <Receipt size={18} className="text-[#E1F5EE]" strokeWidth={2} />
            </div>
            <div>
              <h1
                className="text-[26px] leading-none text-[#15191E] tracking-tight"
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontWeight: 600,
                }}
              >
                Fair Share
              </h1>
              <p className="text-[13px] text-[#5C6470] mt-1.5 tracking-wide uppercase">
                Split costs &middot; settle the ledger
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInvoice(true)}
              disabled={expenses.length === 0}
              className="flex items-center gap-2 px-3.5 py-2 rounded-sm border border-[#15191E]/15 text-[13px] font-medium text-[#15191E] hover:bg-black/5 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <FileDown size={15} strokeWidth={2} /> Preview invoice
            </button>
            <button
              onClick={handleReset}
              aria-label="Reset all entries"
              className="p-2.5 rounded-full text-[#5C6470] hover:text-[#15191E] hover:bg-black/5 transition cursor-pointer"
            >
              <RotateCcw size={17} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-10">
          {/* LEFT: entry form + roster */}
          <div className="space-y-6">
            <form onSubmit={addExpense} className="space-y-3">
              <h2 className="text-[12px] font-medium tracking-[0.08em] uppercase text-[#5C6470] mb-1">
                Add a person
              </h2>
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#15191E]/15 rounded-sm text-[15px] text-[#15191E] placeholder:text-[#5C6470]/60 focus:outline-none focus:ring-2 focus:ring-[#0F8B6C]/40 focus:border-[#0F8B6C] transition"
              />
              <input
                type="number"
                placeholder="Amount paid"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#15191E]/15 rounded-sm text-[15px] text-[#15191E] placeholder:text-[#5C6470]/60 focus:outline-none focus:ring-2 focus:ring-[#0F8B6C]/40 focus:border-[#0F8B6C] transition"
              />
              <button
                type="submit"
                className="w-full bg-[#15191E] text-[#FBF9F3] py-2.5 rounded-sm text-[14px] font-medium hover:bg-[#0F8B6C] transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus size={16} strokeWidth={2.5} /> Add to ledger
              </button>
            </form>

            <div>
              <h2 className="text-[12px] font-medium tracking-[0.08em] uppercase text-[#5C6470] mb-2">
                Who paid
              </h2>
              {expenses.length === 0 ? (
                <p className="text-[13px] text-[#5C6470]/70 italic py-3">
                  No entries yet — add the first payer above.
                </p>
              ) : (
                <ul className="divide-y divide-[#15191E]/8 max-h-64 overflow-y-auto">
                  {expenses.map((expense) => (
                    <li
                      key={expense.id}
                      className="flex items-center justify-between py-2.5 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#15191E]/8 flex items-center justify-center shrink-0">
                          <span className="text-[11px] font-medium text-[#15191E]/70">
                            {initials(expense.name)}
                          </span>
                        </div>
                        <span className="text-[14px] text-[#15191E] truncate capitalize">
                          {expense.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[14px] tabular-nums text-[#5C6470]">
                          {fmt(expense.amount)}
                        </span>
                        <button
                          onClick={() => removeExpense(expense.id)}
                          aria-label={`Remove ${expense.name}`}
                          className="text-[#5C6470]/0 group-hover:text-[#C75D4D] transition cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* RIGHT: results */}
          <div className="flex flex-col gap-6">
            {/* Totals strip */}
            <div className="grid grid-cols-2 divide-x divide-[#15191E]/10 border border-[#15191E]/10 rounded-sm overflow-hidden">
              <div className="px-5 py-4">
                <div className="text-[11px] tracking-[0.08em] uppercase text-[#5C6470]">
                  Total spent
                </div>
                <div
                  className="text-[26px] text-[#15191E] mt-0.5 tabular-nums"
                  style={{ fontFamily: "Georgia, serif", fontWeight: 600 }}
                >
                  {fmt(totalAmount)}
                </div>
              </div>
              <div className="px-5 py-4">
                <div className="text-[11px] tracking-[0.08em] uppercase text-[#5C6470]">
                  Fair share / person
                </div>
                <div
                  className="text-[26px] text-[#0F8B6C] mt-0.5 tabular-nums"
                  style={{ fontFamily: "Georgia, serif", fontWeight: 600 }}
                >
                  {fmt(splitAmount)}
                </div>
              </div>
            </div>

            {/* Net balance */}
            <div>
              <h3 className="text-[12px] font-medium tracking-[0.08em] uppercase text-[#5C6470] mb-2">
                Net balance
              </h3>
              {expenses.length === 0 ? (
                <p className="text-[13px] text-[#5C6470]/70 italic">
                  Balances appear once people are added.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {expenses.map((expense) => {
                    const balance = expense.amount - splitAmount;
                    if (Math.abs(balance) < 0.01) return null;
                    const isReceiver = balance > 0;
                    return (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between text-[14px] py-1"
                      >
                        <span className="text-[#15191E] capitalize">
                          {expense.name}
                        </span>
                        <span
                          className={`font-medium tabular-nums ${
                            isReceiver ? "text-[#0F8B6C]" : "text-[#C75D4D]"
                          }`}
                        >
                          {isReceiver ? "+ " : "− "}
                          {fmt(Math.abs(balance))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Settlement plan — signature element */}
            <div className="border-t-2 border-dashed border-[#15191E]/15 pt-5 flex-grow">
              <h3 className="text-[12px] font-medium tracking-[0.08em] uppercase text-[#5C6470] mb-3">
                Settlement plan
              </h3>

              {expenses.length < 2 ? (
                <p className="text-[13px] text-[#5C6470]/70 italic py-6 text-center">
                  Add at least two people to see who owes whom.
                </p>
              ) : settlements.length === 0 ? (
                <p className="text-[14px] text-[#0F8B6C] font-medium text-center py-6">
                  Everyone's settled. No transfers needed.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {settlements.map((tx, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 bg-white border border-[#15191E]/10 rounded-sm px-4 py-3"
                    >
                      <span className="text-[14px] font-medium text-[#C75D4D] capitalize truncate">
                        {tx.from}
                      </span>
                      <ArrowRight
                        size={14}
                        className="text-[#5C6470]/50 shrink-0"
                      />
                      <span className="text-[14px] font-medium text-[#0F8B6C] capitalize truncate">
                        {tx.to}
                      </span>
                      <span
                        className="ml-auto text-[14px] tabular-nums text-[#15191E] shrink-0"
                        style={{
                          fontFamily: "Georgia, serif",
                          fontWeight: 600,
                        }}
                      >
                        {fmt(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60"
          onClick={() => setShowInvoice(false)}
        >
          <div
            className="max-w-lg w-full max-h-[85vh] overflow-y-auto bg-[#FBF9F3] rounded-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal toolbar */}
            <div className="sticky top-0 bg-[#15191E] px-6 py-3.5 flex items-center justify-between">
              <span className="text-[13px] text-[#FBF9F3]/70 font-medium">
                Invoice preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadInvoice}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-sm bg-[#0F8B6C] text-[#E1F5EE] text-[13px] font-medium hover:bg-[#0d7a5f] transition cursor-pointer"
                >
                  <FileDown size={14} strokeWidth={2.5} /> Download PDF
                </button>
                <button
                  onClick={() => setShowInvoice(false)}
                  aria-label="Close preview"
                  className="p-1.5 rounded-full text-[#FBF9F3]/70 hover:text-[#FBF9F3] hover:bg-white/10 transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Invoice body — mirrors the PDF layout */}
            <div className="px-8 py-7">
              <div className="flex items-start justify-between">
                <div>
                  <h2
                    className="text-[24px] leading-none text-[#15191E]"
                    style={{ fontFamily: "Georgia, serif", fontWeight: 600 }}
                  >
                    Fair Share
                  </h2>
                  <p className="text-[10px] tracking-[0.1em] uppercase text-[#5C6470] mt-1.5">
                    Split costs &middot; settle the ledger
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] text-[#15191E]">
                    Invoice {invoiceNo}
                  </p>
                  <p className="text-[12px] text-[#5C6470] mt-0.5">
                    {dateLabel}
                  </p>
                </div>
              </div>

              <div className="border-t-2 border-dashed border-[#15191E]/15 mt-6 mb-6" />

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] tracking-[0.08em] uppercase text-[#5C6470]">
                    Total spent
                  </p>
                  <p
                    className="text-[22px] text-[#15191E] mt-1 tabular-nums"
                    style={{ fontFamily: "Georgia, serif", fontWeight: 600 }}
                  >
                    {fmt(totalAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.08em] uppercase text-[#5C6470]">
                    Fair share / person
                  </p>
                  <p
                    className="text-[22px] text-[#0F8B6C] mt-1 tabular-nums"
                    style={{ fontFamily: "Georgia, serif", fontWeight: 600 }}
                  >
                    {fmt(splitAmount)}
                  </p>
                </div>
              </div>

              <div className="border-t border-[#15191E]/10 mt-6 pt-5">
                <p className="text-[10px] tracking-[0.08em] uppercase text-[#5C6470] mb-3">
                  Who paid
                </p>
                <div className="space-y-2">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex justify-between text-[14px]"
                    >
                      <span className="text-[#15191E] capitalize">
                        {expense.name}
                      </span>
                      <span className="text-[#5C6470] tabular-nums">
                        {fmt(expense.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#15191E]/10 mt-6 pt-5">
                <p className="text-[10px] tracking-[0.08em] uppercase text-[#5C6470] mb-3">
                  Net balance
                </p>
                <div className="space-y-2">
                  {expenses.map((expense) => {
                    const balance = expense.amount - splitAmount;
                    if (Math.abs(balance) < 0.01) return null;
                    const isReceiver = balance > 0;
                    return (
                      <div
                        key={expense.id}
                        className="flex justify-between text-[14px]"
                      >
                        <span className="text-[#15191E] capitalize">
                          {expense.name}
                        </span>
                        <span
                          className={`font-medium tabular-nums ${
                            isReceiver ? "text-[#0F8B6C]" : "text-[#C75D4D]"
                          }`}
                        >
                          {isReceiver ? "+ " : "\u2212 "}
                          {fmt(Math.abs(balance))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t-2 border-dashed border-[#15191E]/15 mt-6 pt-5">
                <p className="text-[10px] tracking-[0.08em] uppercase text-[#5C6470] mb-3">
                  Settlement plan
                </p>
                {settlements.length === 0 ? (
                  <p className="text-[13px] text-[#0F8B6C] font-medium">
                    Everyone's settled. No transfers needed.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {settlements.map((tx, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2.5 bg-white border border-[#15191E]/10 rounded-sm px-3.5 py-2.5"
                      >
                        <span className="text-[13px] font-medium text-[#C75D4D] capitalize truncate">
                          {tx.from}
                        </span>
                        <ArrowRight
                          size={13}
                          className="text-[#5C6470]/50 shrink-0"
                        />
                        <span className="text-[13px] font-medium text-[#0F8B6C] capitalize truncate">
                          {tx.to}
                        </span>
                        <span
                          className="ml-auto text-[13px] tabular-nums text-[#15191E] shrink-0"
                          style={{
                            fontFamily: "Georgia, serif",
                            fontWeight: 600,
                          }}
                        >
                          {fmt(tx.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-[#15191E]/10 mt-7 pt-4">
                <p className="text-[10px] text-[#5C6470]">
                  Generated with Fair Share
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseSplitter;
