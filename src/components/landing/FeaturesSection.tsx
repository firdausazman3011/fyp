import { CalendarIcon, LightbulbIcon, UsersIcon } from "@/components/icons";

const features = [
  {
    name: "Discover Activities",
    description:
      "Browse and join campus activities, events, and clubs. Never miss out on what's happening in your university community.",
    icon: CalendarIcon,
  },
  {
    name: "Share Your Ideas",
    description:
      "Submit suggestions to improve campus life. Your voice matters and can help shape the university experience for everyone.",
    icon: LightbulbIcon,
  },
  {
    name: "Build Connections",
    description:
      "Connect with fellow students who share your interests. Form study groups, join clubs, and expand your social network.",
    icon: UsersIcon,
  },
];

export function FeaturesSection() {
  return (
    <section className="bg-muted/50 px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need to stay connected
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            UniConnect brings together all the tools you need to make the most
            of your university experience.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="relative rounded-2xl border border-border bg-card p-8 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {feature.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
