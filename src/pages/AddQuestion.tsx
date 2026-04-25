import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CodeEditor } from "@/components/CodeEditor";
import { ArrowLeft, Save, Loader2, Star, Search, ExternalLink, CheckCircle2, XCircle, Globe } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  title: z.string().trim().min(1, "Title required").max(200),
  problem_statement: z.string().max(5000).optional(),
  topic: z.string().max(80).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  platform: z.string().max(80).optional(),
  problem_link: z.string().max(500).optional().or(z.literal("")),
  answer: z.string().max(10000).optional(),
  explanation: z.string().max(10000).optional(),
  code: z.string().max(20000).optional(),
  language: z.string().max(40),
  time_complexity: z.string().max(80).optional(),
  space_complexity: z.string().max(80).optional(),
  status: z.enum(["solved", "pending", "revisit"]),
});

const DATA_STRUCTURE_TOPICS = [
  "Array",
  "String",
  "Hash Table",
  "Linked List",
  "Stack",
  "Queue",
  "Deque",
  "Tree",
  "Binary Tree",
  "Binary Search Tree",
  "Heap",
  "Trie",
  "Graph",
  "Matrix",
  "Set",
  "Map",
];

const PATTERN_TOPICS = [
  "Two Pointers",
  "Sliding Window",
  "Fast & Slow Pointers",
  "Binary Search",
  "Prefix Sum",
  "Merge Intervals",
  "Cyclic Sort",
  "In-place Reversal",
  "Tree BFS",
  "Tree DFS",
  "Graph BFS",
  "Graph DFS",
  "Topological Sort",
  "Union Find",
  "Backtracking",
  "Greedy",
  "Dynamic Programming",
  "0/1 Knapsack",
  "Unbounded Knapsack",
  "LIS / LCS",
  "Divide & Conquer",
  "Bit Manipulation",
  "Math",
  "Recursion",
  "Sorting",
  "Monotonic Stack",
  "Monotonic Queue",
  "Kadane's Algorithm",
  "Other",
];

const PLATFORMS = ["LeetCode", "HackerRank", "Codeforces", "GeeksforGeeks", "AtCoder", "InterviewBit", "CodeChef", "Other"];

export default function AddQuestion() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams();
  const editing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [needsRevision, setNeedsRevision] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [lcLoading, setLcLoading] = useState(false);
  const [lookupResults, setLookupResults] = useState<any[]>([]);
  const [leetcodeNumber, setLeetcodeNumber] = useState<string | null>(null);
  const [duplicateInfo, setDuplicateInfo] = useState<{ id: string; title: string } | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    problem_statement: "",
    topic: "Array",
    difficulty: "medium" as "easy" | "medium" | "hard",
    platform: "LeetCode",
    problem_link: "",
    answer: "",
    explanation: "",
    code: "",
    language: "python",
    time_complexity: "",
    space_complexity: "",
    status: "solved" as "solved" | "pending" | "revisit",
  });

  useEffect(() => {
    if (!editing || !id) return;
    supabase.from("questions").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      if (!data) return;
      setForm({
        title: data.title,
        problem_statement: data.problem_statement ?? "",
        topic: data.topic ?? "Array",
        difficulty: data.difficulty,
        platform: data.platform ?? "LeetCode",
        problem_link: data.problem_link ?? "",
        answer: data.answer ?? "",
        explanation: data.explanation ?? "",
        code: data.code ?? "",
        language: data.language ?? "python",
        time_complexity: data.time_complexity ?? "",
        space_complexity: data.space_complexity ?? "",
        status: data.status,
      });
      setTagsInput((data.tags ?? []).join(", "));
      setFavorite(data.is_favorite ?? false);
      setNeedsRevision(data.needs_revision ?? false);
      setIsPublic(data.is_public ?? false);
      if (data.leetcode_number) {
        setLeetcodeNumber(data.leetcode_number);
      }
    });
  }, [id, editing]);

  useEffect(() => {
    const title = form.title.trim();
    if (title.length < 3) {
      setDuplicateInfo(null);
      setLookupResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      // 1. Duplicate Check
      setCheckingDuplicate(true);
      try {
        let query = supabase
          .from("questions")
          .select("id, title")
          .eq("is_public", true);

        const filters = [`title.ilike."${title}"`];
        if (form.problem_link) filters.push(`problem_link.eq."${form.problem_link.trim()}"`);
        if (leetcodeNumber) filters.push(`leetcode_number.eq."${leetcodeNumber.trim()}"`);
        
        query = query.or(filters.join(","));
        if (editing) query = query.neq("id", id!);

        const { data, error } = await query.limit(1);
        setDuplicateInfo((!error && data && data.length > 0) ? data[0] : null);
        if (!error && data && data.length > 0) setIsPublic(false);
      } catch (err) {
        console.error("Duplicate check failed:", err);
      } finally {
        setCheckingDuplicate(false);
      }

      // 2. Multi-Platform Lookup
      setLcLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("problem-lookup", {
          body: { title },
        });
        if (!error && data?.found) {
          setLookupResults(data.results);
        } else {
          setLookupResults([]);
        }
      } catch (e) {
        console.error("Lookup failed:", e);
      } finally {
        setLcLoading(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [form.title, form.problem_link, leetcodeNumber, id, editing]);

  const update = (k: keyof typeof form, v: string) => setForm({ ...form, [k]: v });

  const selectResult = (res: any) => {
    setForm((prev) => ({
      ...prev,
      problem_link: res.url,
      platform: res.platform,
      difficulty: res.difficulty as any,
    }));
    if (res.platform === "LeetCode" && res.questionNumber) {
      setLeetcodeNumber(res.questionNumber);
    } else {
      setLeetcodeNumber(null);
    }
    toast.success(`Selected ${res.platform}: ${res.title}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      schema.parse(form);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }
    setLoading(true);

    // Duplicate Check for Public Library
    if (isPublic) {
      const trimmedTitle = form.title.trim();
      let query = supabase
        .from("questions")
        .select("id, title")
        .eq("is_public", true);

      // Build OR filter for title, link, and leetcode number
      // Values with spaces or special chars must be wrapped in double quotes for .or()
      const filters = [];
      filters.push(`title.ilike."${trimmedTitle}"`);
      if (form.problem_link) filters.push(`problem_link.eq."${form.problem_link.trim()}"`);
      if (leetcodeNumber) filters.push(`leetcode_number.eq."${leetcodeNumber.trim()}"`);
      
      query = query.or(filters.join(","));

      // If editing, exclude current question
      if (editing) {
        query = query.neq("id", id!);
      }

      const { data: existing, error: checkError } = await query.limit(1);

      if (checkError) {
        console.error("Duplicate check error:", checkError);
      } else if (existing && existing.length > 0) {
        setLoading(false);
        toast.error(`A question with this title/link already exists in the Public Library!`, {
          description: "Please check the Community Feed before adding duplicates.",
        });
        return;
      }
    }

    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    const payload = {
      ...form,
      user_id: user.id,
      tags,
      is_favorite: favorite,
      needs_revision: needsRevision,
      is_public: isPublic,
      problem_link: form.problem_link || null,
      leetcode_number: leetcodeNumber,
    };

    const { error } = editing
      ? await supabase.from("questions").update(payload).eq("id", id!)
      : await supabase.from("questions").insert(payload);

    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Question updated" : "Saved to your vault!");
    navigate("/questions");
  };

  return (
    <div className="container max-w-4xl py-8 px-4 md:px-8 animate-fade-in">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 -ml-2">
        <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
      </Button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{editing ? "Edit question" : "Save a question"}</h1>
          <p className="text-muted-foreground mt-1">Capture every detail for future revision.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basics */}
        <Card className="p-6 space-y-4 border-border bg-card">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Basics</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <div className="relative">
                <Input id="title" value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Two Sum" required className="pr-10" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {lcLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
              </div>
            </div>

            {lookupResults.length > 0 && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-1">Auto-detected</p>
                <div className="flex flex-wrap gap-2">
                  {lookupResults.map((res, i) => (
                    <Button 
                      key={i} 
                      type="button" 
                      variant="outline" 
                      onClick={() => selectResult(res)}
                      className={`h-auto py-2 px-3 flex-col items-start gap-1 group transition-all hover:border-primary/50 ${form.problem_link === res.url ? "border-primary bg-primary/5" : ""}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="text-[9px] px-1 h-3.5 uppercase bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">{res.platform}</Badge>
                        <span className="text-xs font-semibold max-w-[150px] truncate">{res.title}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="capitalize">{res.difficulty}</span>
                        {res.questionNumber && <span className="opacity-60">#{res.questionNumber}</span>}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {duplicateInfo && (
              <div className="flex items-center gap-2 text-sm rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-destructive animate-in fade-in slide-in-from-top-1">
                <XCircle className="h-4 w-4 shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold">Already in Public Library!</p>
                  <p className="text-[11px] opacity-90">"{duplicateInfo.title}" is already shared. You can only save this to your private vault.</p>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ps">Problem statement</Label>
            <Textarea id="ps" rows={4} value={form.problem_statement} onChange={(e) => update("problem_statement", e.target.value)} placeholder="Given an array of integers..." />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Topic</Label>
              <Select value={form.topic} onValueChange={(v) => update("topic", v)}>
                <SelectTrigger><SelectValue placeholder="Select a topic" /></SelectTrigger>
                <SelectContent className="max-h-80">
                  <SelectGroup>
                    <SelectLabel>Data Structures</SelectLabel>
                    {DATA_STRUCTURE_TOPICS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Patterns & Algorithms</SelectLabel>
                    {PATTERN_TOPICS.map((t) => <SelectItem key={`p-${t}`} value={t}>{t}</SelectItem>)}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={form.difficulty} onValueChange={(v: any) => update("difficulty", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={form.platform} onValueChange={(v) => update("platform", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="link">Problem link</Label>
              <div className="flex gap-2">
                <Input
                  id="link"
                  type="url"
                  value={form.problem_link}
                  onChange={(e) => update("problem_link", e.target.value)}
                  placeholder="https://..."
                  className={leetcodeNumber && form.problem_link ? "border-success/60 focus-visible:ring-success/40 bg-success/5" : ""}
                />
                {form.problem_link && (
                  <Button type="button" variant="outline" size="icon" asChild className="shrink-0">
                    <a href={form.problem_link} target="_blank" rel="noopener noreferrer" aria-label="Open problem link">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
              {form.platform !== "Other" && form.problem_link && (
                <p className="text-xs text-success flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Linked to {form.platform} {leetcodeNumber ? `#${leetcodeNumber}` : ""}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Solution */}
        <Card className="p-6 space-y-4 border-border bg-card">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Solution</h2>
          <div className="space-y-2">
            <Label htmlFor="ans">Your answer / approach</Label>
            <Textarea id="ans" rows={3} value={form.answer} onChange={(e) => update("answer", e.target.value)} placeholder="Use a hash map to..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exp">Explanation</Label>
            <Textarea id="exp" rows={4} value={form.explanation} onChange={(e) => update("explanation", e.target.value)} placeholder="Walk through the intuition step by step..." />
          </div>
          <div className="space-y-2">
            <Label>Code</Label>
            <CodeEditor
              value={form.code}
              onChange={(v) => update("code", v)}
              language={form.language}
              onLanguageChange={(l) => update("language", l)}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tc">Time complexity</Label>
              <Input id="tc" value={form.time_complexity} onChange={(e) => update("time_complexity", e.target.value)} placeholder="O(n)" className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sc">Space complexity</Label>
              <Input id="sc" value={form.space_complexity} onChange={(e) => update("space_complexity", e.target.value)} placeholder="O(1)" className="font-mono" />
            </div>
          </div>
        </Card>

        {/* Meta */}
        <Card className="p-6 space-y-4 border-border bg-card">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Organization</h2>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input id="tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="hashmap, easy, interview" />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v: any) => update("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="solved">Solved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="revisit">Revisit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-2">
              <div>
                <Label htmlFor="rev" className="cursor-pointer">For revision</Label>
                <p className="text-xs text-muted-foreground">Show in revision queue</p>
              </div>
              <Switch id="rev" checked={needsRevision} onCheckedChange={setNeedsRevision} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-2">
              <div>
                <Label htmlFor="fav" className="cursor-pointer flex items-center gap-1.5"><Star className="h-3.5 w-3.5" /> Favorite</Label>
                <p className="text-xs text-muted-foreground">Pin to top</p>
              </div>
              <Switch id="fav" checked={favorite} onCheckedChange={setFavorite} />
            </div>
            <div className={`flex items-center justify-between rounded-lg border px-4 py-2 transition-all ${duplicateInfo ? "opacity-50 grayscale border-border bg-muted/40 cursor-not-allowed" : "bg-success/5 border-success/20"}`}>
              <div>
                <Label htmlFor="pub" className={`cursor-pointer flex items-center gap-1.5 font-semibold ${duplicateInfo ? "text-muted-foreground" : "text-success"}`}>
                  <Globe className="h-3.5 w-3.5" /> Public Library
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  {duplicateInfo ? "Already in community feed" : "Show in community feed"}
                </p>
              </div>
              <Switch id="pub" checked={isPublic} onCheckedChange={setIsPublic} disabled={Boolean(duplicateInfo)} />
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3 sticky bottom-4 bg-background/80 backdrop-blur-md border border-border rounded-xl p-3 shadow-lg">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" disabled={loading} className="gradient-hero text-primary-foreground hover:opacity-90 shadow-glow">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1.5" /> {editing ? "Update" : "Save question"}</>}
          </Button>
        </div>
      </form>
    </div>
  );
}
