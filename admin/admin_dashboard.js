document.addEventListener("DOMContentLoaded", function() {
    // Simulate fetching data from backend
    // In a real application, you would use fetch() or axios to get data from your API
    
    // These values should come from your MySQL backend
    const dashboardData = {
        totalLines: 3,
        totalStations: 23,
        totalMetros: 18,
        todayTickets: 1247,
        totalTickets: 45892,
        totalRevenue: 1546835,
        todayRevenue: 43650
    };

    // Set widget values
    document.getElementById("total-lines").innerText = dashboardData.totalLines;
    document.getElementById("total-stations").innerText = dashboardData.totalStations;
    document.getElementById("total-metros").innerText = dashboardData.totalMetros;
    document.getElementById("today-tickets").innerText = dashboardData.todayTickets;

    // Set revenue panel
    document.getElementById("total-tickets").innerText = dashboardData.totalTickets.toLocaleString();
    document.getElementById("total-revenue").innerText = dashboardData.totalRevenue.toLocaleString();
    document.getElementById("today-revenue").innerText = dashboardData.todayRevenue.toLocaleString();

    // Chart.js daily revenue graph
    const ctx = document.getElementById('revenueChart').getContext('2d');
    const revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['6AM', '8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM'],
            datasets: [{
                label: 'Revenue (₹)',
                data: [3200, 4500, 5800, 7200, 8400, 9200, 7800, 6200],
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderColor: 'rgba(255, 255, 255, 0.8)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#fff',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { 
                    display: false,
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: { 
                        color: 'white',
                        callback: function(value) {
                            return '₹' + value;
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: { 
                        color: 'white' 
                    }
                }
            }
        }
    });

    // Search functionality
    const searchInput = document.querySelector('.search-bar input');
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            alert(`Searching for: ${this.value}`);
            // In a real application, you would filter the dashboard content
            // or redirect to a search results page
        }
    });

    // Simulate loading data from backend with a delay
    setTimeout(() => {
        // This would be your actual API call in a real application
        // fetch('/api/dashboard-data')
        //   .then(response => response.json())
        //   .then(data => updateDashboard(data));
        
        console.log("Data loaded from backend");
    }, 1000);
});

// Function to update dashboard with real data
function updateDashboard(data) {
    // Update all dashboard elements with real data
    document.getElementById("total-lines").innerText = data.totalLines;
    document.getElementById("total-stations").innerText = data.totalStations;
    document.getElementById("total-metros").innerText = data.totalMetros;
    document.getElementById("today-tickets").innerText = data.todayTickets;
    document.getElementById("total-tickets").innerText = data.totalTickets.toLocaleString();
    document.getElementById("total-revenue").innerText = data.totalRevenue.toLocaleString();
    document.getElementById("today-revenue").innerText = data.todayRevenue.toLocaleString();
}