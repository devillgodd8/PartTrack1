import { useState, useEffect } from 'react';
import { listUsers, createUser, updateUser, deactivateUser, resetUserPassword, deleteUser } from '../../api/users';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  KeyIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  HashtagIcon,
  EnvelopeIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null });
  const [resetModal, setResetModal] = useState({ open: false, user: null, password: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await listUsers();
      setUsers(data.users || []);
    } catch (err) {
      toast.error('Failed to load user roster');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const { password, ...updates } = form;
        await updateUser(editing, updates);
        toast.success('User details updated successfully');
      } else {
        await createUser(form);
        toast.success('User account created with 5-digit tracking prefix');
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', email: '', password: '', role: 'user' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save user');
    }
  };

  const handleEdit = (user) => {
    setForm({ name: user.name, email: user.email, password: '', role: user.role });
    setEditing(user.id);
    setShowForm(true);
  };

  const handleDeactivate = async (user) => {
    try {
      if (user.is_active) {
        await deactivateUser(user.id);
        toast.success(`User ${user.name} deactivated`);
      } else {
        await updateUser(user.id, { is_active: true });
        toast.success(`User ${user.name} reactivated`);
      }
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to toggle status');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUser(deleteModal.user.id);
      toast.success('User deleted from system');
      setDeleteModal({ open: false, user: null });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleResetPassword = async () => {
    if (resetModal.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    try {
      await resetUserPassword(resetModal.user.id, resetModal.password);
      toast.success('Password updated successfully');
      setResetModal({ open: false, user: null, password: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password');
    }
  };

  const filteredUsers = users.filter(u => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.tracking_prefix?.includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1 border-b border-surface-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-50">User Management</h1>
          <p className="mt-1 text-xs sm:text-sm text-surface-400">
            {users.length} active registered users and their 5-digit tracking prefixes
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditing(null);
            setForm({ name: '', email: '', password: '', role: 'user' });
          }}
          className="btn-primary btn-sm self-start sm:self-auto inline-flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          <span>{showForm ? 'Close Form' : 'Add User'}</span>
        </button>
      </div>

      {/* Create / Edit User Drawer Card */}
      {showForm && (
        <div className="card p-5 sm:p-6 bg-surface-900 border border-brand-500/30 shadow-xl animate-slide-down">
          <div className="flex items-center justify-between pb-3 border-b border-surface-800 mb-4">
            <div>
              <h2 className="text-base font-bold text-surface-50">
                {editing ? 'Modify User Profile' : 'Register New User'}
              </h2>
              <p className="text-xs text-surface-400">
                {editing ? 'Update user role or profile info' : 'New users automatically receive a unique 5-digit tracking prefix'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Full Name <span className="text-rose-400">*</span></label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                className="input"
                placeholder="Jane Doe"
                required
              />
            </div>
            <div>
              <label className="input-label">Email Address <span className="text-rose-400">*</span></label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                className="input"
                placeholder="user@example.com"
                required
              />
            </div>
            {!editing && (
              <div>
                <label className="input-label">Initial Password <span className="text-rose-400">*</span></label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input"
                  placeholder="Minimum 8 characters"
                  required={!editing}
                  minLength={8}
                />
              </div>
            )}
            <div>
              <label className="input-label">System Role <span className="text-rose-400">*</span></label>
              <select
                value={form.role}
                onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
                className="input"
              >
                <option value="user">Standard User (Scoped records)</option>
                <option value="admin">Administrator (Full access)</option>
              </select>
            </div>

            <div className="sm:col-span-2 pt-2 flex items-center gap-3">
              <button type="submit" className="btn-primary btn-sm">
                {editing ? 'Update User' : 'Create User Account'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditing(null); }}
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Toolbar */}
      <div className="card p-3.5 bg-surface-900 border border-surface-800">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, email, role, or 5-digit prefix..."
            className="input pl-9 text-xs sm:text-sm"
          />
        </div>
      </div>

      {/* User Content: Mobile Cards & Desktop Table */}
      {loading ? (
        <LoadingSpinner text="Retrieving user directory..." />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={UserGroupIcon}
          title="No users found"
          description={search ? `No user records matched "${search}".` : "No registered accounts found."}
          actionLabel={search ? "Clear Search" : "Create User"}
          onAction={search ? () => setSearch('') : () => setShowForm(true)}
        />
      ) : (
        <>
          {/* Mobile View: Cards */}
          <div className="sm:hidden space-y-3">
            {filteredUsers.map((u) => (
              <div key={u.id} className="card p-4 bg-surface-900 border border-surface-800 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center justify-center font-bold text-xs">
                      {u.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-surface-100 text-sm">{u.name}</p>
                      <p className="text-xs text-surface-400">{u.email}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                      u.is_active
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-surface-400 pt-2 border-t border-surface-800">
                  <div className="flex items-center gap-1.5">
                    <span className="text-surface-500">Role:</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      u.role === 'admin'
                        ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                        : 'bg-surface-800 text-surface-300 border border-surface-700'
                    }`}>
                      {u.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-surface-500">Prefix:</span>
                    <span className="font-mono font-bold text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded border border-brand-500/20 text-[11px]">
                      {u.tracking_prefix || '—'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-1">
                  <button onClick={() => handleEdit(u)} className="btn-secondary btn-sm p-1.5" title="Edit">
                    <PencilIcon className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setResetModal({ open: true, user: u, password: '' })} className="btn-secondary btn-sm p-1.5" title="Reset Password">
                    <KeyIcon className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeactivate(u)} className="btn-secondary btn-sm p-1.5" title="Toggle active">
                    {u.is_active ? <NoSymbolIcon className="w-3.5 h-3.5 text-amber-400" /> : <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                  <button onClick={() => setDeleteModal({ open: true, user: u })} className="btn-ghost btn-sm p-1.5 text-rose-400" title="Delete">
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden sm:block table-container">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">User</th>
                  <th className="table-header">Prefix</th>
                  <th className="table-header">Role</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Joined</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 flex items-center justify-center font-bold text-xs shrink-0">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-surface-100 text-sm leading-snug">{u.name}</p>
                          <p className="text-xs text-surface-400">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="table-cell">
                      <span className="font-mono font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20 text-xs">
                        {u.tracking_prefix || '—'}
                      </span>
                    </td>

                    <td className="table-cell">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                          u.role === 'admin'
                            ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                            : 'bg-surface-800 text-surface-300 border border-surface-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    <td className="table-cell">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full ${
                          u.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {u.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>

                    <td className="table-cell text-surface-400 text-xs font-mono">
                      {u.created_at ? format(new Date(u.created_at), 'MMM d, yyyy') : '—'}
                    </td>

                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(u)}
                          className="btn-ghost btn-sm text-surface-300 hover:text-surface-100"
                          title="Edit User"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setResetModal({ open: true, user: u, password: '' })}
                          className="btn-ghost btn-sm text-surface-300 hover:text-surface-100"
                          title="Reset Password"
                        >
                          <KeyIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeactivate(u)}
                          className="btn-ghost btn-sm"
                          title={u.is_active ? 'Deactivate User' : 'Reactivate User'}
                        >
                          {u.is_active ? (
                            <NoSymbolIcon className="w-4 h-4 text-amber-400 hover:text-amber-300" />
                          ) : (
                            <CheckCircleIcon className="w-4 h-4 text-emerald-400 hover:text-emerald-300" />
                          )}
                        </button>
                        <button
                          onClick={() => setDeleteModal({ open: true, user: u })}
                          className="btn-ghost btn-sm text-rose-400 hover:bg-rose-500/10"
                          title="Delete User"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Delete User Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, user: null })}
        onConfirm={handleDelete}
        title="Delete User Account"
        message={`Are you sure you want to permanently delete "${deleteModal.user?.name}" (${deleteModal.user?.email})? This action cannot be reversed.`}
        confirmText="Delete User"
        variant="danger"
      />

      {/* Reset Password Modal */}
      {resetModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setResetModal({ open: false, user: null, password: '' })}
          />
          <div className="relative card p-6 max-w-md w-full bg-surface-900 border border-surface-800 animate-scale-in shadow-2xl">
            <h3 className="text-lg font-bold text-surface-50">Reset Account Password</h3>
            <p className="mt-1 text-xs text-surface-400">
              Set a new secure password for <strong className="text-surface-200">{resetModal.user?.name}</strong>.
            </p>
            <div className="mt-4">
              <label className="input-label">New Password</label>
              <input
                type="password"
                value={resetModal.password}
                onChange={(e) => setResetModal(m => ({ ...m, password: e.target.value }))}
                className="input"
                placeholder="Min 8 characters"
                minLength={8}
                autoFocus
              />
            </div>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                onClick={() => setResetModal({ open: false, user: null, password: '' })}
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                className="btn-primary btn-sm"
              >
                Save New Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
