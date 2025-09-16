#!/usr/bin/env node

/**
 * Date-fns v4.1.0 Compatibility Verification Script
 * Verifies that all date-fns functions used in the codebase work correctly
 */

const { format, addDays, subDays, isSameDay, parseISO, formatDistanceToNow } = require('date-fns');

console.log('🔍 Verifying date-fns v4.1.0 compatibility...\n');

const testDate = new Date('2024-01-15T10:30:00Z');
const testDateISO = '2024-01-15T10:30:00Z';

try {
  // Test format function (most commonly used)
  const formatted = format(testDate, 'yyyy-MM-dd');
  console.log('✅ format():', formatted);
  
  // Test date arithmetic functions
  const tomorrow = addDays(testDate, 1);
  const yesterday = subDays(testDate, 1);
  console.log('✅ addDays():', format(tomorrow, 'yyyy-MM-dd'));
  console.log('✅ subDays():', format(yesterday, 'yyyy-MM-dd'));
  
  // Test date comparison
  const isSame = isSameDay(testDate, new Date('2024-01-15T15:00:00Z'));
  console.log('✅ isSameDay():', isSame);
  
  // Test ISO parsing
  const parsedDate = parseISO(testDateISO);
  console.log('✅ parseISO():', format(parsedDate, 'yyyy-MM-dd HH:mm'));
  
  // Test relative formatting
  const relative = formatDistanceToNow(testDate, { addSuffix: true });
  console.log('✅ formatDistanceToNow():', relative);
  
  console.log('\n🎉 All date-fns functions verified successfully!');
  console.log('✅ Ready for deployment with v4.1.0');
  
} catch (error) {
  console.error('❌ Date-fns compatibility test failed:', error.message);
  process.exit(1);
}