param(
  [string]$BackgroundPath = "client/public/images/og-cover.png",
  [string]$LogoPath = "attached_assets/LOGO_1770751298475.png",
  [string]$OutputPath = "client/public/images/og-share-card.png"
)

Add-Type -AssemblyName System.Drawing

function New-RoundedRectanglePath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $Radius * 2

  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()

  return $path
}

$canvasWidth = 1200
$canvasHeight = 630
$bitmap = New-Object System.Drawing.Bitmap($canvasWidth, $canvasHeight)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)

$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$deepBlue = [System.Drawing.Color]::FromArgb(255, 6, 21, 52)
$panelBlue = [System.Drawing.Color]::FromArgb(232, 7, 26, 67)
$panelBorder = [System.Drawing.Color]::FromArgb(74, 255, 255, 255)
$accentCoral = [System.Drawing.Color]::FromArgb(255, 255, 110, 110)
$accentTeal = [System.Drawing.Color]::FromArgb(255, 34, 192, 215)
$softWhite = [System.Drawing.Color]::FromArgb(240, 255, 255, 255)
$mutedWhite = [System.Drawing.Color]::FromArgb(210, 241, 247, 255)

$graphics.Clear($deepBlue)

$backgroundImage = [System.Drawing.Image]::FromFile($BackgroundPath)
$logoImage = [System.Drawing.Image]::FromFile($LogoPath)

$sourceCropY = 84
$sourceCropHeight = $backgroundImage.Height - 168
$sourceCropWidth = [int][Math]::Round($sourceCropHeight * ($canvasWidth / [double]$canvasHeight))
$sourceCropX = [int][Math]::Round(($backgroundImage.Width - $sourceCropWidth) / 2)
$graphics.DrawImage(
  $backgroundImage,
  [System.Drawing.Rectangle]::new(0, 0, $canvasWidth, $canvasHeight),
  [System.Drawing.Rectangle]::new($sourceCropX, $sourceCropY, $sourceCropWidth, $sourceCropHeight),
  [System.Drawing.GraphicsUnit]::Pixel
)

$fullOverlay = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  ([System.Drawing.Point]::new(0, 0)),
  ([System.Drawing.Point]::new($canvasWidth, 0)),
  ([System.Drawing.Color]::FromArgb(178, 5, 18, 44)),
  ([System.Drawing.Color]::FromArgb(44, 4, 14, 36))
)
$graphics.FillRectangle($fullOverlay, 0, 0, $canvasWidth, $canvasHeight)

$leftGlow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(30, 0, 180, 255))
$graphics.FillEllipse($leftGlow, -120, -30, 500, 500)
$rightGlow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(36, 40, 112, 255))
$graphics.FillEllipse($rightGlow, 780, -80, 420, 420)

$panelPath = New-RoundedRectanglePath -X 64 -Y 54 -Width 566 -Height 522 -Radius 34
$panelShadowPath = New-RoundedRectanglePath -X 72 -Y 62 -Width 566 -Height 522 -Radius 34
$panelShadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(46, 3, 10, 26))
$graphics.FillPath($panelShadowBrush, $panelShadowPath)

$panelBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  ([System.Drawing.Point]::new(64, 54)),
  ([System.Drawing.Point]::new(630, 576)),
  $panelBlue,
  ([System.Drawing.Color]::FromArgb(216, 11, 34, 82))
)
$graphics.FillPath($panelBrush, $panelPath)

$panelBorderPen = New-Object System.Drawing.Pen($panelBorder, 1.5)
$graphics.DrawPath($panelBorderPen, $panelPath)

$logoShellPath = New-RoundedRectanglePath -X 92 -Y 88 -Width 118 -Height 118 -Radius 28
$logoShellBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  ([System.Drawing.Point]::new(92, 88)),
  ([System.Drawing.Point]::new(210, 206)),
  ([System.Drawing.Color]::FromArgb(60, 255, 255, 255)),
  ([System.Drawing.Color]::FromArgb(22, 255, 255, 255))
)
$graphics.FillPath($logoShellBrush, $logoShellPath)
$logoShellPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(64, 255, 255, 255), 1)
$graphics.DrawPath($logoShellPen, $logoShellPath)
$graphics.DrawImage($logoImage, [System.Drawing.Rectangle]::new(101, 97, 100, 100))

$eyebrowFont = New-Object System.Drawing.Font("Segoe UI Semibold", 16, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$titleFont = New-Object System.Drawing.Font("Segoe UI Semibold", 48, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$subtitleFont = New-Object System.Drawing.Font("Segoe UI", 21, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$chipFont = New-Object System.Drawing.Font("Segoe UI Semibold", 16, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$footerFont = New-Object System.Drawing.Font("Segoe UI Semibold", 18, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)

$eyebrowBrush = New-Object System.Drawing.SolidBrush($accentCoral)
$titleBrush = New-Object System.Drawing.SolidBrush($softWhite)
$subtitleBrush = New-Object System.Drawing.SolidBrush($mutedWhite)
$footerBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(236, 255, 255, 255))

$graphics.DrawString(
  "MICHELS TRAVEL",
  $eyebrowFont,
  $eyebrowBrush,
  [System.Drawing.PointF]::new(234, 116)
)

$accentBrush = New-Object System.Drawing.SolidBrush($accentTeal)
$graphics.FillRectangle($accentBrush, 236, 146, 102, 4)

$titleFormat = New-Object System.Drawing.StringFormat
$titleFormat.LineAlignment = [System.Drawing.StringAlignment]::Near
$titleFormat.Alignment = [System.Drawing.StringAlignment]::Near
$graphics.DrawString(
  "Voos para o Brasil`ncom atendimento`nem portugues",
  $titleFont,
  $titleBrush,
  [System.Drawing.RectangleF]::new(88, 228, 500, 182),
  $titleFormat
)

$graphics.DrawString(
  "Passagens, bagagem e apoio humano para viajar com mais clareza saindo de Newark.",
  $subtitleFont,
  $subtitleBrush,
  [System.Drawing.RectangleF]::new(88, 428, 460, 88)
)

$chips = @(
  @{ X = 88; Width = 164; Label = "Newark e Ironbound" },
  @{ X = 264; Width = 174; Label = "Suporte humano" },
  @{ X = 450; Width = 130; Label = "Bagagem" }
)

foreach ($chip in $chips) {
  $chipPath = New-RoundedRectanglePath -X $chip.X -Y 530 -Width $chip.Width -Height 38 -Radius 19
  $chipBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(34, 255, 255, 255))
  $chipPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(64, 255, 255, 255), 1)
  $chipTextBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(238, 255, 255, 255))

  $graphics.FillPath($chipBrush, $chipPath)
  $graphics.DrawPath($chipPen, $chipPath)
  $graphics.DrawString(
    $chip.Label,
    $chipFont,
    $chipTextBrush,
    [System.Drawing.RectangleF]::new($chip.X, 538, $chip.Width, 20),
    (New-Object System.Drawing.StringFormat -Property @{ Alignment = [System.Drawing.StringAlignment]::Center })
  )

  $chipBrush.Dispose()
  $chipPen.Dispose()
  $chipTextBrush.Dispose()
  $chipPath.Dispose()
}

$pathPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(120, 255, 255, 255), 2)
$pathPen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
$graphics.DrawBezier(
  $pathPen,
  [System.Drawing.Point]::new(780, 190),
  [System.Drawing.Point]::new(900, 120),
  [System.Drawing.Point]::new(1010, 250),
  [System.Drawing.Point]::new(1110, 178)
)

$routeDotBrush = New-Object System.Drawing.SolidBrush($accentCoral)
$graphics.FillEllipse($routeDotBrush, 762, 175, 16, 16)
$graphics.FillEllipse($routeDotBrush, 1100, 170, 16, 16)

$floatingCardPath = New-RoundedRectanglePath -X 760 -Y 252 -Width 354 -Height 228 -Radius 28
$floatingCardBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(154, 7, 28, 70))
$floatingCardPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(90, 255, 255, 255), 1.2)
$graphics.FillPath($floatingCardBrush, $floatingCardPath)
$graphics.DrawPath($floatingCardPen, $floatingCardPath)

$floatingTitleFont = New-Object System.Drawing.Font("Segoe UI Semibold", 24, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$floatingBodyFont = New-Object System.Drawing.Font("Segoe UI", 18, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$graphics.DrawString(
  "Sua viagem com menos medo",
  $floatingTitleFont,
  $titleBrush,
  [System.Drawing.PointF]::new(794, 292)
)

$graphics.DrawString(
  "Atendimento em portugues, apoio antes da reserva e orientacao clara sobre bagagem e conexoes.",
  $floatingBodyFont,
  $subtitleBrush,
  [System.Drawing.RectangleF]::new(794, 340, 280, 82)
)

$graphics.DrawString(
  "www.michelstravel.agency",
  $footerFont,
  $footerBrush,
  [System.Drawing.PointF]::new(794, 434)
)

$bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$floatingBodyFont.Dispose()
$floatingTitleFont.Dispose()
$footerFont.Dispose()
$chipFont.Dispose()
$subtitleFont.Dispose()
$titleFont.Dispose()
$eyebrowFont.Dispose()
$footerBrush.Dispose()
$subtitleBrush.Dispose()
$titleBrush.Dispose()
$eyebrowBrush.Dispose()
$accentBrush.Dispose()
$floatingCardPen.Dispose()
$floatingCardBrush.Dispose()
$floatingCardPath.Dispose()
$routeDotBrush.Dispose()
$pathPen.Dispose()
$logoShellPen.Dispose()
$logoShellBrush.Dispose()
$logoShellPath.Dispose()
$panelBorderPen.Dispose()
$panelBrush.Dispose()
$panelShadowBrush.Dispose()
$panelShadowPath.Dispose()
$panelPath.Dispose()
$rightGlow.Dispose()
$leftGlow.Dispose()
$fullOverlay.Dispose()
$logoImage.Dispose()
$backgroundImage.Dispose()
$graphics.Dispose()
$bitmap.Dispose()
