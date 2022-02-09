const express = require("express");
const jwt = require("jsonwebtoken");
const path = require("path");
const { getEventsDB, getEvent, createTicket, hashTicket, removeAllTickets, createAdmin, findByUsername, updateEvent, cryptCompare, findTicket, checkJWT } = require("./utils");
const app = express();

app.use(express.static("../frontend"));
app.use(express.json());

//removeAllTickets();
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
  const ticket = await createTicket();
  const hashedTicket = await hashTicket(ticket);
  const newTicket = { ticketId: hashedTicket, verified: false };
  updateEvent(id, { $push: { tickets: newTicket } });

  res.json({ ticketId: ticket, event: event });
});

app.get("/tickets", (req, res) => {
  console.log("--- Get Ticket ---");
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
  const { username, password } = req.body;
  const account = await findByUsername(username);
  const match = await cryptCompare(password, account.password);
  let resObj = {
    success: false,
    token: "",
  };
  if (account && match) {
      const token = jwt.sign({ username: account.username }, "a1b1c1", {
        expiresIn: 600, // Går ut om 10 min (värdet är i sekunder)
      });

      resObj.token = token;
      resObj.success = true;
  }
  res.json(resObj);
});

app.get("/staff/verify", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/staff/verify.html"));
});

app.post("/staff/verify", async (req, res) => {
  if ( !checkJWT(req.headers.authorization.replace("Bearer ", "")) ) {
    res.status(401).send("Unauthorized");
    return;
  }

  console.log("--- Verify ---");
  let resObj = { success: false, alreadyVerified: false };
  const ticketId = req.body.ticketId;

  // gets all events, goes through all events, finds event with ticketId using bcrypt.compare 
  // and returns ticket and corresponding event
  const ticketAndEvent = await findTicket(ticketId);
  
  if (ticketAndEvent != null) {
    const ticket = ticketAndEvent.ticket;
    const event = ticketAndEvent.event;

    if (ticket.verified == true) {
      resObj.alreadyVerified = true;
      res.json(resObj);
      return;
    } else {
      resObj.success = true;
      res.json(resObj);
      ticket.verified = true;
      updateEvent(event.id, { $set: { tickets: event.tickets } });
    }
  } else {
    res.status(404).send("Ticket not found");
  }
});

app.listen(3000, () => {
  console.log("localhost:3000");
});
