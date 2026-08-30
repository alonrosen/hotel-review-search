require('dotenv').config();

async function test() {
  const token = process.env.APIFY_API_TOKEN;
  const actorId = "dbEyMBriog95Fv8CW"; 

  const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${token}`;
  
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "Hotel Cosmopolitan Bologna",
    }),
  });

  if (!res.ok) {
    console.error(await res.text());
    return;
  }

  const data = await res.json();
  console.log(JSON.stringify(data.slice(0, 2), null, 2));
}

test();
