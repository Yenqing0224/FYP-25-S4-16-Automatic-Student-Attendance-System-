# Attendify API Documentation

## Base Information

- **Base URL**: `https://attendify-ekg6.onrender.com/api`
- **Authentication**: Token-based authentication
- **Token Format**: `Token {token}` (in Authorization header)
- **Content-Type**: `application/json`

---

## 1. Authentication

### 1.1 Login

**Endpoint**: `POST /login/`

**Request Body**:
```json
{
  "username": "string",
  "password": "string"
}
```

**Response**:
```json
{
  "message": "Login successful",
  "token": "string",
  "user": {
    "id": 1,
    "username": "string",
    "email": "string",
    "first_name": "string",
    "last_name": "string",
    "phone_number": "string",
    "personal_email": "string",
    "address_street": "string",
    "address_unit": "string",
    "address_postal": "string",
    "address_country": "string",
    "role_type": "string",
    "gender": "string",
    "image_url": "string"
  }
}
```

---

## 2. Admin Users Management

### 2.1 List Admins

**Endpoint**: `GET /admin/crud/admins/`

**Query Parameters**:
- `page` (integer, optional): Page number (default: 1)
- `page_size` (integer, optional): Items per page (default: 10)
- `search` (string, optional): Search keyword
- `adminId` (string, optional): Filter by admin ID
- `name` (string, optional): Filter by name
- `email` (string, optional): Filter by email
- `status` (string, optional): Filter by status (Active/Inactive)

**Response**:
```json
{
  "count": 100,
  "next": "string",
  "previous": "string",
  "results": [
    {
      "id": 1,
      "adminId": "string",
      "name": "string",
      "username": "string",
      "email": "string",
      "mobile": "string",
      "role": "string",
      "status": "Active"
    }
  ]
}
```

### 2.2 Get Admin Detail

**Endpoint**: `GET /admin/crud/admins/{id}/`

**Response**:
```json
{
  "id": 1,
  "adminId": "string",
  "name": "string",
  "username": "string",
  "email": "string",
  "mobile": "string",
  "role": "string",
  "status": "Active"
}
```

### 2.3 Create Admin

**Endpoint**: `POST /admin/crud/admins/`

**Request Body**:
```json
{
  "adminId": "string",
  "name": "string",
  "username": "string",
  "email": "string",
  "mobile": "string",
  "role": "string",
  "status": "Active"
}
```

**Response**: Same as Get Admin Detail

### 2.4 Update Admin

**Endpoint**: `PUT /admin/crud/admins/{id}/`

**Request Body**: Same as Create Admin

**Response**: Same as Get Admin Detail

### 2.5 Delete Admin

**Endpoint**: `DELETE /admin/crud/admins/{id}/`

**Response**: `204 No Content`

---

## 3. Students Management

### 3.1 List Students

**Endpoint**: `GET /admin/crud/students/`

**Query Parameters**:
- `page` (integer, optional): Page number
- `page_size` (integer, optional): Items per page
- `studentName` (string, optional): Filter by student name
- `studentId` (string, optional): Filter by student ID
- `email` (string, optional): Filter by email
- `status` (string, optional): Filter by status (Active/Inactive)

**Response**:
```json
{
  "count": 100,
  "next": "string",
  "previous": "string",
  "results": [
    {
      "id": 1,
      "studentId": "string",
      "name": "string",
      "email": "string",
      "mobile": "string",
      "startDay": "YYYY-MM-DD",
      "endDay": "YYYY-MM-DD",
      "attendanceRate": 95.5,
      "threshold": 90,
      "status": "Active"
    }
  ]
}
```

### 3.2 Get Student Detail

**Endpoint**: `GET /admin/crud/students/{id}/`

**Response**:
```json
{
  "id": 1,
  "studentId": "string",
  "name": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "schoolEmail": "string",
  "personalEmail": "string",
  "mobile": "string",
  "mobileCountry": "string",
  "streetAddress": "string",
  "unitNumber": "string",
  "postalCode": "string",
  "startDay": "YYYY-MM-DD",
  "endDay": "YYYY-MM-DD",
  "attendanceRate": 95.5,
  "threshold": 90,
  "status": "Active",
  "enrolledModules": ["string"],
  "image_url": "string"
}
```

### 3.3 Get Student Semester Records

**Endpoint**: `GET /admin/crud/students/{id}/semester-records/`

**Response**:
```json
{
  "studentId": "string",
  "semesterRecords": [
    {
      "semester": "string",
      "startDay": "YYYY-MM-DD",
      "endDay": "YYYY-MM-DD",
      "attendance": "95.5%"
    }
  ]
}
```

### 3.4 Create Student

**Endpoint**: `POST /admin/crud/students/`

**Request Body**:
```json
{
  "studentId": "string",
  "firstName": "string",
  "lastName": "string",
  "schoolEmail": "string",
  "personalEmail": "string",
  "mobile": "string",
  "mobileCountry": "string",
  "streetAddress": "string",
  "unitNumber": "string",
  "postalCode": "string",
  "status": "Active"
}
```

**Response**: Same as Get Student Detail

### 3.5 Update Student

**Endpoint**: `PUT /admin/crud/students/{id}/`

**Request Body**: Same as Create Student

**Response**: Same as Get Student Detail

### 3.6 Delete Student

**Endpoint**: `DELETE /admin/crud/students/{id}/`

**Response**: `204 No Content`

---

## 4. Lecturers Management

### 4.1 List Lecturers

**Endpoint**: `GET /admin/crud/lecturers/`

**Query Parameters**:
- `page` (integer, optional): Page number
- `page_size` (integer, optional): Items per page
- `name` (string, optional): Filter by name
- `lecturerId` (string, optional): Filter by lecturer ID
- `email` (string, optional): Filter by email
- `department` (string, optional): Filter by department

**Response**:
```json
{
  "count": 100,
  "next": "string",
  "previous": "string",
  "results": [
    {
      "id": 1,
      "lecturerId": "string",
      "name": "string",
      "email": "string",
      "mobile": "string",
      "department": "string",
      "status": "Active"
    }
  ]
}
```

### 4.2 Get Lecturer Detail

**Endpoint**: `GET /admin/crud/lecturers/{id}/`

**Response**:
```json
{
  "id": 1,
  "lecturerId": "string",
  "name": "string",
  "email": "string",
  "mobile": "string",
  "department": "string",
  "status": "Active"
}
```

### 4.3 Create Lecturer

**Endpoint**: `POST /admin/crud/lecturers/`

**Request Body**:
```json
{
  "lecturerId": "string",
  "name": "string",
  "email": "string",
  "mobile": "string",
  "department": "string",
  "status": "Active"
}
```

**Response**: Same as Get Lecturer Detail

### 4.4 Update Lecturer

**Endpoint**: `PUT /admin/crud/lecturers/{id}/`

**Request Body**: Same as Create Lecturer

**Response**: Same as Get Lecturer Detail

### 4.5 Delete Lecturer

**Endpoint**: `DELETE /admin/crud/lecturers/{id}/`

**Response**: `204 No Content`

---

## 5. Staff Management

### 5.1 List Staff

**Endpoint**: `GET /admin/crud/staff/`

**Query Parameters**:
- `page` (integer, optional): Page number
- `page_size` (integer, optional): Items per page
- `staffName` (string, optional): Filter by staff name
- `staffId` (string, optional): Filter by staff ID
- `department` (string, optional): Filter by department

**Response**:
```json
{
  "count": 100,
  "next": "string",
  "previous": "string",
  "results": [
    {
      "id": 1,
      "staffId": "string",
      "name": "string",
      "department": "string",
      "position": "string",
      "email": "string",
      "mobile": "string",
      "leaveBalance": 85.5,
      "status": "Active"
    }
  ]
}
```

### 5.2 Get Staff Detail

**Endpoint**: `GET /admin/crud/staff/{id}/`

**Response**:
```json
{
  "id": 1,
  "staffId": "string",
  "name": "string",
  "department": "string",
  "position": "string",
  "email": "string",
  "mobile": "string",
  "leaveBalance": 85.5,
  "status": "Active"
}
```

### 5.3 Create Staff

**Endpoint**: `POST /admin/crud/staff/`

**Request Body**:
```json
{
  "staffId": "string",
  "name": "string",
  "department": "string",
  "position": "string",
  "email": "string",
  "mobile": "string",
  "status": "Active"
}
```

**Response**: Same as Get Staff Detail

### 5.4 Update Staff

**Endpoint**: `PUT /admin/crud/staff/{id}/`

**Request Body**: Same as Create Staff

**Response**: Same as Get Staff Detail

### 5.5 Delete Staff

**Endpoint**: `DELETE /admin/crud/staff/{id}/`

**Response**: `204 No Content`

---

## 6. Modules Management

### 6.1 List Modules

**Endpoint**: `GET /admin/crud/modules/`

**Query Parameters**:
- `page` (integer, optional): Page number
- `page_size` (integer, optional): Items per page
- `moduleCode` (string, optional): Filter by module code
- `moduleName` (string, optional): Filter by module name
- `status` (string, optional): Filter by status (Active/Inactive)

**Response**:
```json
{
  "count": 100,
  "next": "string",
  "previous": "string",
  "results": [
    {
      "id": 1,
      "moduleCode": "string",
      "moduleName": "string",
      "credits": 6,
      "studentsEnrolled": 213,
      "avgAttendance": 78.5,
      "lecturers": ["string"],
      "status": "Active",
      "description": "string"
    }
  ]
}
```

### 6.2 Get Module Detail

**Endpoint**: `GET /admin/crud/modules/{id}/`

**Response**:
```json
{
  "id": 1,
  "moduleCode": "string",
  "moduleName": "string",
  "credits": 6,
  "studentsEnrolled": 213,
  "avgAttendance": 78.5,
  "lecturers": ["string"],
  "status": "Active",
  "description": "string"
}
```

### 6.3 Get Module Classes

**Endpoint**: `GET /admin/crud/modules/{id}/classes/`

**Response**:
```json
{
  "moduleId": 1,
  "classes": [
    {
      "id": "string",
      "type": "Lecture",
      "lecturer": "string",
      "venue": "string",
      "date": "YYYY-MM-DD HH:mm:ss",
      "present": 150,
      "absent": 63,
      "attendanceRate": 70.4,
      "status": "Active"
    }
  ]
}
```

### 6.4 Get Class Students

**Endpoint**: `GET /admin/crud/modules/{moduleId}/classes/{classId}/students/`

**Response**:
```json
{
  "classId": "string",
  "students": [
    {
      "id": 1,
      "studentId": "string",
      "name": "string",
      "status": "Present"
    }
  ]
}
```

### 6.5 Create Module

**Endpoint**: `POST /admin/crud/modules/`

**Request Body**:
```json
{
  "moduleCode": "string",
  "moduleName": "string",
  "credits": 6,
  "description": "string",
  "status": "Active"
}
```

**Response**: Same as Get Module Detail

### 6.6 Update Module

**Endpoint**: `PUT /admin/crud/modules/{id}/`

**Request Body**: Same as Create Module

**Response**: Same as Get Module Detail

### 6.7 Delete Module

**Endpoint**: `DELETE /admin/crud/modules/{id}/`

**Response**: `204 No Content`

---

## 7. Announcements Management

### 7.1 List Announcements

**Endpoint**: `GET /admin/crud/announcements/`

**Query Parameters**:
- `page` (integer, optional): Page number
- `page_size` (integer, optional): Items per page
- `title` (string, optional): Filter by title
- `type` (string, optional): Filter by type
- `status` (string, optional): Filter by status

**Response**:
```json
{
  "count": 100,
  "next": "string",
  "previous": "string",
  "results": [
    {
      "id": 1,
      "title": "string",
      "type": "string",
      "content": "string",
      "attachments": ["string"],
      "status": "Published",
      "created_at": "YYYY-MM-DD HH:mm:ss",
      "updated_at": "YYYY-MM-DD HH:mm:ss"
    }
  ]
}
```

### 7.2 Get Announcement Detail

**Endpoint**: `GET /admin/crud/announcements/{id}/`

**Response**:
```json
{
  "id": 1,
  "title": "string",
  "type": "string",
  "content": "string",
  "attachments": ["string"],
  "status": "Published",
  "created_at": "YYYY-MM-DD HH:mm:ss",
  "updated_at": "YYYY-MM-DD HH:mm:ss"
}
```

### 7.3 Create Announcement

**Endpoint**: `POST /admin/crud/announcements/`

**Request Body**:
```json
{
  "title": "string",
  "type": "string",
  "content": "string",
  "attachments": ["string"],
  "status": "Published"
}
```

**Response**: Same as Get Announcement Detail

### 7.4 Update Announcement

**Endpoint**: `PUT /admin/crud/announcements/{id}/`

**Request Body**: Same as Create Announcement

**Response**: Same as Get Announcement Detail

### 7.5 Delete Announcement

**Endpoint**: `DELETE /admin/crud/announcements/{id}/`

**Response**: `204 No Content`

---

## 8. Events (Attendance) Management

### 8.1 List Events

**Endpoint**: `GET /admin/crud/events/`

**Query Parameters**:
- `page` (integer, optional): Page number
- `page_size` (integer, optional): Items per page
- `eventName` (string, optional): Filter by event name
- `startDate` (string, optional): Filter by start date (YYYY-MM-DD)
- `endDate` (string, optional): Filter by end date (YYYY-MM-DD)

**Response**:
```json
{
  "count": 100,
  "next": "string",
  "previous": "string",
  "results": [
    {
      "id": 1,
      "eventName": "string",
      "organizer": "string",
      "venue": "string",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "startTime": "HH:mm:ss",
      "endTime": "HH:mm:ss",
      "total": 200,
      "present": 150,
      "late": 20,
      "absent": 30,
      "rate": "75.0%",
      "status": "Active"
    }
  ]
}
```

### 8.2 Get Event Detail

**Endpoint**: `GET /admin/crud/events/{id}/`

**Response**:
```json
{
  "id": 1,
  "eventName": "string",
  "organizer": "string",
  "venue": "string",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "startTime": "HH:mm:ss",
  "endTime": "HH:mm:ss",
  "total": 200,
  "present": 150,
  "late": 20,
  "absent": 30,
  "rate": "75.0%",
  "status": "Active"
}
```

### 8.3 Get Event Attendees

**Endpoint**: `GET /admin/crud/events/{id}/attendees/`

**Response**:
```json
{
  "eventId": 1,
  "attendees": [
    {
      "id": 1,
      "studentId": "string",
      "name": "string",
      "status": "Present",
      "checkInTime": "YYYY-MM-DD HH:mm:ss"
    }
  ]
}
```

### 8.4 Create Event

**Endpoint**: `POST /admin/crud/events/`

**Request Body**:
```json
{
  "eventName": "string",
  "organizer": "string",
  "venue": "string",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "startTime": "HH:mm:ss",
  "endTime": "HH:mm:ss",
  "status": "Active"
}
```

**Response**: Same as Get Event Detail

### 8.5 Update Event

**Endpoint**: `PUT /admin/crud/events/{id}/`

**Request Body**: Same as Create Event

**Response**: Same as Get Event Detail

### 8.6 Delete Event

**Endpoint**: `DELETE /admin/crud/events/{id}/`

**Response**: `204 No Content`

---

## Common Response Format

### Success Response
- **200 OK**: Request successful, returns data
- **201 Created**: Resource created successfully
- **204 No Content**: Request successful, no content to return

### Error Response
```json
{
  "error": "string",
  "message": "string",
  "detail": "string"
}
```

### Common Error Codes
- **400 Bad Request**: Invalid request parameters
- **401 Unauthorized**: Authentication required or token invalid
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

---

## Notes

1. All date fields should be in `YYYY-MM-DD` format
2. All datetime fields should be in `YYYY-MM-DD HH:mm:ss` format
3. All time fields should be in `HH:mm:ss` format
4. Pagination uses `page` and `page_size` parameters
5. All list endpoints should support pagination with `count`, `next`, `previous`, and `results` fields
6. Status fields typically use values: `"Active"` or `"Inactive"`
7. File uploads for attachments should use multipart/form-data
8. Image URLs should be full URLs accessible from the frontend

