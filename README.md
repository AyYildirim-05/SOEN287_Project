# SOEN 287 Term Project: Student & Course Management System

## Project Overview
This is a web application developed as a term project for the **SOEN 287 (Web Programming)** course at Concordia University. The application provides a platform for managing student profiles, course enrollments, and academic performance tracking, featuring a full-stack architecture with a Node.js/Express backend and a Firebase-powered database.

### Key Features
- **Role-Based Authentication:** Secure sign-up and sign-in functionality for Students, Teachers, and Admins using Firebase Auth.
- **Course Management:** Ability to view, add, edit, and delete courses.
- **Assignment Tracker:** Manage assignments with due dates, weights, and completion status.
- **Interactive Grades Visualization:** Dynamic charts displaying student performance and class averages.
- **Student Profiles:** Manage student information including major, GPA, and enrolled courses.
- **User Settings:** Dedicated settings pages for different user roles to manage account details.

---

## Technologies Used
- **Backend:** Node.js, Express.js
- **Database:** Firebase Firestore (NoSQL)
- **Authentication:** Firebase Auth
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Visualization:** Canvas API / Charting logic
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
The dashboard provides a central hub for navigating the system. Users can access their course list, track upcoming assignments, and view their performance at a glance. The header allows users to manage their authentication state.

### Course Section
The courses section displays all courses relevant to the user's role. Each course box contains the course code, name, and instructor.
- **Teachers** can add new courses, edit existing course information, and delete courses they manage.
- **Students** can view and enroll in available courses.

Clicking on a course opens its dedicated page, which provides detailed information about:
- **Course Info:** Title, Instructor, Credits, and TAs.
- **Assignments:** Add, view, and grade assessments.
- **Announcements:** Stay updated with course-specific news.
- **Grades:** Visual representation of performance using interactive charts.

### Assignment Tracker
This section helps students manage their workload. Assignments can be tracked, marked as completed, and archived. The system tracks due dates and assignment status (completed, late, or pending).

### Grades Visualization
The system provides a graphical representation of academic performance.
- **Students** see their individual grades for each course.
- **Teachers** can view the average performance of their classes and manage individual student results.

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
- `BackEnd/`: Contains the server logic, routes, controllers, and database models.
  - `controller/`: Request handlers for authentication, courses, assignments, and grades.
  - `database/`: Firebase initialization and configuration.
  - `routes/`: API endpoint definitions.
  - `models/`: Schema definitions for students, teachers, and courses.
- `FrontEnd/`: Static assets including HTML, CSS, and client-side JavaScript.
  - `Auths/`: Sign-in and Sign-up pages.
  - `courses/`: Course management pages and modals.
  - `Graph/`: Performance visualization scripts.
  - `schedule/`: Assignment tracking and scheduling logic.
  - `settings/`: Role-specific user settings pages.
