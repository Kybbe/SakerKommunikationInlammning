var eventsListElem = document.querySelector("#eventsList");
var templateElem = document.querySelector(".event");

async function getEvents() {
  const response = await fetch("/getEvents");
  const events = await response.json();

  events.forEach((event) => {
    fillEventsList(event);
  });
}

function fillEventsList(event) {
  var eventElem = templateElem.cloneNode(true);
  eventElem.style.display = null;
  eventElem.addEventListener("click", () => {
    window.location.href = `/tickets?id=${event.id}`;
  });
  eventElem.querySelector(".name").textContent = event.name;
  eventElem.querySelector(".date").textContent = event.date;
  eventElem.querySelector(".time").textContent = event.time;
  eventElem.querySelector(".location").textContent = event.location;
  eventElem.querySelector(".remaining").textContent =
    event.maxParticipants - event.tickets.length;
  eventElem.querySelector(".totalTickets").textContent =
    event.maxParticipants + " biljetter kvar";
  eventElem.querySelector(".price").textContent = event.price + "kr";
  if (event.maxParticipants - event.tickets.length == 0) {
    return;
  } else {
    eventsListElem.appendChild(eventElem);
  }
}

getEvents();
