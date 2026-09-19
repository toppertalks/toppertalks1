import CompliancePage from "../components/CompliancePage";

const sections = [
  {
    title: "Information we collect",
    body: [
      "Account data such as name, email, phone number, and profile information.",
      "Session data such as calls, ratings, mentor selections, and wallet activity.",
      "Device and security data used to keep the service stable and prevent abuse.",
    ],
  },
  {
    title: "How we use information",
    body: "We use customer data to run accounts, provide sessions, process payments, improve recommendations, send notifications, and support safety and fraud prevention.",
  },
  {
    title: "Sharing and retention",
    body: [
      "We do not sell personal data.",
      "Data may be shared with service providers that help operate payments, hosting, analytics, email, or verification.",
      "We keep data only as long as needed for the service, legal obligations, and security reviews.",
    ],
  },
  {
    title: "Your choices",
    body: "Users should be able to access, correct, and request deletion of personal data where applicable. If you need a consent or deletion workflow in the app, that flow should link back to this policy and your support email.",
  },
];

export default function PrivacyPage() {
  return (
    <CompliancePage
      eyebrow="Privacy Policy"
      title="Privacy policy"
      subtitle="This policy explains what data TopperTalks collects, why it is used, who may receive it, and how long it is retained."
      heroLabel="Data protection"
      accent="#14b8a6"
      highlights={[
        { label: "Collected data", value: "Account, session and device data" },
        { label: "Sale of data", value: "Not sold" },
        { label: "Retention", value: "Only as long as needed" },
        { label: "User rights", value: "Access, correct, delete" },
      ]}
      sections={sections}
    />
  );
}