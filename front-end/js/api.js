// API Configuration
const API_BASE_URL = 'https://api.sathcademy.prasath.in/api'; // Replace with your backend URL

// Helper function for API calls
async function apiCall(endpoint, method = 'GET', data = null, requiresAuth = true) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers = {
        'Content-Type': 'application/json',
    };
    
    if (requiresAuth) {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            throw new Error('No authentication token');
        }
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = {
        method,
        headers,
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        const responseData = await response.json();
        
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login.html';
                throw new Error('Session expired');
            }
            throw new Error(responseData.message || 'API call failed');
        }
        
        return responseData;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Auth API calls
const authAPI = {
    login: (email, password) => apiCall('/auth/login', 'POST', { email, password }, false),
    register: (name, email, password) => apiCall('/auth/register', 'POST', { name, email, password }, false),
    getMe: () => apiCall('/auth/me', 'GET'),
};

// Classes API calls
const classesAPI = {
    getAll: (filters = {}) => {
        const queryString = new URLSearchParams(filters).toString();
        return apiCall(`/classes${queryString ? '?' + queryString : ''}`);
    },
    getStats: () => apiCall('/classes/stats'),
    getOne: (id) => apiCall(`/classes/${id}`),
    enroll: (id) => apiCall(`/classes/${id}/enroll`, 'POST'),
    getMyClasses: () => apiCall('/user/classes'),
};

// Admin API calls
const adminAPI = {
    getDashboard: () => apiCall('/admin/dashboard'),
    getClasses: () => apiCall('/admin/classes'),
    createClass: (classData) => apiCall('/admin/classes', 'POST', classData),
    updateClass: (id, classData) => apiCall(`/admin/classes/${id}`, 'PUT', classData),
    deleteClass: (id) => apiCall(`/admin/classes/${id}`, 'DELETE'),
    getUsers: () => apiCall('/admin/users'),
    updateUser: (id, userData) => apiCall(`/admin/users/${id}`, 'PUT', userData),
    deleteUser: (id) => apiCall(`/admin/users/${id}`, 'DELETE'),
};