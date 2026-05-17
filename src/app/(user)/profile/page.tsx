import { getCurrentAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { AppImage } from "@/components/ui/AppImage";
import { Card, CardContent } from "@/components/ui/card";

export default async function ProfilePage() {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return null;

  const user = await prisma.user.findUnique({ where: { id: authUser.userId } });
  if (!user) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">View Profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your public profile and account details.</p>
      </div>
      <Card>
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
          <AppImage
            src={user.profilePicture}
            alt={`${user.name} profile`}
            className="h-24 w-24 rounded-full border-2 border-border object-cover shadow-sm"
            fallbackSrc="/uploads/default-profile.svg"
          />
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{user.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          </div>
        </CardContent>
      </Card>
      <ProfileForm initialName={user.name} email={user.email} initialProfilePicture={user.profilePicture} />
    </div>
  );
}
