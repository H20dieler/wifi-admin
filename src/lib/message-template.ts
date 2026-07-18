export const DEFAULT_MESSAGE_TEMPLATE = `Magandang araw, {{name}}!

Paalala lamang na ang iyong bayarin sa WiFi na nagkakahalaga ng {{amount}} ay nakatakdang bayaran sa {{due_date}}.

Makikiusap po kami na mabayaran ito sa o bago ang takdang petsa upang maiwasan ang pagkaantala o pansamantalang pagkaputol ng inyong internet service.

Kung nakapagbayad na po kayo, maaari na pong balewalain ang mensaheng ito.

Maraming salamat sa inyong patuloy na pagtangkilik!`;
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
