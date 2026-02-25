import { useEffect, useState } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { employeeApi } from '../api/client';
import type { Employee, EmployeeCreate } from '../types';
import {
  LoadingState, ErrorState, EmptyState, Modal, FormField, PageHeader,
} from '../components/ui';
import { format } from 'date-fns';

const DEPARTMENTS = [
  'Engineering', 'Product', 'Design', 'Marketing', 'Sales',
  'HR', 'Finance', 'Operations', 'Legal', 'Customer Support',
];

const INITIAL_FORM: EmployeeCreate = { id: '', full_name: '', email: '', department: '' };

function validate(form: EmployeeCreate) {
  const errors: Partial<EmployeeCreate> = {};
  if (!form.id.trim()) errors.id = 'Employee ID is required';
  if (!form.full_name.trim()) errors.full_name = 'Full name is required';
  if (!form.email.trim()) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email format';
  if (!form.department) errors.department = 'Department is required';
  return errors;
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<EmployeeCreate>(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<Partial<EmployeeCreate>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true); setError('');
      const data = await employeeApi.list();
      setEmployees(data.employees);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = employees.filter(
    (e) =>
      e.full_name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate(form);
    if (Object.keys(errors).length) { setFormErrors(errors); return; }
    setSubmitting(true);
    try {
      const newEmp = await employeeApi.create(form);
      setEmployees((prev) => [newEmp, ...prev]);
      toast.success(`${newEmp.full_name} added successfully`);
      setShowModal(false);
      setForm(INITIAL_FORM);
      setFormErrors({});
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (emp: Employee) => {
    if (!confirm(`Delete "${emp.full_name}"? This will also remove all attendance records.`)) return;
    setDeletingId(emp.id);
    try {
      await employeeApi.delete(emp.id);
      setEmployees((prev) => prev.filter((e) => e.id !== emp.id));
      toast.success(`${emp.full_name} deleted`);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setForm(INITIAL_FORM);
    setFormErrors({});
  };

  if (loading) return <div className="p-8"><LoadingState message="Loading employees..." /></div>;
  if (error) return <div className="p-8"><ErrorState message={error} onRetry={load} /></div>;

  return (
    <div className="p-8">
      <PageHeader
        title="Employees"
        description={`${employees.length} employee${employees.length !== 1 ? 's' : ''} total`}
        action={
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add Employee
          </button>
        }
      />

      {/* Search */}
      {employees.length > 0 && (
        <div className="relative mb-5 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Search by name, email, department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title={search ? 'No employees match your search' : 'No employees yet'}
          description={search ? 'Try a different search term' : 'Get started by adding your first employee'}
          action={
            !search ? (
              <button className="btn-primary" onClick={() => setShowModal(true)}>
                <Plus size={16} /> Add Employee
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">ID</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Department</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Joined</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Present Days</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {emp.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{emp.full_name}</p>
                        <p className="text-xs text-gray-500 truncate">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{emp.id}</span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 hidden md:table-cell">{emp.department}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs hidden lg:table-cell">
                    {format(new Date(emp.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="inline-block px-2.5 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                      {emp.total_present}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      className="btn-danger"
                      onClick={() => handleDelete(emp)}
                      disabled={deletingId === emp.id}
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

      {/* Add Modal */}
      {showModal && (
        <Modal title="Add New Employee" onClose={handleClose}>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <FormField label="Employee ID" error={formErrors.id}>
              <input
                className={`input ${formErrors.id ? 'input-error' : ''}`}
                placeholder="e.g. EMP001"
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
              />
            </FormField>
            <FormField label="Full Name" error={formErrors.full_name}>
              <input
                className={`input ${formErrors.full_name ? 'input-error' : ''}`}
                placeholder="e.g. Jane Doe"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </FormField>
            <FormField label="Email Address" error={formErrors.email}>
              <input
                type="email"
                className={`input ${formErrors.email ? 'input-error' : ''}`}
                placeholder="jane@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </FormField>
            <FormField label="Department" error={formErrors.department}>
              <select
                className={`input ${formErrors.department ? 'input-error' : ''}`}
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              >
                <option value="">Select department…</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={handleClose}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Adding…' : 'Add Employee'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
