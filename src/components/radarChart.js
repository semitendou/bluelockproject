export function renderRadar(container, stats) {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  const chart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['EXECUTION', 'FOCUS', 'DISCIPLINE', 'MASTERY', 'CREATION'],
      datasets: [
        {
          label: 'CURRENT',
          data: [
            stats.EXECUTION,
            stats.FOCUS,
            stats.DISCIPLINE,
            stats.MASTERY,
            stats.CREATION,
          ],
          fill: true,
          backgroundColor: 'rgba(0,176,255,0.2)',
          borderColor: '#00b0ff',
          pointBackgroundColor: '#00b0ff',
          pointBorderColor: '#ffffff',
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: '#00b0ff',
        },
      ],
    },
    options: {
      scales: {
        r: {
          suggestedMin: 0,
          suggestedMax: 100,
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
    },
  });
  container.append(canvas);
}
