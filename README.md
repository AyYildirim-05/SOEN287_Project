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

## Deliverable 1 Features 
- Course Overview, ability to navigate between individual course pages
- Assignment scheduler frontend
- Hard-Coded chart displaying grades
- Sign Up and Log In System using Firebase

## Deliverable 2 Features To Be Implemented
- Improved Sign Up and Log In system with proper authentication
- Grades chart updates dynamically based on grades stored in a database
- Assignments can be sorted by due date, completed and late submissions
