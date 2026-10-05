export function renderRadar(container, stats) {
  const wrapper = document.createElement('div');

  wrapper.style.width = 'min(560px, 92vw)';
  wrapper.style.height = 'min(560px, 92vw)';
  wrapper.style.position = 'relative';
  wrapper.style.margin = '0 auto';

  const canvas = document.createElement('canvas');

  canvas.style.width = '100%';
  canvas.style.height = '100%';

  wrapper.appendChild(canvas);
  container.appendChild(wrapper);

  const ctx = canvas.getContext('2d');

  const values = [
    stats.EXECUTION,
    stats.FOCUS,
    stats.DISCIPLINE,
    stats.MASTERY,
    stats.CREATION,
  ];

  const labels = [
    `EXECUTION ${stats.EXECUTION}`,
    `FOCUS ${stats.FOCUS}`,
    `DISCIPLINE ${stats.DISCIPLINE}`,
    `MASTERY ${stats.MASTERY}`,
    `CREATION ${stats.CREATION}`,
  ];

  new Chart(ctx, {
    type: 'radar',

    data: {
      labels,

      datasets: [
        {
          label: 'PLAYER STATS',
          data: values,

          fill: true,

          backgroundColor: 'rgba(0, 176, 255, 0.18)',
          borderColor: '#00b0ff',
          borderWidth: 3,

          pointBackgroundColor: '#00b0ff',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,

          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      animation: {
        duration: 500,
      },

      scales: {
        r: {
          min: 0,
          max: 100,

          beginAtZero: true,

          ticks: {
            display: false,
          },

          grid: {
            circular: false,
            lineWidth: 1,
          },

          angleLines: {
            display: true,
            lineWidth: 1,
          },

          pointLabels: {
            display: true,
            padding: 22,

            font: {
              size: 13,
              weight: '700',
            },
          },
        },
      },

      plugins: {
        legend: {
          display: false,
        },

        tooltip: {
          enabled: false,
        },
      },
    },
  });
}
