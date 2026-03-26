function toggleProfileMenu() {
    const userDataString = localStorage.getItem("user");

    if (!userDataString) {
        window.location.href = "Auths/sign_in.html"; 
        return; 
    }

    try {
        const userData = JSON.parse(userDataString);
        const role = userData.role;

        console.log(`Welcome, ${userData.fname || 'User'}!`);

        switch (role) {
            case "student":
                console.log(`Student ID: ${userData.studentID}`);
                window.location.href = "settings/student_settings.html"; 
                break;

            case "teacher":
                console.log(`Teacher ID: ${userData.teacherID}`);
                window.location.href = "settings/teacher_settings.html"; 
                break;

            case "admin":
                console.log(`Admin ID: ${userData.adminID}`);
                window.location.href = "settings/admin_settings.html";
                break; 

            default:
                console.warn("User role not recognized:", role);
                alert("Account error: Role not assigned.");
        }

    } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("user"); // Clear corrupted data
    }
}