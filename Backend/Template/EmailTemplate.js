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
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">

  <title>${title}</title>

  <style>
    @media only screen and (max-width: 620px) {
      .email-body { padding: 16px 8px !important; }
      .email-container { width: 100% !important; max-width: 100% !important; }
      .logo { font-size: 30px !important; }
      .content { padding: 28px 20px !important; }
      .heading { font-size: 22px !important; line-height: 30px !important; }
      .message { font-size: 15px !important; line-height: 25px !important; }
      .footer { padding: 22px 20px !important; }
    }
  </style>
</head>

<body style="margin:0; padding:0; background:#000000; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" bgcolor="#000000" class="email-body" style="width:100%; background:#000000; padding:32px 12px;">
    <tr>
      <td align="center">

        <table width="600" cellpadding="0" cellspacing="0" border="0" role="presentation" bgcolor="#141414" class="email-container" style="width:100%; max-width:600px; background:#141414; border-radius:8px; overflow:hidden;">

          <!-- Brand header -->
          <tr>
            <td align="center" bgcolor="#000000" style="padding:28px 30px; background:#000000; border-bottom:3px solid #e50914;">
              <div class="logo" style="margin:0; color:#e50914; font-size:36px; line-height:40px; font-weight:900; letter-spacing:3px; text-transform:uppercase;">
                Netflix Clone
              </div>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td class="content" style="padding:40px 36px;">

              <h2 class="heading" style="margin:0; color:#ffffff; font-size:26px; line-height:34px; font-weight:700;">
                ${heading}
              </h2>

              <div class="message" style="margin:20px 0 0; color:#d2d2d2; font-size:16px; line-height:28px;">
                ${message}
              </div>

            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 36px;">
              <div style="height:1px; line-height:1px; font-size:1px; background:#2f2f2f;">&nbsp;</div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" class="footer" style="padding:28px 36px 32px;">

              <p style="margin:0; color:#b3b3b3; font-size:14px; line-height:24px;">
                ${footer}
              </p>

              <!-- Test-clone notice -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-top:20px;">
                <tr>
                  <td bgcolor="#1f1f1f" style="padding:14px 16px; background:#1f1f1f; border-left:3px solid #e50914; border-radius:4px;">
                    <p style="margin:0; color:#a3a3a3; font-size:12px; line-height:19px; text-align:left;">
                      <strong style="color:#e5e5e5;">Notice:</strong>
                      This is a demo project built for testing only. Netflix Clone is
                      not the real Netflix and is not affiliated with, endorsed by, or
                      connected to Netflix, Inc.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:18px 0 0; color:#737373; font-size:12px; line-height:20px;">
                &copy; ${new Date().getFullYear()} Netflix Clone (test project).
              </p>

              <p style="margin:6px 0 0; color:#737373; font-size:12px; line-height:20px;">
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