import { test } from '@playwright/test';

test('dump db', async ({ page }) => {
  await page.goto('http://localhost:9002/dashboard/management/route-planning?mockUserId=user-admin-1');
  await page.waitForTimeout(2000);
  const dbStr = await page.evaluate(() => localStorage.getItem('guardian_mock_db'));
  if (dbStr) {
    const db = JSON.parse(dbStr);
    console.log("DB_DUMP_ROUTES:", JSON.stringify(db.routes || []));
    console.log("DB_DUMP_DRIVERS:", JSON.stringify(db.drivers || []));
  } else {
    console.log("DB_DUMP: NO DB FOUND IN LOCAL STORAGE");
  }
});
