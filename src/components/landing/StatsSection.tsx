const stats = [
  { value: "1,000+", label: "Active Students" },
  { value: "50+", label: "Campus Activities" },
  { value: "200+", label: "Suggestions Implemented" },
  { value: "98%", label: "Satisfaction Rate" },
];

export function StatsSection() {
  return (
    <section id="about" className="bg-background px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-primary sm:text-4xl">
                {stat.value}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
