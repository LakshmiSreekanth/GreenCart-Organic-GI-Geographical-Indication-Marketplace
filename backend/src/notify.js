function mockNotify({ to, subject, body }) {
  console.log("\n--- GreenCart notification (mock) ---");
  console.log("To:", to);
  console.log("Subject:", subject);
  console.log(body);
  console.log("-------------------------------------\n");
  return { sent: true, mock: true, to, subject };
}

module.exports = { mockNotify };
