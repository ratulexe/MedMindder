// Global variable so app.js can access and update it
let myAdherenceChart;

document.addEventListener('DOMContentLoaded', () => {
    const canvasElement = document.getElementById('adherence-chart');
    
    // Safety check: Only load the chart if the canvas exists on the current page
    if (!canvasElement) return;

    const ctx = canvasElement.getContext('2d');

    // Initialize the Chart.js Doughnut Ring
    myAdherenceChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['On Time', 'Late', 'Missed or Pending'],
            datasets: [{
                // Default starting data (0 On Time, 0 Late, 1 Pending to show a full grey circle)
                data: [0, 0, 1], 
                backgroundColor: [
                    '#10b981', // Tailwind Emerald-500 (Green for On Time)
                    '#f59e0b', // Tailwind Amber-500 (Orange for Late)
                    '#e2e8f0'  // Tailwind Slate-200 (Grey for Missed/Pending)
                ],
                borderWidth: 0, 
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '80%', // Creates a sleek, thin modern ring (instead of a thick pie chart)
            plugins: {
                legend: {
                    display: false // Hides the default legend so you can use custom HTML text
                },
                tooltip: {
                    backgroundColor: '#1e293b', // Dark slate tooltip
                    titleFont: { family: 'Geologica', size: 13 },
                    bodyFont: { family: 'Geologica', size: 12, weight: 'bold' },
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            // Custom tooltip formatting: "On Time: 5 doses"
                            return ` ${context.label}: ${context.raw} dose(s)`;
                        }
                    }
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true,
                duration: 1200,
                easing: 'easeOutQuart'
            }
        }
    });
});