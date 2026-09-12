import Link from "next/link";

type StoryCard = {
  title: string;
  excerpt: string;
  href: string;
  readTime: string;
  status: string;
};

type Props = {
  eyebrow: string;
  title: string;
  intro: string;
  stories: StoryCard[];
};

export default function StoriesIndex({
  eyebrow,
  title,
  intro,
  stories,
}: Props) {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
            {eyebrow}
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {title}
          </h1>

          <p className="mt-5 text-lg leading-8 text-slate-600">
            {intro}
          </p>
        </header>

        <section className="mt-12 grid gap-6 md:grid-cols-2">
          {stories.map((story) => (
            <article
              key={story.href}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4 text-xs font-medium text-slate-500">
                <span>{story.readTime}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  {story.status}
                </span>
              </div>

              <h2 className="mt-5 text-2xl font-semibold leading-tight text-slate-900">
                {story.title}
              </h2>

              <p className="mt-3 leading-7 text-slate-600">
                {story.excerpt}
              </p>

              <Link
                href={story.href}
                className="mt-6 inline-flex text-sm font-semibold text-green-700 hover:text-green-800"
              >
                {story.status}
              </Link>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
