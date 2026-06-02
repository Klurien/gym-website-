const API_BASE = '';

async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });
    if (!res.ok) {
        const error = await res.text();
        throw new Error(error || `API error: ${res.status}`);
    }
    return res.json();
}

export async function getTasks() {
    return apiFetch('/api/storage?action=tasks');
}

export async function saveTasks(tasks) {
    if (!tasks?.length) return;
    await apiFetch('/api/storage', {
        method: 'POST',
        body: JSON.stringify({ action: 'tasks', tasks }),
    });
}

export async function getSchedules() {
    return apiFetch('/api/storage?action=schedules');
}

export async function saveSchedules(schedules) {
    if (!schedules?.length) return;
    await apiFetch('/api/storage', {
        method: 'POST',
        body: JSON.stringify({ action: 'schedules', schedules }),
    });
}

export async function getNotifications() {
    return apiFetch('/api/storage?action=notifications');
}

export async function markNotificationRead(id) {
    return apiFetch('/api/storage', {
        method: 'POST',
        body: JSON.stringify({ action: 'mark_read', id }),
    });
}

export async function getFollowing() {
    return apiFetch('/api/storage?action=following');
}

export async function followUser(userId) {
    return apiFetch('/api/storage', {
        method: 'POST',
        body: JSON.stringify({ action: 'follow', userId }),
    });
}

export async function unfollowUser(userId) {
    return apiFetch('/api/storage', {
        method: 'POST',
        body: JSON.stringify({ action: 'unfollow', userId }),
    });
}

export async function getRecentSearches() {
    return apiFetch('/api/storage?action=searches');
}

export async function saveRecentSearches(searches) {
    return apiFetch('/api/storage', {
        method: 'POST',
        body: JSON.stringify({ action: 'searches', searches }),
    });
}