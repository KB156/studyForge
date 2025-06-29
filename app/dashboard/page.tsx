// app/dashboard/page.tsx (Server Component)

import { auth } from "@clerk/nextjs/server";
import DashboardClient from './DashboardClient'; 

export default async function DashboardPage() {
  const session = await auth(); // ✅ wait for the Promise to resolve
  const userId = session.userId;

  return <DashboardClient userId={userId!} />;
}
