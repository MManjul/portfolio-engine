<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
      <head>
        <title>XML Sitemap | Mayank Manjul Portfolio</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style type="text/css">
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", monospace, sans-serif;
            background: #070a0f;
            color: #cbd5e1;
            margin: 0;
            padding: 30px 20px;
          }
          .container {
            max-width: 900px;
            margin: 0 auto;
            background: #0d1522;
            border: 1px solid rgba(0, 242, 254, 0.35);
            border-radius: 8px;
            padding: 24px 28px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(0, 242, 254, 0.15);
          }
          h1 {
            color: #00f2fe;
            font-size: 1.5rem;
            margin: 0 0 6px 0;
            letter-spacing: 0.05em;
          }
          p.desc {
            color: #94a3b8;
            font-size: 0.88rem;
            margin: 0 0 20px 0;
            line-height: 1.5;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.85rem;
            margin-top: 10px;
          }
          th {
            text-align: left;
            background: rgba(0, 242, 254, 0.1);
            color: #00f2fe;
            padding: 10px 14px;
            border-bottom: 1px solid rgba(0, 242, 254, 0.3);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          td {
            padding: 12px 14px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            color: #e2e8f0;
          }
          tr:hover td {
            background: rgba(0, 242, 254, 0.05);
          }
          a {
            color: #38bdf8;
            text-decoration: none;
            word-break: break-all;
          }
          a:hover {
            color: #00f2fe;
            text-decoration: underline;
          }
          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 0.75rem;
            font-weight: 700;
            background: rgba(0, 242, 254, 0.15);
            color: #00f2fe;
            border: 1px solid rgba(0, 242, 254, 0.3);
          }
          .footer {
            margin-top: 24px;
            font-size: 0.75rem;
            color: #64748b;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>XML SITEMAP // MAYANK MANJUL</h1>
          <p class="desc">
            Search-engine index map generated for web crawlers (Google, Bing).
            Total canonical URLs: <strong><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></strong>
          </p>
          <table>
            <thead>
              <tr>
                <th width="50%">URL Location</th>
                <th width="15%">Priority</th>
                <th width="15%">Change Frequency</th>
                <th width="20%">Last Modified</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td>
                    <xsl:variable name="itemURL">
                      <xsl:value-of select="sitemap:loc"/>
                    </xsl:variable>
                    <a href="{$itemURL}">
                      <xsl:value-of select="sitemap:loc"/>
                    </a>
                  </td>
                  <td>
                    <span class="badge"><xsl:value-of select="sitemap:priority"/></span>
                  </td>
                  <td>
                    <xsl:value-of select="sitemap:changefreq"/>
                  </td>
                  <td>
                    <xsl:value-of select="sitemap:lastmod"/>
                  </td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
          <div class="footer">
            Mayank Manjul • Principal Gameplay Engineer &amp; Systems Architect • https://mayankmanjul.com
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
