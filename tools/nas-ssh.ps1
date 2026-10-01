# Verbindet per SSH mit der Synology energizer. Aufruf: .\tools\nas-ssh.ps1
# Ordner dort: /volume1/docker/torjaeger (Live), /volume1/docker/torjaeger-preview (Vorschau)
ssh -i "$env:USERPROFILE\.ssh\prime_nas" Marco.Haufe@energizer.tailfc5923.ts.net
