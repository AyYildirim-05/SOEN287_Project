document.addEventListener("DOMContentLoaded", async () => {
    // 1. Initial data loading
    let courses = [];
    let majors = [];
    let teachers = [];

    async function loadInitialData() {
        console.log("Loading initial admin data...");
        try {
            const [coursesRes, majorsRes, teachersRes] = await Promise.all([
                fetch("/api/courses/"),
                fetch("/api/major/"),
                fetch("/api/teacher/getallteachers")
            ]);

            if (!coursesRes.ok) console.error("Failed to fetch courses", await coursesRes.text());
            if (!majorsRes.ok) console.error("Failed to fetch majors", await majorsRes.text());
            if (!teachersRes.ok) console.error("Failed to fetch teachers", await teachersRes.text());

            courses = await coursesRes.json();
            majors = await majorsRes.json();
            teachers = await teachersRes.json();

            console.log("Data loaded:", { courses, majors, teachers });

            // Populate teacher select in Create Course form
            const teacherSelect = document.getElementById("courseTeacher");
            if (teacherSelect) {
                teachers.forEach(t => {
                    const option = document.createElement("option");
                    option.value = t.id;
                    option.textContent = `${t.fname} ${t.lname} (${t.major || 'No Major'})`;
                    teacherSelect.appendChild(option);
                });
            }

            // Populate initial View Item select (defaults to course)
            updateViewItemSelect();
        } catch (error) {
            console.error("Error loading initial data:", error);
        }
    }

    function updateViewItemSelect() {
        const viewBySelect = document.getElementById("viewBy");
        if (!viewBySelect) return;
        
        const viewBy = viewBySelect.value;
        const viewItemSelect = document.getElementById("viewItem");
        if (!viewItemSelect) return;

        viewItemSelect.innerHTML = `<option value="">Select a ${viewBy}</option>`;

        if (viewBy === "course") {
            courses.forEach(c => {
                const option = document.createElement("option");
                option.value = c.id;
                option.textContent = `${c.code || '???'}: ${c.name || 'Unnamed'}`;
                viewItemSelect.appendChild(option);
            });
        } else if (viewBy === "major") {
            majors.forEach(m => {
                const option = document.createElement("option");
                option.value = m.name; 
                option.textContent = m.name;
                viewItemSelect.appendChild(option);
            });
        }
    }

    // 2. Form Event Listeners
    const createCourseForm = document.getElementById("createCourseForm");
    if (createCourseForm) {
        createCourseForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const code = document.getElementById("courseCode").value;
            const name = document.getElementById("courseName").value;
            const description = document.getElementById("courseDescription").value;
            const teacherId = document.getElementById("courseTeacher").value;
            const teacher = teachers.find(t => t.id === teacherId);

            console.log("Creating course:", { code, name, description, teacherId });

            try {
                const response = await fetch("/api/courses/add", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        code,
                        name,
                        description,
                        teacherId,
                        instructor: teacher ? `${teacher.fname} ${teacher.lname}` : ""
                    })
                });

                if (response.ok) {
                    alert("Course created successfully!");
                    location.reload();
                } else {
                    const error = await response.json();
                    alert("Error creating course: " + (error.message || "Unknown error"));
                }
            } catch (error) {
                console.error("Error creating course:", error);
                alert("Network error while creating course.");
            }
        });
    }

    const createMajorForm = document.getElementById("createMajorForm");
    if (createMajorForm) {
        createMajorForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const name = document.getElementById("majorName").value;
            const description = document.getElementById("majorDescription").value;

            console.log("Creating major:", { name, description });

            try {
                const response = await fetch("/api/major/add", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, description })
                });

                if (response.ok) {
                    alert("Major created successfully!");
                    location.reload();
                } else {
                    const error = await response.json();
                    alert("Error creating major: " + (error.message || "Unknown error"));
                }
            } catch (error) {
                console.error("Error creating major:", error);
                alert("Network error while creating major.");
            }
        });
    }

    // 3. View People Logic
    const viewBySelect = document.getElementById("viewBy");
    if (viewBySelect) {
        viewBySelect.addEventListener("change", updateViewItemSelect);
    }

    const viewItemSelect = document.getElementById("viewItem");
    if (viewItemSelect) {
        viewItemSelect.addEventListener("change", async (e) => {
            const id = e.target.value;
            const viewBy = document.getElementById("viewBy").value;
            const teacherNameSpan = document.getElementById("teacherName");
            const studentsListBody = document.getElementById("studentsListBody");

            if (!id) {
                if (teacherNameSpan) teacherNameSpan.textContent = "N/A";
                if (studentsListBody) studentsListBody.innerHTML = `<tr><td colspan="2">Select an item</td></tr>`;
                return;
            }

            try {
                let url = "";
                if (viewBy === "course") {
                    url = `/api/courses/${id}/people`;
                } else {
                    url = `/api/major/${encodeURIComponent(id)}/people`;
                }

                console.log(`Fetching people from: ${url}`);
                const response = await fetch(url);
                const data = await response.json();
                console.log("People data received:", data);

                // Display Teacher(s)
                if (teacherNameSpan) {
                    if (viewBy === "course") {
                        teacherNameSpan.textContent = data.teacher ? `${data.teacher.fname} ${data.teacher.lname}` : "N/A";
                    } else {
                        teacherNameSpan.textContent = data.teachers && data.teachers.length > 0 
                            ? data.teachers.map(t => `${t.fname} ${t.lname}`).join(", ") 
                            : "None found";
                    }
                }

                // Display Students
                if (studentsListBody) {
                    studentsListBody.innerHTML = "";
                    if (data.students && data.students.length > 0) {
                        data.students.forEach(s => {
                            const tr = document.createElement("tr");
                            tr.innerHTML = `
                                <td>${s.fname} ${s.lname}</td>
                                <td>${s.studentID || "N/A"}</td>
                            `;
                            studentsListBody.appendChild(tr);
                        });
                    } else {
                        studentsListBody.innerHTML = `<tr><td colspan="2">No students found</td></tr>`;
                    }
                }

            } catch (error) {
                console.error("Error fetching people:", error);
            }
        });
    }

    // Load initial data
    await loadInitialData();
});
