import { Resend } from "resend";

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(apiKey);
}

export async function sendPriceAlert({
  to,
  currentPrice,
  previousPrice,
  changePercent,
  direction,
}: {
  to: string[];
  currentPrice: number;
  previousPrice: number;
  changePercent: number;
  direction: "up" | "down";
}) {
  const arrow = direction === "up" ? "↑" : "↓";
  const color = direction === "up" ? "#16a34a" : "#dc2626";
  const sign = direction === "up" ? "+" : "";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Gold Price Alert</title>
</head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e5e5e5;">
          <tr>
            <td style="padding:40px 48px 32px;border-bottom:2px solid #000000;">
              <p style="margin:0;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#666;">Gold Price Tracker</p>
              <h1 style="margin:12px 0 0;font-size:24px;font-weight:400;letter-spacing:0.05em;color:#000;">Price Alert</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 48px;">
              <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#999;">Current Price (XAU/USD)</p>
              <p style="margin:0 0 24px;font-size:36px;font-weight:300;color:#000;">$${currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<span style="font-size:14px;color:#666;margin-left:6px;">per oz</span></p>

              <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px;background:#f5f5f5;width:50%;">
                    <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#999;">Previous Price</p>
                    <p style="margin:0;font-size:18px;font-weight:300;color:#000;">$${previousPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </td>
                  <td style="padding:16px;background:#f5f5f5;width:50%;">
                    <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#999;">Change</p>
                    <p style="margin:0;font-size:18px;font-weight:300;color:${color};">${arrow} ${sign}${changePercent.toFixed(2)}%</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 32px;font-size:13px;line-height:1.6;color:#555;">
                Gold has moved more than 1% in the last hour. Visit the Gold Tracker website to view the full 24-hour price chart.
              </p>

              <p style="margin:0;font-size:11px;color:#aaa;letter-spacing:0.08em;text-transform:uppercase;">
                You are receiving this because you opted in to Gold Price Alerts.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Gold Price Alert\n\nCurrent Price: $${currentPrice.toFixed(2)}/oz\nPrevious Price: $${previousPrice.toFixed(2)}/oz\nChange: ${sign}${changePercent.toFixed(2)}%\n\nGold has moved more than 1% in the last hour.`;

  const resend = getResendClient();
  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "alerts@goldtracker.app",
    to,
    subject: `Gold Price Alert: ${arrow} ${sign}${changePercent.toFixed(2)}% | $${currentPrice.toFixed(2)}/oz`,
    html,
    text,
  });
}
