import CompliancePage from "../components/CompliancePage";

const sections = [
  {
    title: "Support",
    body: [
      "Email: support@toppertalks.in",
      "Phone: add your official support number here before release",
      "Hours: Monday to Saturday, 10:00 AM to 7:00 PM IST",
    ],
  },
  {
    title: "Grievance",
    body: [
      "Email: legal@toppertalks.in",
      "Use this address for privacy concerns, legal notices, refund disputes, and platform grievances.",
    ],
  },
  {
    title: "Business address",
    body: "TopperTalks Pvt. Ltd., Bengaluru, Karnataka – 560001",
  },
];

export default function ContactPage() {
  return (
    <CompliancePage
      eyebrow="Contact Us"
      title="Contact TopperTalks"
      subtitle="Reach the team for support, complaints, refund disputes, legal notices, or any issue related to your account and sessions."
      heroLabel="Support and grievance handling"
      accent="#22c55e"
      highlights={[
        { label: "Support email", value: "support@toppertalks.in" },
        { label: "Grievance email", value: "legal@toppertalks.in" },
        { label: "Office", value: "Bengaluru, Karnataka" },
        { label: "Phone", value: "Add official support line" },
      ]}
      sections={sections}
      footnote="I left the phone line as a configurable placeholder instead of inventing a number. If you have the official contact number, I can wire it into the page immediately."
    />
  );
}