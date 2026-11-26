# Rebuild the static 1200x630 social card using original vector-like drawing commands.
# Requires Windows System.Drawing; writes only assets/social-preview.png in this project.
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$assetDir = Join-Path $root 'assets'
New-Item -ItemType Directory -Force -Path $assetDir | Out-Null
$bitmap = [Drawing.Bitmap]::new(1200,630)
$g = [Drawing.Graphics]::FromImage($bitmap)
$g.SmoothingMode = 'AntiAlias'
$g.TextRenderingHint = 'AntiAliasGridFit'
function Brush($hex) { [Drawing.SolidBrush]::new([Drawing.ColorTranslator]::FromHtml($hex)) }
function Rect($x,$y,$w,$h,$color) { $b=Brush $color; $g.FillRectangle($b,$x,$y,$w,$h); $b.Dispose() }
function Ellipse($x,$y,$w,$h,$color,$outline=$true) { $b=Brush $color; $g.FillEllipse($b,$x,$y,$w,$h); $b.Dispose(); if($outline){$p=[Drawing.Pen]::new([Drawing.ColorTranslator]::FromHtml('#20262a'),5);$g.DrawEllipse($p,$x,$y,$w,$h);$p.Dispose()} }
function Line($x,$y,$xx,$yy,$color,$width=5) { $p=[Drawing.Pen]::new([Drawing.ColorTranslator]::FromHtml($color),$width);$p.StartCap='Round';$p.EndCap='Round';$g.DrawLine($p,$x,$y,$xx,$yy);$p.Dispose() }
function Label($text,$x,$y,$size,$color) { $font=[Drawing.Font]::new('Arial',$size,[Drawing.FontStyle]::Bold,[Drawing.GraphicsUnit]::Pixel);$b=Brush $color;$g.DrawString($text,$font,$b,$x,$y);$b.Dispose();$font.Dispose() }
try {
 Rect 0 0 1200 630 '#191e24'
 Rect 585 0 615 630 '#a2c3c5'
 Ellipse 1105 47 115 115 '#ffe5a0' $false
 foreach($tree in @(@(615,165),@(1030,145),@(1140,210))){
  $x=$tree[0];$y=$tree[1];Line ($x+40) ($y+200) ($x+40) $y '#71523b' 17
  Ellipse ($x-35) ($y-45) 115 112 '#bd633c';Ellipse ($x+25) ($y-70) 110 105 '#e8b650';Ellipse ($x+43) ($y+5) 105 100 '#d7863c'
 }
 Rect 585 440 615 190 '#858951'
 # Neighbor is drawn first, then occluded by the fence.
 Ellipse 1067 267 65 80 '#e7b584'
 Rect 1066 260 68 16 '#d7c39d';Rect 1077 243 47 25 '#d7c39d'
 Line 1058 278 1140 278 '#20262a' 6
 Ellipse 1082 294 6 8 '#20262a' $false;Ellipse 1107 294 6 8 '#20262a' $false
 Ellipse 1094 315 10 13 '#65453c'
 for($x=588;$x -lt 1200;$x+=47){Rect $x 335 43 155 '#a1815e';Line $x 335 $x 489 '#20262a' 4;Line ($x+14) 353 ($x+14) 474 '#8e7051' 2}
 Line 585 405 1200 405 '#70593f' 9
 Ellipse 1055 331 25 16 '#e7b584';Ellipse 1122 331 25 16 '#e7b584'
 # Hoist, rope, suspended roast and fluid-filled pot.
 Line 664 554 705 83 '#20262a' 21;Line 1022 554 979 83 '#20262a' 21;Line 705 83 979 83 '#20262a' 21
 Line 664 554 705 83 '#9aa5a3' 12;Line 1022 554 979 83 '#9aa5a3' 12;Line 705 83 979 83 '#9aa5a3' 12
 Ellipse 827 67 32 32 '#d4a85d';Line 843 99 843 171 '#dfc599' 5
 Ellipse 791 170 105 126 '#e5ac74';Ellipse 775 230 36 53 '#e5ac74';Ellipse 878 230 36 53 '#e5ac74'
 Line 794 272 787 307 '#f1dfba' 10;Line 895 272 903 307 '#f1dfba' 10
 Ellipse 776 302 23 12 '#f1dfba';Ellipse 893 302 23 12 '#f1dfba'
 Line 824 193 810 217 '#f6cc91' 5
 Ellipse 706 547 276 31 '#68754c' $false
 Rect 725 373 237 162 '#20262a';Rect 731 379 225 150 '#6a8288'
 Rect 734 439 219 86 '#dba53e';Line 733 437 954 437 '#efc75c' 5
 Line 728 375 959 375 '#c3d0ce' 7;Line 740 388 740 511 '#b3cbcb' 3
 Line 773 540 760 568 '#20262a' 9;Line 916 540 930 568 '#20262a' 9
 for($i=0;$i -lt 5;$i++){Ellipse (785+$i*24) 530 17 23 '#f6ba58'}
 foreach($bubble in @(@(758,420,9),@(799,397,12),@(901,413,10),@(933,348,8),@(749,342,7))){Ellipse $bubble[0] $bubble[1] $bubble[2] $bubble[2] '#dba53e'}
 # High contrast text keeps the card legible in small social previews.
 Rect 0 0 585 630 '#191e24'
 Label 'A BACKYARD COOKING INCIDENT' 48 65 18 '#a9b0b2'
 Label 'FOWL' 42 112 96 '#f3ebdb'
 Label 'PLAY' 42 207 96 '#ffd267'
 Label 'Lower the turkey.' 48 357 37 '#f3ebdb'
 Label 'Raise the stakes.' 48 406 37 '#ffd267'
 Rect 48 504 259 53 '#ffd267'
 Label 'PLAY IN YOUR BROWSER' 62 520 18 '#191e24'
 Label 'dulanyw.github.io/fowlplay' 48 586 18 '#a9b0b2'
 $bitmap.Save((Join-Path $assetDir 'social-preview.png'),[Drawing.Imaging.ImageFormat]::Png)
} finally { $g.Dispose();$bitmap.Dispose() }
