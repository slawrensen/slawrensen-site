# slawrensen.com

Static marketing site for Stephen Lawrensen (independent software). Single page,
no build step, no dependencies. Product 01 is HWiNFO Sensors for the Elgato
Stream Deck.

## Files

```
index.html                 the whole site (self-contained, inline CSS)
.htaccess                  https redirect, security headers, cache policy
                           (HTML no-cache so deploys are visible at once;
                           images cache a day)
favicon.svg                brand mark
robots.txt
assets/hwinfo-sensors.png  product hero (themes contact sheet)
```

## Deploy (SiteGround, FTP)

The password is passed via the environment so it never lands in a file or a
logged command:

```bash
FTP_PASS='your-ftp-password' bash deploy.sh
```

Override host/user/path if needed (see the top of `deploy.sh`). If plain FTP is
disabled on the account, use `FTP_SCHEME=ftps`.

No-CLI alternative: zip the folder and upload it through SiteGround **Site Tools
> Site > File Manager**, into `public_html`, then extract.

After deploying, rotate the FTP password in SiteGround if it was ever shared in
plain text.

## Editing

It is one HTML file. Add a second product by copying the `.product` block and
bumping `Products / 02`. Colors and spacing live in the `:root` CSS variables at
the top.
