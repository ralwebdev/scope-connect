// Mock data for Scope Connect — Phase 1 frontend-only build.
// Replace with real backend calls when Lovable Cloud is enabled.

export const campusPartners = [
  { name: "IIT Bombay", city: "Mumbai", members: 842 },
  { name: "BITS Pilani", city: "Pilani", members: 654 },
  { name: "VIT Vellore", city: "Vellore", members: 591 },
  { name: "NIT Trichy", city: "Trichy", members: 478 },
  { name: "IIIT Hyderabad", city: "Hyderabad", members: 433 },
  { name: "Manipal University", city: "Manipal", members: 402 },
  { name: "DTU Delhi", city: "New Delhi", members: 388 },
  { name: "SRM University", city: "Chennai", members: 365 },
];

export const liveMetrics = [
  { label: "Campus Partners", value: "142+", change: "+18 this month" },
  { label: "Active Members", value: "12,480", change: "+1.2k this week" },
  { label: "Projects Shipped", value: "3,210", change: "+86 today" },
  { label: "Cities", value: "68", change: "across India" },
];

export const topChapters = [
  { name: "AI Builders Mumbai", campus: "IIT Bombay", members: 142, rank: 1, growth: "+24%" },
  { name: "Startup Sprint BITS", campus: "BITS Pilani", members: 128, rank: 2, growth: "+19%" },
  { name: "Design Lab Vellore", campus: "VIT Vellore", members: 116, rank: 3, growth: "+15%" },
  { name: "RoboTrichy", campus: "NIT Trichy", members: 98, rank: 4, growth: "+12%" },
  { name: "ContentCo Hyderabad", campus: "IIIT Hyderabad", members: 87, rank: 5, growth: "+11%" },
];

export const topBuilders = [
  { name: "Aarav Mehta", campus: "IIT Bombay", level: "Innovator", points: 4820, badge: "🏆" },
  { name: "Diya Sharma", campus: "BITS Pilani", level: "Leader", points: 4560, badge: "⚡" },
  { name: "Kabir Singh", campus: "VIT Vellore", level: "Builder", points: 4210, badge: "🚀" },
  { name: "Ananya Iyer", campus: "IIIT Hyderabad", level: "Innovator", points: 3980, badge: "💡" },
  { name: "Rohan Das", campus: "NIT Trichy", level: "Builder", points: 3740, badge: "🔥" },
  { name: "Meera Nair", campus: "Manipal", level: "Ambassador", points: 3620, badge: "🌟" },
];

export const featuredProjects = [
  {
    title: "MediMatch AI",
    description: "AI-powered symptom triage matching patients to specialists in <30s.",
    category: "AI",
    team: "AI Builders Mumbai",
    votes: 482,
    cover: "🩺",
  },
  {
    title: "CampusDAO",
    description: "Decentralized treasury & voting platform for student societies.",
    category: "Web",
    team: "Startup Sprint BITS",
    votes: 391,
    cover: "🏛️",
  },
  {
    title: "InkFlow",
    description: "Notion-grade design tool built for student creators.",
    category: "Design",
    team: "Design Lab Vellore",
    votes: 356,
    cover: "🎨",
  },
  {
    title: "Sprintly",
    description: "Hackathon-in-a-box: form teams, ship MVPs, present in 48h.",
    category: "Startup",
    team: "ContentCo Hyderabad",
    votes: 312,
    cover: "⚡",
  },
  {
    title: "SwarmBots",
    description: "Open-source swarm robotics framework for under-graduate research.",
    category: "Robotics",
    team: "RoboTrichy",
    votes: 287,
    cover: "🤖",
  },
  {
    title: "PitchCanvas",
    description: "AI co-pilot that turns 1-line ideas into investor-ready decks.",
    category: "AI",
    team: "Builders Delhi",
    votes: 264,
    cover: "📊",
  },
];

export const upcomingEvents = [
  {
    title: "Scope Hack '26",
    type: "Hackathon",
    date: "May 15–17",
    venue: "Pan-India · Hybrid",
    seats: 2400,
    color: "brand",
  },
  {
    title: "AI Founders Sprint",
    type: "Sprint",
    date: "Apr 28",
    venue: "Bengaluru",
    seats: 180,
    color: "cyan",
  },
  {
    title: "Pitch Battle: Series 04",
    type: "Pitch Battle",
    date: "May 04",
    venue: "Mumbai · IIT Bombay",
    seats: 320,
    color: "primary",
  },
  {
    title: "Design Systems Workshop",
    type: "Workshop",
    date: "Apr 30",
    venue: "Online",
    seats: 500,
    color: "cyan",
  },
];

export const testimonials = [
  {
    quote:
      "Scope Connect gave me a national stage as a sophomore. I went from coding alone to leading a 40-person chapter in 6 months.",
    name: "Priya R.",
    role: "Chapter President · VIT Vellore",
  },
  {
    quote:
      "We hired 3 interns from Scope Connect's builder marketplace. The talent density is unreal.",
    name: "Karan G.",
    role: "Founder · Layerly (YC W25)",
  },
  {
    quote:
      "It's the first platform that actually feels built for Gen Z campus builders — not LinkedIn cosplay.",
    name: "Ishita V.",
    role: "Innovator · IIIT Hyderabad",
  },
];

export const feedPosts = [
  {
    id: "1",
    author: "Aarav Mehta",
    campus: "IIT Bombay",
    time: "12m",
    type: "Project Launch",
    content:
      "Just shipped v1 of MediMatch AI 🩺 — triages symptoms to the right specialist in under 30 seconds. Built with my team at AI Builders Mumbai. Would love feedback!",
    likes: 142,
    comments: 28,
    celebrates: 56,
  },
  {
    id: "2",
    author: "Diya Sharma",
    campus: "BITS Pilani",
    time: "1h",
    type: "Achievement",
    content:
      "Hit 4,500 Scope Points 🚀 Officially a Leader-tier builder. Thank you to everyone in Startup Sprint BITS for the late-night brainstorms.",
    likes: 318,
    comments: 64,
    celebrates: 201,
  },
  {
    id: "3",
    author: "Scope Connect",
    campus: "National HQ",
    time: "3h",
    type: "Campus Growth Milestone",
    content:
      "🎉 We just crossed 12,000 active members across 142 campuses. Onwards to 50,000 by end of year. Tag your campus chapter below 👇",
    likes: 892,
    comments: 184,
    celebrates: 612,
  },
  {
    id: "4",
    author: "Karan G.",
    campus: "Recruiter · Layerly",
    time: "5h",
    type: "Hiring Opportunity",
    content:
      "We're hiring 2 frontend interns (React + Tailwind) for summer '26. Open to all campuses. DM your portfolio + Scope profile.",
    likes: 246,
    comments: 92,
    celebrates: 38,
  },
  {
    id: "5",
    author: "Ananya Iyer",
    campus: "IIIT Hyderabad",
    time: "8h",
    type: "Event Update",
    content:
      "Our pitch battle finalists are LIVE at scope.connect/events 🔥 Voting closes at midnight. Show your campus some love.",
    likes: 184,
    comments: 41,
    celebrates: 73,
  },
];

export const interestTags = [
  "AI",
  "Startup",
  "Design",
  "Marketing",
  "Coding",
  "Research",
  "Content",
  "Robotics",
];
