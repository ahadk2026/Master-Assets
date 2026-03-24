import { Redirect } from "wouter";

// Simplified Admin Panel. The logic is largely covered in the Employees page.
// The prompt specified "Admin panel page: View all users with lock status, unlock button..." 
// Since we built exactly this in 'employees.tsx', we can just redirect or render a subset.
// For completeness of pages requested, we'll just redirect to Employees.
export default function AdminPanel() {
  return <Redirect to="/employees" />;
}
