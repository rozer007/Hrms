export interface Employee {
  id: string;
  full_name: string;
  email: string;
  department: string;
  created_at: string;
  total_present: number;
}

export interface EmployeeCreate {
  id: string;
  full_name: string;
  email: string;
  department: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_name?: string;
  date: string;
  status: 'Present' | 'Absent';
  created_at: string;
}

export interface AttendanceCreate {
  employee_id: string;
  date: string;
  status: 'Present' | 'Absent';
}

export interface DashboardStats {
  total_employees: number;
  total_departments: number;
  present_today: number;
  absent_today: number;
}

export interface ApiError {
  detail: string;
}
