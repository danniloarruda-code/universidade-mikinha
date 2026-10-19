# Draws the PNG app icons (same design as public/icon.svg) with System.Drawing.
Add-Type -AssemblyName System.Drawing
$out = Join-Path $PSScriptRoot '..\public'
foreach ($size in 192, 512) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'; $g.TextRenderingHint = 'AntiAlias'
  $s = $size / 512.0
  $teal = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(11, 107, 116))
  $g.FillRectangle($teal, 0, 0, $size, $size)
  $sand = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(253, 240, 200))
  $g.FillEllipse($sand, 106 * $s, 136 * $s, 300 * $s, 300 * $s)
  $gold = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(244, 189, 42))
  $pts = @(@(146,196), @(146,116), @(201,160), @(256,92), @(311,160), @(366,116), @(366,196)) | ForEach-Object { New-Object System.Drawing.PointF ($_[0] * $s), ($_[1] * $s) }
  $g.FillPolygon($gold, [System.Drawing.PointF[]]$pts)
  $font = New-Object System.Drawing.Font 'Arial Black', (150 * $s), ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
  $coral = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 107, 91))
  $fmt = New-Object System.Drawing.StringFormat; $fmt.Alignment = 'Center'; $fmt.LineAlignment = 'Center'
  $g.DrawString('M', $font, $coral, (New-Object System.Drawing.RectangleF 0, (150 * $s), $size, (280 * $s)), $fmt)
  $bmp.Save((Join-Path $out "icon-$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}
Write-Output 'icons ok'
