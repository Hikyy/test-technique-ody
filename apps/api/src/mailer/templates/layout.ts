interface LayoutOptions {
  title: string;
  preheader?: string;
  body: string;
}

const escapeHtml = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function renderLayout({ title, preheader, body }: LayoutOptions): string {
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#fbfaf6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#15140f;">
    ${
      preheader
        ? `<div style="display:none;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">${escapeHtml(preheader)}</div>`
        : ""
    }
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbfaf6;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border:1px solid rgba(20,20,18,0.08);border-radius:12px;padding:36px 32px;">
            <tr>
              <td>
                <div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:22px;color:#15140f;margin-bottom:24px;">Sève</div>
                ${body}
                <div style="margin-top:28px;padding-top:20px;border-top:1px solid rgba(20,20,18,0.08);font-size:11px;color:rgba(21,20,15,0.55);">
                  Vous recevez cet email parce qu'il vous a été adressé par un membre de Sève.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
