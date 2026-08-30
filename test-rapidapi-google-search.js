require('dotenv').config();

async function test() {
  const url = `https://local-business-data.p.rapidapi.com/search?query=${encodeURIComponent("Hotel Cosmopolitan Bologna")}&limit=3`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-key": process.env.RAPIDAPI_KEY,
      "x-rapidapi-host": "local-business-data.p.rapidapi.com",
    },
  });

  const data = await res.json();
  console.log(JSON.stringify(data.data.slice(0, 1), null, 2));
}

test();
