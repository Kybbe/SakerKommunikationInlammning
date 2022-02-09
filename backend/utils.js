const bcrypt = require("bcryptjs");
const nedb = require("nedb-promise");
const staffDB = new nedb({ filename: "accounts.db", autoload: true });
const eventsDB = new nedb({ filename: "events.db", autoload: true });

const saltRounds = 10;

async function getEventsDB() {
  return await eventsDB.find({});
}

async function getEvent(id) {
  return await eventsDB.findOne({ id: parseInt(id) });
}

async function createTicket() {
  const randomNR = String(Math.floor(Math.random() * 1000000));
  const match = await findTicket(randomNR); // check if ticket number already is a ticket
  if (match == null) { // if not, create ticket
    return randomNR;
  } else { // if yes, do the function again (creating a new number)
    return createTicket();
  } 
}

async function hashTicket(ticket) {
  console.log("--- Hash ticket ---");
  return await bcrypt.hash(String(ticket), saltRounds);
}

async function removeAllTickets() {
  console.log("--- Remove all tickets ---");
  await eventsDB.update({}, { $set: { tickets: [] } }, { multi: true });
}

//removeAllTickets();

async function findTicket(ticketId) {
  console.log("--- Find Ticket ---");
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
        return { ticket: ticket, event: event };
      }
    }
  }
  console.log("No match");
  return null;
}

async function createAdmin() {
  console.log("--- Create admin ---");
  const account = {
    username: "admin",
    password: await bcrypt.hash("admin", saltRounds),
  };
  await staffDB.insert(account);
}

//createAdmin();

async function findByUsername(username) {
  return await staffDB.findOne({ username: username });
}

async function checkJWT(token) {
  console.log("--- Check JWT ---");
  try {
    const data = jwt.verify(token, "a1b1c1");
    return true;
  } catch (err) {
    return false;
  }
}

async function updateEvent(id, update) {
  console.log("--- Update database ---");
  await eventsDB.update({ id: parseInt(id) }, update);
}

async function cryptCompare(plainText, hash) {
  const match = await bcrypt.compare(plainText, hash);
  return match;
}

module.exports = { getEventsDB, getEvent, createTicket, hashTicket, removeAllTickets, createAdmin, findByUsername, updateEvent, cryptCompare, findTicket, checkJWT };