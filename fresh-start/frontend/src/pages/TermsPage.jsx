import CompliancePage from "../components/CompliancePage";

const sections = [
  {
    title: "Acceptance of terms",
    body: "By using TopperTalks, you agree to these terms for your own account and for any session or wallet activity that takes place under it.",
  },
  {
    title: "User responsibilities",
    body: [
      "Provide accurate registration details and keep your login credentials secure.",
      "Use the platform only for lawful academic mentoring, support, and platform features.",
      "Do not misuse calls, ratings, reports, or wallet features to harass or defraud anyone.",
    ],
  },
  {
    title: "Sessions and payments",
    body: "Session pricing, wallet deductions, refunds, and any no-show or cancellation charges should be followed exactly as displayed inside the product and in the refund policy. If there is any difference, the live policy page should be updated before launch.",
  },
  {
    title: "Service limitations",
    body: "TopperTalks is a marketplace for mentorship. We do not guarantee admission outcomes, exam results, or the exact academic advice given by each mentor.",
  },
  {
    title: "Changes to terms",
    body: "We may update these terms when the product, law, or billing model changes. Updated terms should always show a fresh effective date.",
  },
];

export default function TermsPage() {
  return (
    <CompliancePage
      eyebrow="Terms & Conditions"
      title="Terms and conditions"
      subtitle="These terms govern how students, mentors, and visitors may use TopperTalks, including accounts, wallet activity, sessions, and dispute handling."
      heroLabel="Platform rules"
      accent="#8b5cf6"
      highlights={[
        { label: "Users", value: "Students, mentors, visitors" },
        { label: "Usage", value: "Lawful platform use only" },
        { label: "Pricing", value: "Use the live price page" },
        { label: "Law", value: "Keep local compliance current" },
      ]}
      sections={sections}
    />
  );
}