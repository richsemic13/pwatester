let budgetData = {
    totalBudget: 0,
    totalExpenses: 0,
    budgetLeft: 0,
    expenses: []
};

let expenseChart;
let currentUser = localStorage.getItem("currentUser") || null;

// ==========================
// AUTH FUNCTIONS
// ==========================
function getUsers() {
    return JSON.parse(localStorage.getItem("users")) || [];
}

function saveUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
}

function getBudgetKey() {
    return `budgetData_${currentUser}`;
}

function loadBudgetData() {
    const savedData = JSON.parse(localStorage.getItem(getBudgetKey()));
    budgetData = savedData || {
        totalBudget: 0,
        totalExpenses: 0,
        budgetLeft: 0,
        expenses: []
    };
}

function updateLocalStorage() {
    if (currentUser) {
        localStorage.setItem(getBudgetKey(), JSON.stringify(budgetData));
    }
}

function showApp() {
    document.getElementById("authSection").style.display = "none";
    document.getElementById("appSection").style.display = "block";
}

function showAuth() {
    document.getElementById("authSection").style.display = "flex";
    document.getElementById("appSection").style.display = "none";
}

function logoutUser() {
    localStorage.removeItem("currentUser");
    currentUser = null;
    showAuth();
}

// ==========================
// BUDGET FUNCTIONS
// ==========================
function formatCurrency(value) {
    return "₱" + Number(value).toFixed(2);
}

function updateUI() {
    document.getElementById("totalBudget").textContent = formatCurrency(budgetData.totalBudget);
    document.getElementById("totalExpenses").textContent = formatCurrency(budgetData.totalExpenses);
    document.getElementById("budgetLeft").textContent = formatCurrency(budgetData.budgetLeft);

    let tableBody = document.getElementById("expenseTableBody");
    tableBody.innerHTML = "";

    if (budgetData.expenses.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center">No expenses yet.</td></tr>`;
    } else {
        budgetData.expenses.forEach(expense => {
            let row = document.createElement("tr");
            row.setAttribute("data-id", expense.id);

            row.innerHTML = `
                <td class="title-cell">${expense.title}</td>
                <td class="amount-cell">${formatCurrency(expense.amount)}</td>
                <td class="category-cell">${expense.category}</td>
                <td>${expense.date}</td>
                <td class="action-cell text-center">
                    <button class="btn btn-sm btn-warning edit-btn mb-1">Edit</button>
                    <button class="btn btn-sm btn-danger delete-btn mb-1">Remove</button>
                </td>
            `;

            tableBody.appendChild(row);
        });
    }

    updateChart();
}

function updateChart() {
    const chartContainer = document.getElementById("chartContainer");
    if (chartContainer.style.display === "none") return;

    let categories = {};

    budgetData.expenses.forEach(expense => {
        categories[expense.category] = (categories[expense.category] || 0) + expense.amount;
    });

    let labels = Object.keys(categories);
    let data = Object.values(categories);

    const ctx = document.getElementById("expenseChart").getContext("2d");

    if (expenseChart) {
        expenseChart.destroy();
    }

    if (labels.length === 0) return;

    expenseChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    "#4e79a7",
                    "#f28e2b",
                    "#e15759",
                    "#76b7b2",
                    "#59a14f"
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: "bottom" }
            }
        }
    });
}

function resetAll() {
    if (!confirm("Are you sure you want to reset everything?")) return;

    budgetData = {
        totalBudget: 0,
        totalExpenses: 0,
        budgetLeft: 0,
        expenses: []
    };

    updateLocalStorage();
    updateUI();
}

// ==========================
// DOM READY
// ==========================
document.addEventListener("DOMContentLoaded", function () {

    const loginBox = document.getElementById("loginBox");
    const registerBox = document.getElementById("registerBox");

    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    const showLoginPassword = document.getElementById("showLoginPassword");
    const showRegisterPassword = document.getElementById("showRegisterPassword");

    const loginPassword = document.getElementById("loginPassword");
    const registerPassword = document.getElementById("registerPassword");
    const confirmPassword = document.getElementById("confirmPassword");

    // SWITCH TO REGISTER
    document.getElementById("showRegister").addEventListener("click", function (e) {
        e.preventDefault();
        loginBox.style.display = "none";
        registerBox.style.display = "block";

        loginForm.reset();
        showLoginPassword.checked = false;
        loginPassword.type = "password";
    });

    // SWITCH TO LOGIN
    document.getElementById("showLogin").addEventListener("click", function (e) {
        e.preventDefault();
        registerBox.style.display = "none";
        loginBox.style.display = "block";

        registerForm.reset();
        showRegisterPassword.checked = false;
        registerPassword.type = "password";
        confirmPassword.type = "password";
    });

    // SHOW PASSWORD LOGIN
    showLoginPassword.addEventListener("change", function () {
        loginPassword.type = this.checked ? "text" : "password";
    });

    // SHOW PASSWORD REGISTER
    showRegisterPassword.addEventListener("change", function () {
        let type = this.checked ? "text" : "password";
        registerPassword.type = type;
        confirmPassword.type = type;
    });

    // REGISTER
    registerForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const firstName = document.getElementById("registerFirstName").value.trim();
        const lastName = document.getElementById("registerLastName").value.trim();
        const number = document.getElementById("registerNumber").value.trim();
        const email = document.getElementById("registerEmail").value.trim().toLowerCase();
        const password = registerPassword.value.trim();
        const confirm = confirmPassword.value.trim();

        if (password !== confirm) {
            alert("Passwords do not match.");
            return;
        }

        let users = getUsers();

        if (users.find(u => u.email === email)) {
            alert("Email already registered.");
            return;
        }

        users.push({ firstName, lastName, number, email, password });
        saveUsers(users);

        alert("Registration successful!");

        registerForm.reset();
        registerBox.style.display = "none";
        loginBox.style.display = "block";
    });

    // LOGIN
    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const email = document.getElementById("loginEmail").value.trim().toLowerCase();
        const password = loginPassword.value.trim();

        let users = getUsers();
        let user = users.find(u => u.email === email && u.password === password);

        if (!user) {
            alert("Invalid email or password.");
            return;
        }

        currentUser = email;
        localStorage.setItem("currentUser", email);

        loadBudgetData();
        showApp();

        document.getElementById("displayUsername").textContent =
            `${user.firstName} ${user.lastName}`;

        updateUI();
        loginForm.reset();
    });

    // LOGOUT
    document.getElementById("logoutBtn").addEventListener("click", logoutUser);

    // AUTO LOGIN
    if (currentUser) {
        let users = getUsers();
        let user = users.find(u => u.email === currentUser);

        loadBudgetData();
        showApp();

        if (user) {
            document.getElementById("displayUsername").textContent =
                `${user.firstName} ${user.lastName}`;
        }

        updateUI();
    } else {
        showAuth();
    }

});
