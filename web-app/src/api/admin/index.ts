import request from '@/utils/request';

// baseURL 已包含 /api，后端实际路径为 /api/admin/crud/...
const adminPrefix = '/admin/crud';

// ---- Users ----
export function listAdminUsers(query?: any) {
  return request({
    url: `${adminPrefix}/users/`,
    method: 'get',
    params: query
  });
}
export function getAdminUser(id: string | number) {
  return request({
    url: `${adminPrefix}/users/${id}/`,
    method: 'get'
  });
}

export function addAdminUser(data: any) {
  return request({
    url: `${adminPrefix}/users/`,
    method: 'post',
    data
  });
}

export function updateAdminUser(id: string | number, data: any) {
  return request({
    url: `${adminPrefix}/users/${id}/`,
    method: 'patch',
    data
  });
}

export function delAdminUser(id: string | number) {
  return request({
    url: `${adminPrefix}/users/${id}/`,
    method: 'delete'
  });
}

// ---- Students ----
export function listAdminStudents(query?: any) {
  return request({
    url: `${adminPrefix}/students/`,
    method: 'get',
    params: query
  });
}

export function getAdminStudent(id: string | number) {
  return request({
    url: `${adminPrefix}/students/${id}/`,
    method: 'get'
  });
}

export function addAdminStudent(data: any) {
  return request({
    url: `${adminPrefix}/students/`,
    method: 'post',
    data
  });
}

export function updateAdminStudent(id: string | number, data: any) {
  return request({
    url: `${adminPrefix}/students/${id}/`,
    method: 'patch',
    data
  });
}

export function delAdminStudent(id: string | number) {
  return request({
    url: `${adminPrefix}/students/${id}/`,
    method: 'delete'
  });
}

// ---- Lecturers ----
export function listAdminLecturers(query?: any) {
  return request({
    url: `${adminPrefix}/lecturers/`,
    method: 'get',
    params: query
  });
}

export function getAdminLecturer(id: string | number) {
  return request({
    url: `${adminPrefix}/lecturers/${id}/`,
    method: 'get'
  });
}

export function addAdminLecturer(data: any) {
  return request({
    url: `${adminPrefix}/lecturers/`,
    method: 'post',
    data
  });
}

export function updateAdminLecturer(id: string | number, data: any) {
  return request({
    url: `${adminPrefix}/lecturers/${id}/`,
    method: 'patch',
    data
  });
}

export function delAdminLecturer(id: string | number) {
  return request({
    url: `${adminPrefix}/lecturers/${id}/`,
    method: 'delete'
  });
}

// ---- Admins ----
export function listAdmins(query?: any) {
  return request({
    url: `${adminPrefix}/admins/`,
    method: 'get',
    params: query
  });
}

export function getAdmin(id: string | number) {
  return request({
    url: `${adminPrefix}/admins/${id}/`,
    method: 'get'
  });
}

export function addAdmin(data: any) {
  return request({
    url: `${adminPrefix}/admins/`,
    method: 'post',
    data
  });
}

export function updateAdmin(id: string | number, data: any) {
  return request({
    url: `${adminPrefix}/admins/${id}/`,
    method: 'patch',
    data
  });
}

export function delAdmin(id: string | number) {
  return request({
    url: `${adminPrefix}/admins/${id}/`,
    method: 'delete'
  });
}

// ---- Semesters ----
export function listSemesters(query?: any) {
  return request({
    url: `${adminPrefix}/semesters/`,
    method: 'get',
    params: query
  });
}

export function getSemester(id: string | number) {
  return request({
    url: `${adminPrefix}/semesters/${id}/`,
    method: 'get'
  });
}

export function addSemester(data: any) {
  return request({
    url: `${adminPrefix}/semesters/`,
    method: 'post',
    data
  });
}

export function updateSemester(id: string | number, data: any) {
  return request({
    url: `${adminPrefix}/semesters/${id}/`,
    method: 'patch',
    data
  });
}

export function delSemester(id: string | number) {
  return request({
    url: `${adminPrefix}/semesters/${id}/`,
    method: 'delete'
  });
}

// ---- Modules ----
export function listModules(query?: any) {
  return request({
    url: `${adminPrefix}/modules/`,
    method: 'get',
    params: query
  });
}

export function getModule(id: string | number) {
  return request({
    url: `${adminPrefix}/modules/${id}/`,
    method: 'get'
  });
}

export function addModule(data: any) {
  return request({
    url: `${adminPrefix}/modules/`,
    method: 'post',
    data
  });
}

export function updateModule(id: string | number, data: any) {
  return request({
    url: `${adminPrefix}/modules/${id}/`,
    method: 'patch',
    data
  });
}

export function delModule(id: string | number) {
  return request({
    url: `${adminPrefix}/modules/${id}/`,
    method: 'delete'
  });
}

// ---- Class Sessions ----
export function listClassSessions(query?: any) {
  return request({
    url: `${adminPrefix}/sessions/`,
    method: 'get',
    params: query
  });
}

export function getClassSession(id: string | number) {
  return request({
    url: `${adminPrefix}/sessions/${id}/`,
    method: 'get'
  });
}

export function addClassSession(data: any) {
  return request({
    url: `${adminPrefix}/sessions/`,
    method: 'post',
    data
  });
}

export function updateClassSession(id: string | number, data: any) {
  return request({
    url: `${adminPrefix}/sessions/${id}/`,
    method: 'patch',
    data
  });
}

export function delClassSession(id: string | number) {
  return request({
    url: `${adminPrefix}/sessions/${id}/`,
    method: 'delete'
  });
}

// ---- Attendance Records ----
export function listAttendanceRecords(query?: any) {
  return request({
    url: `${adminPrefix}/attendance/`,
    method: 'get',
    params: query
  });
}

export function getAttendanceRecord(id: string | number) {
  return request({
    url: `${adminPrefix}/attendance/${id}/`,
    method: 'get'
  });
}

export function addAttendanceRecord(data: any) {
  return request({
    url: `${adminPrefix}/attendance/`,
    method: 'post',
    data
  });
}

export function updateAttendanceRecord(id: string | number, data: any) {
  return request({
    url: `${adminPrefix}/attendance/${id}/`,
    method: 'patch',
    data
  });
}

export function delAttendanceRecord(id: string | number) {
  return request({
    url: `${adminPrefix}/attendance/${id}/`,
    method: 'delete'
  });
}

// ---- Notifications ----
export function listNotifications(query?: any) {
  return request({
    url: `${adminPrefix}/notifications/`,
    method: 'get',
    params: query
  });
}

export function getNotification(id: string | number) {
  return request({
    url: `${adminPrefix}/notifications/${id}/`,
    method: 'get'
  });
}

export function addNotification(data: any) {
  return request({
    url: `${adminPrefix}/notifications/`,
    method: 'post',
    data
  });
}

export function updateNotification(id: string | number, data: any) {
  return request({
    url: `${adminPrefix}/notifications/${id}/`,
    method: 'patch',
    data
  });
}

export function delNotification(id: string | number) {
  return request({
    url: `${adminPrefix}/notifications/${id}/`,
    method: 'delete'
  });
}

// ---- News ----
export function listNews(query?: any) {
  return request({
    url: `${adminPrefix}/news/`,
    method: 'get',
    params: query
  });
}

export function getNews(id: string | number) {
  return request({
    url: `${adminPrefix}/news/${id}/`,
    method: 'get'
  });
}

export function addNews(data: any) {
  return request({
    url: `${adminPrefix}/news/`,
    method: 'post',
    data
  });
}

export function updateNews(id: string | number, data: any) {
  return request({
    url: `${adminPrefix}/news/${id}/`,
    method: 'patch',
    data
  });
}

export function delNews(id: string | number) {
  return request({
    url: `${adminPrefix}/news/${id}/`,
    method: 'delete'
  });
}

// ---- Events ----
export function listEvents(query?: any) {
  return request({
    url: `${adminPrefix}/events/`,
    method: 'get',
    params: query
  });
}

export function getEvent(id: string | number) {
  return request({
    url: `${adminPrefix}/events/${id}/`,
    method: 'get'
  });
}

export function addEvent(data: any) {
  return request({
    url: `${adminPrefix}/events/`,
    method: 'post',
    data
  });
}

export function updateEvent(id: string | number, data: any) {
  return request({
    url: `${adminPrefix}/events/${id}/`,
    method: 'patch',
    data
  });
}

export function delEvent(id: string | number) {
  return request({
    url: `${adminPrefix}/events/${id}/`,
    method: 'delete'
  });
}

// ---- Leave Requests ----
export function listLeaveRequests(query?: any) {
  return request({
    url: `${adminPrefix}/leaves/`,
    method: 'get',
    params: query
  });
}

export function getLeaveRequest(id: string | number) {
  return request({
    url: `${adminPrefix}/leaves/${id}/`,
    method: 'get'
  });
}

export function addLeaveRequest(data: any) {
  return request({
    url: `${adminPrefix}/leaves/`,
    method: 'post',
    data
  });
}

export function updateLeaveRequest(id: string | number, data: any) {
  return request({
    url: `${adminPrefix}/leaves/${id}/`,
    method: 'patch',
    data
  });
}

export function delLeaveRequest(id: string | number) {
  return request({
    url: `${adminPrefix}/leaves/${id}/`,
    method: 'delete'
  });
}

// ---- Appeals ----
export function listAppeals(query?: any) {
  return request({
    url: `${adminPrefix}/appeals/`,
    method: 'get',
    params: query
  });
}

export function getAppeal(id: string | number) {
  return request({
    url: `${adminPrefix}/appeals/${id}/`,
    method: 'get'
  });
}

export function addAppeal(data: any) {
  return request({
    url: `${adminPrefix}/appeals/`,
    method: 'post',
    data
  });
}

export function updateAppeal(id: string | number, data: any) {
  return request({
    url: `${adminPrefix}/appeals/${id}/`,
    method: 'patch',
    data
  });
}

export function delAppeal(id: string | number) {
  return request({
    url: `${adminPrefix}/appeals/${id}/`,
    method: 'delete'
  });
}
