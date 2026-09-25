const test = require('node:test');
const assert = require('node:assert/strict');

const router = require('../src/routes/portal');

test('portal router exposes result management endpoints', () => {
  const paths = router.stack
    .filter((layer) => layer.route)
    .map((layer) => Object.keys(layer.route.methods)[0] + ' ' + layer.route.path);

  assert(paths.includes('get /results'));
  assert(paths.includes('post /results'));
  assert(paths.includes('patch /results/:id'));
  assert(paths.includes('post /results/:id/approve'));
  assert(paths.includes('post /results/:id/correct'));
  assert(paths.includes('delete /results/:id'));
});

test('portal router exposes protected finance, attendance, and student service workflows', () => {
  const paths = router.stack
    .filter((layer) => layer.route)
    .map((layer) => Object.keys(layer.route.methods)[0] + ' ' + layer.route.path);

  assert(paths.includes('post /attendance'));
  assert(paths.includes('patch /attendance/:id'));
  assert(paths.includes('post /fees'));
  assert(paths.includes('patch /fees/:id'));
});

test('result model keeps the academic identity fields explicit', () => {
  const Result = require('../src/models/Result');
  assert.equal(Result.schema.path('studentId').options.required, true);
  assert.equal(Result.schema.path('courseId').options.required, true);
  assert.equal(Result.schema.path('semester').options.default, 'Semester 1');
});

test('academic utility calculates credit-weighted GPA and CGPA', () => {
  const { calculateAcademicSummary } = require('../src/utils/academics');
  const summary = calculateAcademicSummary([
    { semester: 'Semester 1', grade: 'A', courseId: { credits: 3 } },
    { semester: 'Semester 1', grade: 'B', courseId: { credits: 3 } },
    { semester: 'Semester 2', grade: 'B+', courseId: { credits: 4 } },
  ]);
  assert.equal(summary.semesters[0].gpa, 3.5);
  assert.equal(summary.cgpa, 3.5);
  assert.equal(summary.totalCredits, 10);
});

test('role permission metadata follows resource.action naming', () => {
  const { permissionsForRole } = require('../src/utils/permissions');
  const permissions = permissionsForRole('academic_officer');
  assert(permissions.includes('results.approve'));
  assert(permissions.every((permission) => permission.includes('.') || permission === '*'));
});
