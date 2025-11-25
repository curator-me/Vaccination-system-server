# Vaccine Distribution System Backend

A Node.js + Express backend for managing **regional vaccine hubs**, vaccine centers, user registrations, appointments, and vaccine stock. Includes automated **appointment reminders**, **stock monitoring**, and a **chatbot assistant** for user guidance.

---

## **Table of Contents**

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Appointment Workflow](#appointment-workflow)
- [Cron Jobs](#cron-jobs)
- [License](#license)

---

## **Features**

- Regional **vaccine hubs** managing vaccine distribution to centers.
- User registration via email, phone and **NID** with password hashing.
- **JWT**-based authentication with protected routes.
- CRUD operations for vaccine centers and appointments.
- Vaccine appointment based on vaccine stock, availability,
- **Optimal appointment date** based on vaccine availability, slot availability and vaccine stock for selected center ensuring a seamless, conflict-free vaccination journey
- **Automated** vaccine stock management per **hub** and **center**.
- Automated **appointment reminders** via email.
- Daily **vaccine stock monitoring** and low-stock alerts.
- **Chatbot assistant** to guide users on registration, appointments, and vaccine info.

---

## **Tech Stack**

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Atlas / local)
- **Auth:** JWT
- **Email:** Nodemailer
- **Cron Jobs:** node-cron
- **Date Handling:** dayjs
- **Password Security:** bcryptjs

---

## **Environment Variables**

Create a `.env` file in the root:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
```

---

## **Getting Started**

1. **Install dependencies**

```bash
npm install
```

2. **Run the server**

```bash
npm run dev
```

3. **Server URL**

```
http://localhost:5000
```

---

## **API Endpoints**

### **Users**

| Method | Route              | Description       |
| ------ | ------------------ | ----------------- |
| POST   | `/api/users`       | Create a new user |
| POST   | `/api/users/login` | User login        |
| GET    | `/api/users`       | Get user by email |
| GET    | `/api/users/:id`   | Get user by ID    |

### **Appointments**

| Method | Route                       | Description                  |
| ------ | --------------------------- | ---------------------------- |
| GET    | `/api/appointments`         | Get all appointments (admin) |
| GET    | `/api/appointments/:userId` | Get appointments for a user  |
| POST   | `/api/appointments/add`     | Add a new appointment        |

### **Vaccine Centers**

| Method | Route                      | Description             |
| ------ | -------------------------- | ----------------------- |
| GET    | `/api/vaccine-centers`     | Get all vaccine centers |
| GET    | `/api/vaccine-centers/:id` | Get center by ID        |

### **Chatbot**

| Method | Route               | Description                        |
| ------ | ------------------- | ---------------------------------- |
| POST   | `/api/chatbot/chat` | Ask questions to chatbot assistant |

---

## **Appointment Workflow**

When a user submits an appointment request:

1. **Validate user**

   - Check if `userId` exists in users collection.

2. **Validate vaccine center**

   - Fetch center by `center_id`. If not found, return 404.

3. **Validate vaccine availability**

   - Ensure the requested vaccine exists in the center’s stock.

4. **Check slot availability**

   - If all slots are booked step 5.

5. **Determine appointment date**

   - Calculate next available appointment based on slots booked.

6. **Create appointment document**

   - Save user info, center info, vaccine info, registration number, date of registration, appointment date, and status `'applied'`. Generate a vaccine card.

7. **Update booked slots**

   - Increment `slot_booked` for that vaccine in the center.

8. **Chatbot assistant available**

   - Users can query chatbot for assistance about vaccine info, appointment status, and center locations.

---

## **Cron Jobs**

- **10 PM:** Appointment reminders sent to users for next-day appointments.
- **11 PM:** Vaccine stock check for low-stock alerts and supply requests.

Cron jobs are modular and located in the `/cron` folder.

---

## **License**

This project is licensed under the MIT License.

---
