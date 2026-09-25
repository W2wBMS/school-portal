const ROLE_PERMISSIONS = {
  student: ['students.view', 'students.update', 'courses.view', 'registrations.create', 'results.view', 'fees.view', 'payments.create', 'requests.create'],
  lecturer: ['courses.view', 'attendance.view', 'attendance.update', 'results.enter', 'results.submit'],
  department_admin: ['students.view', 'students.create', 'students.update', 'courses.view', 'courses.create', 'courses.update', 'registrations.approve', 'results.enter', 'results.approve', 'fees.view', 'requests.assign'],
  academic_officer: ['students.view', 'students.create', 'students.update', 'courses.view', 'courses.create', 'courses.update', 'registrations.approve', 'results.enter', 'results.submit', 'results.approve', 'requests.assign'],
  finance_officer: ['students.view', 'fees.view', 'fees.create', 'fees.update', 'payments.verify'],
  student_affairs: ['students.view', 'students.create', 'students.update', 'requests.assign'],
  system_admin: ['users.manage', 'audit.view', 'students.view', 'students.create', 'students.update', 'courses.view', 'courses.create', 'courses.update', 'registrations.approve', 'results.enter', 'results.submit', 'results.approve', 'fees.view', 'fees.create', 'fees.update', 'payments.verify', 'requests.assign'],
  super_admin: ['*'],
};

function permissionsForRole(role) {
  return ROLE_PERMISSIONS[role] || [];
}

function hasPermission(role, permission) {
  const permissions = permissionsForRole(role);
  return permissions.includes('*') || permissions.includes(permission);
}

module.exports = { ROLE_PERMISSIONS, permissionsForRole, hasPermission };
