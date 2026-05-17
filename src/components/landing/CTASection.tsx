import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/icons";

export function CTASection() {
  return (
    <section className="bg-background px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Ready to get started?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Join UniConnect today and become part of a vibrant university
          community. Discover activities, share ideas, and connect with peers.
        </p>
        <div className="mt-10">
          <Button asChild size="lg" className="gap-2">
            <Link href="/signup">
              Create Your Account
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
