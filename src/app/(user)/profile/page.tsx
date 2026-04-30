import { getCurrentAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { AppImage } from "@/components/ui/AppImage";

export default async function ProfilePage() {
  const authUser = await getCurrentAuthUser();
  if (!authUser) return null;

  const user = await prisma.user.findUnique({ where: { id: authUser.userId } });
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-textPrimary">View Profile</h1>
      </div>
      <section className="rounded-3xl border-2 border-[#6b4f3a] bg-white p-6 shadow-lg">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <AppImage
            src={user.profilePicture}
            alt={`${user.name} profile`}
            className="h-24 w-24 rounded-full border border-primary/10 object-cover"
            fallbackSrc="/uploads/default-profile.svg"
          />
          <div>
            <h2 className="text-3xl font-semibold text-textPrimary">{user.name}</h2>
            <p className="text-sm text-textSecondary">{user.email}</p>
          </div>
        </div>
      </section>
      <ProfileForm initialName={user.name} email={user.email} initialProfilePicture={user.profilePicture} />
    </div>
  );
}
