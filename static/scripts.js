document.getElementById("loginForm").onsubmit = function(e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const data = {
        username: username,
        password: password
    }

    fetch('https://deepply.someonewhoexists.hackclub.app/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.access_token) {
            localStorage.setItem('access_token', data.access_token);
            window.location.href = '/pages/dashboard.html';
        }
    })
    .catch(error => {
        console.error("Error:", error);
        document.getElementById('errorMessage').innerText = "Invalid username or password";
    });
};