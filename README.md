# SOEN 287 Term Project: Student & Course Management System

## Project Overview
This is a web application developed as a term project for the **SOEN 287 (Web Programming)** course at Concordia University. The application provides a platform for managing student profiles, course enrollments, and academic performance tracking, featuring a full-stack architecture with a Node.js/Express backend and a Firebase-powered database.

---

## What's in the Project?

The system is a comprehensive management tool designed for three primary user roles: **Students**, **Teachers**, and **Admins**. It combines administrative workflows with academic tracking and data visualization.

### 1. User Roles & Capabilities

#### **Student Experience**
- **Dashboard:** View a personalized overview of enrolled courses and upcoming assignments.
- **Course Enrollment:** Search through available courses and enroll in new ones.
- **Academic Tracking:** 
  - View course-specific announcements and materials.
  - Track assignments, view weights, and see due dates.
  - Mark assignments as completed to move them to an archive.
  - View individual grades for each assessment.
- **Performance Visualization:** Access a dynamic GPA estimator and bar charts showing performance across all enrolled courses.
- **Profile Management:** Update personal information, major, and view academic standing.

#### **Teacher Experience**
- **Course Creation:** Create new courses, defining codes, names, credits, and descriptions.
- **Class Management:**
  - View lists of enrolled students for each course.
  - Post and manage course-wide announcements.
  - Create, edit, and delete assignments with specific weights and deadlines.
- **Grading Suite:**
  - Grade individual student assignments through a dedicated interface.
  - View class-wide performance metrics and average grades.
- **Visualization:** See comparative charts of student performance within their courses.

#### **Admin Experience**
- **System-Wide Oversight:** Access a global view of all courses, students, and teachers.
- **Global Analytics:** View comprehensive performance graphs that aggregate data across the entire institution.
- **Administrative Control:** (Planned) Manage user accounts and system-wide configurations.

### 2. Core Modules
- **Authentication System:** Secure email/password login and registration powered by Firebase Auth, with role-based redirection.
- **Course Engine:** A robust backend for managing course metadata, instructor assignments, and student rosters.
- **Assignment Tracker:** A dynamic scheduler that handles deadlines, weights, and submission status.
- **Grades & Analytics:** A calculation engine that computes weighted averages and GPAs, paired with a Canvas-based visualization layer.
- **Settings & Profile:** Dedicated portals for users to manage their identity and preferences within the system.

---

## Technologies Used
- **Backend:** Node.js, Express.js
- **Database:** Firebase Firestore (NoSQL)
- **Authentication:** Firebase Auth
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Visualization:** HTML5 Canvas API for custom data charting
- **Development Tools:** Nodemon, Dotenv, UUID

---

## Prerequisites
Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or higher recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- A [Firebase Project](https://console.firebase.google.com/) with Firestore and Authentication enabled.

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
  - `Graph/`: Performance visualization and GPA estimation scripts.
  - `schedule/`: Assignment tracking and scheduling logic.
  - `settings/`: Role-specific user settings pages.
