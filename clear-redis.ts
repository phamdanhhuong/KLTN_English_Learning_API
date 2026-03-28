import { createClient } from 'redis';
import * as dotenv from 'dotenv';
dotenv.config();

async function clearCache() {
  console.log("Connecting to Redis: " + process.env.REDIS_URL);
  const client = createClient({ url: process.env.REDIS_URL });
  
  client.on('error', (err) => console.log('Redis Client Error', err));
  await client.connect();

  console.log("Connected! Clearing ach:defs...");
  await client.del('ach:defs');
  console.log("Cleared Master Achievements Cache!");
  
  // optionally clear all user achievement cache
  const keys = await client.keys('ach:user:*');
  if (keys.length > 0) {
    console.log(`Clearing ${keys.length} user achievement caches...`);
    await client.del(keys);
  }
  
  console.log("Done!");
  await client.disconnect();
}

clearCache().catch(console.error);
