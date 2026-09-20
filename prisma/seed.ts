import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/crypto";

const prisma = new PrismaClient();

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000);
}
function daysAhead(n: number) {
  return new Date(Date.now() + n * 86_400_000);
}

async function main() {
  console.log("🌱 Seeding Campus ProtoForge…");

  // Wipe in dependency order
  await prisma.activityEvent.deleteMany();
  await prisma.agentLog.deleteMany();
  await prisma.apiTestCase.deleteMany();
  await prisma.externalApi.deleteMany();
  await prisma.learningAsset.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.artefact.deleteMany();
  await prisma.agentToolState.deleteMany();
  await prisma.agentTool.deleteMany();
  await prisma.llmProvider.deleteMany();
  await prisma.agentConfig.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.prototypeTrack.deleteMany();
  await prisma.team.deleteMany();
  await prisma.challenge.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  // ---------------------------------------------------------------------
  // Departments
  // ---------------------------------------------------------------------
  const deptNames = [
    ["Computer Science", "CS"],
    ["Information Technology", "IT"],
    ["Electronics & Communication", "ECE"],
    ["Mechanical Engineering", "ME"],
    ["Business Administration", "MBA"],
    ["Design", "DES"],
  ] as const;
  for (const [name, code] of deptNames) {
    await prisma.department.create({ data: { name, code } });
  }

  // ---------------------------------------------------------------------
  // Users  (password for all: demo123)
  // ---------------------------------------------------------------------
  const pw = hashPassword("demo123");

  const admin = await prisma.user.create({
    data: { email: "admin@campus.edu", name: "Priya Raman", passwordHash: pw, role: "admin", department: "Computer Science", title: "Dean of Innovation", skills: JSON.stringify(["Strategy", "Accreditation"]) },
  });
  const facultyCS = await prisma.user.create({
    data: { email: "faculty@campus.edu", name: "Dr. Arjun Mehta", passwordHash: pw, role: "faculty", department: "Computer Science", title: "Prof.", skills: JSON.stringify(["Distributed Systems", "HCI", "Cloud"]), preferredStack: "Mentors capstone teams; CS302, CS405" },
  });
  const facultyECE = await prisma.user.create({
    data: { email: "faculty.ece@campus.edu", name: "Dr. Kavya Nair", passwordHash: pw, role: "faculty", department: "Electronics & Communication", title: "Dr.", skills: JSON.stringify(["IoT", "Embedded", "Signal Processing"]) },
  });
  const stu1 = await prisma.user.create({
    data: { email: "student@campus.edu", name: "Rahul Verma", passwordHash: pw, role: "student", department: "Computer Science", year: 3, skills: JSON.stringify(["React", "Node.js", "REST APIs", "MongoDB"]), preferredStack: "Next.js + Postgres" },
  });
  const stu2 = await prisma.user.create({
    data: { email: "sneha@campus.edu", name: "Sneha Iyer", passwordHash: pw, role: "student", department: "Information Technology", year: 2, skills: JSON.stringify(["Python", "Flask", "Pandas", "Charts"]), preferredStack: "FastAPI + SQLite" },
  });
  const stu3 = await prisma.user.create({
    data: { email: "vikram@campus.edu", name: "Vikram Shah", passwordHash: pw, role: "student", department: "Computer Science", year: 4, skills: JSON.stringify(["TypeScript", "React Native", "WebSockets", "Docker"]), preferredStack: "T3 stack" },
  });
  const stu4 = await prisma.user.create({
    data: { email: "meera@campus.edu", name: "Meera Krishnan", passwordHash: pw, role: "student", department: "Design", year: 3, skills: JSON.stringify(["Figma", "Design Systems", "User Research"]), preferredStack: "Figma + Framer" },
  });
  const stu5 = await prisma.user.create({
    data: { email: "zoya@campus.edu", name: "Zoya Khan", passwordHash: pw, role: "student", department: "Electronics & Communication", year: 3, skills: JSON.stringify(["Arduino", "MQTT", "C++", "Sensors"]), preferredStack: "ESP32 + Node-RED" },
  });

  // ---------------------------------------------------------------------
  // Challenge 1 — Weather + maps (student idea, full pipeline, healthy team)
  // ---------------------------------------------------------------------
  const ch1 = await prisma.challenge.create({
    data: {
      title: "Rain-or-Roam: weather-aware campus route planner",
      rawDescription:
        "Students walking between classes get caught in rain because they don't know which covered walkways or shuttles exist. Build an app that combines live weather data with campus map routes to suggest the driest (or fastest) path between two buildings. It should warn about heavy rain in the next 30 minutes and suggest covered alternatives. Ideally it feels like Google Maps but optimised for staying dry on campus.",
      domainTags: JSON.stringify(["Weather API", "Maps", "React", "Routing"]),
      courseTag: "CS302 — Human-Computer Interaction",
      department: "Computer Science",
      difficulty: "intermediate",
      expectedImpact: "Cut rain-soaked walks for 4,000+ students; a campus pilot before monsoon season.",
      kind: "student_idea",
      status: "in_progress",
      briefStatus: "approved",
      ownerId: stu1.id,
      structuredBrief: JSON.stringify({
        problemStatement:
          "Students frequently walk between campus buildings without knowing when rain will start or which routes stay covered, resulting in soaked commutes and missed classes.",
        contextMotivation:
          "Campus sprawl means 5–12 minute walks between buildings. Weather turns fast during monsoon months, and students have no tool that combines hyperlocal rain timing with knowledge of covered walkways, shuttle timings, and building shortcuts.",
        constraintsAssumptions: [
          "Assume campus has mapped building coordinates and a list of covered walkways (provided as JSON).",
          "Weather data comes from a public API updated at most every 10 minutes.",
          "Mobile-first web app; no native store distribution needed for MVP.",
        ],
        expectedLearners: { year: "2nd–4th year undergraduates", skills: ["React", "REST APIs", "Basic graph routing", "Map libraries"] },
        successMetrics: [
          "A route from any building A to B renders in under 2 seconds.",
          "Rain-warning shown for next 30 minutes with ≥70% accuracy vs actual rain during a 2-week trial.",
          "5+ students successfully use it to plan a dry route in pilot testing.",
        ],
        evaluationHints: ["Quality of route logic vs naive shortest path", "Graceful handling of weather API failures", "Clarity of the 'dryness' explanation to the user"],
      }),
    },
  });

  // Track for ch1
  const track1 = await prisma.prototypeTrack.create({
    data: {
      challengeId: ch1.id,
      level: "intermediate",
      skillTags: JSON.stringify(["React", "Maps", "Weather API", "Routing"]),
      syllabusLinks: JSON.stringify([{ label: "CS302 syllabus — unit on location-aware apps", url: "https://example.edu/cs302" }]),
      createdByAgent: true,
      milestones: {
        create: [
          {
            orderIndex: 0,
            title: "Discover & Clarify the Problem",
            description: "Interview 3 students about rainy-day routes, map the covered walkways, define what 'driest path' means.",
            checklistItems: JSON.stringify([
              { label: "Interview 3+ students about rainy-day pain", done: true },
              { label: "List covered walkways as JSON data", done: true },
              { label: "Define dryness score formula", done: true },
              { label: "Pick map + weather APIs", done: true },
            ]),
            dueDate: daysAgo(21),
            status: "done",
            aiSuggestions: JSON.stringify([
              "Google Maps Platform: https://developers.google.com/maps/documentation",
              "OpenWeather API: https://openweathermap.org/api",
            ]),
          },
          {
            orderIndex: 1,
            title: "Plan the Architecture",
            description: "Choose graph model for walkways, define API contract, register external APIs in the API Lab.",
            checklistItems: JSON.stringify([
              { label: "Graph model: nodes = building exits, edges = walkway segments", done: true },
              { label: "Register weather + maps APIs in API Lab", done: true },
              { label: "Sketch system diagram (Next.js + route service)", done: true },
              { label: "Write build plan split across team", done: false },
            ]),
            dueDate: daysAgo(14),
            status: "done",
            aiSuggestions: JSON.stringify(["Dijkstra refresher: https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm"]),
          },
          {
            orderIndex: 2,
            title: "Build the First MVP",
            description: "End-to-end: pick two buildings, show route + rain overlay. One API fully wired with error handling.",
            checklistItems: JSON.stringify([
              { label: "Minimal map view with building pins", done: true },
              { label: "Route calculation between two buildings", done: true },
              { label: "Weather call with 10s timeout + fallback", done: true },
              { label: "Deploy nightly build for team demos", done: false },
            ]),
            dueDate: daysAhead(3),
            status: "in_progress",
            aiSuggestions: JSON.stringify(["Keep the weather client isolated in one module so you can swap providers; cache responses for 10 minutes."]),
          },
          {
            orderIndex: 3,
            title: "Refine & Test",
            description: "Usability session with 3 students, fix top issues, add offline fallback for weather downtime.",
            checklistItems: JSON.stringify([
              { label: "Run 1 usability session", done: false },
              { label: "Handle API failure with cached routes", done: false },
            ]),
            dueDate: daysAhead(17),
            status: "todo",
            aiSuggestions: JSON.stringify([]),
          },
          {
            orderIndex: 4,
            title: "Demo & Documentation",
            description: "2–3 min demo video, README with setup, run Docs & Pitch agent and edit output.",
            checklistItems: JSON.stringify([
              { label: "Record demo video", done: false },
              { label: "Final README", done: false },
            ]),
            dueDate: daysAhead(31),
            status: "todo",
            aiSuggestions: JSON.stringify([]),
          },
        ],
      },
    },
  });

  const team1 = await prisma.team.create({
    data: {
      name: "Dry Runners",
      challengeId: ch1.id,
      prototypeTrackId: track1.id,
      mentorId: facultyCS.id,
      notes: "Weather API key from Rahul's account. Weekly sync Fridays 5pm.",
      lastActivityAt: daysAgo(1),
      members: { create: [{ userId: stu1.id, role: "lead" }, { userId: stu4.id, role: "member" }] },
    },
  });

  await prisma.artefact.createMany({
    data: [
      { teamId: team1.id, milestoneId: null, type: "code_repo", url: "https://github.com/campus-dry-runners/rain-or-roam", shortDescription: "MVP repo — map view + routing", uploaderId: stu1.id, createdAt: daysAgo(6) },
      { teamId: team1.id, milestoneId: null, type: "doc", url: "https://docs.google.com/document/d/dry-runners-research", shortDescription: "Student interview notes (3 interviews)", uploaderId: stu4.id, createdAt: daysAgo(10) },
      { teamId: team1.id, milestoneId: null, type: "slide", url: "https://slides.com/dry-runners/architecture", shortDescription: "Architecture sketch deck", uploaderId: stu1.id, createdAt: daysAgo(12) },
    ],
  });

  await prisma.feedback.create({
    data: {
      teamId: team1.id,
      milestoneId: null,
      facultyId: facultyCS.id,
      rubricScores: JSON.stringify([
        { name: "Problem clarity", maxScore: 10, score: 9 },
        { name: "Technical depth", maxScore: 25, score: 18 },
        { name: "Prototype completeness", maxScore: 25, score: 16 },
        { name: "Use of APIs / integrations", maxScore: 15, score: 10 },
        { name: "Documentation & pitch", maxScore: 15, score: null },
        { name: "Teamwork & process", maxScore: 10, score: 8 },
      ]),
      comments: "Strong start — the dryness-score idea is genuinely novel. Document the formula. Demo video pending before I can score documentation.",
      finalised: false,
      createdAt: daysAgo(4),
    },
  });

  // Team 1 external APIs (published + approved)
  const weatherApi = await prisma.externalApi.create({
    data: {
      teamId: team1.id,
      name: "OpenWeather One Call",
      baseUrl: "https://api.openweathermap.org/data/2.5",
      description: "Live weather + precipitation forecast used for the 30-minute rain warning.",
      authType: "api_key",
      authConfig: JSON.stringify({ headerName: "x-api-key", note: "Key stored in team .env, not in code" }),
      exampleEndpoints: JSON.stringify([
        { method: "GET", path: "/weather?q=Chennai&units=metric", description: "Current conditions for campus city" },
        { method: "GET", path: "/forecast?q=Chennai&units=metric", description: "3-hour-step forecast for rain timing" },
      ]),
      category: "utilities",
      tags: JSON.stringify(["weather", "maps", "routing"]),
      docsUrl: "https://openweathermap.org/api",
      isPublishedToRegistry: true,
      registryStatus: "approved",
      reviewedBy: facultyCS.id,
      reviewNote: "Useful campus-wide; approved for registry.",
      usageCount: 14,
      createdAt: daysAgo(20),
    },
  });
  await prisma.apiTestCase.createMany({
    data: [
      { apiId: weatherApi.id, teamId: team1.id, name: "GET /weather?q=Chennai", method: "GET", path: "https://api.openweathermap.org/data/2.5/weather?q=Chennai&units=metric", expectedStatus: 200, lastStatus: 200, lastDurationMs: 340, lastRunAt: daysAgo(1), consecutiveFailures: 0, lastResponse: '{"weather":[{"main":"Clouds"}],"main":{"temp":29}}' },
      { apiId: weatherApi.id, teamId: team1.id, name: "GET /forecast?q=Chennai", method: "GET", path: "https://api.openweathermap.org/data/2.5/forecast?q=Chennai&units=metric", expectedStatus: 200, lastStatus: 200, lastDurationMs: 410, lastRunAt: daysAgo(1), consecutiveFailures: 0 },
    ],
  });

  // ---------------------------------------------------------------------
  // Challenge 2 — Sports analytics (faculty course challenge, at-risk team)
  // ---------------------------------------------------------------------
  const ch2 = await prisma.challenge.create({
    data: {
      title: "Campus Sports Analytics Dashboard",
      rawDescription:
        "Our sports department tracks matches in spreadsheets and nobody can answer simple questions like 'which hostel team improved most this semester'. Build a dashboard that ingests match results (from our mock sports data API), shows team performance trends, and lets the sports secretary publish a weekly highlights page. Stretch: prediction of match outcomes from past form.",
      domainTags: JSON.stringify(["Sports API", "Analytics", "Charts", "Python"]),
      courseTag: "CS415 — Data Visualization",
      department: "Computer Science",
      difficulty: "beginner",
      expectedImpact: "Replace 6 spreadsheet reports with a live dashboard used by the sports office.",
      kind: "official_course",
      status: "in_progress",
      briefStatus: "approved",
      ownerId: facultyCS.id,
      structuredBrief: JSON.stringify({
        problemStatement: "Match data lives in spreadsheets, so trends and improvement stories are invisible to the sports office and students.",
        contextMotivation: "Inter-hostel leagues generate 100+ matches a semester across 5 sports. A live dashboard would make performance visible and increase participation.",
        constraintsAssumptions: [
          "A mock sports data API serves matches, teams, and players as JSON.",
          "Read-only for MVP; admin entry forms are a stretch goal.",
          "Charts must work on the sports office's aging desktop browser.",
        ],
        expectedLearners: { year: "1st–2nd year undergraduates", skills: ["Basic Python or JavaScript", "Charts", "REST consumption"] },
        successMetrics: ["Dashboard loads all semester matches in under 3 seconds", "Weekly highlights page generated with one click", "Sports office uses it for at least 2 weekly reports"],
        evaluationHints: ["Clarity of charts for non-technical users", "Correct aggregation of wins/points", "Handling of missing match data"],
      }),
    },
  });

  const track2 = await prisma.prototypeTrack.create({
    data: {
      challengeId: ch2.id,
      level: "beginner",
      skillTags: JSON.stringify(["Charts", "REST", "Python"]),
      syllabusLinks: JSON.stringify([]),
      createdByAgent: true,
      milestones: {
        create: [
          { orderIndex: 0, title: "Discover & Clarify the Problem", description: "Meet the sports secretary, list the 5 questions the dashboard must answer.", checklistItems: JSON.stringify([{ label: "Interview sports secretary", done: true }, { label: "List top-5 questions", done: true }]), dueDate: daysAgo(28), status: "done", aiSuggestions: JSON.stringify([]) },
          { orderIndex: 1, title: "Plan the Architecture", description: "Pick chart library, register the sports API, define the data refresh approach.", checklistItems: JSON.stringify([{ label: "Register sports API in API Lab", done: true }, { label: "Choose chart library", done: true }]), dueDate: daysAgo(21), status: "done", aiSuggestions: JSON.stringify([]) },
          { orderIndex: 2, title: "Build the First MVP", description: "One page: standings table + wins-over-time line chart from the live API.", checklistItems: JSON.stringify([{ label: "Standings table", done: false }, { label: "Wins-over-time chart", done: false }]), dueDate: daysAgo(2), status: "in_progress", aiSuggestions: JSON.stringify([]) },
          { orderIndex: 3, title: "Refine & Test", description: "Test with sports office; handle API outages gracefully.", checklistItems: JSON.stringify([{ label: "Offline fallback for API", done: false }]), dueDate: daysAhead(10), status: "todo", aiSuggestions: JSON.stringify([]) },
          { orderIndex: 4, title: "Demo & Documentation", description: "Demo video + README.", checklistItems: JSON.stringify([{ label: "Demo video", done: false }]), dueDate: daysAhead(24), status: "todo", aiSuggestions: JSON.stringify([]) },
        ],
      },
    },
  });

  const team2 = await prisma.team.create({
    data: {
      name: "Stat Squad",
      challengeId: ch2.id,
      prototypeTrackId: track2.id,
      mentorId: facultyCS.id,
      notes: "",
      lastActivityAt: daysAgo(9),
      members: { create: [{ userId: stu2.id, role: "lead" }] },
    },
  });

  await prisma.artefact.create({
    data: { teamId: team2.id, type: "doc", url: "https://docs.google.com/document/d/stat-squad-questions", shortDescription: "Top-5 dashboard questions from sports secretary", uploaderId: stu2.id, createdAt: daysAgo(9) },
  });

  const sportsApi = await prisma.externalApi.create({
    data: {
      teamId: team2.id,
      name: "Campus Sports Mock API",
      baseUrl: "https://sportsdata.example-campus.dev/api",
      description: "Mock API seeded with 3 semesters of inter-hostel match results, teams, and players.",
      authType: "none",
      authConfig: JSON.stringify({}),
      exampleEndpoints: JSON.stringify([
        { method: "GET", path: "/v1/matches?season=2026", description: "All matches in a season" },
        { method: "GET", path: "/v1/teams", description: "Hostel teams with rosters" },
        { method: "GET", path: "/v1/standings?sport=cricket", description: "Computed standings" },
      ]),
      category: "sports",
      tags: JSON.stringify(["sports", "analytics"]),
      repoUrl: "https://github.com/campus-labs/sports-mock-api",
      isPublishedToRegistry: true,
      registryStatus: "pending",
      usageCount: 7,
      createdAt: daysAgo(15),
    },
  });
  await prisma.apiTestCase.createMany({
    data: [
      { apiId: sportsApi.id, teamId: team2.id, name: "GET /v1/matches?season=2026", method: "GET", path: "https://sportsdata.example-campus.dev/api/v1/matches?season=2026", expectedStatus: 200, lastStatus: 503, lastRunAt: daysAgo(2), consecutiveFailures: 3, lastResponse: "Service Unavailable" },
      { apiId: sportsApi.id, teamId: team2.id, name: "GET /v1/teams", method: "GET", path: "https://sportsdata.example-campus.dev/api/v1/teams", expectedStatus: 200, lastStatus: 200, lastDurationMs: 120, lastRunAt: daysAgo(3), consecutiveFailures: 0 },
    ],
  });

  // ---------------------------------------------------------------------
  // Challenge 3 — EdTech analytics (faculty, team forming, pending brief)
  // ---------------------------------------------------------------------
  const ch3 = await prisma.challenge.create({
    data: {
      title: "Early-warning attendance & grades radar for mentors",
      rawDescription:
        "Mentors meet 20 students each but only find out about slipping attendance or grades after it's too late. Using our mock student-data APIs (attendance, assignment scores), build a radar that flags students trending toward risk two weeks early and suggests one concrete action per flagged student, e.g. 'missed 3 consecutive labs — schedule a check-in'. Privacy matters: mentors see only their own mentees.",
      domainTags: JSON.stringify(["EdTech", "Analytics", "Privacy", "Dashboards"]),
      courseTag: "CS405 — Software Engineering",
      department: "Information Technology",
      difficulty: "advanced",
      expectedImpact: "Mentors intervene 2 weeks earlier; measurable attendance improvement for flagged students.",
      kind: "official_course",
      status: "open",
      briefStatus: "ai_draft",
      ownerId: facultyCS.id,
      structuredBrief: null, // deliberately unstructured — showcase the agent
    },
  });

  const track3 = await prisma.prototypeTrack.create({
    data: {
      challengeId: ch3.id,
      level: "advanced",
      skillTags: JSON.stringify(["Analytics", "Auth", "Dashboards", "Privacy"]),
      syllabusLinks: JSON.stringify([]),
      createdByAgent: true,
      milestones: {
        create: [
          { orderIndex: 0, title: "Discover & Clarify the Problem", description: "Define 'at-risk' thresholds with 2 mentors; map privacy requirements.", checklistItems: JSON.stringify([{ label: "Define risk thresholds", done: false }, { label: "Privacy data-flow sketch", done: false }]), dueDate: daysAhead(7), status: "todo", aiSuggestions: JSON.stringify([]) },
          { orderIndex: 1, title: "Plan the Architecture", description: "Auth model for mentor-scoped data; register student-data API.", checklistItems: JSON.stringify([{ label: "Mentor-scoped auth design", done: false }, { label: "Register APIs", done: false }]), dueDate: daysAhead(21), status: "todo", aiSuggestions: JSON.stringify([]) },
          { orderIndex: 2, title: "Build the First MVP", description: "Radar list for one mentor with 3 signals.", checklistItems: JSON.stringify([{ label: "Radar list view", done: false }]), dueDate: daysAhead(35), status: "todo", aiSuggestions: JSON.stringify([]) },
          { orderIndex: 3, title: "Refine & Test", description: "Backtest risk flags against last semester's data.", checklistItems: JSON.stringify([{ label: "Backtest vs last semester", done: false }]), dueDate: daysAhead(49), status: "todo", aiSuggestions: JSON.stringify([]) },
          { orderIndex: 4, title: "Demo & Documentation", description: "Mentor-facing demo + privacy notes.", checklistItems: JSON.stringify([{ label: "Demo", done: false }]), dueDate: daysAhead(63), status: "todo", aiSuggestions: JSON.stringify([]) },
        ],
      },
    },
  });

  const edtechApi = await prisma.externalApi.create({
    data: {
      teamId: null,
      name: "Campus Student-Data Mock API",
      baseUrl: "https://edtech.example-campus.dev/api",
      description: "Mock attendance, assignment, and grade APIs with mentor-scoped access tokens for capstone projects.",
      authType: "bearer",
      authConfig: JSON.stringify({ note: "Request a scoped token from the course instructor" }),
      exampleEndpoints: JSON.stringify([
        { method: "GET", path: "/v1/attendance?student={id}", description: "Attendance ledger for a student" },
        { method: "GET", path: "/v1/scores?course={id}", description: "Assignment scores for a course" },
        { method: "GET", path: "/v1/mentees?mentor={id}", description: "Mentor-scoped student list" },
      ]),
      category: "edtech",
      tags: JSON.stringify(["edtech", "analytics", "privacy"]),
      isPublishedToRegistry: true,
      registryStatus: "approved",
      reviewedBy: admin.id,
      reviewNote: "Central mock service for capstones; approved.",
      usageCount: 22,
      createdAt: daysAgo(40),
    },
  });

  // ---------------------------------------------------------------------
  // Challenge 4 — IoT (lab challenge, completed → learning asset)
  // ---------------------------------------------------------------------
  const ch4 = await prisma.challenge.create({
    data: {
      title: "Smart Lab Occupancy & Air-Quality Monitor",
      rawDescription:
        "Labs are either empty with AC blasting or overcrowded with CO2 buildup. Build ESP32 sensor nodes that publish occupancy + CO2 over MQTT to a dashboard showing which lab to walk to, plus a weekly utilisation report for the lab-in-charge.",
      domainTags: JSON.stringify(["IoT", "MQTT", "Dashboards", "ESP32"]),
      department: "Electronics & Communication",
      difficulty: "advanced",
      expectedImpact: "Save ~15% lab energy; pick the right lab from your phone.",
      kind: "lab",
      status: "completed",
      briefStatus: "approved",
      ownerId: facultyECE.id,
      structuredBrief: JSON.stringify({
        problemStatement: "Lab space and energy are wasted because occupancy and air quality are invisible in real time.",
        contextMotivation: "12 shared labs, no utilisation data, complaints about stuffy rooms during peak hours.",
        constraintsAssumptions: ["ESP32 + CO2 sensor nodes publish over MQTT", "Dashboard is a web app", "Privacy: no cameras, presence via PIR only"],
        expectedLearners: { year: "3rd–4th year", skills: ["Embedded C", "MQTT", "Web dashboards"] },
        successMetrics: ["Dashboard reflects lab state within 30 seconds", "Weekly report auto-generated", "2 labs piloted for 4 weeks"],
        evaluationHints: ["Sensor data reliability", "Dashboard usability", "Energy-saving evidence"],
      }),
    },
  });

  const track4 = await prisma.prototypeTrack.create({
    data: {
      challengeId: ch4.id,
      level: "advanced",
      skillTags: JSON.stringify(["IoT", "MQTT", "Dashboards"]),
      syllabusLinks: JSON.stringify([]),
      createdByAgent: true,
      milestones: {
        create: [
          { orderIndex: 0, title: "Discover & Clarify the Problem", description: "Sensor placement survey and requirements.", checklistItems: JSON.stringify([{ label: "Survey 3 labs", done: true }]), dueDate: daysAgo(80), status: "done", aiSuggestions: JSON.stringify([]) },
          { orderIndex: 1, title: "Plan the Architecture", description: "MQTT topic design + dashboard schema.", checklistItems: JSON.stringify([{ label: "Topic map", done: true }]), dueDate: daysAgo(66), status: "done", aiSuggestions: JSON.stringify([]) },
          { orderIndex: 2, title: "Build the First MVP", description: "One sensor node + live dashboard.", checklistItems: JSON.stringify([{ label: "Node firmware", done: true }, { label: "Dashboard", done: true }]), dueDate: daysAgo(52), status: "done", aiSuggestions: JSON.stringify([]) },
          { orderIndex: 3, title: "Refine & Test", description: "3 nodes, calibration, dropped-packet handling.", checklistItems: JSON.stringify([{ label: "Calibrate CO2", done: true }]), dueDate: daysAgo(38), status: "done", aiSuggestions: JSON.stringify([]) },
          { orderIndex: 4, title: "Demo & Documentation", description: "Final demo to lab-in-charge + handover doc.", checklistItems: JSON.stringify([{ label: "Handover doc", done: true }]), dueDate: daysAgo(24), status: "done", aiSuggestions: JSON.stringify([]) },
        ],
      },
    },
  });

  const team4 = await prisma.team.create({
    data: {
      name: "AirSpace IoT",
      challengeId: ch4.id,
      prototypeTrackId: track4.id,
      mentorId: facultyECE.id,
      notes: "Graduated to the Learning Library after final review.",
      lastActivityAt: daysAgo(24),
      members: { create: [{ userId: stu5.id, role: "lead" }, { userId: stu3.id, role: "member" }] },
    },
  });

  await prisma.artefact.createMany({
    data: [
      { teamId: team4.id, type: "code_repo", url: "https://github.com/airspace-iot/lab-monitor", shortDescription: "Firmware + dashboard monorepo", uploaderId: stu5.id, createdAt: daysAgo(30) },
      { teamId: team4.id, type: "demo_video", url: "https://youtube.com/watch?v=airspace-demo", shortDescription: "Final 2-min demo video", uploaderId: stu3.id, createdAt: daysAgo(25) },
    ],
  });

  await prisma.feedback.create({
    data: {
      teamId: team4.id,
      facultyId: facultyECE.id,
      rubricScores: JSON.stringify([
        { name: "Problem clarity", maxScore: 10, score: 9 },
        { name: "Technical depth", maxScore: 25, score: 22 },
        { name: "Prototype completeness", maxScore: 25, score: 23 },
        { name: "Use of APIs / integrations", maxScore: 15, score: 12 },
        { name: "Documentation & pitch", maxScore: 15, score: 13 },
        { name: "Teamwork & process", maxScore: 10, score: 9 },
      ]),
      comments: "Outstanding work. Calibration logs were thorough. Approved for the Learning Assets Library — future ECE batches will use this as reference architecture.",
      finalised: true,
      createdAt: daysAgo(23),
    },
  });

  await prisma.learningAsset.create({
    data: {
      teamId: team4.id,
      challengeId: ch4.id,
      title: "AirSpace IoT — Lab occupancy & air-quality monitoring reference build",
      summary:
        "A complete ESP32 + MQTT + web-dashboard build that any campus can replicate: 12 labs instrumented, 30s latency, weekly utilisation reports. Includes calibration notes and a privacy-first presence design.",
      tags: JSON.stringify(["IoT", "MQTT", "Dashboards", "advanced"]),
      publishedBy: facultyECE.id,
      createdAt: daysAgo(22),
    },
  });

  // ---------------------------------------------------------------------
  // Agent tool registry + default configs
  // ---------------------------------------------------------------------
  await prisma.agentTool.createMany({
    data: [
      { name: "read_challenge_brief", description: "Reads a challenge's structured brief and raw description.", schemaJson: JSON.stringify({ challengeId: "string" }) },
      { name: "read_team_milestones", description: "Reads a team's milestones with status and checklists.", schemaJson: JSON.stringify({ teamId: "string" }) },
      { name: "list_team_apis", description: "Lists ExternalApi registrations for a team, with endpoints and auth type.", schemaJson: JSON.stringify({ teamId: "string" }) },
      { name: "read_api_test_results", description: "Reads API Lab test results to assess integration health.", schemaJson: JSON.stringify({ teamId: "string" }) },
      { name: "suggest_integration", description: "Produces a concrete integration idea for a registered API.", schemaJson: JSON.stringify({ apiId: "string", goal: "string" }) },
    ],
  });
  for (const tool of await prisma.agentTool.findMany()) {
    for (const team of [team1, team2]) {
      await prisma.agentToolState.create({ data: { teamId: team.id, toolId: tool.id, enabled: true } });
    }
  }

  await prisma.agentConfig.createMany({
    data: [
      { agentName: "Idea Structurer", maxAutonomy: "act_with_review" },
      { agentName: "Track Generator", maxAutonomy: "act_with_review" },
      { agentName: "Prototype Coach", maxAutonomy: "suggest" },
      { agentName: "Feedback Agent", maxAutonomy: "suggest" },
      { agentName: "Docs & Pitch", maxAutonomy: "act_with_review" },
      { agentName: "Retention Radar", maxAutonomy: "suggest" },
    ],
  });

  // ---------------------------------------------------------------------
  // Agent logs + activity for a lively stream
  // ---------------------------------------------------------------------
  await prisma.agentLog.createMany({
    data: [
      { agentName: "Idea Structurer", actionType: "structured_brief_heuristic", relatedEntityType: "challenge", relatedEntityId: ch1.id, payload: JSON.stringify({ engine: "heuristic" }), createdAt: daysAgo(30) },
      { agentName: "Track Generator", actionType: "track_generated_heuristic", relatedEntityType: "challenge", relatedEntityId: ch1.id, payload: JSON.stringify({ engine: "heuristic" }), createdAt: daysAgo(29) },
      { agentName: "Prototype Coach", actionType: "coach_guidance", relatedEntityType: "team", relatedEntityId: team1.id, payload: JSON.stringify({ engine: "heuristic" }), createdAt: daysAgo(2) },
      { agentName: "Feedback Agent", actionType: "feedback_draft_created", relatedEntityType: "team", relatedEntityId: team1.id, payload: JSON.stringify({ engine: "heuristic" }), createdAt: daysAgo(4) },
      { agentName: "Docs & Pitch", actionType: "pitch_docs_generated", relatedEntityType: "team", relatedEntityId: team4.id, payload: JSON.stringify({ engine: "heuristic" }), createdAt: daysAgo(25) },
      { agentName: "Retention Radar", actionType: "retention_scan", relatedEntityType: "system", relatedEntityId: "platform", payload: JSON.stringify({ atRiskCount: 1, healthy: 2 }), createdAt: daysAgo(1) },
    ],
  });

  await prisma.activityEvent.createMany({
    data: [
      { teamId: team1.id, challengeId: ch1.id, actorName: "Rahul Verma", action: "artefact.upload", summary: "code repo added: MVP repo — map view + routing", createdAt: daysAgo(6) },
      { teamId: team1.id, challengeId: ch1.id, actorName: "Prototype Coach", action: "agent.action", summary: "Prototype Coach: coach_guidance", createdAt: daysAgo(2) },
      { teamId: team1.id, challengeId: ch1.id, actorName: "Rahul Verma", action: "api.test", summary: "GET https://api.openweathermap.org/data/2.5/weather → 200 (340ms) ✓", createdAt: daysAgo(1) },
      { teamId: team2.id, challengeId: ch2.id, actorName: "Sneha Iyer", action: "api.test", summary: "GET /v1/matches → 503 (timeout) ✗", createdAt: daysAgo(2) },
      { teamId: team2.id, challengeId: ch2.id, actorName: "Sneha Iyer", action: "artefact.upload", summary: "doc added: Top-5 dashboard questions", createdAt: daysAgo(9) },
      { challengeId: ch3.id, actorName: "Dr. Arjun Mehta", action: "challenge.create", summary: "New challenge: Early-warning attendance & grades radar for mentors", createdAt: daysAgo(12) },
      { teamId: team4.id, challengeId: ch4.id, actorName: "Dr. Kavya Nair", action: "asset.publish", summary: "Learning asset published: AirSpace IoT reference build", createdAt: daysAgo(22) },
      { challengeId: ch1.id, actorName: "Dr. Arjun Mehta", action: "registry.review", summary: "Approved \"OpenWeather One Call\" for the campus API Registry", createdAt: daysAgo(19) },
    ],
  });

  console.log("✅ Seed complete.");
  console.log("   Demo logins (password: demo123):");
  console.log("   • student@campus.edu  (Rahul — Dry Runners team)");
  console.log("   • faculty@campus.edu  (Dr. Arjun Mehta)");
  console.log("   • admin@campus.edu    (Priya Raman)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
