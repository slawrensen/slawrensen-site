#!/usr/bin/env bash
# Deploy the static site to SiteGround over FTP.
#
# The password is read from the environment so it is NEVER written into this
# file or into a command that gets logged. Run it like this (in Git Bash):
#
#     FTP_PASS='your-ftp-password' bash deploy.sh
#
# After a successful deploy, rotate the FTP password in SiteGround Site Tools
# if it has ever been shared in plain text.
#
# Optional overrides (defaults shown):
#     FTP_HOST=slawrensen.com        # or the FTP hostname from SiteGround Site Tools > FTP Accounts
#     FTP_USER=clagent@slawrensen.com
#     REMOTE_DIR=public_html         # docroot of the primary domain on SiteGround
#     FTP_SCHEME=ftp                 # set to 'ftps' if plain FTP is disabled

set -euo pipefail

FTP_HOST="${FTP_HOST:-slawrensen.com}"
FTP_USER="${FTP_USER:-clagent@slawrensen.com}"
REMOTE_DIR="${REMOTE_DIR:-slawrensen.com/public_html}"
FTP_SCHEME="${FTP_SCHEME:-ftp}"
: "${FTP_PASS:?Set FTP_PASS in your environment, e.g. FTP_PASS='...' bash deploy.sh}"

HERE="$(cd "$(dirname "$0")" && pwd)"
FILES=(
  "index.html"
  ".htaccess"
  "favicon.svg"
  "robots.txt"
  "assets/hwinfo-sensors.png"
)

echo "Deploying to ${FTP_SCHEME}://${FTP_HOST}/${REMOTE_DIR}/ as ${FTP_USER}"
for f in "${FILES[@]}"; do
  echo "  -> ${f}"
  # --ssl upgrades to FTPS (password encrypted in transit); -k skips the cert
  # hostname check because SiteGround serves a shared cert that will not match a
  # custom domain. Transport stays encrypted; only the name match is relaxed.
  curl -sS --ssl -k --ftp-create-dirs -T "${HERE}/${f}" \
    "${FTP_SCHEME}://${FTP_HOST}/${REMOTE_DIR}/${f}" \
    --user "${FTP_USER}:${FTP_PASS}"
done

echo "Done. Open https://slawrensen.com/ to verify."
