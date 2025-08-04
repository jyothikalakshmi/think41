
// backend/loadData.js
const fs = require('fs');
const csv = require('csv-parser');
const db = require('./db');

// Reusable insert function
function insertCSV(filePath, tableName, columns, filterFn = null, callback = null) {
  const rows = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => {
      if (!filterFn || filterFn(data)) {
        const row = columns.map((col) => (data[col] === '' ? null : data[col]));
        rows.push(row);
      }
    })
    .on('end', () => {
      if (rows.length === 0) {
        console.log(`⚠️ No valid rows to insert for ${tableName}`);
        if (callback) callback();
        return;
      }

      const placeholders = rows.map(() => '(' + columns.map(() => '?').join(',') + ')').join(',');
      const values = rows.flat();
    //   const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${placeholders}`;
    const query = `INSERT IGNORE INTO ${tableName} (${columns.join(', ')}) VALUES ${placeholders}`;


      db.query(query, values, (err) => {
        if (err) {
          console.error(`❌ Error inserting into ${tableName}:`, err.sqlMessage || err);
        } else {
          console.log(`✅ Inserted ${rows.length} rows into ${tableName}`);
        }

        if (callback) callback();
      });
    });
}

// STEP 1: Insert users (no filter needed)
insertCSV(
  'uploads/users.csv',
  'users',
  [
    'id', 'first_name', 'last_name', 'email', 'age', 'gender', 'state',
    'street_address', 'postal_code', 'city', 'country',
    'latitude', 'longitude', 'traffic_source', 'created_at'
  ],
  null,
  insertOrdersAfterUsers // callback to insert orders after users
);

// STEP 2: Insert orders — after loading valid user IDs
function insertOrdersAfterUsers() {
  db.query('SELECT id FROM users', (err, results) => {
    if (err) {
      console.error('❌ Failed to fetch user IDs:', err.sqlMessage || err);
      db.end();
      return;
    }

    const validUserIds = new Set(results.map((row) => String(row.id)));

    insertCSV(
      'uploads/orders.csv',
      'orders',
      [
        'order_id', 'user_id', 'status', 'gender',
        'created_at', 'returned_at', 'shipped_at', 'delivered_at', 'num_of_item'
      ],
      (data) => validUserIds.has(data.user_id), // filter function
      () => db.end() // close DB after everything is done
    );
  });
}

