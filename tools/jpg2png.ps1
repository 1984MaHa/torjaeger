# Wandelt die Vorlagen-JPG in verlustfreie PNG (nur Windows, nur beim Entwickeln). Aufruf: powershell -File tools/jpg2png.ps1 <Eingabe.jpg> <Ausgabe.png>
param([Parameter(Mandatory=$true)][string]$In,[Parameter(Mandatory=$true)][string]$Out)
Add-Type -AssemblyName System.Drawing
$img=[System.Drawing.Image]::FromFile((Resolve-Path $In))
$bmp=New-Object System.Drawing.Bitmap($img)
$bmp.Save($Out,[System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose();$img.Dispose()
