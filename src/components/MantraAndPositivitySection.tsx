import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { randomMemeQueryOptions } from "@/lib/queries";

export function MantraAndPositivitySection() {
  const { data: meme } = useQuery(randomMemeQueryOptions()) as any;

  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-stretch">
          {/* Left Side: Good before Bad Mantra */}
          <div className="flex flex-1 flex-col justify-center rounded-3xl border border-border bg-white p-8 sm:p-10 shadow-soft">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              “Good before Bad”
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              This is a mantra to have in the forefront of your mind to create excellent daily habits, the idea is that you always do something positive before considering alternatives in improving your healthy lifestyle choices.
            </p>

            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Examples include:</h3>
              <ul className="grid gap-3 text-sm text-muted-foreground">
                {[
                  "Eat something healthy first, you’re less likely to eat bad and if you do, less of it.",
                  "Carry healthy snacks to reach for, so you are not tempted by others.",
                  "Take supplements, mineral, protein or antioxidant drinks during the day so you’re less likely to eat unprocessed food.",
                  "Eat nuts before sweets.",
                  "In the morning, walk before you sit, sitting is the new smoking.",
                  "Use stairs instead of the lift whenever possible.",
                  "Commit to doing a tiny part of ANY undesirable task, once you START, you are likely to do more.",
                ].map((example, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{example}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs italic text-muted-foreground">
                Make your own ‘Good before Bad’ statements here to follow. WRITE THEM NOW, don’t ponder, just write.
              </p>
            </div>
          </div>

          {/* Right Side: Positivity Meme */}
          <div className="flex flex-col lg:w-[400px] xl:w-[450px] shrink-0 overflow-hidden rounded-3xl border border-border bg-wellness-50 shadow-elevated">
            <div className="p-6">
              <h2 className="text-xl font-bold text-foreground">Start Your Day with Positivity</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Here’s your daily dose of feel-good energy – a positivity meme to make you smile and inspire a fresh, positive start.
              </p>
            </div>
            <div className="flex-1 bg-muted relative min-h-[300px]">
              {meme ? (
                <img
                  src={meme.image_url}
                  alt="Daily positivity meme"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-8 text-center text-muted-foreground">
                  Loading your daily dose of positivity...
                </div>
              )}
            </div>
            <div className="p-6">
              <p className="text-sm text-muted-foreground italic">
                Because when you feel good, you do good – for your body, your mind, and your life. Let today be your best yet!
              </p>
              <Link to="/memes" className="mt-4 inline-flex items-center text-sm font-semibold text-primary hover:underline">
                See more memes →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
