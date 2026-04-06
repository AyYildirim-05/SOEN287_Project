// For applying the color scheme to assignments based on due dates.
function applyAssignmentColorScheme(boxElement, dueDate) {
    if (!dueDate) {
        // If there is no due date, we can default to green or leave it as the default border
        boxElement.style.borderColor = "green"; 
        return;
    }

    const now = new Date();
    const due = new Date(dueDate);
    
    // Calculate the difference in milliseconds
    const timeDiff = due.getTime() - now.getTime();
    
    // Convert difference from milliseconds to hours
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (timeDiff < 0) {
        // Past the due date
        boxElement.style.borderColor = "red";
    } else if (hoursDiff <= 24) {
        // Within 24 hours of the due date
        // Note: Standard "yellow" can be hard to see against a white background, 
        // consider using "#eab308" (a golden yellow) if you want better contrast.
        boxElement.style.borderColor = "#eab308"; 
    } else {
        // More than a day out
        boxElement.style.borderColor = "green";
    }
}