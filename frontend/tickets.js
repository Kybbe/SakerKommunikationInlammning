var ticket = "";
var urlId = "";
var currentEvent = "";

async function getTicketAndEvent() {
  const urlParams = new URLSearchParams(window.location.search);
  urlId = urlParams.get("id");

  const response = await fetch("/createTicket/" + urlId);

  if (response.status === 420) {
    alert("Full");
    window.location.href = "/events";
    return;
  }

  const data = await response.json();

  ticket = data.ticketId;
  currentEvent = data.event;

  fillFields();
  saveTicket();
}

function fillFields() {
  document.querySelector(".name").textContent = currentEvent.name;
  document.querySelector(".location").textContent = currentEvent.location;
  document.querySelector(".date").textContent = currentEvent.date;
  let time = currentEvent.time.split(" - ");
  document.querySelector(".firstTime").textContent = time[0];
  document.querySelector(".secondTime").textContent = time[1];

  document.querySelector(".ticketNumber").innerHTML = ticket;
  JsBarcode("#code39", ticket, {format: "code39", background: "transparent", lineColor: "#373737", displayValue: false});
}

function saveTicket() {
  let ticketObj = {
    ticketId: ticket,
    event: currentEvent,
  };

  // save ticket to local storage
  localStorage.setItem("ticket" + urlId, JSON.stringify(ticketObj));
}

function loadTicket() {
  const urlParams = new URLSearchParams(window.location.search);
  urlId = urlParams.get("id");

  let saved = JSON.parse(localStorage.getItem("ticket" + urlId));

  console.log(saved);
  if (saved && saved.event.id == urlId) {
    console.log("Ticket already saved");
    currentEvent = saved.event;
    ticket = saved.ticketId;
    fillFields();
    saveTicket();
  } else {
    getTicketAndEvent();
  }
}

loadTicket();
