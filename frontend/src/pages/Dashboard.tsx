import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Building2, UserCheck, UserX, ArrowRight } from 'lucide-react';
import { employeeApi, attendanceApi } from '../api/client';
import type { DashboardStats, Employee, AttendanceRecord } from '../types';
import { LoadingState, ErrorState } from '../components/ui';
import { format } from 'date-fns';

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const [s, emps, att] = await Promise.all([
        employeeApi.dashboard(),
        employeeApi.list(),
        attendanceApi.list(),
      ]);
      setStats(s);
      setEmployees(emps.employees.slice(0, 5));
      setRecentAttendance(att.records.slice(0, 8));
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="p-8"><LoadingState message="Loading dashboard..." /></div>;
  if (error) return <div className="p-8"><ErrorState message={error} onRetry={load} /></div>;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview for {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Employees" value={stats!.total_employees} icon={Users} color="bg-blue-500" />
        <StatCard label="Departments" value={stats!.total_departments} icon={Building2} color="bg-purple-500" />
        <StatCard label="Present Today" value={stats!.present_today} icon={UserCheck} color="bg-green-500" />
        <StatCard label="Absent Today" value={stats!.absent_today} icon={UserX} color="bg-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Employees */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="text-sm font-semibold text-gray-900">Recent Employees</h2>
            <Link to="/employees" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {employees.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No employees yet</p>
            ) : (
              employees.map((emp) => (
                <div key={emp.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {emp.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{emp.full_name}</p>
                    <p className="text-xs text-gray-500 truncate">{emp.department} · {emp.id}</p>
                  </div>
                  <span className="text-xs text-gray-400">{emp.total_present}d present</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="text-sm font-semibold text-gray-900">Recent Attendance</h2>
            <Link to="/attendance" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentAttendance.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No attendance records yet</p>
            ) : (
              recentAttendance.map((rec) => (
                <div key={rec.id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{rec.employee_name || rec.employee_id}</p>
                    <p className="text-xs text-gray-500">{format(new Date(rec.date + 'T00:00:00'), 'MMM d, yyyy')}</p>
                  </div>
                  <span className={rec.status === 'Present' ? 'badge-present' : 'badge-absent'}>
                    {rec.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
