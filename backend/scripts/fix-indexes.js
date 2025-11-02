/*
  One-time script to fix index conflicts and duplicates.
  Usage (Windows PowerShell):
    $env:MONGODB_URI="mongodb://localhost:27017/healthnexus"; node scripts/fix-indexes.js
*/

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set. Set it in the environment before running.');
  process.exit(1);
}

(async () => {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const dbName = new URL(MONGODB_URI).pathname.replace('/', '') || 'healthnexus';
    const db = client.db(dbName);

    // Helpers
    const dropIndexIfExists = async (collectionName, indexName) => {
      const coll = db.collection(collectionName);
      const idxs = await coll.indexes();
      const exists = idxs.find(i => i.name === indexName);
      if (exists) {
        console.log(`Dropping index ${collectionName}.${indexName}`);
        await coll.dropIndex(indexName);
      }
    };

    const logIndexes = async (collectionName) => {
      const coll = db.collection(collectionName);
      const idxs = await coll.indexes();
      console.log(`\nIndexes for ${collectionName}:`);
      idxs.forEach(i => console.log(`- ${i.name} => ${JSON.stringify(i.key)}`));
    };

    // Service collection: keep schema text index, remove custom one if present
    await dropIndexIfExists('services', 'service_text_search');

    // Users: drop our custom index if it exists (schema handles email unique)
    await dropIndexIfExists('users', 'user_email_unique');

    // Generic: ensure no duplicate named indexes from earlier runs
    // Add more as needed

    // Log final state
    await logIndexes('services');
    await logIndexes('users');

    console.log('\n✅ Index fix completed.');
  } catch (err) {
    console.error('Index fix error:', err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
})();
