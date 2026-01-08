# Process Performance Explorer

A modern **Angular 19** application that visualizes event-based process data using **D3.js**. This tool helps users explore process flows, identify bottlenecks, and track Key Performance Indicators (KPIs) over time.

<img width="1441" height="950" alt="Screenshot 2026-01-08 at 12 35 26" src="https://github.com/user-attachments/assets/ce343eff-a752-4bfb-bb92-245509761e7a" />

## 🚀 Features

### 1. Process Flow Diagram
**"How does the process actually run?"**
- A force-directed graph showing the journey of all cases.
- **Nodes (Circles):** Represent process activities. Bigger nodes = more frequent activities.
- **Links (Arrows):** Represent transitions between steps. Thicker lines = more common paths.
- **Interaction:** Click any node to filter the entire dashboard by that activity.

### 2. Bottleneck Analysis
**"Where are we losing time?"**
- A bar chart visualizing the **average duration** of each activity.
- **Red Bars:** Critical bottlenecks (slowest steps).
- **Green Bars:** Efficient steps (fastest steps).
- Helps identify which part of the process needs optimization (e.g., "Order Shipped" taking 15 hours vs. "Payment Received" taking 2 hours).

### 3. KPI Timeline
**"Are we getting faster or slower?"**
- A dual-axis line chart tracking performance over time.
- **🔵 Blue Line (Efficiency):** Average Case Duration (Hours). Lower is better. Shows how long it takes to complete an order from start to finish.
- **🟢 Green Line (Throughput):** Completed Cases (Count). Higher is better. Shows how many orders were finished on that specific day.
- **Insight:** Allows you to correlate speed vs. volume (e.g., "Did our speed drop when volume spiked?").

### 4. Cross-Filtering
- Interactive data exploration.
- Clicking on a chart element (like a bar or node) instantly filters all other charts to focus on that specific activity.

---

## 🛠️ Tech Stack

- **Framework:** Angular 19 (Standalone Components, Signals, Control Flow)
- **Visualization:** D3.js v7
- **Tooling:** Nx Monorepo
- **Styling:** CSS Variables (Dark Theme)

---

## 🏁 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/process-performance-explorer.git
   ```

2. Navigate to the project directory:
   ```bash
   cd process-explorer
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

### Running the App

Start the development server:

```bash
npm start
# OR
npx nx serve
```

Open your browser and navigate to `http://localhost:4200`.

---

## 📂 Project Structure

```
src/app/
├── components/
│   ├── process-graph/       # D3 Force-directed graph
│   ├── bottleneck-chart/    # D3 Bar chart
│   └── kpi-timeline/        # D3 Dual-axis line chart
├── models/
│   └── event-log.model.ts   # TypeScript interfaces
├── services/
│   └── process-data.service.ts # Data processing & Signals
└── app.component.ts         # Main layout
```
