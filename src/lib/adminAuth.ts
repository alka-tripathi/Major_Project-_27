export const isAdmin = (email: string | null | undefined): boolean => {
  if (!email) return false;
  // Use environment variable if available, fallback to a default admin email
  const adminEmailsStr = process.env.NEXT_PUBLIC_ADMIN_EMAILS || 'admin@example.com';
  const adminEmails = adminEmailsStr.split(',').map(e => e.trim().toLowerCase());
  
  return adminEmails.includes(email.toLowerCase());
};
