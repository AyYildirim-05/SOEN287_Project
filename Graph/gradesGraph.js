const courses = ["SOEN287", "SOEN228", "COMP249", "ENGR233", "ENGR202"]; // x-axis labels
const grades = [85, 90, 78, 92, 88]; // y-axis data

const gradesGraph = new Chart("gradesChart", {
    type: 'bar',
    data: {
        labels: courses,
        datasets: [{
            backgroundColor: 'lightgoldenrodyellow',
            data: grades
        }]
    },

    options: {
        plugins: {
            legend: {
                display: false
            }
        }
    }
})