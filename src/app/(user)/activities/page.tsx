import { getCurrentAuthUser } from "@/lib/auth";
import { getUserActivitiesList } from "@/lib/activities-list";
import { UserActivitiesTabs } from "@/components/activities/UserActivitiesTabs";

export default async function ActivitiesPage() {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return null;

  const activities = await getUserActivitiesList(authUser.userId);

  return <UserActivitiesTabs activities={activities} />;
}
