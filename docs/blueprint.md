# **App Name**: UniAttend

## Core Features:

- Admin Login: Secure authentication for administrators using Firebase Authentication, allowing access to the dashboard. Includes password visibility toggle.
- User Management CRUD: Administrators can create, read, update, and delete user accounts (Admin, Jefe de Carrera, Docente, Alumno), with validation.
- Role Assignment: Ability to assign and modify roles (Administrador, Jefe de Carrera, Docente, Alumno) to each user during creation and editing.
- Firestore Data Persistence: All user data and roles are stored and managed persistently in Firestore database.
- Admin Dashboard Overview: A centralized dashboard displaying key statistics like total students, total teachers, and daily attendance summaries.
- Dashboard Navigation: Intuitive sidebar navigation within the dashboard to access sections for Users, Alumnos, Docentes, and Asistencias.
- Facial Recognition Preparation: Backend setup for integrating face-api.js for future facial recognition capabilities (without implementing actual recognition in this MVP).

## Style Guidelines:

- The visual scheme embraces a modern, university aesthetic with a light color palette. The primary color is a vibrant and energetic Red (#FF1E2D).
- The background color is a very subtle, desaturated hint of the primary hue (#F7DCDC), providing a clean, bright foundation consistent with a light theme.
- An accent color, a rich magenta (#991F60), provides visual contrast and depth, strategically used for interactive elements and highlights.
- Both headlines and body text utilize 'Poppins', a modern geometric sans-serif, chosen for its contemporary feel and legibility, suitable for short and medium-length texts found in a dashboard.
- Employ a consistent set of line-style icons for navigation and actions within the dashboard, ensuring clarity and a modern, minimalist look.
- The admin interface features a clean, two-column layout with a fixed sidebar for navigation and a main content area for data display and forms, ensuring easy access and logical information flow.
- Subtle transitions and hover effects on navigation items and interactive buttons will provide a smooth and responsive user experience.