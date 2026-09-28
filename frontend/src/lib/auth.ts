export type Role =
  | 'student'
  | 'lecturer'
  | 'department_admin'
  | 'academic_officer'
  | 'finance_officer'
  | 'student_affairs'
  | 'system_admin'
  | 'super_admin';

export type UserSession = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  studentId?: string;
  department?: string;
  programme?: string;
  level?: string;
};

export const roleLabels: Record<Role, string> = {
  student: 'Student',
  lecturer: 'Lecturer',
  department_admin: 'Department Admin',
  academic_officer: 'Academic Officer',
  finance_officer: 'Finance Officer',
  student_affairs: 'Student Affairs',
  system_admin: 'System Admin',
  super_admin: 'Super Admin',
};

export const roleRoutes: Record<Role, string> = {
  student: '/dashboard/student',
  lecturer: '/dashboard/lecturer',
  department_admin: '/dashboard/admin',
  academic_officer: '/dashboard/admin',
  finance_officer: '/dashboard/admin',
  student_affairs: '/dashboard/admin',
  system_admin: '/dashboard/admin',
  super_admin: '/dashboard/admin',
};

export function getDashboardPath(role: Role | string) {
  return roleRoutes[role as Role] || '/dashboard/student';
}

export function canAccessRole(role: Role | string, requiredRole: Role | string) {
  if (!role || !requiredRole) return false;

  const roleMap: Record<string, string[]> = {
    student: ['student'],
    lecturer: ['lecturer'],
    department_admin: ['department_admin'],
    academic_officer: ['academic_officer'],
    finance_officer: ['finance_officer'],
    student_affairs: ['student_affairs'],
    system_admin: ['system_admin', 'super_admin'],
    super_admin: ['super_admin'],
  };

  return (roleMap[role] || []).includes(requiredRole as string);
}

export function isAdminRole(role?: Role | string) {
  return ['department_admin', 'academic_officer', 'finance_officer', 'student_affairs', 'system_admin', 'super_admin'].includes(String(role || ''));
}

export function canAccessRoute(role: Role | string, pathname: string) {
  const accessMap: Record<string, string[]> = {
    student: [
      '/dashboard/student',
      '/dashboard/student/results',
      '/dashboard/student/transcript',
      '/dashboard/student/attendance',
      '/dashboard/student/timetable',
      '/dashboard/student/fees',
      '/dashboard/student/payments',
      '/dashboard/student/registration',
      '/dashboard/student/profile',
      '/dashboard/student/support',
    ],
    lecturer: [
      '/dashboard/lecturer',
      '/dashboard/lecturer/courses',
      '/dashboard/lecturer/attendance',
      '/dashboard/lecturer/results',
      '/dashboard/lecturer/timetable',
    ],
    department_admin: [
      '/dashboard/admin',
      '/dashboard/admin/users',
      '/dashboard/admin/courses',
      '/dashboard/admin/attendance',
      '/dashboard/admin/timetable',
      '/dashboard/admin/fees',
      '/dashboard/admin/payments',
    ],
    academic_officer: [
      '/dashboard/admin',
      '/dashboard/admin/users',
      '/dashboard/admin/courses',
      '/dashboard/admin/attendance',
      '/dashboard/admin/timetable',
      '/dashboard/admin/fees',
      '/dashboard/admin/results',
      '/dashboard/admin/requests',
      '/dashboard/admin/payments',
    ],
    finance_officer: [
      '/dashboard/admin',
      '/dashboard/admin/fees',
      '/dashboard/admin/payments',
    ],
    student_affairs: [
      '/dashboard/admin',
      '/dashboard/admin/users',
      '/dashboard/admin/attendance',
    ],
    system_admin: [
      '/dashboard/admin',
      '/dashboard/admin/users',
      '/dashboard/admin/courses',
      '/dashboard/admin/attendance',
      '/dashboard/admin/timetable',
      '/dashboard/admin/fees',
      '/dashboard/admin/results',
      '/dashboard/admin/requests',
      '/dashboard/admin/payments',
    ],
    super_admin: [
      '/dashboard/admin',
      '/dashboard/admin/users',
      '/dashboard/admin/courses',
      '/dashboard/admin/attendance',
      '/dashboard/admin/timetable',
      '/dashboard/admin/fees',
      '/dashboard/admin/results',
      '/dashboard/admin/requests',
      '/dashboard/admin/payments',
    ],
  };

  return (accessMap[role as keyof typeof accessMap] || []).includes(pathname);
}
