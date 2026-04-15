// =============================================================================
// API Service - Backend Communication
// =============================================================================

const API_BASE = import.meta.env.DEV
    ? 'http://localhost:8787/api'
    : 'https://padillas-concrete-api.angel-padillaf-dev.workers.dev/api';

/**
 * Make authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('adminToken');

    const headers = {
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData (browser sets it with boundary)
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        // Handle session expiration
        if (response.status === 401) {
            localStorage.removeItem('adminToken');
            const error = new Error(data.error || 'Session expired');
            error.isAuthError = true;
            throw error;
        }
        throw new Error(data.error || 'Request failed');
    }

    return data;
}

// =============================================================================
// Auth API
// =============================================================================

export async function login(username, password) {
    const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    });

    if (data.token) {
        localStorage.setItem('adminToken', data.token);
    }

    return data;
}

export async function verifyToken() {
    try {
        const data = await apiRequest('/auth/verify');
        return data.success;
    } catch {
        localStorage.removeItem('adminToken');
        return false;
    }
}

export function logout() {
    localStorage.removeItem('adminToken');
}

// =============================================================================
// Projects API
// =============================================================================

export async function getProjects() {
    const data = await apiRequest('/projects');
    return data.projects || [];
}

export async function createProject(projectData) {
    return apiRequest('/projects', {
        method: 'POST',
        body: JSON.stringify(projectData),
    });
}

export async function updateProject(projectId, updates) {
    return apiRequest(`/projects/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
    });
}

export async function deleteProject(projectId) {
    return apiRequest(`/projects/${projectId}`, {
        method: 'DELETE',
    });
}

export async function uploadPhoto(projectId, file, type = 'gallery') {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('type', type);

    return apiRequest(`/projects/${projectId}/photos`, {
        method: 'POST',
        body: formData,
    });
}

export async function deletePhoto(projectId, photoId) {
    return apiRequest(`/projects/${projectId}/photos/${photoId}`, {
        method: 'DELETE',
    });
}

// =============================================================================
// Password Management
// =============================================================================

export async function changePassword(currentPassword, newPassword, newUsername = null) {
    const payload = { currentPassword, newPassword };
    if (newUsername) {
        payload.newUsername = newUsername;
    }

    const data = await apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(payload),
    });

    // Update token if new one is provided
    if (data.token) {
        localStorage.setItem('adminToken', data.token);
    }

    return data;
}

// =============================================================================
// User Management API (Admin only)
// =============================================================================

export async function getUsers() {
    const data = await apiRequest('/users');
    return data.users || [];
}

export async function createUser(userData) {
    return apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify(userData),
    });
}

export async function updateUser(userId, updates) {
    return apiRequest(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
    });
}

export async function deleteUser(userId) {
    return apiRequest(`/users/${userId}`, {
        method: 'DELETE',
    });
}

// =============================================================================
// Admin Utilities
// =============================================================================

export async function getCloudinaryUsage() {
    const data = await apiRequest('/admin/cloudinary-usage');
    return data.usage;
}

export async function toggleProjectVisibility(projectId, visible) {
    return apiRequest(`/projects/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify({ visible }),
    });
}

// =============================================================================
// Clients API (Contact Form Submissions - Admin only)
// =============================================================================

export async function getClients() {
    const data = await apiRequest('/clients');
    return data.clients || [];
}

export async function updateClientStatus(clientId, status) {
    return apiRequest(`/clients/${clientId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
}

export async function deleteClient(clientId) {
    return apiRequest(`/clients/${clientId}`, {
        method: 'DELETE',
    });
}
