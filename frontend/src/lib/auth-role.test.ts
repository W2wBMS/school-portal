import test from 'node:test';
import assert from 'node:assert/strict';

import { getDashboardPath, canAccessRole } from './auth';

test('student maps to student dashboard', () => {
  assert.equal(getDashboardPath('student'), '/dashboard/student');
});

test('admin maps to admin dashboard', () => {
  assert.equal(getDashboardPath('system_admin'), '/dashboard/admin');
});

test('lecturer is not allowed in student dashboard', () => {
  assert.equal(canAccessRole('lecturer', 'student'), false);
});
