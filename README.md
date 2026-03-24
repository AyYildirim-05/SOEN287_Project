# SOEN 287 Term Project: Student & Course Management System

## Project Overview
This is a web application developed as a term project for the **SOEN 287 (Web Programming)** course at Concordia University. The application provides a platform for managing student profiles and course enrollments, featuring a full-stack architecture with a Node.js/Express backend and a Firebase-powered database.

### Key Features
- **User Authentication:** Secure sign-up and sign-in functionality using Firebase Auth.
- **Course Management:** Ability to view, add, and enroll in courses.
- **Student Profiles:** Manage student information including major, GPA, and enrolled courses.
- **Interactive UI:** Responsive frontend built with HTML, CSS, and JavaScript.

---

## Technologies Used
- **Backend:** Node.js, Express.js
- **Database:** Firebase Firestore (NoSQL)
- **Authentication:** Firebase Auth
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Development Tools:** Nodemon, Dotenv, UUID

---

## Prerequisites
Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or higher recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- A [Firebase Project](https://console.firebase.google.com/) with Firestore and Authentication enabled.

---

## User Guide

### Main Page
The main page of the website is divided into 3 parts: the course list section, the assignment tracker and the grades graph. In the header of the website, the user can choose to sign up and create an account or directly log in if they already have one.

### Course Section
The courses section displays all courses that the student or teacher has access to. Each course is represented by a course box containing the course code, its name, and other details by hovering over the box. 

Users can scroll through the list of available courses to view all courses. Clicking on any course box will open the individual course page for that course.

For teachers, an “Add Course” box is also available. Selecting this option opens a form where the teacher can create a new course by entering the course code, course name, instructor, and other information. Once submitted, the new course will appear in the courses list. Teacher may also delete courses by clicking on the remove button which will prompt them to enter the course code to ensure that they want to delete it.

Students may also see an enroll course option which allows them to enroll in available courses made by teachers.

For deliverable 1 purposes, the view of the course section is using a teacher role view.

When a course is clciekd on from the courses section, the user is taken to the course page. This page displays information about the course and is divided into several sections.

At the top of the page, a card displays the main course information including:

- Course title
- Instructor name
- Number of credits
- TAs
- Other possible details that will be added in deliverable 2

Teachers can edit this information using the edit course info button.

Below the course information card, there will be 3 more cards displaying information on the assignments, the announcements, and the grades.

In the assignments section, it will display a list of all assignments associated with the course. Each assignment box shows:

- Assignment due date
- Assignment weight
- Assignment title

Teachers can add new assignments by clicking the “Add Assignment” Button which will open a modal window where assignment details such as title, due date, and weight can be entered. Teachers will also be able to click on the assignment to grade every student assignment

The announcement section displays all course announcements posted by instructors.

Teachers can add an announcement with the “add announcement” button and entering the announcement text in the popup window.

The grades section displays a graphical representation of the grades using a bar chat. Below the chart, a list of grades for individual assessments is also displayed. Students get to see their grade for their assignment. Teachers get to see the average of student grades for assignments on the graph.

To return to the dashboard, the user can click the dashboard button at the top to return to the original home page.

### Assignment Tracker Section
This section displays all assignments that a student has. For deliverable 1, there are only hard-coded assignments into the view as the database has not been fully completed. The student can check an assignment to deem it as completed. This action will cause the assignment to be placed in the "Archive" section of the display. For the next deliverable, the assignments will be colour coded to show the status of the assignment (completed, late submission, not submitted). 

For this deliverable, both students and teachers see the same thing. In the future, the teacher will be able to see all the assignmetns they have made and how many students have completed it. 

### Grades Graph Section
This section displays a graph with the overall grade per class a student is enrolled in. Hovering over each bar will display the grade. For deliverable 1, the graph has been hard coded to display set values as the database is not complete. In the future, the graph will adapt dynamically to individual student's results while also showing the average of the class. 

The teacher for now also share the same view as the student. In the next deliverable, they will be able to see the individual grades of every student enrolled in the classes they are teaching. They will also be able to see an overall average of the classes they are teaching.

---

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd SOEN287_Project
```

### 2. Install Dependencies
Run the following command in the root directory:
```bash
npm install
```

### 3. Firebase Configuration
You need to provide your own Firebase service account credentials to connect the backend to Firestore.

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Navigate to **Project Settings** > **Service Accounts**.
3.  Click **Generate New Private Key** and download the JSON file.
4.  Modify the `.env.example` file  inside the `BackEnd/` directory to `.env`.
5.  Add your service account information to the `.env` file:

    ```env
    # Option A: Path to your service account JSON file
    FIREBASE_SERVICE_ACCOUNT_PATH=./path/to/your/serviceAccountKey.json
    FIREBASE_WEB_API_KEY=YOUR_FIREBASE_API_KEY

    # Optional: Port configuration
    PORT=5500
    ```

### 4. Seed the Database (Optional)
To populate your database with initial sample data, run:
```bash
npm run seed
```

---

## Running the Application

### Development Mode (with Auto-Reload)
Starts the server using `nodemon` which automatically restarts when file changes are detected:
```bash
npm run dev
```

### Production Mode
Starts the server normally:
```bash
npm start
```

Once the server is running, the application will be accessible at:
[http://localhost:5500](http://localhost:5500)

---

## Project Structure
- `BackEnd/`: Contains the server logic, routes, controllers, and database configuration.
  - `controller/`: Request handlers for auth and courses.
  - `database/`: Firebase initialization.
  - `routes/`: API endpoint definitions.
  - `scripts/`: Utility scripts like `seedData.js`.
- `FrontEnd/`: Static assets including HTML, CSS, and client-side JavaScript.
  - `Auths/`: Sign-in and Sign-up pages.
  - `courses/`: Course management pages and components.
  - `Graph/`: Grades and performance visualization.
  
---

## Deliverable 1 Features 
- Course Overview, ability to navigate between individual course pages
- Assignment scheduler frontend
- Hard-Coded chart displaying grades
- Sign Up and Log In System using Firebase

## Deliverable 2 Features To Be Implemented
- Improved Sign Up and Log In system with proper authentication
- Grades chart updates dynamically based on grades stored in a database
- Assignments can be sorted by due date, completed and late submissions
