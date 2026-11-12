# 🚦 Delhi Traffic Accident & Risk Analysis Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Status: Complete](https://img.shields.io/badge/Status-Complete-emerald.svg)]()
[![Platform: Web%20Dashboard%20%26%20Power%20BI](https://img.shields.io/badge/Platform-Web%20Dashboard%20%26%20Power%20BI-purple.svg)]()

> **An End-to-End Smart City Traffic Safety Intelligence System, Accident Hotspot Detection & Risk Predictive Platform for Delhi NCR.**

---

## 📌 Project Overview

The **Delhi Traffic & Accident Risk Analysis Platform** is an end-to-end data analytics and urban intelligence project designed to analyze traffic accident patterns, identify high-risk zones across Delhi, and empower decision-makers with real-time risk predictions.

The platform transforms raw accident telemetry and traffic data (500 verified incidents across 10 Delhi corridors) into interactive visualizations, corridor safety matrices, and machine learning risk heuristics.

---

## 🚀 Quick Launch (Web Interface)

You don't need to install Python, Node, or any complex packages! The interface runs directly in your browser:

### Option 1: Double-Click Launcher (Recommended)
Simply double-click **`launch_dashboard.bat`** or double-click **`index.html`** in your browser (Chrome, Edge, Firefox, Brave).

### Option 2: Local HTTP Server (Optional)
If you prefer running a local server on `http://localhost:8080`, right-click **`server.ps1`** and choose **Run with PowerShell**.

---

## 📊 Platform Features & Architecture

### 1. 📈 Executive Analytics Dashboard
- **Real-time KPI Metrics**:
  - **Total Accidents**: 500 verified cases
  - **Total Casualties**: 1,438 (1,193 Injuries, 245 Fatalities)
  - **High-Risk Severity Rate**: 31.2% (156 cases requiring trauma care)
  - **Fatality Ratio**: 17.0% of casualties
  - **Top Accident Hotspot**: Lajpat Nagar (65 cases, 40 fatalities)
  - **Peak Hazard Window**: 18:00 – 21:00 (Evening Rush)
- **Interactive Visualizations (Chart.js)**:
  - **Hourly Crash Volume & Severity Curve**: 24-hour crash distribution highlighting evening spikes.
  - **Area Hotspot Ranking**: Stacked horizontal bar chart breakdown across all 10 areas by severity.
  - **Weather Impact Multiplier**: Comparison across Rain, Fog, Smog, Storm, and Clear weather conditions.
  - **Vehicle Class Fatality Share**: Doughnut distribution of bikes, trucks, buses, cars, and autos.
  - **Violation Factors Breakdown**: Polar area chart showing the impact of wrong-side driving, speeding, and signal jumping.
  - **Monthly Trajectory**: 12-month crash timeline.
- **Corridor Safety Matrix**:
  - Tabulated casualty rankings, fatality rates, primary hazard causes, and Delhi Police priority actions for all 10 monitored sectors.
- **Recent Incident Log & Filter Strip**:
  - Real-time incident feed and interactive corridor, severity, weather, vehicle, violation, and time slot filtering.

### 2. 🧠 AI Crash Risk Predictor & Route Advisor
- Simulates real-time risk based on multi-factor empirical weights:
  - Input corridor, hour of day, weather, vehicle type, and observed driver violation.
  - Outputs a **0–100% Crash Danger Index**, **Injury Probability**, and **Fatality Probability**.
  - Generates dynamic safety advisories and Delhi Police Standard Operating Procedures (SOP).

### 3. 📋 Live Incident Data Explorer
- Complete 500-record dataset table with instant keyword search.
- Multi-column sorting and clean pagination.
- **Add Incident Modal**: Inject new incident telemetry with real-time recalculations.
- **Export to CSV**: 1-click download of filtered records.
- **Print / PDF Report**: Formatted CSS print view.

### 4. 📑 Project Report & Insights
- Comprehensive academic documentation of problem statements, methodology, data cleaning, and municipal policy recommendations.

---

## 🛠️ Tools & Technologies Used

| Technology | Purpose |
|------------|---------|
| **HTML5 & Vanilla JavaScript** | Core interactive web interface architecture |
| **Tailwind CSS & Custom Twilight Plum CSS** | Responsive UI styled with Obsidian Plum (`#190019`), Royal Plum (`#2B124C`), Violet Wine (`#522B5B`), Dusky Rose (`#854F6C`), Soft Blush (`#DFB6B2`), and Warm Cream (`#FBE4D8`) |
| **Chart.js** | Animated, responsive charting and analytics |
| **Power BI & DAX** | Original BI dashboard file (`Traffic dashboard.pbix`) |
| **PowerShell TcpListener** | Standalone zero-dependency local web server (`server.ps1`) |

---

## 📂 Project Directory Structure

```text
Delhi-traffic-accident-and-risk-analysis/
├── index.html                   # Main Interactive Web Dashboard
├── styles.css                   # Custom Twilight Plum theme styling & responsive layout
├── app.js                       # Analytics engine, filters, predictor & Chart.js logic
├── accidents_data.js            # Enriched 500 incident records dataset
├── launch_dashboard.bat         # 1-Click launcher for Windows
├── server.ps1                   # Lightweight PowerShell local HTTP server
├── Traffic dashboard.pbix       # Original Power BI Dashboard file
├── Data set/
│   ├── Delhi_Traffic_Accident_Dataset.xlsx  # Cleaned Excel dataset
│   ├── Raw data                             # Tab-separated dataset
│   └── accidents.json                       # Geo-enriched JSON dataset
├── Project report/
│   └── Report                               # Comprehensive project report
└── README.md                    # Project documentation
```

---

## 💡 Key Research Insights & Business Recommendations

1. **Outer Ring Road Speed Enforcement**: Low traffic density segments allow excessive speeds, tripling fatality rates. Speed cameras should be deployed along Lajpat Nagar and Punjabi Bagh flyovers.
2. **Dynamic Winter Fog VMS Signs**: Fog and smog reduce visibility and multiply severe crashes by 45%. Automated Variable Message Signs are vital on arterial entryways.
3. **Median Barriers Against Wrong-Side Driving**: Wrong-side maneuvers caused 59 fatalities (the highest of any violation). Installing high-visibility median barriers at Saket and Karol Bagh is critical.
4. **Adaptive Signal Phasing in Evening Rush**: Crash frequency peaks between 18:00 and 21:00 due to commuter congestion and signal jumps.
