/**
 * Delhi Traffic Accident & Risk Analysis Platform
 * Lead Analytics & Interface Architecture
 * Theme: Twilight Plum & Blush Ivory (#190019, #2B124C, #522B5B, #854F6C, #DFB6B2, #FBE4D8)
 */

(function () {
  'use strict';

  // Regional Metadata & Baseline Hazard Scoring
  const AREA_METADATA = {
    "Punjabi Bagh": { zone: "West Delhi", roadType: "Urban Arterial / Ring Road", baseRisk: 72 },
    "Karol Bagh": { zone: "Central Delhi", roadType: "Commercial / High Density", baseRisk: 78 },
    "Rohini": { zone: "North West Delhi", roadType: "Suburban Grid / High Speed", baseRisk: 68 },
    "Chandni Chowk": { zone: "North Delhi", roadType: "Historic Core / Mixed Pedestrian", baseRisk: 74 },
    "Lajpat Nagar": { zone: "South Delhi", roadType: "Ring Road Interchange / Heavy Transit", baseRisk: 88 },
    "Kashmere Gate": { zone: "North Delhi", roadType: "Interstate Transit Hub / Flyover", baseRisk: 79 },
    "Saket": { zone: "South Delhi", roadType: "Major Arterial / Commercial Hub", baseRisk: 82 },
    "Janakpuri": { zone: "West Delhi", roadType: "Suburban Arterial / Metro Corridor", baseRisk: 64 },
    "Connaught Place": { zone: "Central Delhi", roadType: "Inner/Outer Radial Corridor", baseRisk: 71 },
    "Dwarka": { zone: "South West Delhi", roadType: "Planned Sub-City / Wide Expressways", baseRisk: 66 }
  };

  // State Management
  const state = {
    allData: [],
    filteredData: [],
    charts: {},
    activeTab: 'overview',
    filters: {
      area: 'All',
      severity: 'All',
      weather: 'All',
      vehicle: 'All',
      violation: 'All',
      timeSlot: 'All',
      search: ''
    },
    pagination: {
      page: 1,
      pageSize: 15,
      sortField: 'date',
      sortOrder: 'desc'
    }
  };

  // Document Ready Initialization
  document.addEventListener('DOMContentLoaded', () => {
    loadDataset();
    setupEventListeners();
  });

  // Load and Validate Dataset
  function loadDataset() {
    if (window.DELHI_ACCIDENTS_DATA && Array.isArray(window.DELHI_ACCIDENTS_DATA)) {
      initializeWithData(window.DELHI_ACCIDENTS_DATA);
    } else {
      fetch('./Data set/accidents.json')
        .then(res => res.json())
        .then(data => {
          initializeWithData(data);
        })
        .catch(err => {
          console.warn('Direct fetch failed, falling back to local fallback data...', err);
          showToast('Failed to load dataset. Please ensure accidents_data.js is present.', 'error');
        });
    }
  }

  function initializeWithData(data) {
    state.allData = data.map(item => ({
      ...item,
      hour: item.hour !== undefined ? item.hour : parseInt(item.time.split(':')[0], 10),
      injuries: parseInt(item.injuries || 0, 10),
      fatalities: parseInt(item.fatalities || 0, 10),
      totalCasualties: parseInt(item.injuries || 0, 10) + parseInt(item.fatalities || 0, 10)
    }));

    applyFilters();
    initCharts();
    renderAll();
    initPredictor();
  }

  // Event Listeners
  function setupEventListeners() {
    // Tab Switching
    document.querySelectorAll('[data-tab-target]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-tab-target');
        switchTab(target);
      });
    });

    // Filters Dropdowns
    const filterIds = [
      { id: 'filterArea', key: 'area' },
      { id: 'filterSeverity', key: 'severity' },
      { id: 'filterWeather', key: 'weather' },
      { id: 'filterVehicle', key: 'vehicle' },
      { id: 'filterViolation', key: 'violation' },
      { id: 'filterTimeSlot', key: 'timeSlot' }
    ];

    filterIds.forEach(({ id, key }) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', (e) => {
          state.filters[key] = e.target.value;
          state.pagination.page = 1;
          applyFilters();
          renderAll();
        });
      }
    });

    // Reset Filters Button
    document.getElementById('resetFiltersBtn')?.addEventListener('click', () => {
      resetFilters();
    });

    // Search Input (Explorer Table)
    const searchInput = document.getElementById('tableSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.filters.search = e.target.value.trim().toLowerCase();
        state.pagination.page = 1;
        applyFilters();
        renderTable();
      });
    }

    // Export CSV
    document.getElementById('exportCsvBtn')?.addEventListener('click', exportToCSV);

    // Print Report
    document.getElementById('printReportBtn')?.addEventListener('click', () => {
      window.print();
    });

    // Add Incident Form
    document.getElementById('addIncidentForm')?.addEventListener('submit', handleAddIncident);

    // Predictor Form
    document.getElementById('runPredictorBtn')?.addEventListener('click', runRiskPrediction);
    ['predArea', 'predWeather', 'predTime', 'predVehicle', 'predViolation'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', runRiskPrediction);
    });
  }

  // Tab Navigation
  function switchTab(tabId) {
    state.activeTab = tabId;
    document.querySelectorAll('.tab-view').forEach(view => {
      view.classList.add('hidden');
    });
    const targetView = document.getElementById(`tab-${tabId}`);
    if (targetView) {
      targetView.classList.remove('hidden');
    }

    document.querySelectorAll('[data-tab-target]').forEach(btn => {
      if (btn.getAttribute('data-tab-target') === tabId) {
        btn.classList.add('bg-[#854F6C]', 'text-[#FBE4D8]', 'shadow-lg');
        btn.classList.remove('text-[#DFB6B2]', 'hover:bg-[#522B5B]');
      } else {
        btn.classList.remove('bg-[#854F6C]', 'text-[#FBE4D8]', 'shadow-lg');
        btn.classList.add('text-[#DFB6B2]', 'hover:bg-[#522B5B]');
      }
    });
  }

  // Filter Application
  function applyFilters() {
    state.filteredData = state.allData.filter(item => {
      if (state.filters.area !== 'All' && item.area !== state.filters.area) return false;
      if (state.filters.severity !== 'All' && item.severity !== state.filters.severity) return false;
      if (state.filters.weather !== 'All' && item.weather !== state.filters.weather) return false;
      if (state.filters.vehicle !== 'All' && item.vehicle !== state.filters.vehicle) return false;
      if (state.filters.violation !== 'All' && item.violation !== state.filters.violation) return false;
      if (state.filters.timeSlot !== 'All') {
        const hr = item.hour;
        if (state.filters.timeSlot === 'morning' && !(hr >= 7 && hr < 12)) return false;
        if (state.filters.timeSlot === 'afternoon' && !(hr >= 12 && hr < 17)) return false;
        if (state.filters.timeSlot === 'evening' && !(hr >= 17 && hr < 22)) return false;
        if (state.filters.timeSlot === 'night' && !(hr >= 22 || hr < 7)) return false;
      }
      if (state.filters.search) {
        const q = state.filters.search;
        const textMatch = (item.id && item.id.toLowerCase().includes(q)) ||
                          (item.area && item.area.toLowerCase().includes(q)) ||
                          (item.vehicle && item.vehicle.toLowerCase().includes(q)) ||
                          (item.violation && item.violation.toLowerCase().includes(q)) ||
                          (item.weather && item.weather.toLowerCase().includes(q)) ||
                          (item.severity && item.severity.toLowerCase().includes(q));
        if (!textMatch) return false;
      }
      return true;
    });

    updateFilterBadges();
  }

  function resetFilters() {
    state.filters = {
      area: 'All',
      severity: 'All',
      weather: 'All',
      vehicle: 'All',
      violation: 'All',
      timeSlot: 'All',
      search: ''
    };

    const ids = ['filterArea', 'filterSeverity', 'filterWeather', 'filterVehicle', 'filterViolation', 'filterTimeSlot'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = 'All';
    });

    if (document.getElementById('tableSearchInput')) {
      document.getElementById('tableSearchInput').value = '';
    }

    applyFilters();
    renderAll();
    showToast('Filters reset to default view');
  }

  // Remove individual filter chip
  window.removeSingleFilter = function (filterKey) {
    if (state.filters[filterKey] !== undefined) {
      state.filters[filterKey] = 'All';
      const idMap = {
        area: 'filterArea',
        severity: 'filterSeverity',
        weather: 'filterWeather',
        vehicle: 'filterVehicle',
        violation: 'filterViolation',
        timeSlot: 'filterTimeSlot'
      };
      const el = document.getElementById(idMap[filterKey]);
      if (el) el.value = 'All';
      applyFilters();
      renderAll();
    }
  };

  // Corridor focus from table
  window.focusCorridor = function (areaName) {
    state.filters.area = areaName;
    const select = document.getElementById('filterArea');
    if (select) select.value = areaName;
    applyFilters();
    renderAll();
    switchTab('overview');
    showToast(`Focused analytics on: ${areaName}`);
  };

  // Backward compatibility alias
  window.filterByAreaFromMap = window.focusCorridor;

  function updateFilterBadges() {
    const filterConfig = [
      { key: 'area', label: 'Area', id: 'filterArea' },
      { key: 'severity', label: 'Severity', id: 'filterSeverity' },
      { key: 'weather', label: 'Weather', id: 'filterWeather' },
      { key: 'vehicle', label: 'Vehicle', id: 'filterVehicle' },
      { key: 'violation', label: 'Violation', id: 'filterViolation' },
      { key: 'timeSlot', label: 'Time', id: 'filterTimeSlot' }
    ];

    let activeCount = 0;
    const chipsHtml = [];

    filterConfig.forEach(({ key, label, id }) => {
      const el = document.getElementById(id);
      const val = state.filters[key];
      if (val !== 'All') {
        activeCount++;
        el?.classList.add('filter-active');
        chipsHtml.push(`
          <span class="filter-chip">
            <span>${label}: <strong>${val}</strong></span>
            <i class="fa-solid fa-xmark filter-chip-remove" onclick="window.removeSingleFilter('${key}')" title="Remove filter"></i>
          </span>
        `);
      } else {
        el?.classList.remove('filter-active');
      }
    });

    if (state.filters.search) {
      activeCount++;
      chipsHtml.push(`
        <span class="filter-chip">
          <span>Search: <strong>"${state.filters.search}"</strong></span>
          <i class="fa-solid fa-xmark filter-chip-remove" onclick="document.getElementById('tableSearchInput').value=''; state.filters.search=''; applyFilters(); renderAll();" title="Remove search"></i>
        </span>
      `);
    }

    const container = document.getElementById('activeChipsContainer');
    if (container) {
      if (chipsHtml.length > 0) {
        container.innerHTML = `
          <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-[#522B5B]/50 w-full">
            <span class="text-[11px] font-bold text-[#DFB6B2] uppercase tracking-wider flex items-center gap-1">
              <i class="fa-solid fa-filter text-[#DFB6B2]"></i> Active Filters:
            </span>
            ${chipsHtml.join('')}
            <button onclick="document.getElementById('resetFiltersBtn').click()" class="text-[11px] font-semibold text-[#DFB6B2] hover:text-[#FBE4D8] underline ml-2">
              Clear All
            </button>
          </div>
        `;
        container.classList.remove('hidden');
      } else {
        container.innerHTML = '';
        container.classList.add('hidden');
      }
    }

    const badge = document.getElementById('activeFiltersCount');
    if (badge) {
      if (activeCount > 0) {
        badge.innerText = `${activeCount} Active`;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    const total = state.allData.length;
    const count = state.filteredData.length;
    const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
    setText('filteredCountBadge', `Found ${count} of ${total} records (${pct}%)`);
  }

  // Render All Views
  function renderAll() {
    renderKPIs();
    updateCharts();
    renderTable();
    renderCorridorMatrix();
    renderRecentIncidentsFeed();
  }

  // KPI Calculations & Rendering
  function renderKPIs() {
    const data = state.filteredData;
    const totalAccidents = data.length;
    const totalInjuries = data.reduce((acc, cur) => acc + (cur.injuries || 0), 0);
    const totalFatalities = data.reduce((acc, cur) => acc + (cur.fatalities || 0), 0);
    const totalCasualties = totalInjuries + totalFatalities;

    const highSeverityCount = data.filter(d => d.severity === 'High').length;
    const highRiskPct = totalAccidents > 0 ? ((highSeverityCount / totalAccidents) * 100).toFixed(1) : 0;
    const fatalityRatePct = totalCasualties > 0 ? ((totalFatalities / totalCasualties) * 100).toFixed(1) : 0;

    const areaCounts = {};
    data.forEach(d => {
      areaCounts[d.area] = (areaCounts[d.area] || 0) + 1;
    });
    let topArea = 'N/A';
    let topAreaCount = 0;
    Object.entries(areaCounts).forEach(([ar, cnt]) => {
      if (cnt > topAreaCount) {
        topAreaCount = cnt;
        topArea = ar;
      }
    });

    const hourCounts = {};
    data.forEach(d => {
      hourCounts[d.hour] = (hourCounts[d.hour] || 0) + 1;
    });
    let peakHr = -1;
    let peakHrCount = 0;
    Object.entries(hourCounts).forEach(([hr, cnt]) => {
      if (cnt > peakHrCount) {
        peakHrCount = cnt;
        peakHr = parseInt(hr, 10);
      }
    });
    const peakHourText = peakHr >= 0 ? `${String(peakHr).padStart(2, '0')}:00 - ${String((peakHr + 1) % 24).padStart(2, '0')}:00` : 'N/A';

    const violationCounts = {};
    data.forEach(d => {
      violationCounts[d.violation] = (violationCounts[d.violation] || 0) + 1;
    });
    let topViolation = 'N/A';
    let topViolCount = 0;
    Object.entries(violationCounts).forEach(([v, c]) => {
      if (c > topViolCount) {
        topViolCount = c;
        topViolation = v;
      }
    });

    animateNumber('kpiTotalAccidents', totalAccidents);
    animateNumber('kpiTotalInjuries', totalInjuries);
    animateNumber('kpiTotalFatalities', totalFatalities);
    animateNumber('kpiTotalCasualties', totalCasualties);

    setText('kpiHighRiskRate', `${highRiskPct}%`);
    setText('kpiFatalityRate', `${fatalityRatePct}%`);
    setText('kpiTopHotspot', topArea);
    setText('kpiTopHotspotSub', `${topAreaCount} recorded cases`);
    setText('kpiPeakHour', peakHourText);
    setText('kpiPeakHourSub', `${peakHrCount} peak crashes`);
    setText('kpiTopViolation', topViolation);
    setText('kpiTopViolationSub', `${topViolCount} incidents`);
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
  }

  function animateNumber(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    const start = parseInt(el.innerText.replace(/,/g, '') || 0, 10);
    const duration = 400;
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.floor(start + (target - start) * progress);
      el.innerText = current.toLocaleString();
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.innerText = target.toLocaleString();
      }
    }
    requestAnimationFrame(update);
  }

  // Chart.js Visualizations in Twilight Plum Palette
  function getChartColors() {
    return {
      textColor: '#DFB6B2',
      gridColor: 'rgba(223, 182, 178, 0.1)',
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif"
    };
  }

  function initCharts() {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js library not yet loaded, retrying on window load.');
      window.addEventListener('load', () => {
        if (typeof Chart !== 'undefined' && !state.charts.hourly) {
          initCharts();
          updateCharts();
        }
      });
      return;
    }
    try {
      initHourlyChart();
      initAreaChart();
      initWeatherChart();
      initVehicleChart();
      initViolationChart();
      initMonthlyChart();
    } catch (err) {
      console.warn('Error during chart initialization:', err);
    }
  }

  // 1. Hourly Trend Chart
  function initHourlyChart() {
    const ctx = document.getElementById('hourlyChart')?.getContext('2d');
    if (!ctx) return;
    const colors = getChartColors();

    state.charts.hourly = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`),
        datasets: [
          {
            label: 'Total Crashes',
            data: [],
            backgroundColor: 'rgba(133, 79, 108, 0.85)',
            hoverBackgroundColor: '#DFB6B2',
            borderRadius: 4
          },
          {
            type: 'line',
            label: 'High Severity Crashes',
            data: [],
            borderColor: '#f43f5e',
            backgroundColor: 'rgba(244, 63, 94, 0.15)',
            borderWidth: 2.5,
            tension: 0.35,
            pointRadius: 3,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: colors.textColor, font: { family: colors.fontFamily } }
          },
          tooltip: {
            backgroundColor: '#190019',
            borderColor: '#522B5B',
            borderWidth: 1,
            titleColor: '#FBE4D8',
            bodyColor: '#DFB6B2',
            padding: 10
          }
        },
        scales: {
          x: {
            ticks: { color: colors.textColor, font: { family: colors.fontFamily, size: 10 } },
            grid: { display: false }
          },
          y: {
            ticks: { color: colors.textColor, font: { family: colors.fontFamily } },
            grid: { color: colors.gridColor }
          }
        }
      }
    });
  }

  // 2. Area Risk Breakdown Chart (Stacked Horizontal)
  function initAreaChart() {
    const ctx = document.getElementById('areaChart')?.getContext('2d');
    if (!ctx) return;
    const colors = getChartColors();

    state.charts.area = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          {
            label: 'High Severity',
            data: [],
            backgroundColor: '#f43f5e',
            borderRadius: 3
          },
          {
            label: 'Medium Severity',
            data: [],
            backgroundColor: '#854F6C',
            borderRadius: 3
          },
          {
            label: 'Low Severity',
            data: [],
            backgroundColor: '#DFB6B2',
            borderRadius: 3
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            ticks: { color: colors.textColor },
            grid: { color: colors.gridColor }
          },
          y: {
            stacked: true,
            ticks: { color: '#FBE4D8', font: { weight: 600 } },
            grid: { display: false }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: colors.textColor }
          },
          tooltip: {
            backgroundColor: '#190019',
            borderColor: '#522B5B',
            borderWidth: 1,
            titleColor: '#FBE4D8',
            bodyColor: '#DFB6B2'
          }
        }
      }
    });
  }

  // 3. Weather Impact Chart
  function initWeatherChart() {
    const ctx = document.getElementById('weatherChart')?.getContext('2d');
    if (!ctx) return;
    const colors = getChartColors();

    state.charts.weather = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Rainy', 'Fog', 'Smog', 'Storm', 'Clear'],
        datasets: [
          {
            label: 'Injuries',
            data: [],
            backgroundColor: '#DFB6B2',
            borderRadius: 4
          },
          {
            label: 'Fatalities',
            data: [],
            backgroundColor: '#f43f5e',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: colors.textColor }
          },
          tooltip: {
            backgroundColor: '#190019',
            borderColor: '#522B5B',
            borderWidth: 1,
            titleColor: '#FBE4D8',
            bodyColor: '#DFB6B2'
          }
        },
        scales: {
          x: {
            ticks: { color: colors.textColor },
            grid: { display: false }
          },
          y: {
            ticks: { color: colors.textColor },
            grid: { color: colors.gridColor }
          }
        }
      }
    });
  }

  // 4. Vehicle Distribution Chart
  function initVehicleChart() {
    const ctx = document.getElementById('vehicleChart')?.getContext('2d');
    if (!ctx) return;
    const colors = getChartColors();

    state.charts.vehicle = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: [
              '#FBE4D8', '#DFB6B2', '#854F6C', '#522B5B', '#d977a8', '#f43f5e'
            ],
            borderWidth: 2,
            borderColor: '#2B124C'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: colors.textColor, boxWidth: 12 }
          },
          tooltip: {
            backgroundColor: '#190019',
            borderColor: '#522B5B',
            borderWidth: 1,
            titleColor: '#FBE4D8',
            bodyColor: '#DFB6B2'
          }
        },
        cutout: '65%'
      }
    });
  }

  // 5. Violation Breakdown Chart
  function initViolationChart() {
    const ctx = document.getElementById('violationChart')?.getContext('2d');
    if (!ctx) return;
    const colors = getChartColors();

    state.charts.violation = new Chart(ctx, {
      type: 'polarArea',
      data: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: [
              'rgba(244, 63, 94, 0.8)',
              'rgba(223, 182, 178, 0.8)',
              'rgba(133, 79, 108, 0.8)',
              'rgba(82, 43, 91, 0.8)',
              'rgba(251, 228, 216, 0.8)',
              'rgba(217, 119, 168, 0.8)'
            ],
            borderWidth: 1.5,
            borderColor: '#2B124C'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: colors.textColor, boxWidth: 12 }
          },
          tooltip: {
            backgroundColor: '#190019',
            borderColor: '#522B5B',
            borderWidth: 1,
            titleColor: '#FBE4D8',
            bodyColor: '#DFB6B2'
          }
        },
        scales: {
          r: {
            ticks: { display: false },
            grid: { color: colors.gridColor }
          }
        }
      }
    });
  }

  // 6. Monthly Trajectory Chart
  function initMonthlyChart() {
    const ctx = document.getElementById('monthlyChart')?.getContext('2d');
    if (!ctx) return;
    const colors = getChartColors();

    state.charts.monthly = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
          {
            label: 'Monthly Accidents',
            data: [],
            borderColor: '#DFB6B2',
            backgroundColor: 'rgba(133, 79, 108, 0.25)',
            borderWidth: 3,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#FBE4D8',
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#190019',
            borderColor: '#522B5B',
            borderWidth: 1,
            titleColor: '#FBE4D8',
            bodyColor: '#DFB6B2'
          }
        },
        scales: {
          x: {
            ticks: { color: colors.textColor },
            grid: { display: false }
          },
          y: {
            ticks: { color: colors.textColor },
            grid: { color: colors.gridColor }
          }
        }
      }
    });
  }

  // Update Charts With Dynamic Filtered Data
  function updateCharts() {
    if (typeof Chart === 'undefined') return;
    const data = state.filteredData;

    try {
      // 1. Hourly Chart
      if (state.charts.hourly) {
        const hourlyTotal = Array(24).fill(0);
        const hourlyHigh = Array(24).fill(0);
        data.forEach(d => {
          if (d.hour >= 0 && d.hour < 24) {
            hourlyTotal[d.hour]++;
            if (d.severity === 'High') {
              hourlyHigh[d.hour]++;
            }
          }
        });
        state.charts.hourly.data.datasets[0].data = hourlyTotal;
        state.charts.hourly.data.datasets[1].data = hourlyHigh;
        state.charts.hourly.update();
      }

      // 2. Area Chart
      if (state.charts.area) {
        const areaMap = {};
        data.forEach(d => {
          if (!areaMap[d.area]) areaMap[d.area] = { high: 0, med: 0, low: 0, total: 0 };
          areaMap[d.area].total++;
          if (d.severity === 'High') areaMap[d.area].high++;
          else if (d.severity === 'Medium') areaMap[d.area].med++;
          else areaMap[d.area].low++;
        });
        const sortedAreas = Object.keys(areaMap).sort((a, b) => areaMap[b].total - areaMap[a].total);
        state.charts.area.data.labels = sortedAreas;
        state.charts.area.data.datasets[0].data = sortedAreas.map(a => areaMap[a].high);
        state.charts.area.data.datasets[1].data = sortedAreas.map(a => areaMap[a].med);
        state.charts.area.data.datasets[2].data = sortedAreas.map(a => areaMap[a].low);
        state.charts.area.update();
      }

      // 3. Weather Chart
      if (state.charts.weather) {
        const weathers = ['Rainy', 'Fog', 'Smog', 'Storm', 'Clear'];
        const weatherStats = {};
        weathers.forEach(w => weatherStats[w] = { injuries: 0, fatalities: 0 });
        data.forEach(d => {
          if (weatherStats[d.weather]) {
            weatherStats[d.weather].injuries += d.injuries;
            weatherStats[d.weather].fatalities += d.fatalities;
          }
        });
        state.charts.weather.data.labels = weathers;
        state.charts.weather.data.datasets[0].data = weathers.map(w => weatherStats[w].injuries);
        state.charts.weather.data.datasets[1].data = weathers.map(w => weatherStats[w].fatalities);
        state.charts.weather.update();
      }

      // 4. Vehicle Chart
      if (state.charts.vehicle) {
        const vehCounts = {};
        data.forEach(d => {
          vehCounts[d.vehicle] = (vehCounts[d.vehicle] || 0) + 1;
        });
        const sortedVehs = Object.keys(vehCounts).sort((a, b) => vehCounts[b] - vehCounts[a]);
        state.charts.vehicle.data.labels = sortedVehs;
        state.charts.vehicle.data.datasets[0].data = sortedVehs.map(v => vehCounts[v]);
        state.charts.vehicle.update();
      }

      // 5. Violation Chart
      if (state.charts.violation) {
        const violCounts = {};
        data.forEach(d => {
          violCounts[d.violation] = (violCounts[d.violation] || 0) + 1;
        });
        const sortedViols = Object.keys(violCounts).sort((a, b) => violCounts[b] - violCounts[a]);
        state.charts.violation.data.labels = sortedViols;
        state.charts.violation.data.datasets[0].data = sortedViols.map(v => violCounts[v]);
        state.charts.violation.update();
      }

      // 6. Monthly Chart
      if (state.charts.monthly) {
        const monthly = Array(12).fill(0);
        data.forEach(d => {
          if (d.date) {
            const m = parseInt(d.date.split('-')[1], 10) - 1;
            if (m >= 0 && m < 12) monthly[m]++;
          }
        });
        state.charts.monthly.data.datasets[0].data = monthly;
        state.charts.monthly.update();
      }
    } catch (err) {
      console.warn('Error during chart update:', err);
    }
  }

  // Render Corridor Safety Matrix
  function renderCorridorMatrix() {
    const tbody = document.getElementById('corridorMatrixBody');
    if (!tbody) return;

    const areaMap = {};
    Object.keys(AREA_METADATA).forEach(area => {
      areaMap[area] = {
        name: area,
        meta: AREA_METADATA[area],
        total: 0,
        injuries: 0,
        fatalities: 0,
        highSeverity: 0,
        violations: {}
      };
    });

    state.filteredData.forEach(d => {
      if (areaMap[d.area]) {
        const a = areaMap[d.area];
        a.total++;
        a.injuries += d.injuries;
        a.fatalities += d.fatalities;
        if (d.severity === 'High') a.highSeverity++;
        a.violations[d.violation] = (a.violations[d.violation] || 0) + 1;
      }
    });

    const sorted = Object.values(areaMap).sort((a, b) => b.total - a.total);

    tbody.innerHTML = '';
    sorted.forEach((item, idx) => {
      const topVio = Object.entries(item.violations).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'N/A';
      const highPct = item.total > 0 ? Math.round((item.highSeverity / item.total) * 100) : 0;
      
      let riskPill = `<span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#522B5B]/50 text-[#DFB6B2] border border-[#522B5B]">Low</span>`;

      if (item.highSeverity >= 16 || item.fatalities >= 25 || item.total >= 50) {
        riskPill = `<span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">🔴 Critical</span>`;
      } else if (item.total >= 25 || item.fatalities >= 12) {
        riskPill = `<span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#854F6C]/40 text-[#FBE4D8] border border-[#854F6C]">🟠 Severe</span>`;
      }

      let action = 'Deploy radar speed checks & lane separators';
      if (item.name === 'Lajpat Nagar') action = 'Install ANPR Speed Gantry & Ring Road flyover illumination';
      else if (item.name === 'Saket') action = 'Erect physical median barriers & anti-wrong-way tire spikes';
      else if (item.name === 'Karol Bagh') action = 'Pedestrian refuge islands & signal phase optimization';
      else if (item.name === 'Kashmere Gate') action = 'ISBT transit flow redesign & VMS winter fog alerts';
      else if (item.name === 'Rohini') action = 'High-speed speed cameras & intersection rumble strips';
      else if (item.name === 'Chandni Chowk') action = 'Restricted commercial loading hours & pedestrian bollards';

      const tr = document.createElement('tr');
      tr.className = 'border-b border-[#522B5B]/40 hover:bg-[#522B5B]/30 transition text-xs';
      tr.innerHTML = `
        <td class="py-3 px-4 font-mono font-bold text-[#DFB6B2]">#${idx + 1}</td>
        <td class="py-3 px-4">
          <span class="font-bold text-[#FBE4D8] block">${item.name}</span>
          <span class="text-[11px] text-[#DFB6B2]">${item.meta.zone}</span>
        </td>
        <td class="py-3 px-4 font-extrabold text-[#FBE4D8]">${item.total}</td>
        <td class="py-3 px-4 text-[#DFB6B2]">${item.injuries + item.fatalities} <span class="text-[10px] text-rose-400 font-semibold">(${item.fatalities} dead)</span></td>
        <td class="py-3 px-4">
          <div class="flex items-center gap-2">
            <div class="w-16 h-2 bg-[#190019] rounded-full overflow-hidden border border-[#522B5B]">
              <div class="h-full bg-rose-500 rounded-full" style="width: ${highPct}%"></div>
            </div>
            <span class="font-bold text-[#FBE4D8] text-[11px]">${highPct}%</span>
          </div>
        </td>
        <td class="py-3 px-4 font-semibold text-[#DFB6B2]">${topVio}</td>
        <td class="py-3 px-4">${riskPill}</td>
        <td class="py-3 px-4 text-[11px] text-[#DFB6B2]">${action}</td>
        <td class="py-3 px-4 text-right">
          <button onclick="window.focusCorridor('${item.name}')" class="px-2.5 py-1 rounded-md text-[11px] font-bold btn-plum">
            Focus
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Render Recent Incidents Feed
  function renderRecentIncidentsFeed() {
    const feed = document.getElementById('recentIncidentsFeed');
    if (!feed) return;

    const data = [...state.filteredData].slice(0, 5);
    feed.innerHTML = '';

    if (data.length === 0) {
      feed.innerHTML = `<p class="text-xs text-[#DFB6B2] py-4 text-center">No recent records matching current filter.</p>`;
      return;
    }

    data.forEach(item => {
      const div = document.createElement('div');
      div.className = 'p-3 rounded-xl bg-[#190019]/60 border border-[#522B5B]/60 flex items-center justify-between gap-3 text-xs';
      
      let badge = 'badge-medium';
      if (item.severity === 'High') badge = 'badge-high';
      else if (item.severity === 'Low') badge = 'badge-low';

      div.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-[#522B5B]/60 flex items-center justify-center text-[#DFB6B2] font-bold">
            ${getVehicleIcon(item.vehicle)}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-mono font-bold text-[#DFB6B2]">${item.id}</span>
              <span class="font-bold text-[#FBE4D8]">${item.area}</span>
              <span class="text-[10px] text-[#DFB6B2]">${item.date} • ${item.time}</span>
            </div>
            <p class="text-[11px] text-[#DFB6B2]">
              Violation: <strong class="text-[#FBE4D8]">${item.violation}</strong> | Weather: <strong>${item.weather}</strong>
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badge}">${item.severity}</span>
          <div class="text-right text-[11px] font-bold">
            <span class="text-[#DFB6B2]">${item.injuries} inj</span> / 
            <span class="text-rose-400">${item.fatalities} dead</span>
          </div>
        </div>
      `;
      feed.appendChild(div);
    });
  }

  // Incident Table & Pagination
  function renderTable() {
    const tbody = document.getElementById('incidentTableBody');
    if (!tbody) return;

    let data = [...state.filteredData];

    const { sortField, sortOrder } = state.pagination;
    data.sort((a, b) => {
      let va = a[sortField];
      let vb = b[sortField];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortOrder === 'asc' ? -1 : 1;
      if (va > vb) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const totalRows = data.length;
    const { page, pageSize } = state.pagination;
    const totalPages = Math.ceil(totalRows / pageSize) || 1;
    const startIdx = (page - 1) * pageSize;
    const pageRows = data.slice(startIdx, startIdx + pageSize);

    tbody.innerHTML = '';
    if (pageRows.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center py-10 text-[#DFB6B2]">
            <i class="fa-solid fa-magnifying-glass text-3xl mb-2 text-[#854F6C] block"></i>
            <span class="font-semibold text-sm text-[#FBE4D8] block">No traffic incidents match your active filters.</span>
            <button onclick="document.getElementById('resetFiltersBtn').click()" class="mt-3 px-3 py-1.5 rounded-lg btn-plum text-xs">
              Reset Filters
            </button>
          </td>
        </tr>
      `;
    } else {
      pageRows.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-[#522B5B]/40 hover:bg-[#522B5B]/30 transition text-sm';

        let sevClass = 'badge-medium';
        if (row.severity === 'High') sevClass = 'badge-high';
        else if (row.severity === 'Low') sevClass = 'badge-low';

        tr.innerHTML = `
          <td class="py-3 px-4 font-mono font-bold text-[#DFB6B2]">${row.id}</td>
          <td class="py-3 px-4 whitespace-nowrap text-[#FBE4D8]">${row.date} <span class="text-xs text-[#DFB6B2]">${row.time}</span></td>
          <td class="py-3 px-4 font-semibold text-[#FBE4D8]">${row.area}</td>
          <td class="py-3 px-4 text-[#DFB6B2]">
            <span class="inline-flex items-center gap-1.5">
              ${getVehicleIcon(row.vehicle)}
              ${row.vehicle}
            </span>
          </td>
          <td class="py-3 px-4 text-[#DFB6B2]">${row.violation}</td>
          <td class="py-3 px-4 text-[#DFB6B2]">
            <span class="inline-flex items-center gap-1.5">
              ${getWeatherIcon(row.weather)}
              ${row.weather}
            </span>
          </td>
          <td class="py-3 px-4">
            <span class="px-2.5 py-1 rounded-full text-xs font-bold ${sevClass}">${row.severity}</span>
          </td>
          <td class="py-3 px-4 text-center text-[#DFB6B2] font-bold">${row.injuries}</td>
          <td class="py-3 px-4 text-center font-bold ${row.fatalities > 0 ? 'text-rose-400' : 'text-[#DFB6B2]'}">${row.fatalities}</td>
        </tr>
        `;
        tbody.appendChild(tr);
      });
    }

    setText('tablePageInfo', `Showing ${totalRows === 0 ? 0 : startIdx + 1} - ${Math.min(startIdx + pageSize, totalRows)} of ${totalRows}`);
    
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    if (prevBtn) {
      prevBtn.disabled = page <= 1;
      prevBtn.onclick = () => {
        if (state.pagination.page > 1) {
          state.pagination.page--;
          renderTable();
        }
      };
    }
    if (nextBtn) {
      nextBtn.disabled = page >= totalPages;
      nextBtn.onclick = () => {
        if (state.pagination.page < totalPages) {
          state.pagination.page++;
          renderTable();
        }
      };
    }
  }

  function getVehicleIcon(veh) {
    switch (veh) {
      case 'Bus': return '<i class="fa-solid fa-bus text-[#DFB6B2]"></i>';
      case 'Truck': return '<i class="fa-solid fa-truck-moving text-[#DFB6B2]"></i>';
      case 'Bike': return '<i class="fa-solid fa-motorcycle text-[#DFB6B2]"></i>';
      case 'Car': return '<i class="fa-solid fa-car-side text-[#FBE4D8]"></i>';
      case 'Auto': return '<i class="fa-solid fa-taxi text-[#DFB6B2]"></i>';
      case 'E-Rickshaw': return '<i class="fa-solid fa-bolt text-[#DFB6B2]"></i>';
      default: return '<i class="fa-solid fa-car text-[#DFB6B2]"></i>';
    }
  }

  function getWeatherIcon(weather) {
    switch (weather) {
      case 'Rainy': return '<i class="fa-solid fa-cloud-showers-heavy text-[#DFB6B2]"></i>';
      case 'Fog': return '<i class="fa-solid fa-smog text-[#DFB6B2]"></i>';
      case 'Smog': return '<i class="fa-solid fa-industry text-[#DFB6B2]"></i>';
      case 'Storm': return '<i class="fa-solid fa-cloud-bolt text-[#DFB6B2]"></i>';
      case 'Clear': return '<i class="fa-solid fa-sun text-[#FBE4D8]"></i>';
      default: return '<i class="fa-solid fa-cloud text-[#DFB6B2]"></i>';
    }
  }

  // AI Risk Assessment Engine & Route Safety Predictor
  function initPredictor() {
    runRiskPrediction();
  }

  function runRiskPrediction() {
    const area = document.getElementById('predArea')?.value || 'Saket';
    const hour = parseInt(document.getElementById('predTime')?.value || 19, 10);
    const weather = document.getElementById('predWeather')?.value || 'Fog';
    const vehicle = document.getElementById('predVehicle')?.value || 'Bike';
    const violation = document.getElementById('predViolation')?.value || 'Over Speeding';

    const areaWeights = {
      'Lajpat Nagar': 35, 'Saket': 32, 'Karol Bagh': 30, 'Kashmere Gate': 28,
      'Chandni Chowk': 26, 'Punjabi Bagh': 25, 'Rohini': 24, 'Connaught Place': 23,
      'Dwarka': 22, 'Janakpuri': 20
    };

    const weatherWeights = {
      'Fog': 25, 'Rainy': 22, 'Storm': 20, 'Smog': 18, 'Clear': 8
    };

    const violationWeights = {
      'Wrong Side': 28, 'Over Speeding': 25, 'Drunk Driving': 27,
      'Signal Jump': 20, 'No Seatbelt': 16, 'No Helmet': 18
    };

    const vehicleWeights = {
      'Bike': 20, 'E-Rickshaw': 18, 'Truck': 17, 'Bus': 16, 'Auto': 15, 'Car': 12
    };

    let timePenalty = 10;
    if (hour >= 17 && hour <= 21) timePenalty = 22;
    else if (hour >= 0 && hour <= 4) timePenalty = 24;
    else if (hour >= 7 && hour <= 10) timePenalty = 15;

    const baseScore = (areaWeights[area] || 25) * 0.28 +
                      (weatherWeights[weather] || 15) * 0.26 +
                      (violationWeights[violation] || 18) * 0.26 +
                      (vehicleWeights[vehicle] || 15) * 0.12 +
                      timePenalty * 0.18;

    const riskScore = Math.min(Math.max(Math.round(baseScore * 3.6), 12), 99);

    let predLevel = 'Low / Controlled Risk';
    let levelClass = 'text-[#DFB6B2] bg-[#522B5B]/30 border-[#522B5B]';
    let fatalProb = Math.min(Math.round(riskScore * 0.38), 58);
    let injuryProb = Math.min(Math.round(riskScore * 0.95), 96);

    if (riskScore >= 70) {
      predLevel = 'Extreme High Hazard';
      levelClass = 'text-rose-400 bg-rose-500/15 border-rose-500';
    } else if (riskScore >= 45) {
      predLevel = 'Elevated Corridor Threat';
      levelClass = 'text-[#FBE4D8] bg-[#854F6C]/40 border-[#DFB6B2]';
    }

    let advisory = [];
    if (weather === 'Fog' || weather === 'Smog') {
      advisory.push('⚠️ Severe visibility reduction: Maintain maximum 35 km/h, deploy amber anti-fog lights and double headway distance.');
    }
    if (weather === 'Rainy') {
      advisory.push('🌧️ Aquaplaning hazard: Avoid abrupt braking on flyover approaches and metro construction zones.');
    }
    if (violation === 'Wrong Side' || violation === 'Over Speeding') {
      advisory.push('🚨 High Fatal Multiplier: Wrong side maneuvers in this corridor correlate with 59% of severe collisions.');
    }
    if (hour >= 17 && hour <= 21) {
      advisory.push('⏰ Peak congestion corridor: Active transit frequency triples accident probability. Anticipate sudden bus stops.');
    }
    if (vehicle === 'Bike' || vehicle === 'E-Rickshaw') {
      advisory.push('🛡️ Vulnerable road user: Certified full-face helmet / protective lane compliance strictly advised.');
    }
    if (advisory.length === 0) {
      advisory.push('✅ Standard conditions: Maintain posted corridor speed limits and obey lane discipline.');
    }

    setText('predScoreVal', `${riskScore}%`);
    const dial = document.getElementById('predScoreBar');
    if (dial) dial.style.width = `${riskScore}%`;

    const levelBadge = document.getElementById('predLevelBadge');
    if (levelBadge) {
      levelBadge.className = `px-3 py-1 rounded-full text-xs font-bold border ${levelClass}`;
      levelBadge.innerText = predLevel;
    }

    setText('predInjuryOdds', `${injuryProb}%`);
    setText('predFatalOdds', `${fatalProb}%`);

    const advList = document.getElementById('predAdvisoryList');
    if (advList) {
      advList.innerHTML = advisory.map(msg => `<li class="p-2.5 rounded-lg bg-[#190019]/70 border border-[#522B5B] text-[#DFB6B2] text-xs">${msg}</li>`).join('');
    }
  }

  // Add Incident Form Handler
  function handleAddIncident(e) {
    e.preventDefault();

    const date = document.getElementById('newDate')?.value || new Date().toISOString().split('T')[0];
    const time = document.getElementById('newTime')?.value || '18:30';
    const area = document.getElementById('newArea')?.value || 'Saket';
    const vehicle = document.getElementById('newVehicle')?.value || 'Car';
    const violation = document.getElementById('newViolation')?.value || 'Signal Jump';
    const weather = document.getElementById('newWeather')?.value || 'Clear';
    const severity = document.getElementById('newSeverity')?.value || 'Medium';
    const injuries = parseInt(document.getElementById('newInjuries')?.value || 0, 10);
    const fatalities = parseInt(document.getElementById('newFatalities')?.value || 0, 10);

    const nextNum = state.allData.length + 1;
    const newId = `A${String(nextNum).padStart(4, '0')}`;
    const meta = AREA_METADATA[area] || { zone: 'Delhi NCR' };

    const newRecord = {
      id: newId,
      date,
      time,
      hour: parseInt(time.split(':')[0], 10),
      area,
      zone: meta.zone,
      vehicle,
      violation,
      weather,
      severity,
      injuries,
      fatalities,
      totalCasualties: injuries + fatalities
    };

    state.allData.unshift(newRecord);
    applyFilters();
    renderAll();
    closeModal('addIncidentModal');
    showToast(`Incident #${newId} recorded successfully!`, 'success');
  }

  // Export Filtered Table to CSV
  function exportToCSV() {
    const data = state.filteredData;
    if (data.length === 0) {
      showToast('No records to export!', 'error');
      return;
    }

    const headers = ['Accident_ID', 'Date', 'Time', 'Area', 'Zone', 'Vehicle_Type', 'Violation_Type', 'Weather', 'Severity_Level', 'Injuries', 'Fatalities'];
    const rows = data.map(d => [
      d.id,
      d.date,
      d.time,
      `"${d.area}"`,
      `"${d.zone || ''}"`,
      d.vehicle,
      `"${d.violation}"`,
      d.weather,
      d.severity,
      d.injuries,
      d.fatalities
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `delhi_traffic_accidents_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${data.length} incident records to CSV`);
  }

  // Toast Notifications
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const color = type === 'error' ? 'bg-rose-900 border-rose-500 text-rose-200' : (type === 'success' ? 'bg-[#522B5B] border-[#DFB6B2] text-[#FBE4D8]' : 'bg-[#2B124C] border-[#854F6C] text-[#FBE4D8]');
    toast.className = `flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-2xl border text-xs font-semibold ${color} transform translate-y-2 opacity-0 transition duration-300`;
    toast.innerHTML = `<i class="fa-solid ${type === 'error' ? 'fa-circle-exclamation' : (type === 'success' ? 'fa-check text-emerald-400' : 'fa-circle-info text-[#DFB6B2]')}"></i> ${message}`;

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
      toast.classList.add('opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // Modal Controls
  window.openModal = function (modalId) {
    document.getElementById(modalId)?.classList.remove('hidden');
  };
  window.closeModal = function (modalId) {
    document.getElementById(modalId)?.classList.add('hidden');
  };

})();
