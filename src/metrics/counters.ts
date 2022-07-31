export const metricsCounters = [
  {
    name: "phone_user_logins",
    help: "Total number of users logging in using a phone number",
    labelNames: ["phone"],
  },
  {
    name: "email_user_logins",
    help: "Total number of users logging in using an email",
    labelNames: ["email"],
  },
] as const;

export type CounterName = typeof metricsCounters[number]["name"];
