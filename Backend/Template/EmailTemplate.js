const emailTemplate = ({
  title = "Netflix Clone",
  heading,
  message,
  footer = "Thanks for using Netflix Clone.",
}) => {
  return `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">

  <title>${title}</title>

  <style>
    @media only screen and (max-width: 620px) {
      .email-body { padding: 16px 8px !important; }
      .email-container { width: 100% !important; max-width: 100% !important; }
      .logo { font-size: 28px !important; }
      .content { padding: 28px 20px !important; }
      .heading { font-size: 22px !important; line-height: 30px !important; }
      .message { font-size: 15px !important; line-height: 25px !important; }
      .footer { padding: 22px 20px !important; }
    }
  </style>
</head>

<body style="margin:0; padding:0; background:#080B14; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" bgcolor="#080B14" class="email-body" style="width:100%; background:#080B14; padding:32px 12px;">
    <tr>
      <td align="center">

        <table width="600" cellpadding="0" cellspacing="0" border="0" role="presentation" bgcolor="#0F172A" class="email-container" style="width:100%; max-width:600px; background:#0F172A; border-radius:14px; overflow:hidden; border:1px solid rgba(139,92,246,0.18);">

          <!-- Brand header -->
          <tr>
            <td align="center" bgcolor="#0B1120" style="padding:30px 30px; background:#0B1120; border-bottom:1px solid rgba(139,92,246,0.25);">
              <div class="logo" style="margin:0; color:#e50914; font-size:34px; line-height:38px; font-weight:900; letter-spacing:3px; text-transform:uppercase;">
                Netflix Clone
              </div>
            </td>
          </tr>

          <!-- Accent gradient strip -->
          <tr>
            <td style="height:3px; line-height:3px; font-size:0; background:#8B5CF6; background:linear-gradient(90deg, #8B5CF6 0%, #22D3EE 100%);">&nbsp;</td>
          </tr>

          <!-- Main content -->
          <tr>
            <td class="content" style="padding:40px 36px;">

              <h2 class="heading" style="margin:0; color:#f8fafc; font-size:26px; line-height:34px; font-weight:700;">
                ${heading}
              </h2>

              <div class="message" style="margin:20px 0 0; color:#cbd5e1; font-size:16px; line-height:28px;">
                ${message}
              </div>

            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 36px;">
              <div style="height:1px; line-height:1px; font-size:1px; background:rgba(139,92,246,0.18);">&nbsp;</div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" class="footer" style="padding:28px 36px 32px;">

              <p style="margin:0; color:#94a3b8; font-size:14px; line-height:24px;">
                ${footer}
              </p>

              <!-- Test-clone notice -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-top:20px;">
                <tr>
                  <td bgcolor="#111827" style="padding:14px 16px; background:#111827; border-left:3px solid #8B5CF6; border-radius:6px;">
                    <p style="margin:0; color:#94a3b8; font-size:12px; line-height:19px; text-align:left;">
                      <strong style="color:#cbd5e1;">Notice:</strong>
                      This is a demo project built for testing only. Netflix Clone is
                      not the real Netflix and is not affiliated with, endorsed by, or
                      connected to Netflix, Inc.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:18px 0 0; color:#64748b; font-size:12px; line-height:20px;">
                &copy; ${new Date().getFullYear()} Netflix Clone (test project).
              </p>

              <p style="margin:6px 0 0; color:#64748b; font-size:12px; line-height:20px;">
                This is an automated email. Please do not reply.
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>

</html>
`;
};

module.exports = emailTemplate;
