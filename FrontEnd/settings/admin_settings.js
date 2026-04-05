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

            // Populate Enroll selects
            const enrollMajorSelect = document.getElementById("enrollMajor");
            const enrollCourseSelect = document.getElementById("enrollCourse");

            if (enrollMajorSelect) {
                majors.forEach(m => {
                    const option = document.createElement("option");
                    option.value = m.name;
                    option.textContent = m.name;
                    enrollMajorSelect.appendChild(option);
                });
            }

            if (enrollCourseSelect) {
                courses.forEach(c => {
                    const option = document.createElement("option");
                    option.value = c.id;
                    const isDisabled = c.isEnabled === false;
                    option.textContent = `${c.code}: ${c.name}${isDisabled ? ' (Disabled)' : ''}`;
                    if (isDisabled) option.style.color = "#dc3545";
                    enrollCourseSelect.appendChild(option);
                });
            }

            // Populate Manage Status select
            const manageStatusSelect = document.getElementById("manageStatusCourse");
            const updateTeacherSelect = document.getElementById("updateCourseTeacher");
            if (manageStatusSelect) {
                manageStatusSelect.innerHTML = '<option value="">Select a Course</option>';
                courses.forEach(c => {
                    const option = document.createElement("option");
                    option.value = c.id;
                    option.textContent = `${c.code}: ${c.name}`;
                    manageStatusSelect.appendChild(option);
                });
            }

            if (updateTeacherSelect) {
                updateTeacherSelect.innerHTML = '<option value="">No Teacher (Clear)</option>';
                teachers.forEach(t => {
                    const option = document.createElement("option");
                    option.value = t.id;
                    option.textContent = `${t.fname} ${t.lname} (${t.major || 'No Major'})`;
                    updateTeacherSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error("Error loading initial data:", error);
        }
    }

    // Manage Course Status Logic
    const manageStatusSelect = document.getElementById("manageStatusCourse");
    const statusText = document.getElementById("currentCourseStatus");
    const toggleStatusBtn = document.getElementById("toggleCourseStatusBtn");
    const updateTeacherSelect = document.getElementById("updateCourseTeacher");
    const updateTeacherBtn = document.getElementById("updateTeacherBtn");
    const courseControls = document.getElementById("courseManagementControls");
    const noCourseMsg = document.getElementById("noCourseSelectedMsg");

    if (manageStatusSelect) {
        manageStatusSelect.addEventListener("change", () => {
            const courseId = manageStatusSelect.value;
            if (!courseId) {
                if (courseControls) courseControls.style.display = "none";
                if (noCourseMsg) noCourseMsg.style.display = "block";
                return;
            }

            if (courseControls) courseControls.style.display = "block";
            if (noCourseMsg) noCourseMsg.style.display = "none";

            const course = courses.find(c => c.id === courseId);
            if (course) {
                const isEnabled = course.isEnabled !== false; // Default to true if undefined
                statusText.textContent = isEnabled ? "Enabled" : "Disabled";
                statusText.style.color = isEnabled ? "#28a745" : "#dc3545";
                toggleStatusBtn.textContent = isEnabled ? "Disable Course" : "Enable Course";
                toggleStatusBtn.style.backgroundColor = isEnabled ? "#dc3545" : "#28a745";

                if (updateTeacherSelect) {
                    updateTeacherSelect.value = course.teacherId || "";
                }
            }
        });
    }

    if (toggleStatusBtn) {
        toggleStatusBtn.addEventListener("click", async () => {
            const courseId = manageStatusSelect.value;
            if (!courseId) return;

            const course = courses.find(c => c.id === courseId);
            const currentStatus = course.isEnabled !== false;
            const newStatus = !currentStatus;

            const confirmMsg = newStatus 
                ? "Are you sure you want to enable this course? Students and teachers will be able to register."
                : "Are you sure you want to disable this course? This will prevent any new registrations.";

            if (!confirm(confirmMsg)) return;

            toggleStatusBtn.disabled = true;
            toggleStatusBtn.textContent = "Updating...";

            try {
                const response = await fetch(`/api/courses/${courseId}/status`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isEnabled: newStatus })
                });

                if (response.ok) {
                    alert(`Course ${newStatus ? 'enabled' : 'disabled'} successfully!`);
                    // Update local data and UI
                    course.isEnabled = newStatus;
                    statusText.textContent = newStatus ? "Enabled" : "Disabled";
                    statusText.style.color = newStatus ? "#28a745" : "#dc3545";
                    toggleStatusBtn.textContent = newStatus ? "Disable Course" : "Enable Course";
                    toggleStatusBtn.style.backgroundColor = newStatus ? "#dc3545" : "#28a745";
                } else {
                    const error = await response.json();
                    alert("Error updating status: " + (error.message || "Unknown error"));
                }
            } catch (error) {
                console.error("Error updating course status:", error);
                alert("Network error while updating course status.");
            } finally {
                toggleStatusBtn.disabled = false;
            }
        });
    }

    if (updateTeacherBtn) {
        updateTeacherBtn.addEventListener("click", async () => {
            const courseId = manageStatusSelect.value;
            const newTeacherId = updateTeacherSelect.value;
            if (!courseId) return;

            const course = courses.find(c => c.id === courseId);
            const teacher = teachers.find(t => t.id === newTeacherId);
            const teacherName = teacher ? `${teacher.fname} ${teacher.lname}` : "No Teacher (Clear)";

            if (!confirm(`Are you sure you want to change the teacher for this course to ${teacherName}?`)) return;

            updateTeacherBtn.disabled = true;
            updateTeacherBtn.textContent = "Updating...";

            try {
                const response = await fetch(`/api/courses/${courseId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ teacherId: newTeacherId })
                });

                if (response.ok) {
                    const updatedCourse = await response.json();
                    alert("Teacher updated successfully!");
                    // Update local data
                    course.teacherId = updatedCourse.teacherId;
                    course.instructor = updatedCourse.instructor;
                    console.log("Updated local course data:", course);
                } else {
                    const error = await response.json();
                    alert("Error updating teacher: " + (error.message || "Unknown error"));
                }
            } catch (error) {
                console.error("Error updating teacher:", error);
                alert("Network error while updating teacher.");
            } finally {
                updateTeacherBtn.disabled = false;
                updateTeacherBtn.textContent = "Update Teacher";
            }
        });
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
                const isDisabled = c.isEnabled === false;
                option.textContent = `${c.code || '???'}: ${c.name || 'Unnamed'}${isDisabled ? ' (Disabled)' : ''}`;
                if (isDisabled) option.style.color = "#dc3545";
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

    // New Enroll logic
    async function updateEnrollChecklist() {
        const majorName = document.getElementById("enrollMajor").value;
        const courseId = document.getElementById("enrollCourse").value;
        const listBody = document.getElementById("enrollStudentsListBody");
        const statusDiv = document.getElementById("enrollmentStatus");
        const batchBtn = document.getElementById("enrollBatchBtn");

        if (!majorName || !courseId) {
            statusDiv.textContent = "Select both a major and course first";
            listBody.innerHTML = "";
            batchBtn.disabled = true;
            return;
        }

        try {
            statusDiv.textContent = "Loading students...";
            
            // Get all students in the major
            const majorRes = await fetch(`/api/major/${encodeURIComponent(majorName)}/people`);
            const majorData = await majorRes.json();
            const studentsInMajor = majorData.students || [];

            // Get students already in the course
            const courseRes = await fetch(`/api/courses/${courseId}/people`);
            const courseData = await courseRes.json();
            const studentsInCourse = courseData.students || [];
            const studentIdsInCourse = new Set(studentsInCourse.map(s => s.uid));

            listBody.innerHTML = "";
            let count = 0;

            studentsInMajor.forEach(student => {
                // Check if they are already in the course
                const isEnrolled = studentIdsInCourse.has(student.uid);
                
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td style="width: 40px;">
                        <input type="checkbox" name="studentEnroll" value="${student.uid}" 
                               ${isEnrolled ? 'disabled checked' : ''}>
                    </td>
                    <td>${student.fname} ${student.lname}</td>
                    <td>${student.studentID || "N/A"} ${isEnrolled ? '(Already Enrolled)' : ''}</td>
                `;
                listBody.appendChild(tr);
                if (!isEnrolled) count++;
            });

            statusDiv.textContent = `${count} student(s) available for enrollment in this major.`;
            batchBtn.disabled = count === 0;

        } catch (error) {
            console.error("Error updating checklist:", error);
            statusDiv.textContent = "Error loading students.";
        }
    }

    const enrollMajorSelect = document.getElementById("enrollMajor");
    const enrollCourseSelect = document.getElementById("enrollCourse");

    if (enrollMajorSelect) enrollMajorSelect.addEventListener("change", updateEnrollChecklist);
    if (enrollCourseSelect) enrollCourseSelect.addEventListener("change", updateEnrollChecklist);

    const enrollBatchBtn = document.getElementById("enrollBatchBtn");
    if (enrollBatchBtn) {
        enrollBatchBtn.addEventListener("click", async () => {
            const courseId = document.getElementById("enrollCourse").value;
            const checkboxes = document.querySelectorAll('input[name="studentEnroll"]:checked:not(:disabled)');
            const selectedIds = Array.from(checkboxes).map(cb => cb.value);

            if (selectedIds.length === 0) return;

            if (!confirm(`Enroll ${selectedIds.length} students into the selected course?`)) return;

            enrollBatchBtn.disabled = true;
            enrollBatchBtn.textContent = "Enrolling...";

            try {
                let successCount = 0;
                for (const uid of selectedIds) {
                    const response = await fetch("/api/courses/enroll", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ courseId, studentId: uid })
                    });
                    if (response.ok) successCount++;
                }

                alert(`Successfully enrolled ${successCount} out of ${selectedIds.length} students.`);
                updateEnrollChecklist();
            } catch (error) {
                console.error("Error batch enrolling:", error);
                alert("An error occurred during enrollment.");
            } finally {
                enrollBatchBtn.disabled = false;
                enrollBatchBtn.textContent = "Enroll Selected Students";
            }
        });
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
            const removeBtn = document.getElementById("removePeopleBtn");
            const teacherCheck = document.getElementById("removeTeacherCheck");
            const studentHeader = document.getElementById("studentSelectHeader");

            if (!id) {
                if (teacherNameSpan) teacherNameSpan.textContent = "N/A";
                if (studentsListBody) studentsListBody.innerHTML = `<tr><td colspan="2">Select an item</td></tr>`;
                if (removeBtn) removeBtn.style.display = "none";
                if (teacherCheck) teacherCheck.style.display = "none";
                if (studentHeader) studentHeader.style.display = "none";
                return;
            }

            try {
                let url = "";
                if (viewBy === "course") {
                    url = `/api/courses/${id}/people`;
                    if (removeBtn) removeBtn.style.display = "block";
                    if (studentHeader) studentHeader.style.display = "table-cell";
                } else {
                    url = `/api/major/${encodeURIComponent(id)}/people`;
                    if (removeBtn) removeBtn.style.display = "none";
                    if (teacherCheck) teacherCheck.style.display = "none";
                    if (studentHeader) studentHeader.style.display = "none";
                }

                console.log(`Fetching people from: ${url}`);
                const response = await fetch(url);
                const data = await response.json();
                console.log("People data received:", data);

                // Display Teacher(s)
                if (teacherNameSpan) {
                    if (viewBy === "course") {
                        teacherNameSpan.textContent = data.teacher ? `${data.teacher.fname} ${data.teacher.lname}` : "N/A";
                        if (teacherCheck) {
                            teacherCheck.style.display = data.teacher ? "inline-block" : "none";
                            teacherCheck.checked = false;
                            teacherCheck.value = data.teacher ? data.teacher.id : "";
                        }
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
                            if (viewBy === "course") {
                                tr.innerHTML = `
                                    <td><input type="checkbox" name="removeStudentCheck" value="${s.id || s.uid}"></td>
                                    <td>${s.fname} ${s.lname}</td>
                                    <td>${s.studentID || "N/A"}</td>
                                `;
                            } else {
                                tr.innerHTML = `
                                    <td>${s.fname} ${s.lname}</td>
                                    <td>${s.studentID || "N/A"}</td>
                                `;
                            }
                            studentsListBody.appendChild(tr);
                        });
                    } else {
                        const colSpan = viewBy === "course" ? 3 : 2;
                        studentsListBody.innerHTML = `<tr><td colspan="${colSpan}">No students found</td></tr>`;
                    }
                }

            } catch (error) {
                console.error("Error fetching people:", error);
            }
        });
    }

    const removePeopleBtn = document.getElementById("removePeopleBtn");
    if (removePeopleBtn) {
        removePeopleBtn.addEventListener("click", async () => {
            const courseId = document.getElementById("viewItem").value;
            if (!courseId) return;

            const teacherCheck = document.getElementById("removeTeacherCheck");
            const studentChecks = document.querySelectorAll('input[name="removeStudentCheck"]:checked');
            
            const removeTeacher = teacherCheck && teacherCheck.checked;
            const studentIdsToRemove = Array.from(studentChecks).map(cb => cb.value);

            if (!removeTeacher && studentIdsToRemove.length === 0) {
                alert("Please select at least one person to remove.");
                return;
            }

            if (!confirm(`Are you sure you want to remove the selected ${studentIdsToRemove.length + (removeTeacher ? 1 : 0)} people from this course?`)) {
                return;
            }

            removePeopleBtn.disabled = true;
            removePeopleBtn.textContent = "Removing...";

            try {
                // Remove teacher
                if (removeTeacher) {
                    const teacherId = teacherCheck.value;
                    await fetch("/api/courses/remove-teacher", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ courseId, teacherId })
                    });
                }

                // Remove students
                for (const studentId of studentIdsToRemove) {
                    await fetch("/api/courses/unenroll", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ courseId, studentId })
                    });
                }

                alert("Successfully removed selected people from the course.");
                location.reload(); // Reload the webpage
            } catch (error) {
                console.error("Error removing people:", error);
                alert("An error occurred while removing people.");
            } finally {
                removePeopleBtn.disabled = false;
                removePeopleBtn.textContent = "Remove Selected from Course";
            }
        });
    }

    // Load initial data
    await loadInitialData();
});
