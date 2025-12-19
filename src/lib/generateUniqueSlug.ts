import { getSupabaseAdmin } from './supabaseAdmin';

function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // пробелы → "-"
    .replace(/^-+|-+$/g, '');   // убрать дефисы в начале/конце
}

export async function generateUniqueSlug(base: string): Promise<string> {
  const supabaseAdmin = getSupabaseAdmin();
  const normalized = normalizeSlug(base || 'user');

  let slug = normalized;
  let counter = 1;

  while (true) {
    // проверяем slug в profiles_earner
    const { data: p1 } = await supabaseAdmin
      .from('profiles_earner')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    // проверяем slug в employers
    const { data: p2 } = await supabaseAdmin
      .from('employers')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (!p1 && !p2) break; // уникально

    slug = `${normalized}-${counter++}`;
  }

  return slug;
}
