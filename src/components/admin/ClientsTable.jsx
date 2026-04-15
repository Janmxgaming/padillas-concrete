/**
 * ClientsTable - Displays contact form submissions for admin management
 * Shows client info, address, service, message, date and status
 * Admin can update status (pending/answered/rejected) or delete entries
 */
import { useState } from 'react';
import { Trash2, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_CONFIG = {
    pending:  { label: 'Pending',  color: 'bg-yellow-100 text-yellow-800 border-yellow-300', Icon: Clock },
    answered: { label: 'Answered', color: 'bg-green-100  text-green-800  border-green-300',  Icon: CheckCircle },
    rejected: { label: 'Rejected', color: 'bg-red-100    text-red-800    border-red-300',    Icon: XCircle },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const { Icon } = cfg;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
            <Icon className="w-3 h-3" />
            {cfg.label}
        </span>
    );
}

function formatAddress(address) {
    if (!address) return '—';
    const { street, apt, city, state, zip } = address;
    const line1 = [street, apt].filter(Boolean).join(', ');
    const line2 = [city, state, zip].filter(Boolean).join(', ');
    return [line1, line2].filter(Boolean).join('\n') || '—';
}

function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

export default function ClientsTable({ clients, onUpdateStatus, onDelete }) {
    const [expanded, setExpanded] = useState(null);
    const [filter, setFilter] = useState('all');

    const filtered = filter === 'all' ? clients : clients.filter(c => c.status === filter);

    return (
        <div className="space-y-4">
            {/* Filter bar */}
            <div className="flex flex-wrap gap-2 mb-4">
                {['all', 'pending', 'answered', 'rejected'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                            filter === f
                                ? 'bg-red-600 text-white border-red-600'
                                : 'bg-gray-800 text-gray-300 border-gray-600 hover:border-red-500'
                        }`}
                    >
                        {f === 'all' ? `All (${clients.length})` : `${STATUS_CONFIG[f].label} (${clients.filter(c => c.status === f).length})`}
                    </button>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="text-lg font-medium">No submissions yet</p>
                    <p className="text-sm mt-1">Contact form submissions will appear here</p>
                </div>
            )}

            {filtered.map(client => {
                const isOpen = expanded === client.id;
                return (
                    <div key={client.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                        {/* Row header */}
                        <div
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-750 transition"
                            onClick={() => setExpanded(isOpen ? null : client.id)}
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-white truncate">{client.name}</p>
                                    <p className="text-sm text-gray-400 truncate">{client.email}</p>
                                </div>
                                <div className="hidden sm:block text-sm text-gray-300 min-w-fit">
                                    <span className="bg-red-900/40 text-red-300 px-2 py-0.5 rounded text-xs font-medium">
                                        {client.service}
                                    </span>
                                </div>
                                <StatusBadge status={client.status} />
                                <p className="hidden md:block text-xs text-gray-500 min-w-fit">
                                    {formatDate(client.createdAt)}
                                </p>
                            </div>
                            <div className="ml-3 text-gray-400">
                                {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </div>
                        </div>

                        {/* Expanded details */}
                        {isOpen && (
                            <div className="border-t border-gray-700 p-4 space-y-4 bg-gray-850">
                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-400 font-medium mb-1">Contact Info</p>
                                        <p className="text-white">{client.name}</p>
                                        <a href={`mailto:${client.email}`} className="text-red-400 hover:underline block">{client.email}</a>
                                        <a href={`tel:${client.phone}`} className="text-red-400 hover:underline block">{client.phone}</a>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 font-medium mb-1">Address</p>
                                        <p className="text-white whitespace-pre-line">{formatAddress(client.address)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 font-medium mb-1">Service Requested</p>
                                        <p className="text-white">{client.service}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 font-medium mb-1">Submitted</p>
                                        <p className="text-white">{formatDate(client.createdAt)}</p>
                                        {client.statusUpdatedAt && (
                                            <p className="text-gray-400 text-xs mt-1">
                                                Status updated {formatDate(client.statusUpdatedAt)}
                                                {client.statusUpdatedBy ? ` by ${client.statusUpdatedBy}` : ''}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-gray-400 font-medium mb-1 text-sm">Message</p>
                                    <p className="text-gray-200 text-sm bg-gray-900 rounded-lg p-3 whitespace-pre-wrap">
                                        {client.message}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {client.status !== 'answered' && (
                                        <button
                                            onClick={() => onUpdateStatus(client.id, 'answered')}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white text-sm rounded-lg transition"
                                        >
                                            <CheckCircle className="w-4 h-4" /> Mark Answered
                                        </button>
                                    )}
                                    {client.status !== 'pending' && (
                                        <button
                                            onClick={() => onUpdateStatus(client.id, 'pending')}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-700 hover:bg-yellow-600 text-white text-sm rounded-lg transition"
                                        >
                                            <Clock className="w-4 h-4" /> Mark Pending
                                        </button>
                                    )}
                                    {client.status !== 'rejected' && (
                                        <button
                                            onClick={() => onUpdateStatus(client.id, 'rejected')}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition"
                                        >
                                            <XCircle className="w-4 h-4" /> Mark Rejected
                                        </button>
                                    )}
                                    <button
                                        onClick={() => onDelete(client.id, client.name)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900 hover:bg-red-800 text-white text-sm rounded-lg transition ml-auto"
                                    >
                                        <Trash2 className="w-4 h-4" /> Delete
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
