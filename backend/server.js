const bcrypt = require("bcryptjs");
const express = require("express");
const nedb = require("nedb-promise");
const jwt = require("jsonwebtoken");
const path = require("path");
const staffDB = new nedb({ filename: "accounts.db", autoload: true });
const eventsDB = new nedb({ filename: "events.db", autoload: true });
const app = express();

const saltRounds = 10;

app.use(express.static("../frontend"));
app.use(express.json());

async function getEventsDB() {
  const events = await eventsDB.find({});
  return events;
}

async function getEvent(id) {
  id = parseInt(id);
  const event = await eventsDB.findOne({ id: id });
  return event;
}

function createTicket() {
  return {
    ticketId: String(Math.floor(Math.random() * 1000000)),
    verified: false,
  };
}

async function removeAllTickets() {
  await eventsDB.update({}, { $set: { tickets: [] } }, { multi: true });
}

//removeAllTickets();

async function createAdmin() {
  const account = {
    username: "admin",
    password: await bcrypt.hash("admin", saltRounds),
  };
  await staffDB.insert(account);
}

//createAdmin();

app.get("/getEvents", async (req, res) => {
  console.log("--- Get Events ---");
  const events = await getEventsDB();
  // order events by id
  events.sort((a, b) => a.id - b.id);
  res.json(events);
});

app.get("/createTicket/:id", async (req, res) => {
  console.log("--- Create Ticket ---");
  const id = parseInt(req.params.id);
  const event = await getEvent(id);

  if (event.tickets.length >= event.maxParticipants) {
    res.status(420).send("Full");
    console.log(event.name + " Is full");
    return;
  }
  const ticket = createTicket();
  hashedTicket = await bcrypt.hash(ticket.ticketId, saltRounds);
  event.tickets.push({ ticketId: hashedTicket, verified: false });

  eventsDB.update({ id: id }, { $set: { tickets: event.tickets } });

  res.json({ ticketId: ticket.ticketId, event: event });
});

app.get("/tickets", (req, res) => {
  console.log("--- Get Tickets ---");
  res.sendFile(path.join(__dirname, "../frontend/tickets.html"));
});

app.get("/events", async (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/events.html"));
});

app.get("/staff/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/staff/login.html"));
});

app.post("/staff/login", async (req, res) => {
  console.log("--- Login ---");
  let resObj = {
    success: false,
    token: "",
  };
  const { username, password } = req.body;
  const account = await staffDB.findOne({ username: username });
  if (account) {
    const match = await bcrypt.compare(password, account.password);
    if (match) {
      const token = jwt.sign({ username: account.username }, "a1b1c1", {
        expiresIn: 600, // Går ut om 10 min (värdet är i sekunder)
      });

      resObj.token = token;
      resObj.success = true;
    }
  }
  res.json(resObj);
});

app.get("/staff/verify", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/staff/verify.html"));
});

app.post("/staff/verify", async (req, res) => {
  const token = req.headers.authorization.replace("Bearer ", "");
  try {
    const data = jwt.verify(token, "a1b1c1");
  } catch (err) {
    res.status(401).send("Invalid token");
    return;
  }
  console.log("--- Verify ---");
  let resObj = { success: false, alreadyVerified: false };
  const ticketId = req.body.ticketId;
  // get all events, go through all events, find event with ticketId using bcrypt.compare
  const events = await getEventsDB(); // get all events
  for (let i = 0; i < events.length; i++) {
    // go through all events
    const event = events[i];
    for (let j = 0; j < event.tickets.length; j++) {
      // go through all tickets
      const ticket = event.tickets[j];
      const match = await bcrypt.compare(ticketId, ticket.ticketId); // compare ticketId with ticket
      if (match == true) {
        // if match
        if (ticket.verified == true) {
          resObj.alreadyVerified = true;
          res.json(resObj);
          return;
        } else {
          resObj.success = true;
          res.json(resObj);
          ticket.verified = true;
          await eventsDB.update(
            { id: event.id },
            { $set: { tickets: event.tickets } }
          );
        }
        return; // dont do antything else, since we found the ticket
      } else if (match == false) {
        // if no match, do all over again
        resObj.success = false;
      }
    }
  }
  res.json(resObj);
});

app.listen(3000, () => {
  console.log("localhost:3000");
});
