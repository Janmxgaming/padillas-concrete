/**
 * Cloudinary Storage Widget - Admin only
 * Displays real-time storage and bandwidth usage for the Cloudinary account
 */
import { useState, useEffect } from 'react';
import { Cloud, HardDrive, Wifi, RefreshCw, Image, Layers } from 'lucide-react';
import { getCloudinaryUsage } from '../../services/api';

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function UsageBar({ label, used, limit, icon, colorClass }) {
    const Icon = icon;
    const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
    const isWarning = pct >= 70;
    const isDanger = pct >= 90;
    const barColor = isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : colorClass;
    const textColor = isDanger ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-gray-400';

    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 text-gray-300 text-sm">
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                </div>
                <span className={`text-xs font-medium ${textColor}`}>
                    {formatBytes(used)} / {formatBytes(limit)}{' '}
                    <span className="text-gray-500">({pct.toFixed(1)}%)</span>
                </span>
            </div>
            <div className="h-2.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            {isWarning && (
                <p className={`text-xs mt-1 ${textColor}`}>
                    {isDanger ? '⚠ Critical — almost full!' : '⚠ Getting close to the limit'}
                </p>
            )}
        </div>
    );
}

function StatBox({ label, value, icon }) {
    const Icon = icon;
    return (
        <div className="bg-gray-700/50 rounded-lg p-3 text-center">
            {Icon && <Icon className="w-4 h-4 text-gray-400 mx-auto mb-1" />}
            <p className="text-white font-semibold text-lg">{value}</p>
            <p className="text-gray-400 text-xs">{label}</p>
        </div>
    );
}

export default function CloudinaryStorageWidget() {
    const [usage, setUsage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const data = await getCloudinaryUsage();
            setUsage(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    return (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 mb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-blue-400" />
                    <h3 className="text-white font-semibold">Cloudinary Storage</h3>
                    {usage?.plan && (
                        <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full capitalize">
                            {usage.plan}
                        </span>
                    )}
                </div>
                <button
                    onClick={load}
                    disabled={loading}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                    title="Refresh"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Loading state */}
            {loading && (
                <div className="flex items-center justify-center py-8 text-gray-500 text-sm gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Loading usage...
                </div>
            )}

            {/* Error state */}
            {error && !loading && (
                <div className="text-center py-4">
                    <p className="text-red-400 text-sm mb-2">{error}</p>
                    <button
                        onClick={load}
                        className="text-xs text-gray-400 hover:text-white underline"
                    >
                        Try again
                    </button>
                </div>
            )}

            {/* Usage data */}
            {usage && !loading && (
                <div className="space-y-4">
                    <UsageBar
                        label="Storage"
                        used={usage.storage?.usage ?? 0}
                        limit={usage.storage?.limit ?? 0}
                        icon={HardDrive}
                        colorClass="bg-blue-500"
                    />
                    <UsageBar
                        label="Bandwidth (monthly)"
                        used={usage.bandwidth?.usage ?? 0}
                        limit={usage.bandwidth?.limit ?? 0}
                        icon={Wifi}
                        colorClass="bg-purple-500"
                    />

                    <div className="grid grid-cols-3 gap-3 pt-1">
                        <StatBox
                            label="Images"
                            value={(usage.resources ?? 0).toLocaleString()}
                            icon={Image}
                        />
                        <StatBox
                            label="Derived"
                            value={(usage.derived_resources ?? 0).toLocaleString()}
                            icon={Layers}
                        />
                        <StatBox
                            label="Requests"
                            value={(usage.requests ?? 0).toLocaleString()}
                        />
                    </div>

                    {usage.last_updated && (
                        <p className="text-gray-600 text-xs text-right pt-1">
                            Last updated: {new Date(usage.last_updated).toLocaleString()}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
