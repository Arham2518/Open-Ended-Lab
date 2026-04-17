# TaskBloom

TaskBloom is a task management web application built using the MERN stack (MongoDB, Express, Node.js). The purpose of this project is to make task management more engaging by combining a simple interface with a small gamified element. As users complete tasks, a digital flower grows, which visually represents their progress.

---

## Features

The application provides basic task management functionality along with some interactive elements:

* Users can create, edit, delete, and mark tasks as complete
* Two UI modes are available:

  * Zen mode (light and minimal interface)
  * Arcade mode (dark and more interactive interface)
* Tasks can be filtered by status (All, Active, Done)
* Tasks can be sorted based on priority or due date
* A flower grows petals as tasks are completed
* Users gain experience points (XP), level up, and maintain streaks
* Task data is stored so progress is not lost on refresh
* Tasks can have different priority levels (high, medium, low)
* Optional due dates can be added to tasks
* A simple animation appears when a task is completed in Arcade mode
* The application is responsive and works on different screen sizes

---

## Project Structure

```
taskbloom/
├── backend/
│   ├── server.js
│   ├── models/
│   │   └── Task.js
│   └── routes/
│       └── tasks.js
├── frontend/
│   ├── index.html
│   └── src/
│       ├── app.js
│       └── style.css
├── package.json
└── .env
```

---

## Requirements

Before running the project, make sure the following are installed:

* Node.js (version 14 or higher)
* npm (comes with Node.js)
* MongoDB (either local installation or MongoDB Atlas)

---

## Installation

Clone or download the project and navigate to the folder:

```
git clone <repository-url>
cd taskbloom
```

Install the required dependencies:

```
npm install
```

---

## Running the Project

### Step 1: Create environment variables

Create a `.env` file in the root directory and add:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/taskbloom
```

If you are using MongoDB Atlas, replace the connection string accordingly.

---

### Step 2: Start MongoDB

If you are using local MongoDB, run:

```
mongod
```

---

### Step 3: Start the server

Run the following command:

```
npm start
```

For development mode:

```
npm run dev
```

---

### Step 4: Open the application

Open your browser and go to:

```
http://localhost:5000
```

---

## Configuration

The application can be configured using the `.env` file:

* `PORT` defines the server port
* `MONGO_URI` defines the database connection

---

## Technologies Used

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose

### Frontend

* HTML
* CSS
* JavaScript (Vanilla JS)

---

## Common Issues

### MongoDB connection failed

Make sure MongoDB is running and the connection string in `.env` is correct.

### Backend not responding

Ensure the server is running and the correct port is being used.

### Data not saving

Check if MongoDB is connected properly.

---

## Development Notes

To modify the backend routes, edit:

```
backend/routes/tasks.js
```

To change the database schema, edit:

```
backend/models/Task.js
```

To update the UI design, edit:

```
frontend/src/style.css
```

---

## Conclusion

This project demonstrates how task management can be combined with simple gamification elements to improve user engagement. It maintains a balance between functionality and visual interaction while keeping the overall design clean and usable.

