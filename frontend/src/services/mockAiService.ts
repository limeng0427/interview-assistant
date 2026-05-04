// Mock AI service — returns realistic generated content without a real API call.
// Replace with real AI API calls by implementing the same AIService interface
// in a new file (e.g. claudeAiService.ts) and swapping it in aiService.ts.

import { v4 as uuid } from 'uuid';
import type {
  AIService,
  GenerateQuestionsInput,
  GenerateReportInput,
  InterviewQuestion,
  CandidateReport,
  QuestionGroup,
  SeniorityLevel,
  QuestionStatus,
} from '@/types/interview';

// ─── Question templates per group ────────────────────────────────────────────

const questionBank: Record<
  QuestionGroup,
  Array<{
    question: string;
    difficulty: 'easy' | 'medium' | 'hard';
    exampleAnswer: string;
    evaluationCriteria: string[];
    followUpQuestions: string[];
  }>
> = {
  technical: [
    {
      question: 'Explain how you would design a caching layer for a high-traffic API endpoint.',
      difficulty: 'medium',
      exampleAnswer:
        'A strong answer covers: cache-aside vs write-through strategies, TTL policies, cache invalidation on data mutations, Redis or Memcached as backing store, handling cache stampedes with locks or probabilistic early expiry, and monitoring hit rates.',
      evaluationCriteria: [
        'Understands cache-aside vs write-through tradeoffs',
        'Considers cache invalidation',
        'Mentions observability/hit rates',
        'Aware of stampede / thundering herd',
      ],
      followUpQuestions: [
        'How would you handle a cache miss storm after a deployment?',
        'What would change if the data updates very frequently?',
      ],
    },
    {
      question: 'Walk me through how you debug a production memory leak.',
      difficulty: 'hard',
      exampleAnswer:
        'Look for: profiling tools (heap snapshots, flame graphs), correlating memory growth with request patterns, identifying retained object graphs, using APM tooling, and the rollback/hotfix decision-making process.',
      evaluationCriteria: [
        'Uses profiling tools systematically',
        'Can correlate symptoms to root cause',
        'Understands GC behaviour',
        'Has a clear rollback plan',
      ],
      followUpQuestions: [
        'Have you ever had to hotfix in production? Walk me through it.',
        'How do you prevent memory leaks from reaching production?',
      ],
    },
    {
      question: 'How do you approach writing testable code?',
      difficulty: 'easy',
      exampleAnswer:
        'Key signals: dependency injection, pure functions, separating I/O from logic, meaningful unit boundaries, avoiding global state. Bonus: TDD discipline, contract testing for integrations.',
      evaluationCriteria: [
        'Understands dependency injection',
        'Separates pure logic from side effects',
        'Mentions meaningful test boundaries',
      ],
      followUpQuestions: [
        'When would you skip writing a unit test?',
        'How do you test code that depends on time?',
      ],
    },
    {
      question: 'What is your approach to API versioning?',
      difficulty: 'medium',
      exampleAnswer:
        'Cover: URL versioning vs header versioning vs content negotiation, backward-compatibility guarantees, deprecation timelines, changelog communication, and how to manage breaking changes with existing consumers.',
      evaluationCriteria: [
        'Knows multiple versioning strategies',
        'Considers consumer impact',
        'Has a deprecation process',
      ],
      followUpQuestions: ['How do you communicate a breaking change to external consumers?'],
    },
    {
      question: 'Describe a time you had to significantly refactor a codebase. How did you approach it?',
      difficulty: 'medium',
      exampleAnswer:
        'Look for: characterisation tests before refactoring, strangler fig pattern for large migrations, incremental delivery, getting buy-in, and measuring quality improvement after.',
      evaluationCriteria: [
        'Tests before refactoring',
        'Incremental approach',
        'Stakeholder communication',
        'Measured the outcome',
      ],
      followUpQuestions: ['What did you leave out, and why?', 'What would you do differently?'],
    },
  ],
  'system-design': [
    {
      question: `Design a URL shortener that needs to handle 100 million URLs and serve billions of redirects per day.`,
      difficulty: 'hard',
      exampleAnswer:
        'Key areas: hashing strategy (base62 encoding), write path (hash collision handling), read path (CDN + cache in front of DB), database choice (key-value store like DynamoDB), analytics event stream, and rate limiting on writes.',
      evaluationCriteria: [
        'Identifies read-heavy vs write-heavy split',
        'Picks appropriate data store',
        'Addresses caching at the right layer',
        'Considers rate limiting / abuse',
        'Discusses tradeoffs explicitly',
      ],
      followUpQuestions: [
        'How would you add click analytics without slowing redirects?',
        'How does your design change if custom slugs are required?',
      ],
    },
    {
      question: 'How would you design a notification system that supports email, SMS, and push?',
      difficulty: 'hard',
      exampleAnswer:
        'Event-driven architecture: producer emits notification event, fan-out to per-channel queues, idempotency keys, retry with exponential backoff, delivery status tracking, user preference centre, opt-out handling.',
      evaluationCriteria: [
        'Event-driven, not synchronous',
        'Idempotency and retry logic',
        'Per-channel queue separation',
        'User preferences / opt-out',
      ],
      followUpQuestions: [
        'How do you ensure a notification is delivered exactly once?',
        'What happens if the SMS provider is down?',
      ],
    },
    {
      question: 'Design a rate limiter that works across a distributed fleet of API servers.',
      difficulty: 'hard',
      exampleAnswer:
        'Options: token bucket vs sliding window, centralised counter (Redis with atomic increment + TTL) vs local approximate counting (leaky bucket with sync). Discuss consistency vs performance tradeoff, and sliding window log algorithm.',
      evaluationCriteria: [
        'Knows at least two rate limiting algorithms',
        'Addresses distributed consistency',
        'Considers Redis atomic operations',
        'Discusses approximate vs exact tradeoff',
      ],
      followUpQuestions: [
        'What happens if your Redis instance goes down?',
        'How do you rate limit per user vs per IP vs per endpoint?',
      ],
    },
  ],
  behavioural: [
    {
      question:
        'Tell me about a time you disagreed with a technical decision made by your team. How did you handle it?',
      difficulty: 'medium',
      exampleAnswer:
        'STAR format. Look for: genuine disagreement (not "I just went along"), evidence-based persuasion, written communication of concerns, willingness to commit to the decision once made, and a real outcome including cases where they were wrong.',
      evaluationCriteria: [
        'Real disagreement, not vague',
        'Evidence-based approach',
        'Respects team autonomy after decision',
        'Honest about outcome',
      ],
      followUpQuestions: [
        'What would you do differently?',
        'Has there been a case where you were overruled and you turned out to be right?',
      ],
    },
    {
      question: "Describe a project that didn't go as planned. What happened and what did you learn?",
      difficulty: 'medium',
      exampleAnswer:
        'Specificity and ownership matter. Watch for blame-shifting. Look for concrete lessons applied afterward — not "I learned to communicate better" but "I started weekly written status updates to the stakeholder."',
      evaluationCriteria: [
        'Owns the failure without blame-shifting',
        'Specific lessons, not platitudes',
        'Evidence lessons were applied',
      ],
      followUpQuestions: ["What would you change if you could do it again?", "Did anyone else see it coming?"],
    },
    {
      question: 'Tell me about a time you had to deliver under a very tight deadline. What did you do?',
      difficulty: 'medium',
      exampleAnswer:
        'Good signals: cutting scope deliberately (not just working harder), stakeholder communication about what would be dropped, protecting quality where it mattered most, and what the actual outcome was.',
      evaluationCriteria: [
        'Scope reduction, not just effort increase',
        'Communicated tradeoffs to stakeholders',
        'Protected quality where it mattered',
      ],
      followUpQuestions: ['What was cut, and was that the right call in hindsight?'],
    },
    {
      question: 'Tell me about a time you received difficult feedback. How did you respond?',
      difficulty: 'easy',
      exampleAnswer:
        'Specific feedback, not "I always welcome feedback." A real behavior change afterward, not just reflection. Self-awareness about whether the feedback was fair.',
      evaluationCriteria: [
        'Specific feedback cited',
        'Genuine behavioral change',
        'Self-aware',
      ],
      followUpQuestions: ['Did you agree with the feedback?', "What made it hard to hear?"],
    },
  ],
  leadership: [
    {
      question: 'How do you set technical direction for a team without becoming a bottleneck?',
      difficulty: 'hard',
      exampleAnswer:
        'Written design docs and RFCs, paved roads / golden path patterns, decision logs, time-boxed async reviews, delegating ownership rather than approval, mentoring people to make good decisions independently.',
      evaluationCriteria: [
        'Written artifacts over verbal direction',
        'Distributed decision-making',
        'Avoids being a gatekeeper',
      ],
      followUpQuestions: [
        'How do you handle it when a team member makes a call you disagree with?',
        'How do you onboard a new engineer quickly?',
      ],
    },
    {
      question: 'Tell me about a time you mentored someone through a hard technical problem.',
      difficulty: 'medium',
      exampleAnswer:
        'Active mentorship signals: pair programming, structured check-ins, gradual ownership handoff. Red flag: "I just answered their questions." Look for genuine investment in the other person\'s growth.',
      evaluationCriteria: [
        'Active mentorship, not passive availability',
        'Gradual ownership handoff',
        'Outcome for the mentee',
      ],
      followUpQuestions: ['What was the hardest part of mentoring them?', 'Would they say the same thing?'],
    },
    {
      question: 'Tell me about a time you had to advocate for a difficult engineering investment.',
      difficulty: 'hard',
      exampleAnswer:
        'Concrete investment (eval infra, paying down tech debt, migration). How they built the business case, who pushed back, how they handled it, and what the outcome was.',
      evaluationCriteria: [
        'Concrete investment, not vague',
        'Business case framing',
        'Managed pushback constructively',
      ],
      followUpQuestions: ["What would have happened if you hadn't pushed for it?"],
    },
  ],
  communication: [
    {
      question: 'How do you explain a complex technical decision to a non-technical stakeholder?',
      difficulty: 'easy',
      exampleAnswer:
        'Analogies anchored to business concerns (cost, risk, time), not jargon. Written summary up front, detail in appendix. Checking comprehension rather than just delivering.',
      evaluationCriteria: [
        'Uses audience-appropriate language',
        'Anchors to business impact',
        'Checks understanding',
      ],
      followUpQuestions: ['Walk me through an example. What was the decision and how did you explain it?'],
    },
    {
      question: 'Describe how you handle a stakeholder who keeps asking for features that conflict with your priorities.',
      difficulty: 'medium',
      exampleAnswer:
        'Empathy first — surface the underlying need. Share the opportunity cost, not just "no." Escalate transparently when needed. Involve them in prioritisation.',
      evaluationCriteria: [
        'Surfaces underlying need',
        'Shares cost of the request',
        'Transparent escalation path',
      ],
      followUpQuestions: ["Tell me about a time this didn't resolve cleanly."],
    },
    {
      question: 'How do you structure a design doc or technical RFC?',
      difficulty: 'easy',
      exampleAnswer:
        'Problem statement → options considered → decision → tradeoffs → risks → open questions. Audience awareness: executives get a TL;DR, engineers get the detail.',
      evaluationCriteria: [
        'Clear structure with problem first',
        'Explicitly states tradeoffs',
        'Audience-aware',
      ],
      followUpQuestions: ['Can you show or describe a real one you wrote?'],
    },
  ],
  'culture-fit': [
    {
      question: 'What kind of work environment helps you do your best work?',
      difficulty: 'easy',
      exampleAnswer:
        'Look for honesty and self-awareness. Red flag: "I work well in any environment." Good signal: specific preferences (async-first, direct feedback, ownership), and realistic assessment of what they need.',
      evaluationCriteria: [
        'Specific and honest',
        'Self-aware about preferences',
        'Realistic about what they need',
      ],
      followUpQuestions: ["What environment drains you?"],
    },
    {
      question: 'How do you stay current in the field without burning out?',
      difficulty: 'easy',
      exampleAnswer:
        'Concrete habits (weekly paper club, one newsletter, conference talks), sustainable cadence, taste-driven not hype-driven. Skeptical of "I read everything" answers.',
      evaluationCriteria: [
        'Concrete sustainable habits',
        'Selective, not reactive to hype',
        'Has clear signal-to-noise filter',
      ],
      followUpQuestions: ['What did you read or learn last week?'],
    },
    {
      question: "What do you want to be doing professionally in three years?",
      difficulty: 'easy',
      exampleAnswer:
        'Honest direction: IC depth, technical leadership, product ownership. Not "I just want to keep learning." Bonus if aligned with this role\'s growth path.',
      evaluationCriteria: [
        'Has a clear direction',
        'Honest rather than performative',
        'Potentially aligned with role',
      ],
      followUpQuestions: ["What would need to be true for you to get there?"],
    },
  ],
  'problem-solving': [
    {
      question: 'Walk me through how you approach a problem you have never seen before.',
      difficulty: 'medium',
      exampleAnswer:
        'Good signals: breaks the problem down before solving, confirms assumptions, explores solution space before committing, checks their solution, and knows when to ask for help.',
      evaluationCriteria: [
        'Breaks problem down systematically',
        'Validates assumptions explicitly',
        'Explores alternatives before committing',
        'Knows when to ask for help',
      ],
      followUpQuestions: ["Give me an example where this approach led you astray."],
    },
    {
      question: 'Tell me about the most complex technical problem you have solved.',
      difficulty: 'hard',
      exampleAnswer:
        'Specificity and depth. How did they scope it? What did they try that did not work? How did they know they had the right solution? Bonus: quantified impact.',
      evaluationCriteria: [
        'Genuinely complex, not a standard task',
        'Shows their personal contribution',
        'Learned from failures during the process',
        'Quantified the outcome',
      ],
      followUpQuestions: ['What would you do differently now?', 'How did others contribute?'],
    },
  ],
  'domain-knowledge': [
    {
      question: 'What recent development in this domain has changed how you approach your work?',
      difficulty: 'medium',
      exampleAnswer:
        'Genuine engagement with the field, not name-dropping. Should be able to explain why it matters and whether they have applied it or considered applying it.',
      evaluationCriteria: [
        'Specific and recent',
        'Can explain the significance',
        'Applied or considered applying it',
      ],
      followUpQuestions: ['What was the last thing you learned that changed your mind on something?'],
    },
    {
      question: 'Where do you see the biggest unsolved problems in this space?',
      difficulty: 'hard',
      exampleAnswer:
        'Opinions backed by experience. Not hype-cycle answers. Should be able to defend the opinion with technical reasoning.',
      evaluationCriteria: [
        'Has a genuine opinion',
        'Can defend with technical reasoning',
        'Not just echoing industry hype',
      ],
      followUpQuestions: ['What are you doing about it in your current work?'],
    },
  ],
};

// Adjust difficulty based on seniority
function adjustedQuestions(
  group: QuestionGroup,
  seniority: SeniorityLevel,
  count: number,
  startIdx: number
) {
  const pool = questionBank[group] || [];
  const difficultyPref: Record<SeniorityLevel, Array<'easy' | 'medium' | 'hard'>> = {
    junior: ['easy', 'medium'],
    intermediate: ['easy', 'medium', 'hard'],
    senior: ['medium', 'hard'],
    lead: ['hard', 'medium'],
  };
  const preferred = difficultyPref[seniority];
  const sorted = [...pool].sort((a, b) => {
    const ai = preferred.indexOf(a.difficulty);
    const bi = preferred.indexOf(b.difficulty);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  return sorted.slice(startIdx, startIdx + count);
}

// ─── Mock AI service implementation ──────────────────────────────────────────

export const mockAiService: AIService = {
  async generateQuestions(input) {
    // Simulate network latency
    await new Promise((r) => setTimeout(r, 1400 + Math.random() * 800));

    const questions: InterviewQuestion[] = [];

    for (const group of input.groups) {
      const templates = adjustedQuestions(group, input.seniority, input.questionsPerGroup, 0);
      for (const t of templates) {
        // Personalise the question to the job title
        const jobSuffix =
          t.question.includes('Walk me through') || t.question.includes('Describe')
            ? ''
            : '';
        questions.push({
          id: uuid(),
          group,
          question: t.question + jobSuffix,
          difficulty: t.difficulty,
          exampleAnswer: t.exampleAnswer,
          evaluationCriteria: t.evaluationCriteria,
          followUpQuestions: t.followUpQuestions,
          status: 'not-asked' as QuestionStatus,
          notes: '',
        });
      }
    }

    return questions;
  },

  async generateReport(input) {
    await new Promise((r) => setTimeout(r, 2000 + Math.random() * 1000));

    const { session } = input;
    const { questions, setup } = session;

    const statusCounts = questions.reduce<Record<string, number>>((acc, q) => {
      acc[q.status] = (acc[q.status] || 0) + 1;
      return acc;
    }, {});

    const goodCount = statusCounts['good'] || 0;
    const partialCount = statusCounts['partial'] || 0;
    const poorCount = statusCounts['poor'] || 0;
    const asked = goodCount + partialCount + poorCount + (statusCounts['asked'] || 0) + (statusCounts['follow-up'] || 0);
    const total = questions.length;
    const score = total > 0 ? (goodCount * 3 + partialCount * 1) / (total * 3) : 0;

    const recommendation: CandidateReport['recommendation'] =
      score >= 0.7 ? 'hire' :
      score >= 0.85 ? 'strong-hire' :
      score >= 0.45 ? 'maybe' : 'no-hire';

    const notesByGroup = questions
      .filter((q) => q.notes.trim())
      .map((q) => `${q.group}: ${q.notes.trim()}`);

    const goodQuestions = questions.filter((q) => q.status === 'good');
    const poorQuestions = questions.filter((q) => q.status === 'poor' || q.status === 'partial');

    return {
      sessionId: session.id,
      candidateSummary: `${setup.candidateName || 'The candidate'} was assessed for the ${setup.jobTitle} role at the ${setup.seniority} level. ${asked} of ${total} questions were covered across ${setup.selectedGroups.length} areas. Overall performance was ${score >= 0.7 ? 'strong' : score >= 0.45 ? 'mixed' : 'below expectations'}, with ${goodCount} strong answers, ${partialCount} partial answers, and ${poorCount} poor answers.`,
      technicalStrengths: goodQuestions.slice(0, 3).map(
        (q) => `Demonstrated strong understanding on: "${q.question.slice(0, 80)}…"`
      ),
      behaviouralStrengths: [
        goodCount > 2 ? 'Articulate and structured responses across multiple areas.' : '',
        notesByGroup[0] || '',
      ].filter(Boolean),
      concerns: poorQuestions.slice(0, 3).map(
        (q) => `Weak signal on: "${q.question.slice(0, 80)}…"`
      ),
      recommendedFollowUp: questions
        .filter((q) => q.status === 'follow-up' || q.followUpQuestions.length > 0)
        .flatMap((q) => q.followUpQuestions)
        .slice(0, 4),
      recommendation,
      generatedAt: new Date().toISOString(),
    };
  },
};
