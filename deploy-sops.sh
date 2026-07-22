#!/usr/bin/env bash
# Deploy using the SOPS-encrypted FTP password.
#
# The password is decrypted from secrets/ftp.enc.yaml at runtime only. It is
# never written to disk in plaintext and never appears in a logged command.
#
#     bash deploy-sops.sh
#
# Requires: sops + age installed, the age private key at
# ~/.config/sops/age/keys.txt (or set SOPS_AGE_KEY_FILE), and the encrypted
# secret already created (see README "Encrypt the FTP password").

set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
export SOPS_AGE_KEY_FILE="${SOPS_AGE_KEY_FILE:-$HOME/.config/sops/age/keys.txt}"
SECRET="$HERE/secrets/ftp.enc.yaml"

[ -f "$SECRET" ] || { echo "Missing $SECRET. Encrypt the FTP password first (see README)."; exit 1; }

# Decrypt into the child process environment only; deploy.sh reads $FTP_PASS.
FTP_PASS="$(sops -d --extract '["ftp_pass"]' "$SECRET")" bash "$HERE/deploy.sh"
