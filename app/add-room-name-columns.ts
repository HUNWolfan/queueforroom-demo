import { query } from './db.server';

/**
 * Add name_en and name_hu columns to rooms table
 */
async function addColumns() {
  console.log('Adding name_en and name_hu columns to rooms table...');

  try {
    // Add name_en column if it doesn't exist
    await query(`
      ALTER TABLE rooms 
      ADD COLUMN IF NOT EXISTS name_en VARCHAR(100)
    `);
    console.log('✓ name_en column added');

    // Add name_hu column if it doesn't exist
    await query(`
      ALTER TABLE rooms 
      ADD COLUMN IF NOT EXISTS name_hu VARCHAR(100)
    `);
    console.log('✓ name_hu column added');

    console.log('✅ Columns added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding columns:', error);
    process.exit(1);
  }
}

addColumns();
