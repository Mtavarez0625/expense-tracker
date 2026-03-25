"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

type Expense = {
  id: string;
  title: string;
  amount: number;
  category: string;
  createdAt: string;
};

const categories = [
  "Food",
  "Transportation",
  "Entertainment",
  "Utilities",
  "Shopping",
  "Health",
  "Housing",
  "Other",
];

const categoryColors: Record<string, string> = {
  Food: "#22c55e",
  Transportation: "#3b82f6",
  Entertainment: "#8b5cf6",
  Utilities: "#f97316",
  Shopping: "#f59e0b",
  Health: "#ef4444",
  Housing: "#14b8a6",
  Other: "#84cc16",
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);

export default function Home() {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("Food");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: session, status } = useSession();

  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  async function fetchExpenses() {
    try {
      const res = await fetch("/api/expenses", {
        cache: "no-store",
      });

      if (!res.ok) {
        setExpenses([]);
        return;
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        setExpenses(data);
      } else {
        setExpenses([]);
      }
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
      setExpenses([]);
    }
  }

  useEffect(() => {
    if (status === "authenticated") {
      fetchExpenses();
    }
  }, [status]);

  const filteredExpenses = expenses.filter((expense) => {
    const matchesCategory =
      selectedCategory === "All" || expense.category === selectedCategory;

    const matchesSearch = expense.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const categoryTotals = filteredExpenses.reduce(
    (acc: Record<string, number>, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    },
    {}
  );

  const topCategory =
    Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  const chartData = categories
    .map((category) => ({
      category,
      amount: categoryTotals[category] || 0,
    }))
    .filter((item) => item.amount > 0);

  const monthlyTotals: Record<string, number> = {};

  filteredExpenses.forEach((expense) => {
    const date = new Date(expense.createdAt);

    const monthLabel = date.toLocaleString("en-US", {
      month: "short",
      year: "2-digit",
    });

    monthlyTotals[monthLabel] =
      (monthlyTotals[monthLabel] || 0) + expense.amount;
  });

  const monthlyChartData = Object.entries(monthlyTotals)
    .map(([month, amount]) => ({
      month,
      amount,
      date: new Date(month),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(({ month, amount }) => ({
      month,
      amount,
    }));

  const currentMonth = monthlyChartData[monthlyChartData.length - 1];
  const previousMonth = monthlyChartData[monthlyChartData.length - 2];

  const currentMonthAmount = currentMonth?.amount || 0;
  const previousMonthAmount = previousMonth?.amount || 0;

  const monthlyChange =
    previousMonthAmount > 0
      ? ((currentMonthAmount - previousMonthAmount) / previousMonthAmount) * 100
      : null;

  const monthlyChangeColor =
    monthlyChange === null
      ? "text-slate-400"
      : monthlyChange > 0
        ? "text-rose-600"
        : "text-emerald-600";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const numericAmount = Number(amount);

    if (
      !title ||
      !category ||
      Number.isNaN(numericAmount) ||
      numericAmount <= 0
    ) {
      console.error("Invalid expense data");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          amount: numericAmount,
          category,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create expense");
      }

      setTitle("");
      setAmount("");
      setCategory("Food");
      await fetchExpenses();
    } catch (error) {
      console.error("Failed to add expense:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch("/api/expenses", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete expense");
      }

      await fetchExpenses();
    } catch (error) {
      console.error("Failed to delete expense:", error);
    }
  }

  function startEdit(expense: Expense) {
    setEditingId(expense.id);
    setEditTitle(expense.title);
    setEditAmount(String(expense.amount));
    setEditCategory(expense.category);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditAmount("");
    setEditCategory("Food");
  }

  async function handleUpdate(id: string) {
    const numericAmount = Number(editAmount);

    if (
      !editTitle ||
      !editCategory ||
      Number.isNaN(numericAmount) ||
      numericAmount <= 0
    ) {
      console.error("Invalid expense data");
      return;
    }

    try {
      const res = await fetch("/api/expenses", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          title: editTitle,
          amount: numericAmount,
          category: editCategory,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update expense");
      }

      cancelEdit();
      await fetchExpenses();
    } catch (error) {
      console.error("Failed to update expense:", error);
    }
  }

  async function generateAiInsight() {
    try {
      setAiLoading(true);
      setAiInsight("");

      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          total,
          currentMonthAmount,
          previousMonthAmount,
          monthlyChange,
          topCategory,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate AI insight");
      }

      const data = await res.json();
      setAiInsight(data.insight || "No insight available.");
    } catch (error) {
      console.error("AI insight error:", error);
      setAiInsight(
        "Insight temporarily unavailable. Please try again in a moment."
      );
    } finally {
      setAiLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 text-slate-900 md:p-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-slate-500">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 text-slate-900 md:p-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-slate-500">Redirecting to login...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 text-slate-900 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-5xl font-bold tracking-tight text-slate-900 md:text-6xl">
              Expense Tracker
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
              Track spending, analyze trends, and manage your finances with a polished full-stack dashboard built with Next.js, Prisma, and PostgreSQL.
            </p>
          </div>

          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
            <p className="text-sm font-medium text-slate-500">Signed in as</p>
            <p className="mt-1 truncate font-medium text-slate-900">
              {session?.user?.email ?? "Unknown user"}
            </p>

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="mt-5 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800 active:scale-[0.98]"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mb-10 rounded-[2rem] bg-slate-900 p-8 text-white shadow-lg">
          <p className="text-sm font-medium uppercase tracking-[0.12em] text-slate-300">
            Total Spending
          </p>
          <p className="mt-3 text-5xl font-bold tracking-tight md:text-6xl">
            {formatCurrency(total)}
          </p>
        </div>

        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="mb-5">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              Filters
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Narrow your expenses by title or category
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="w-full">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Search expenses
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title..."
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm transition duration-200 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="w-full">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Filter by category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm transition duration-200 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="All">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Spending by Category
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Breakdown of your current spending
            </p>

            {chartData.length === 0 ? (
              <p className="mt-6 text-slate-500">No category data yet.</p>
            ) : (
              <ul className="mt-6">
                {chartData.map(({ category, amount }) => (
                  <li
                    key={category}
                    className="flex items-center justify-between border-b border-slate-100 py-3 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: categoryColors[category] }}
                      />
                      <span className="font-medium text-slate-900">
                        {category}
                      </span>
                    </div>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Spending Chart
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Visual comparison across categories
            </p>

            {chartData.length === 0 ? (
              <p className="mt-6 text-slate-500">No chart data yet.</p>
            ) : (
              <div className="mt-6 h-[320px] w-full">
                <ResponsiveContainer>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="category"
                      tick={{ fill: "#334155", fontSize: 12 }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fill: "#334155", fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        backgroundColor: "#ffffff",
                      }}
                      labelStyle={{ color: "#0f172a" }}
                    />
                    <Bar
                      dataKey="amount"
                      radius={[8, 8, 0, 0]}
                      animationDuration={800}
                      label={{ position: "top", fill: "#111827", fontSize: 12 }}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={categoryColors[entry.category] || "#000000"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
            <p className="text-sm font-medium text-slate-500">This Month</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              {formatCurrency(currentMonthAmount)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
            <p className="text-sm font-medium text-slate-500">Last Month</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              {formatCurrency(previousMonthAmount)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
            <p className="text-sm font-medium text-slate-500">Monthly Change</p>
            <p
              className={`mt-3 text-3xl font-bold tracking-tight ${monthlyChangeColor}`}
            >
              {monthlyChange === null
                ? "N/A"
                : `${monthlyChange >= 0 ? "↑ +" : "↓ "}${Math.abs(monthlyChange).toFixed(1)}%`}
            </p>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Monthly Spending Trend
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Track how your spending changes over time
          </p>

          {monthlyChartData.length < 2 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <p className="font-medium text-slate-600">No monthly data yet.</p>
              <p className="mt-1 text-slate-500">
                Add expenses across multiple months to unlock your spending
                trend.
              </p>
              <p className="mt-4 text-sm font-semibold text-slate-700">
                Current month total: {formatCurrency(currentMonthAmount)}
              </p>
            </div>
          ) : (
            <div className="mt-6 h-[320px] w-full">
              <ResponsiveContainer>
                <LineChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#334155", fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: "#334155", fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      backgroundColor: "#ffffff",
                    }}
                    labelStyle={{ color: "#0f172a" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#0f172a"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                AI Insights
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Generate a smart summary of your spending patterns
              </p>
            </div>

            <button
              type="button"
              onClick={generateAiInsight}
              disabled={aiLoading}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition duration-200 hover:bg-slate-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {aiLoading ? "Generating..." : "Generate Insight"}
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            {aiInsight ? (
              <p className="leading-7 text-slate-700">{aiInsight}</p>
            ) : (
              <p className="text-slate-500">
                No AI insights yet. Click “Generate Insight” to analyze your
                dashboard.
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <form
            onSubmit={handleSubmit}
            className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Add Expense
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Add a new transaction to your dashboard
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="Groceries"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="85"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-slate-900 py-3 text-base font-medium text-white transition duration-200 hover:bg-slate-800 active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? "Adding..." : "Add Expense"}
              </button>
            </div>
          </form>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Recent Expenses
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Your latest transactions at a glance
            </p>

            {filteredExpenses.length === 0 ? (
              <p className="mt-6 text-slate-500">
                No expenses found. Try adjusting your filters.
              </p>
            ) : (
              <ul className="mt-6 space-y-4">
                {filteredExpenses.map((expense) => (
                  <li
                    key={expense.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {editingId === expense.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />

                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />

                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        >
                          {categories.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdate(expense.id)}
                            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition duration-200 hover:bg-slate-800 active:scale-[0.98]"
                          >
                            Save
                          </button>

                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium text-slate-900">
                            {expense.title}
                          </div>

                          <div className="mt-2">
                            <span
                              className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                              style={{
                                backgroundColor:
                                  categoryColors[expense.category] || "#64748b",
                              }}
                            >
                              {expense.category}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-semibold text-slate-900">
                            {formatCurrency(expense.amount)}
                          </div>

                          <div className="mt-2 flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(expense)}
                              className="rounded-xl bg-amber-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-amber-600"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(expense.id)}
                              className="rounded-xl bg-rose-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-600"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}