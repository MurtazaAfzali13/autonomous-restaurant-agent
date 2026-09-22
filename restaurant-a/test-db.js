const Database = require('better-sqlite3');

try {
  const db = new Database('meals.db');
  console.log('✅ Database connection successful');
  
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('📋 Tables:', tables);
  
  const meals = db.prepare('SELECT COUNT(*) as count FROM meals').get();
  console.log('🍽️ Total meals:', meals.count);
  
  db.close();
  console.log('✅ Database test completed successfully');
} catch (error) {
  console.error('❌ Database error:', error);
}
