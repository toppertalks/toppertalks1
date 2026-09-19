import CompliancePage from "../components/CompliancePage";

const sections = [
  {
    title: "What TopperTalks does",
    body: "TopperTalks helps students connect with verified toppers for one-to-one academic guidance through voice and video sessions. The platform is designed for fast help, practical doubt solving, and exam-specific mentoring.",
  },
  {
    title: "Who it is for",
    body: [
      "Students preparing for JEE, NEET, or other competitive exams who need quick support from someone who has already cleared the path.",
      "Toppers and mentors who want to share what worked, build trust through live sessions, and earn from their experience.",
    ],
  },
  {
    title: "How the platform works",
    body: "Users browse toppers, view profile details and pricing, add money to their wallet, and start a session when they are ready. Sessions, ratings, and wallet activity remain visible inside the app for a simple support flow.",
  },
];

export default function AboutPage() {
  return (
    <CompliancePage
      eyebrow="About Us"
      title="About TopperTalks"
      subtitle="TopperTalks is a mentorship marketplace built to connect students with verified toppers for direct, on-demand academic guidance."
      heroLabel="Student-first mentoring"
      accent="#38bdf8"
      highlights={[
        { label: "Focus", value: "Live exam guidance" },
        { label: "Audience", value: "JEE & NEET aspirants" },
        { label: "Format", value: "1:1 voice and video" },
        { label: "Trust", value: "Verified mentor profiles" },
      ]}
      sections={sections}
      footnote="If you want, this page can also be extended with a founder story, operating entity details, or a roadmap section before launch."
    />
  );
}