/**
 * Admin Dashboard - Project & Photo Management
 * Refactored to use modular components and hooks
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAdminDialogs } from '../../hooks/useAdminDialogs';
import { AdminHeader, ProjectCard, UsersTable, CloudinaryStorageWidget, ClientsTable } from '../../components/admin';
import {
    getProjects,
    createProject,
    updateProject,
    deleteProject,
    uploadPhoto,
    deletePhoto,
    changePassword,
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleProjectVisibility,
    getClients,
    updateClientStatus,
    deleteClient,
} from '../../services/api';
import { Image, Users, Plus, Loader2, MessageSquare } from 'lucide-react';
import { showConfirm } from '../../utils/alerts';

export default function AdminDashboard() {
    const { user, logout, updateUser: updateAuthUser } = useAuth();
    const navigate = useNavigate();

    // State
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedProject, setExpandedProject] = useState(null);
    const [activeTab, setActiveTab] = useState('projects');

    // File upload refs
    const fileInputRef = useRef(null);
    const [uploadTarget, setUploadTarget] = useState(null); // { projectId, type }

    const isAdmin = user?.role === 'admin';
    const isEditor = user?.role === 'user';

    // Initialize dialogs hook
    const dialogs = useAdminDialogs({
        onAuthError: () => {
            dialogs.showSessionExpired(() => {
                logout();
                navigate('/admin');
            });
        },
    });

    // Load data
    useEffect(() => {
        loadProjects();
        if (isAdmin) {
            loadUsers();
            loadClients();
        }
    }, [isAdmin]);

    // Force password change on first login
    useEffect(() => {
        if (user?.mustChangePassword && !loading) {
            setTimeout(() => handleSetupAccount(), 500);
        }
    }, [user, loading]);

    // ==========================================================================
    // Data Loading
    // ==========================================================================

    async function loadProjects() {
        try {
            const data = await getProjects();
            setProjects(data);
        } catch (error) {
            dialogs.handleError(error, 'Failed to load projects');
        } finally {
            setLoading(false);
        }
    }

    async function loadUsers() {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    }

    async function loadClients() {
        try {
            const data = await getClients();
            setClients(data);
        } catch (error) {
            console.error('Failed to load clients:', error);
        }
    }

    // ==========================================================================
    // Project Actions
    // ==========================================================================

    async function handleCreateProject() {
        const formData = await dialogs.projectDialog();
        if (!formData) return;

        try {
            dialogs.showLoading('Creating...');
            const data = await createProject(formData);
            setProjects([...projects, data.project]);
            setExpandedProject(data.project.id);
            dialogs.showSuccess('Project Created!', 'Now add photos to your project below.', 0);
        } catch (error) {
            dialogs.handleError(error, 'Failed to create project');
        }
    }

    async function handleEditProject(project) {
        const formData = await dialogs.projectDialog(project);
        if (!formData) return;

        try {
            dialogs.showLoading('Saving...');
            await updateProject(project.id, formData);
            setProjects(projects.map(p => p.id === project.id ? { ...p, ...formData } : p));
            dialogs.showSuccess('Saved!');
        } catch (error) {
            dialogs.handleError(error, 'Failed to save project');
        }
    }

    async function handleDeleteProject(project) {
        const confirmed = await dialogs.deleteProjectDialog(project.title);
        if (!confirmed) return;

        try {
            dialogs.showLoading('Deleting...');
            await deleteProject(project.id);
            setProjects(projects.filter(p => p.id !== project.id));
            dialogs.showSuccess('Deleted!');
        } catch (error) {
            dialogs.handleError(error, 'Failed to delete project');
        }
    }

    async function handleToggleVisibility(project, newVisible) {
        // Optimistic update
        setProjects(projects.map(p => p.id === project.id ? { ...p, visible: newVisible } : p));
        try {
            await toggleProjectVisibility(project.id, newVisible);
        } catch (error) {
            // Revert on failure
            setProjects(projects.map(p => p.id === project.id ? { ...p, visible: project.visible } : p));
            dialogs.handleError(error, 'Failed to update visibility');
        }
    }

    // ==========================================================================
    // Photo Actions
    // ==========================================================================

    function openFileUpload(projectId, type) {
        setUploadTarget({ projectId, type });
        fileInputRef.current?.click();
    }

    async function handleFileUpload(e) {
        const files = e.target.files;
        if (!files?.length || !uploadTarget) return;

        const filesArray = Array.from(files);
        const { projectId, type } = uploadTarget;

        e.target.value = '';
        setUploadTarget(null);

        dialogs.showLoading(`Uploading ${filesArray.length} photo(s)...`);

        const successfulUploads = [];
        const failedUploads = [];

        for (const file of filesArray) {
            try {
                const result = await uploadPhoto(projectId, file, type);
                successfulUploads.push(result);
            } catch (error) {
                failedUploads.push({ file: file.name, error: error.message });
            }
        }

        // Update state with successful uploads
        if (successfulUploads.length > 0) {
            setProjects(projects.map(p => {
                if (p.id !== projectId) return p;
                const updated = { ...p };
                successfulUploads.forEach(({ photo }) => {
                    if (photo.type === 'before') updated.beforePhoto = photo;
                    else if (photo.type === 'after') updated.afterPhoto = photo;
                    else updated.photos = [...(updated.photos || []), photo];
                });
                return updated;
            }));
        }

        // Show result
        if (failedUploads.length > 0) {
            const details = failedUploads.map(f => `${f.file}: ${f.error}`).join('\n');
            dialogs.showError(
                failedUploads.length === filesArray.length ? 'Upload Failed' : 'Partial Upload',
                `${successfulUploads.length} uploaded, ${failedUploads.length} failed\n${details}`
            );
        } else {
            dialogs.showSuccess('Uploaded!', `${successfulUploads.length} photo(s) uploaded`);
        }
    }

    async function handleDeletePhoto(projectId, photo) {
        const confirmed = await dialogs.deletePhotoDialog(photo.url);
        if (!confirmed) return;

        try {
            dialogs.showLoading('Deleting...');
            await deletePhoto(projectId, photo.id);

            setProjects(projects.map(p => {
                if (p.id !== projectId) return p;
                const updated = { ...p };
                if (p.beforePhoto?.id === photo.id) updated.beforePhoto = null;
                else if (p.afterPhoto?.id === photo.id) updated.afterPhoto = null;
                else updated.photos = (p.photos || []).filter(ph => ph.id !== photo.id);
                return updated;
            }));

            dialogs.showSuccess('Deleted!');
        } catch (error) {
            dialogs.handleError(error, 'Failed to delete photo');
        }
    }

    async function handleReorderPhoto(projectId, photoIndex, direction) {
        const project = projects.find(p => p.id === projectId);
        if (!project?.photos || project.photos.length < 2) return;

        const newIndex = direction === 'left' ? photoIndex - 1 : photoIndex + 1;
        if (newIndex < 0 || newIndex >= project.photos.length) return;

        const newPhotos = [...project.photos];
        [newPhotos[photoIndex], newPhotos[newIndex]] = [newPhotos[newIndex], newPhotos[photoIndex]];

        // Optimistic update
        setProjects(projects.map(p => p.id === projectId ? { ...p, photos: newPhotos } : p));

        try {
            await updateProject(projectId, { photos: newPhotos });
        } catch (error) {
            // Revert on error
            setProjects(projects.map(p => p.id === projectId ? { ...p, photos: project.photos } : p));
            dialogs.handleError(error, 'Failed to save photo order');
        }
    }

    // ==========================================================================
    // User Actions
    // ==========================================================================

    async function handleCreateUser() {
        const formData = await dialogs.userDialog();
        if (!formData) return;

        try {
            dialogs.showLoading('Creating...');
            const data = await createUser(formData);
            setUsers([...users, data.user]);
            dialogs.showSuccess('User Created!');
        } catch (error) {
            dialogs.handleError(error, 'Failed to create user');
        }
    }

    async function handleEditUser(targetUser) {
        const formData = await dialogs.userDialog(targetUser);
        if (!formData) return;

        try {
            dialogs.showLoading('Saving...');
            await updateUser(targetUser.id, formData);
            setUsers(users.map(u => u.id === targetUser.id ? { ...u, ...formData } : u));
            dialogs.showSuccess('Saved!');
        } catch (error) {
            dialogs.handleError(error, 'Failed to save user');
        }
    }

    async function handleDeleteUser(targetUser) {
        if (targetUser.id === user?.id) {
            dialogs.showError('Cannot Delete', 'You cannot delete your own account');
            return;
        }

        const confirmed = await dialogs.deleteUserDialog(targetUser.username);
        if (!confirmed) return;

        try {
            dialogs.showLoading('Deleting...');
            await deleteUser(targetUser.id);
            setUsers(users.filter(u => u.id !== targetUser.id));
            dialogs.showSuccess('Deleted!');
        } catch (error) {
            dialogs.handleError(error, 'Failed to delete user');
        }
    }

    // ==========================================================================
    // Credentials Actions
    // ==========================================================================

    async function handleSetupAccount() {
        const formData = await dialogs.setupAccountDialog(user?.username);
        if (!formData) return handleSetupAccount(); // Loop until successful

        try {
            dialogs.showLoading('Updating credentials...');
            const result = await changePassword(formData.currentPassword, formData.newPassword, formData.newUsername);
            if (result.user) updateAuthUser(result.user);
            dialogs.showSuccess('Account Updated!', `Welcome, ${result.user?.username}!`, 0);
        } catch (error) {
            dialogs.showError('Error', error.message);
            handleSetupAccount(); // Retry
        }
    }

    async function handleChangeCredentials() {
        const formData = await dialogs.credentialsDialog(user?.username);
        if (!formData) return;

        try {
            dialogs.showLoading('Updating credentials...');
            const result = await changePassword(formData.currentPassword, formData.newPassword, formData.newUsername);
            if (result.user) updateAuthUser(result.user);
            dialogs.showSuccess('Credentials Updated!');
        } catch (error) {
            dialogs.handleError(error, 'Failed to update credentials');
        }
    }

    async function handleLogout() {
        const confirmed = await dialogs.logoutDialog();
        if (confirmed) {
            logout();
            navigate('/admin');
        }
    }

    // ==========================================================================
    // Client Actions
    // ==========================================================================

    async function handleUpdateClientStatus(clientId, status) {
        try {
            const result = await updateClientStatus(clientId, status);
            setClients(clients.map(c => c.id === clientId ? result.client : c));
        } catch (error) {
            dialogs.handleError(error, 'Failed to update client status');
        }
    }

    async function handleDeleteClient(clientId, clientName) {
        const confirmed = await showConfirm(
            'Delete Submission',
            `Delete submission from "${clientName}"? This cannot be undone.`,
            'Yes, delete'
        );
        if (!confirmed) return;

        try {
            dialogs.showLoading('Deleting...');
            await deleteClient(clientId);
            setClients(clients.filter(c => c.id !== clientId));
            dialogs.showSuccess('Deleted!');
        } catch (error) {
            dialogs.handleError(error, 'Failed to delete client submission');
        }
    }

    // ==========================================================================
    // Render
    // ==========================================================================

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900">
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFileUpload}
                className="hidden"
            />

            <AdminHeader
                user={user}
                isAdmin={isAdmin}
                onLogout={handleLogout}
                onChangeCredentials={handleChangeCredentials}
                onCreateUser={handleCreateUser}
            />

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Tabs (Admin only) */}
                {isAdmin && (
                    <div className="flex space-x-4 mb-6 border-b border-gray-700">
                        <TabButton
                            active={activeTab === 'projects'}
                            onClick={() => setActiveTab('projects')}
                            icon={<Image className="w-5 h-5 inline mr-2" />}
                            label="Gallery Projects"
                        />
                        <TabButton
                            active={activeTab === 'clients'}
                            onClick={() => setActiveTab('clients')}
                            icon={<MessageSquare className="w-5 h-5 inline mr-2" />}
                            label={`Clients${clients.filter(c => c.status === 'pending').length > 0 ? ` (${clients.filter(c => c.status === 'pending').length})` : ''}`}
                        />
                        <TabButton
                            active={activeTab === 'users'}
                            onClick={() => setActiveTab('users')}
                            icon={<Users className="w-5 h-5 inline mr-2" />}
                            label="User Management"
                        />
                    </div>
                )}

                {/* Users Tab */}
                {isAdmin && activeTab === 'users' && (
                    <div>
                        <SectionHeader title="User Management" onAdd={handleCreateUser} addLabel="New User" />
                        <UsersTable
                            users={users}
                            currentUserId={user?.id}
                            onEdit={handleEditUser}
                            onDelete={handleDeleteUser}
                        />
                    </div>
                )}

                {/* Clients Tab */}
                {isAdmin && activeTab === 'clients' && (
                    <div>
                        <SectionHeader title="Client Submissions" />
                        <ClientsTable
                            clients={clients}
                            onUpdateStatus={handleUpdateClientStatus}
                            onDelete={handleDeleteClient}
                        />
                    </div>
                )}

                {/* Projects Tab */}
                {(activeTab === 'projects' || !isAdmin) && (
                    <div>
                        {isAdmin && <CloudinaryStorageWidget />}
                        <SectionHeader
                            title="Gallery Projects"
                            onAdd={isAdmin || isEditor ? handleCreateProject : null}
                            addLabel="New Project"
                        />

                        {projects.length === 0 ? (
                            <EmptyState
                                icon={<Image className="w-16 h-16 text-gray-600" />}
                                title="No projects yet"
                                subtitle="Create your first project to start adding photos"
                            />
                        ) : (
                            <div className="space-y-4">
                                {projects.map(project => (
                                    <ProjectCard
                                        key={project.id}
                                        project={project}
                                        isExpanded={expandedProject === project.id}
                                        isAdmin={isAdmin}
                                        isEditor={isEditor}
                                        onToggle={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
                                        onEdit={() => handleEditProject(project)}
                                        onDelete={() => handleDeleteProject(project)}
                                        onUploadPhoto={(type) => openFileUpload(project.id, type)}
                                        onDeletePhoto={(photo) => handleDeletePhoto(project.id, photo)}
                                        onReorderPhoto={(index, dir) => handleReorderPhoto(project.id, index, dir)}
                                        onToggleVisibility={(newVisible) => handleToggleVisibility(project, newVisible)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

// ==========================================================================
// Helper Components
// ==========================================================================

function TabButton({ active, onClick, icon, label }) {
    return (
        <button
            onClick={onClick}
            className={`pb-3 px-2 font-medium transition-colors ${active
                ? 'text-red-500 border-b-2 border-red-500'
                : 'text-gray-400 hover:text-white'
                }`}
        >
            {icon}
            {label}
        </button>
    );
}

function SectionHeader({ title, onAdd, addLabel }) {
    return (
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            {onAdd && (
                <button
                    onClick={onAdd}
                    className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    {addLabel}
                </button>
            )}
        </div>
    );
}

function EmptyState({ icon, title, subtitle }) {
    return (
        <div className="text-center py-16">
            <div className="mx-auto mb-4">{icon}</div>
            <p className="text-gray-400 text-lg">{title}</p>
            {subtitle && <p className="text-gray-500 mt-2">{subtitle}</p>}
        </div>
    );
}
