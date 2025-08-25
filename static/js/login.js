document.getElementById("submit").addEventListener("click", async function (e) {
    e.preventDefault();

    window.location.href = "/home";
});



document.getElementById("toggle-btn").addEventListener("click", function (event) {
    event.preventDefault();
    
    let formTitle = document.getElementById("form-title");
    let confirmPasswordGroup = document.getElementById("confirm-password-group");
    let toggleText = document.getElementById("toggle-text");
    let toggleBtn = document.getElementById("toggle-btn");

    if (confirmPasswordGroup.classList.contains("hidden")) {
        formTitle.innerText = "Create Account";
        confirmPasswordGroup.classList.remove("hidden");
        toggleText.innerText = "Already have an account?";
        toggleBtn.innerText = "Login";
    } else {
        formTitle.innerText = "Login";
        confirmPasswordGroup.classList.add("hidden");
        toggleText.innerText = "Don't have an account?";
        toggleBtn.innerText = "Create Account";
    }
});
