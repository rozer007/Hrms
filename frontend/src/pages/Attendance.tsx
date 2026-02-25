import { useEffect, useState } from 'react';
import { Plus, Filter, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { attendanceApi, employeeApi } from '../api/client';
import type { AttendanceRecord, AttendanceCreate, Employee } from '../types';
import {
  LoadingState, ErrorState, EmptyState, Modal, FormField, PageHeader,
} from '../components/ui';
import { format } from 'date-fns';

const today = () => new Date().toISOString().split('T')[0];

export default function Attendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [filterEmpId, setFilterEmpId] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  // Form
  const [form, setForm] = useState<AttendanceCreate>({
    employee_id: '',
    date: today(),
    status: 'Present',
  });
  const [formErrors, setFormErrors] = useState<Partial<AttendanceCreate>>({});

  const loadRecords = async (params?: { employee_id?: string; date_from?: string; date_to?: string }) => {
    try {
      setLoading(true); setError('');
      const data = await attendanceApi.list(params);
      setRecords(data.records);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
    employeeApi.list().then((d) => setEmployees(d.employees)).catch(() => {});
  }, []);

  const handleFilter = () => {
    loadRecords({
      employee_id: filterEmpId || undefined,
      date_from: filterFrom || undefined,
      date_to: filterTo || undefined,
    });
  };

  const handleReset = () => {
    setFilterEmpId(''); setFilterFrom(''); setFilterTo('');
    loadRecords();
  };

  const validate = () => {
    const errs: Partial<AttendanceCreate> = {};
    if (!form.employee_id) errs.employee_id = 'Select an employee';
    if (!form.date) errs.date = 'Date is required';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSubmitting(true);
    try {
      const rec = await attendanceApi.create(form);
      setRecords((prev) => [rec, ...prev]);
      toast.success('Attendance marked successfully');
      setShowModal(false);
      setForm({ employee_id: '', date: today(), status: 'Present' });
      setFormErrors({});
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (rec: AttendanceRecord) => {
    if (!confirm('Remove this attendance record?')) return;
    setDeletingId(rec.id);
    try {
      await attendanceApi.delete(rec.id);
      setRecords((prev) => prev.filter((r) => r.id !== rec.id));
      toast.success('Record deleted');
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  const presentCount = records.filter((r) => r.status === 'Present').length;
  const absentCount = records.filter((r) => r.status === 'Absent').length;

  const handleClose = () => {
    setShowModal(false);
    setForm({ employee_id: '', date: today(), status: 'Present' });
    setFormErrors({});
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Attendance"
        description="Track daily attendance for all employees"
        action={
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Mark Attendance
          </button>
        }
      />

      {/* Summary badges */}
      {records.length > 0 && (
        <div className="flex gap-3 mb-5">
          <span className="badge-present px-3 py-1 text-sm">✓ {presentCount} Present</span>
          <span className="badge-absent px-3 py-1 text-sm">✗ {absentCount} Absent</span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
            {records.length} Total
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 mb-5">
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
            <Filter size={15} /> Filters
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="label text-xs">Employee</label>
            <select
              className="input text-sm"
              value={filterEmpId}
              onChange={(e) => setFilterEmpId(e.target.value)}
            >
              <option value="">All employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label text-xs">From</label>
            <input type="date" className="input text-sm" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
          </div>
          <div>
            <label className="label text-xs">To</label>
            <input type="date" className="input text-sm" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
          </div>
          <button className="btn-primary text-sm" onClick={handleFilter}>Apply</button>
          <button className="btn-secondary text-sm" onClick={handleReset}>Reset</button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState message="Loading attendance records..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadRecords()} />
      ) : records.length === 0 ? (
        <EmptyState
          title="No attendance records found"
          description="Mark attendance to get started"
          action={
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Mark Attendance
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">ID</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((rec) => (
                <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {(rec.employee_name || rec.employee_id).charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{rec.employee_name || rec.employee_id}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{rec.employee_id}</span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {format(new Date(rec.date + 'T00:00:00'), 'MMM d, yyyy')}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={rec.status === 'Present' ? 'badge-present' : 'badge-absent'}>
                      {rec.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      className="btn-danger"
                      onClick={() => handleDelete(rec)}
                      disabled={deletingId === rec.id}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal title="Mark Attendance" onClose={handleClose}>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <FormField label="Employee" error={formErrors.employee_id}>
              <select
                className={`input ${formErrors.employee_id ? 'input-error' : ''}`}
                value={form.employee_id}
                onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
              >
                <option value="">Select employee…</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.id})</option>
                ))}
              </select>
            </FormField>
            <FormField label="Date" error={formErrors.date}>
              <input
                type="date"
                className={`input ${formErrors.date ? 'input-error' : ''}`}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </FormField>
            <FormField label="Status">
              <div className="flex gap-4 mt-1">
                {(['Present', 'Absent'] as const).map((s) => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value={s}
                      checked={form.status === s}
                      onChange={() => setForm({ ...form, status: s })}
                      className="accent-blue-600"
                    />
                    <span className={`text-sm font-medium ${s === 'Present' ? 'text-green-700' : 'text-red-700'}`}>
                      {s}
                    </span>
                  </label>
                ))}
              </div>
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={handleClose}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Saving…' : 'Mark Attendance'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
