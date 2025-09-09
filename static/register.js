document.getElementById('togglePassword').onclick = function() {
    const passwordField = document.getElementById('password');
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
    } else {
        passwordField.type = 'password';
    }
};


document.getElementById('registerForm').onsubmit = function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const email = document.getElementById('email').value;


    const data = {
        username: username,
        password: password,
        email: email
    };
    fetch('https://deepply.someonewhoexists.hackclub.app/api/create_user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(async response => {
        const json = await response.json();
        if (!response.ok) {
            throw json;
        }
        return json;
    })
    .then(r => {
        if (r.access_token) {
            alert("User registered successfully!");
            localStorage.setItem('access_token', r.access_token);
            window.location.href = 'pages/dashboard.html';
        }
    })
    .catch(error => {
        console.error("Error:", error);
        document.getElementById('errorMessage').innerText = error.detail || "An error occurred";
        document.getElementById('errorMessage').style.display = 'block';
    });
};