const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProblemResult {
  platform: string;
  title: string;
  url: string;
  difficulty: string;
  questionNumber?: string;
  score: number;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (nb.includes(na) || na.includes(nb)) return 0.9;
  const aw = new Set(na.split(" "));
  const bw = new Set(nb.split(" "));
  let common = 0;
  aw.forEach((w) => { if (bw.has(w)) common++; });
  return common / Math.max(aw.size, bw.size);
}

async function lookupLeetCode(title: string): Promise<ProblemResult[]> {
  const query = `
    query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
      problemsetQuestionList: questionList(
        categorySlug: $categorySlug
        limit: $limit
        skip: $skip
        filters: $filters
      ) {
        questions: data {
          title
          titleSlug
          questionFrontendId
          difficulty
        }
      }
    }`;

  try {
    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Referer": "https://leetcode.com",
        "User-Agent": "Mozilla/5.0",
      },
      body: JSON.stringify({
        query,
        variables: {
          categorySlug: "",
          skip: 0,
          limit: 10,
          filters: { searchKeywords: title.trim() },
        },
      }),
    });

    if (!res.ok) return [];
    const data = await res.json();
    const questions = data?.data?.problemsetQuestionList?.questions ?? [];
    
    return questions.map((q: any) => ({
      platform: "LeetCode",
      title: q.title,
      url: `https://leetcode.com/problems/${q.titleSlug}/`,
      difficulty: q.difficulty.toLowerCase(),
      questionNumber: q.questionFrontendId,
      score: similarity(title, q.title),
    })).filter((q: any) => q.score > 0.4);
  } catch {
    return [];
  }
}

async function lookupCodeforces(title: string): Promise<ProblemResult[]> {
  try {
    // Note: Codeforces API returns ALL problems (~9000). We fetch it and filter.
    // In a real production app, we would cache this result.
    const res = await fetch("https://codeforces.com/api/problemset.problems");
    if (!res.ok) return [];
    const data = await res.json();
    const problems = data?.result?.problems ?? [];
    
    const results: ProblemResult[] = [];
    for (const p of problems) {
      const score = similarity(title, p.name);
      if (score > 0.6) {
        results.push({
          platform: "Codeforces",
          title: p.name,
          url: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
          difficulty: p.rating ? (p.rating < 1200 ? "easy" : p.rating < 1900 ? "medium" : "hard") : "medium",
          questionNumber: `${p.contestId}${p.index}`,
          score: score,
        });
      }
      if (results.length > 5) break; 
    }
    return results.sort((a, b) => b.score - a.score);
  } catch {
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { title } = await req.json();
    if (!title || typeof title !== "string" || title.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Title required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Run lookups in parallel
    const [lcResults, cfResults] = await Promise.all([
      lookupLeetCode(title),
      lookupCodeforces(title),
    ]);

    const allResults = [...lcResults, ...cfResults].sort((a, b) => b.score - a.score);

    return new Response(JSON.stringify({
      found: allResults.length > 0,
      results: allResults,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg, found: false }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
