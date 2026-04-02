/**
 * Users Table Component - Admin user management
 */
import { Edit, Trash2, Users } from 'lucide-react';

export default function UsersTable({ users, currentUserId, onEdit, onDelete }) {
    if (users.length === 0) {
        return (
            <div className="text-center py-16">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No users yet</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-gray-700">
                        <th className="text-left text-gray-400 font-medium px-4 py-3">Username</th>
                        <th className="text-left text-gray-400 font-medium px-4 py-3">Role</th>
                        <th className="text-left text-gray-400 font-medium px-4 py-3">Created</th>
                        <th className="text-right text-gray-400 font-medium px-4 py-3">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id} className="border-b border-gray-700 last:border-0">
                            <td className="px-4 py-3 text-white">
                                {user.username}
                                {user.id === currentUserId && (
                                    <span className="ml-2 text-xs text-gray-500">(you)</span>
                                )}
                            </td>
                            <td className="px-4 py-3">
                                <RoleBadge role={user.role} />
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-sm">
                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-right">
                                <button
                                    onClick={() => onEdit(user)}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onDelete(user)}
                                    disabled={user.id === currentUserId}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function RoleBadge({ role }) {
    const isAdmin = role === 'admin';
    return (
        <span className={`px-2 py-1 rounded text-xs ${isAdmin ? 'bg-red-600/20 text-red-400' : 'bg-blue-600/20 text-blue-400'
            }`}>
            {isAdmin ? 'Admin' : 'Editor'}
        </span>
    );
}
