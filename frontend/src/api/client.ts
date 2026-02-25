import axios from 'axios';
import type {
  Employee,
  EmployeeCreate,
  AttendanceRecord,
  AttendanceCreate,
  DashboardStats,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor to normalize errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.detail ||
      err.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(typeof message === 'string' ? message : JSON.stringify(message)));
  }
);

// Employees
export const employeeApi = {
  list: () =>
    api.get<{ employees: Employee[]; total: number }>('/api/employees/list_employees').then((r) => r.data),

  get: (id: string) =>
    api.get<Employee>(`/api/employees/get_employee/${id}`).then((r) => r.data),

  create: (data: EmployeeCreate) =>
    api.post<Employee>('/api/employees/create_employee', data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/api/employees/delete_employee/${id}`),

  dashboard: () =>
    api.get<DashboardStats>('/api/employees/dashboard').then((r) => r.data),
};

// Attendance
export const attendanceApi = {
  list: (params?: { employee_id?: string; date_from?: string; date_to?: string }) =>
    api
      .get<{ records: AttendanceRecord[]; total: number; total_present: number }>(
        '/api/attendance/list_attendance',
        { params }
      )
      .then((r) => r.data),

  create: (data: AttendanceCreate) =>
    api.post<AttendanceRecord>('/api/attendance/mark_attendance', data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/api/attendance/delete_attendance/${id}`),
};
