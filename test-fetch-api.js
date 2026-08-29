const fetch = require("node-fetch");
const dotenv = require("dotenv");
dotenv.config();

async function run() {
  // Assuming the hotel DoubleTree Times Square South is in the DB
  const res = await fetch("http://localhost:3000/api/reviews/fetch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-secret": process.env.ADMIN_SECRET
    },
    body: JSON.stringify({
      hotelId: "cm0ew84r40000rbs4j0xpsw41", // I need to get a valid hotelId from DB
      source: "tripadvisor",
      pages: 1
    })
  });
  
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
}

run();
