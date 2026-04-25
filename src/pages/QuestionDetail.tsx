import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CodeEditor } from "@/components/CodeEditor";
import { DifficultyBadge, StatusBadge } from "@/components/StatusBadges";
import { ArrowLeft, ExternalLink, Edit3, Star, Sparkles, Loader2, Globe, Lock, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function QuestionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [q, setQ] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [togglingPublic, setTogglingPublic] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase.from("questions").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      setQ(data);
      setLoading(false);
    });
  }, [id]);

  const togglePublic = async () => {
    if (!q) return;
    setTogglingPublic(true);
    const next = !q.is_public;
    const { error } = await supabase.from("questions").update({ is_public: next }).eq("id", q.id);
    setTogglingPublic(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setQ({ ...q, is_public: next });
    toast.success(next ? "Question is now public — share the link!" : "Question is now private");
  };

  const copyShareLink = async () => {
    const url = `${window.location.origin}/share/${q.id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!q) {
    return (
      <div className="container max-w-3xl py-12 text-center">
        <p className="text-muted-foreground mb-4">Question not found.</p>
        <Button asChild><Link to="/questions">Back to questions</Link></Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 px-4 md:px-8 space-y-6 animate-fade-in">
      <Button variant="ghost" onClick={() => navigate(-1)} className="-ml-2">
        <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
      </Button>

      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{q.title}</h1>
          <div className="flex items-center gap-1 shrink-0">
            {q.is_favorite && <Star className="h-5 w-5 fill-warning text-warning" />}
            {q.needs_revision && <Sparkles className="h-5 w-5 fill-info/30 text-info" />}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyBadge level={q.difficulty} />
          <StatusBadge status={q.status} />
          {q.topic && <Badge variant="secondary">{q.topic}</Badge>}
          {q.leetcode_number && (
            q.problem_link ? (
              <a href={q.problem_link} target="_blank" rel="noopener noreferrer" className="inline-flex">
                <Badge variant="outline" className="font-mono bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 cursor-pointer">
                  LC #{q.leetcode_number} <ExternalLink className="h-3 w-3 ml-1" />
                </Badge>
              </a>
            ) : (
              <Badge variant="outline" className="font-mono bg-primary/10 text-primary border-primary/30">LC #{q.leetcode_number}</Badge>
            )
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            Saved {format(new Date(q.created_at), "MMM d, yyyy")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {q.problem_link && (
            <Button variant="outline" size="sm" asChild>
              <a href={q.problem_link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Original problem
              </a>
            </Button>
          )}
          <Button size="sm" asChild>
            <Link to={`/edit/${q.id}`}><Edit3 className="h-3.5 w-3.5 mr-1.5" /> Edit</Link>
          </Button>
          <Button
            size="sm"
            variant={q.is_public ? "default" : "outline"}
            onClick={togglePublic}
            disabled={togglingPublic}
            className={q.is_public ? "bg-success text-success-foreground hover:bg-success/90" : ""}
          >
            {q.is_public ? <Globe className="h-3.5 w-3.5 mr-1.5" /> : <Lock className="h-3.5 w-3.5 mr-1.5" />}
            {q.is_public ? "Public" : "Make public"}
          </Button>
          {q.is_public && (
            <Button size="sm" variant="outline" onClick={copyShareLink}>
              {copied ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
              Copy share link
            </Button>
          )}
        </div>
      </header>

      {q.is_public && (
        <Card className="p-4 border-success/30 bg-success/5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Globe className="h-4 w-4 text-success shrink-0" />
            <span className="text-sm text-muted-foreground truncate">
              Anyone with the link can view this question:
            </span>
            <code className="text-xs px-2 py-1 rounded bg-background border border-border truncate">
              {window.location.origin}/share/{q.id}
            </code>
          </div>
        </Card>
      )}

      {q.problem_statement && (
        <Card className="p-6 border-border bg-card">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Problem</h2>
          <p className="whitespace-pre-wrap leading-relaxed">{q.problem_statement}</p>
        </Card>
      )}

      {(q.answer || q.explanation) && (
        <Card className="p-6 border-border bg-card space-y-4">
          {q.answer && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Approach</h2>
              <p className="whitespace-pre-wrap leading-relaxed">{q.answer}</p>
            </div>
          )}
          {q.explanation && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Explanation</h2>
              <p className="whitespace-pre-wrap leading-relaxed">{q.explanation}</p>
            </div>
          )}
        </Card>
      )}

      {q.code && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">Code</h2>
          <CodeEditor value={q.code} onChange={() => {}} language={q.language ?? "python"} onLanguageChange={() => {}} height="400px" />
        </div>
      )}

      {(q.time_complexity || q.space_complexity) && (
        <Card className="p-6 border-border bg-card">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Complexity</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Time</div>
              <div className="font-mono text-lg font-semibold">{q.time_complexity || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Space</div>
              <div className="font-mono text-lg font-semibold">{q.space_complexity || "—"}</div>
            </div>
          </div>
        </Card>
      )}

      {q.tags && q.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {q.tags.map((t: string) => (
            <span key={t} className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">#{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}
