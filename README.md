# 💸 Expense Tracker (Full Stack)

A production-ready expense tracking application with secure authentication, real-time analytics, and AI-powered financial insights.

---

## 🚀 Live Demo
👉 https://expense-tracker-wine-theta-32.vercel.app/

---

## 📸 Screenshots

### 🧾 Dashboard
![Dashboard](https://raw.githubusercontent.com/Mtavarez0625/expense-tracker/main/public/screenshots/expense-dashboard.png)

### 📊 Financial Overview
![Overview](https://raw.githubusercontent.com/Mtavarez0625/expense-tracker/main/public/screenshots/expense-overview.png)

### 📊 Spending Breakdown
![Breakdown](https://raw.githubusercontent.com/Mtavarez0625/expense-tracker/main/public/screenshots/expense-breakdown.png)

### 📈 Monthly Spending Trend
![Trend](https://raw.githubusercontent.com/Mtavarez0625/expense-tracker/main/public/screenshots/expense-monthly-trend.png)

### 🧠 AI Financial Insights
![AI](https://raw.githubusercontent.com/Mtavarez0625/expense-tracker/main/public/screenshots/expense-ai.png)

### 📋 Expense Management
![Management](https://raw.githubusercontent.com/Mtavarez0625/expense-tracker/main/public/screenshots/expense-management.png)

---

## 🧠 Problem

Managing personal finances is often fragmented across spreadsheets, banking apps, and manual tracking.  
Most users lack:

- Real-time visibility into spending habits  
- Clear month-over-month comparisons  
- Actionable insights to improve financial decisions  

As a result, users track data — but don’t gain meaningful insights.

---

## 💡 Solution

Built a full-stack expense tracking platform that transforms raw financial data into actionable insights:

- Centralizes all expenses into a single, structured system  
- Separates analytics data from UI filtering for accurate insights  
- Provides real-time dashboards with category and monthly breakdowns  
- Tracks spending trends across multiple months  
- Integrates AI to generate intelligent financial summaries  

The system is designed with a production mindset, prioritizing data integrity, scalability, and user experience.

---

## 🧠 Engineering Decisions

- Implemented dual data layers:
  - `analyticsExpenses` → drives charts, summaries, AI insights  
  - `displayExpenses` → drives filtered UI lists  

  This prevents UI filters (search) from corrupting analytics.

- Ensured consistent data ordering (newest first) for better UX

- Designed API routes with strict user scoping (`userId`) for security

- Used Prisma for type-safe queries and scalable database access

- Built reusable formatting utilities (currency, date) for consistency

---

## ⚙️ Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS  
- **Backend:** Next.js API Routes  
- **Database:** PostgreSQL (Neon)  
- **ORM:** Prisma  
- **Authentication:** NextAuth (Credentials)  
- **AI Integration:** OpenAI API  
- **Deployment:** Vercel  

---

## 🧩 Core Features

- 🔐 Secure authentication system  
- 💸 Add, edit, and delete expenses  
- 🔍 Category filtering and search  
- 📊 Monthly analytics and visual charts  
- 🤖 AI-generated financial insights and spending patterns  

---

## 🏗️ Architecture

- RESTful API routes for data operations  
- Prisma ORM for type-safe database access  
- Modular component structure for scalability  
- Server-side data fetching with optimized performance  
- Environment-based configuration for secure deployment  

---

## 🧪 Production Considerations

- Input validation and error handling  
- Secure environment variables for API keys  
- Optimized queries using Prisma  
- Clean separation of concerns (UI / API / DB)  
- Scalable deployment using Vercel + Neon  

---

## 💡 Key Highlights

- Built full authentication system from scratch  
- Integrated AI to enhance user decision-making  
- Designed for scalability and maintainability  
- Production-ready deployment with real database  

---

## 👤 Author

**Marcos Tavarez**  
Full Stack Developer  
Available for remote, hybrid, or relocation opportunities
