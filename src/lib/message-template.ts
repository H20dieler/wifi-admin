export const DEFAULT_MESSAGE_TEMPLATE =
  "Hi {{name}}, this is a reminder that your WiFi bill of {{amount}} is due {{due_date}}. Please settle your balance to avoid service interruption. Thank you!";

export type TemplateVars = {
  name: string;
  amount: string;
  due_date: string;
};

export function fillTemplate(template: string, vars: TemplateVars): string {
  return template
    .replaceAll("{{name}}", vars.name)
    .replaceAll("{{amount}}", vars.amount)
    .replaceAll("{{due_date}}", vars.due_date);
}
