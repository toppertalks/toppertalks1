import CompliancePage from "../components/CompliancePage";

const sections = [
  {
    title: "Public pricing",
    body: [
      "TopperTalks shows pricing publicly before a user starts a session.",
      "The app currently uses a simple wallet-based flow where the session cost is visible in the mentor profile and wallet screens.",
    ],
  },
  {
    title: "Wallet and billing",
    body: "Users add money to their wallet, start a call when ready, and the applicable amount is deducted for the completed session. The wallet screen should always remain the source of truth for live billing details.",
  },
  {
    title: "Recommended disclosure",
    body: "If you introduce promo pricing, minimum session lengths, platform fees, or cancellation charges later, keep those rules visible here so customers can review them before payment.",
  },
];

export default function PricingPage() {
  return (
    <CompliancePage
      eyebrow="Pricing / Services"
      title="Pricing and services"
      subtitle="This page tells customers what they are buying, how the wallet works, and where the billing rules live before a session starts."
      heroLabel="Public price disclosure"
      accent="#f59e0b"
      highlights={[
        { label: "Service", value: "1:1 mentor sessions" },
        { label: "Pricing", value: "Visible before checkout" },
        { label: "Billing", value: "Wallet-based deduction" },
        { label: "Scope", value: "Live academic guidance" },
      ]}
      sections={sections}
      footnote="Replace the generic billing language here with your final live rates if you want the page to show exact INR amounts."
    />
  );
}