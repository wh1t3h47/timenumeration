/* eslint-env browser */
function getValues() {
  const firstName = document.getElementById("#name").value;
  const lastName = document.getElementById("#surname").value;
  const email = document.getElementById("#email").value;
  const password = document.getElementById("#password").value;

  if (firstName === "") {
    alert("First name cannot be empty");
    return [];
  }
  if (lastName === "") {
    alert("Surname cannot be empty");
    return [];
  }
  if (email === "") {
    alert("Email name cannot be empty");
    return [];
  }
  if (password === "") {
    alert("Password name cannot be empty");
    return [];
  }

  return [firstName, lastName, email, password];
}

function sendApiSignUp(params, callback) {
  // Output: will call the callback with first parameter
  // set to  false if failed to register
  // or      true if successfully registered
  const [firstName, lastName, email, password] = params;
  fetch("/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password,
    }),
  }).then((response) => {
    if (response.status == 200) {
      callback(true);
    } else {
      callback(false);
    }
  });
}

window.addEventListener("load", () => {
  document.getElementById("registerBtn").addEventListener("click", () => {
    const userInput = [...getValues()];
    if (userInput === []) {
      // getValues() failed
      return;
    }
    let resultHandler = (succeed) => {
      if (succeed) {
        alert("okay");
      } else {
        alert("not okay");
      }
    };
    sendApiSignUp(userInput, resultHandler);
  });
});
