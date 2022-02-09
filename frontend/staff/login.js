async function login() {
  const username = document.querySelector("#username").value;
  const password = document.querySelector("#password").value;

  let response = await fetch("http://localhost:3000/staff/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username,
      password: password,
    }),
  });
  let data = await response.json();

  if (data.success) {
    sessionStorage.setItem("token", data.token);
    window.location.href = "http://localhost:3000/staff/verify";
  } else {
    alert("Incorrect username or password");
  }
}

async function verify() {
  const ticketId = document.querySelector("#ticket").value;
  const token = sessionStorage.getItem("token");

  let response = await fetch("http://localhost:3000/staff/verify", {
    method: "POST",
    headers: {
      'Authorization': `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ticketId: ticketId,
    }),
  });
  if(response.status == 401) {
    alert("Invalid token");
    window.location.href = "http://localhost:3000/staff/login";
    return;
  }  else if(response.status == 404) {
    alert("Ticket not found");
    return;
  }
  let data = await response.json();

  if (data.alreadyVerified) {
    alert("Ticket already verified");
  } else if (data.success) {
    alert("Ticket verified");
  } else {
    alert("Incorrect ticket ID");
  }
}
