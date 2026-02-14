// Check if user is authenticated
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        window.location.href = '/login.html';
        return false;
    }
    
    try {
        const userData = JSON.parse(user);
        return userData;
    } catch (e) {
        window.location.href = '/login.html';
        return false;
    }
}

// Check if user is admin
function checkAdmin() {
    const user = checkAuth();
    if (!user) return false;
    
    if (user.role !== 'admin') {
        window.location.href = '/dashboard.html';
        return false;
    }
    
    return user;
}

// Get current user
function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

// Update navigation based on auth status
function updateNavigation() {
    const user = getCurrentUser();
    
    // Update nav links based on user role
    const navLinks = document.getElementById('navLinks');
    if (navLinks) {
        if (user) {
            if (user.role === 'admin') {
                navLinks.innerHTML = `
                    <a href="/dashboard.html" class="text-gray-700 hover:text-blue-600">Dashboard</a>
                    <a href="/classes.html" class="text-gray-700 hover:text-blue-600">Classes</a>
                    <a href="/admin/dashboard.html" class="text-gray-700 hover:text-blue-600">Admin</a>
                    <div class="relative group">
                        <button class="flex items-center space-x-2 text-gray-700">
                            <span>${user.name}</span>
                            <i class="fas fa-chevron-down text-xs"></i>
                        </button>
                        <div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block">
                            <a href="/profile.html" class="block px-4 py-2 text-gray-700 hover:bg-gray-100">Profile</a>
                            <button onclick="logout()" class="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100">Logout</button>
                        </div>
                    </div>
                `;
            } else {
                navLinks.innerHTML = `
                    <a href="/dashboard.html" class="text-gray-700 hover:text-blue-600">Dashboard</a>
                    <a href="/classes.html" class="text-gray-700 hover:text-blue-600">Classes</a>
                    <div class="relative group">
                        <button class="flex items-center space-x-2 text-gray-700">
                            <span>${user.name}</span>
                            <i class="fas fa-chevron-down text-xs"></i>
                        </button>
                        <div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block">
                            <a href="/profile.html" class="block px-4 py-2 text-gray-700 hover:bg-gray-100">Profile</a>
                            <button onclick="logout()" class="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100">Logout</button>
                        </div>
                    </div>
                `;
            }
        } else {
            navLinks.innerHTML = `
                <a href="/login.html" class="text-gray-700 hover:text-blue-600">Login</a>
                <a href="/register.html" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Sign Up</a>
            `;
        }
    }
}

// Show loading spinner
function showLoading() {
    const loader = document.getElementById('loadingOverlay');
    if (loader) loader.classList.remove('hidden');
}

// Hide loading spinner
function hideLoading() {
    const loader = document.getElementById('loadingOverlay');
    if (loader) loader.classList.add('hidden');
}

// Show toast message
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');
    
    if (!toast || !toastMessage) return;
    
    toastMessage.textContent = message;
    
    // Set icon based on type
    if (toastIcon) {
        if (type === 'success') {
            toastIcon.className = 'fas fa-check-circle text-green-500 text-xl mr-3';
            toast.className = 'bg-white rounded-lg shadow-lg border-l-4 border-green-500 px-6 py-4 min-w-[300px]';
        } else if (type === 'error') {
            toastIcon.className = 'fas fa-exclamation-circle text-red-500 text-xl mr-3';
            toast.className = 'bg-white rounded-lg shadow-lg border-l-4 border-red-500 px-6 py-4 min-w-[300px]';
        }
    }
    
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateNavigation();
});