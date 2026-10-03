# Export the actual game frames without changing their pivot between animation states.
param([string]$GameRoot = 'C:/OneStep/tiny_defense')
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$repo = Split-Path $PSScriptRoot -Parent
$source = Join-Path $GameRoot 'Assets/Resources/TinyDefense'
$output = Join-Path $repo 'assets/world/combat'
New-Item -ItemType Directory -Force -Path $output | Out-Null
$manifest = [ordered]@{ version = 1; actors = [ordered]@{}; effects = [ordered]@{} }
$definitions = @(
    @{ id='guardian'; path='Units/Characters/NightSkins/guardian/'; hero=$true; hp=594; damage=36; reduction=.5; interval=.65; hitFrame=2; size=190; speed=116 },
    @{ id='spear-goblin'; path='Units/Monsters/Base/MonSpearGoblin'; hero=$false; hp=55; damage=8; reduction=0; interval=1; hitFrame=3; size=127; speed=80 },
    @{ id='torch-goblin'; path='Units/Monsters/Base/MonTorchGoblin'; hero=$false; hp=45; damage=9; reduction=0; interval=.9; hitFrame=4; size=119; speed=128 },
    @{ id='gnome'; path='Units/Monsters/Base/MonGnome'; hero=$false; hp=26; damage=5; reduction=0; interval=.9; hitFrame=3; size=101; speed=136 }
)
foreach ($definition in $definitions) {
    $states = [ordered]@{}
    foreach ($state in @('Idle','Run','Attack')) {
        $relative = $definition.path + $state + '.png'
        $file = Join-Path $source $relative
        $image = [System.Drawing.Bitmap]::FromFile($file)
        $cell = $image.Height
        $count = [int]($image.Width / $cell)
        $atlas = New-Object System.Drawing.Bitmap ($count * 192), 192
        $graphics = [System.Drawing.Graphics]::FromImage($atlas)
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.DrawImage($image, 0, 0, $atlas.Width, $atlas.Height)
        $name = $definition.id + '-' + $state.ToLowerInvariant() + '.png'
        $atlas.Save((Join-Path $output $name), [System.Drawing.Imaging.ImageFormat]::Png)
        if ($state -eq 'Idle') {
            # One fixed foot anchor from the idle frame; weapons never rescale the body.
            $foot = 0
            for ($y=0; $y -lt 192; $y++) {
                for ($x=0; $x -lt 192; $x++) {
                    if ($atlas.GetPixel($x,$y).A -ge 32) { $foot=$y }
                }
            }
            $anchor = ($foot + 1) / 192
        }
        $states[$state.ToLowerInvariant()] = [ordered]@{ file=$name; frames=$count; cell=192; source=$relative; sha256=(Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant() }
        $graphics.Dispose(); $atlas.Dispose(); $image.Dispose()
    }
    $actor = [ordered]@{ hero=$definition.hero; hp=$definition.hp; damage=$definition.damage; reduction=$definition.reduction; interval=$definition.interval; hitFrame=$definition.hitFrame; size=$definition.size; speed=$definition.speed; fps=12; anchor=$anchor; states=$states }
    $manifest.actors[$definition.id] = $actor
}
foreach ($effect in @(@{id='slash'; path='FX/HeroAttack/guardian.png'; frames=8; fps=24}, @{id='spark'; path='FX/HitSpark.png'; frames=1; fps=1})) {
    $file = Join-Path $source $effect.path
    Copy-Item -LiteralPath $file -Destination (Join-Path $output ($effect.id+'.png'))
    $manifest.effects[$effect.id] = [ordered]@{ file=($effect.id+'.png'); frames=$effect.frames; fps=$effect.fps; source=$effect.path; sha256=(Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant() }
}
$json = $manifest | ConvertTo-Json -Depth 8
[System.IO.File]::WriteAllText((Join-Path $output 'manifest.json'), $json + "`n", (New-Object System.Text.UTF8Encoding $false))
Write-Output 'Exported game idle/run/attack frames, guardian strike and hit spark for the night encounter.'
