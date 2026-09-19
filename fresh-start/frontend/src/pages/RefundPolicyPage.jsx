import CompliancePage from "../components/CompliancePage";

const sections = [
  {
    title: "Cancellation before session start",
    body: "If a user cancels before the session begins, the platform should clearly state whether the wallet amount stays untouched or whether a small convenience fee applies. Whatever rule you choose should be shown here and in the checkout flow.",
  },
  {
    title: "No-show and disconnect handling",
    body: "If the mentor does not join, the student disconnects early, or a technical issue interrupts the session, the refund decision should follow the live support and dispute process. The product should tell the user where to raise the issue and how long review takes.",
  },
  {
    title: "Completed sessions",
    body: "Once a session is completed successfully, the normal rule should be that the charge is final unless a verified service error or policy exception applies.",
  },
  {
    title: "How to request a refund",
    body: [
      "Write to support@toppertalks.in or legal@toppertalks.in.",
      "Include the session time, mentor name, transaction reference, and a short description of the problem.",
      "Keep the user informed about the review timeline before the request is submitted.",
    ],
  },
];

export default function RefundPolicyPage() {
  return (
    <CompliancePage
      eyebrow="Cancellation & Refund"
      title="Cancellation and refund policy"
      subtitle="This page should explain when a session can be cancelled, how no-shows are handled, and when a refund is allowed."
      heroLabel="Refund rules"
      accent="#f97316"
      highlights={[
        { label: "Before call", value: "Show cancellation rule clearly" },
        { label: "No-show", value: "Tell users how to report it" },
        { label: "Completed", value: "Normally final once delivered" },
        { label: "Support", value: "support@toppertalks.in" },
      ]}
      sections={sections}
      footnote="If you already have exact refund windows, fee rules, or dispute timelines, replace the generic language in this page before deployment."
    />
  );
}