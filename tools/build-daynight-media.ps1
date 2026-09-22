#Requires -Version 5.1
<#
.SYNOPSIS
    Builds the day/night section media (10 MP4 clips + 10 WebP posters) and the
    lobby BGM track for the Tiny Defense game page.

.DESCRIPTION
    Reproducible asset pipeline. Reads raw capture clips and the lobby BGM from the
    Tiny Defense game project, transcodes them to web budgets, and writes the results
    into this repository under assets/daynight/ and assets/audio/.

    Video : 540x960, 30fps, H.264 crf 32 preset slow, yuv420p, +faststart, NO AUDIO TRACK.
            The audio track is removed on purpose: it is a precondition for muted
            autoplay and it must never fight the lobby BGM player.
    Poster: single frame taken from the MIDDLE of each encoded clip, WebP quality 80.
            The first frame is a fade-in and is often black, so the midpoint is used.
    Audio : MP3 128 kbps / 44.1 kHz / stereo.

    Budget: each MP4 <= 1.2 MB, all 10 MP4s <= 6 MB. If the budget is exceeded the
    fix is NOT a higher crf (it smears the pixel art) but trimming the one long clip:
        -TrimSeconds @{ 'night-02-defense' = 6 }

.PARAMETER RawClipsDir
    Folder holding the raw 1080x1920 capture clips.

.PARAMETER AudioSource
    The lobby BGM source file (secret_of_beautiful_forest.mp3).

.PARAMETER RepoRoot
    Repository root. Defaults to the parent of the folder holding this script.

.PARAMETER Only
    'all' (default), 'video' or 'audio'.

.PARAMETER TrimSeconds
    Hashtable of slug -> seconds. Listed clips are cut to their first N seconds.

.PARAMETER AudioFade
    Adds a 0.3 s fade-in and a 1.0 s fade-out to the BGM.
    OFF by default, and that default is a measurement, not a guess: the source ends
    with 2.70 s of digital silence (silencedetect: silence_start 88.86 -> EOF) and
    starts below -60 dBFS for its first 28 ms (first 5 ms peak -84.5 dBFS). There is
    no amplitude step at the loop seam, so a fade has nothing to smooth.
    Run with -ReportSeam to re-measure before changing this.

.PARAMETER ReportSeam
    Measures head/tail amplitude of the produced MP3 and prints it. This is the
    evidence for the -AudioFade decision.

.EXAMPLE
    pwsh -File tools/build-daynight-media.ps1
.EXAMPLE
    pwsh -File tools/build-daynight-media.ps1 -Only video -TrimSeconds @{ 'night-02-defense' = 6 }
#>
[CmdletBinding()]
param(
    [string]$RawClipsDir = 'C:\OneStep\tiny_defense\output\marketing\youtube-shorts\2026-08-04\raw_clips',
    [string]$AudioSource = 'C:\OneStep\tiny_defense\Assets\Resources\TinyDefense\Audio\secret_of_beautiful_forest.mp3',
    [string]$RepoRoot,
    [ValidateSet('all', 'video', 'audio')]
    [string]$Only = 'all',
    [hashtable]$TrimSeconds = @{},
    [switch]$AudioFade,
    [switch]$ReportSeam
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# --- constants -------------------------------------------------------------
$VideoWidth      = 540
$VideoHeight     = 960
$VideoFps        = 30
$VideoCrf        = 32
$VideoPreset     = 'slow'
$PosterQuality   = 80
$AudioBitrate    = '128k'
$AudioRate       = 44100
$AudioChannels   = 2
$PerClipBudgetKB = 1229   # 1.2 MB
$TotalBudgetKB   = 6144   # 6 MB

# Slug contract. plan.md section 16 is the source of truth; these slugs are also
# hard-coded in the page markup, so do not rename them here alone.
$Clips = @(
    [pscustomobject]@{ Slug = 'day-01-gather';    Source = 'day_gather.mp4' }
    [pscustomobject]@{ Slug = 'day-02-memory';    Source = 'day_resource_minigame.mp4' }
    [pscustomobject]@{ Slug = 'day-03-tool';      Source = 'tool_upgrade.mp4' }
    [pscustomobject]@{ Slug = 'day-04-village';   Source = 'day_peace.mp4' }
    [pscustomobject]@{ Slug = 'day-05-relic';     Source = 'relic_select.mp4' }
    [pscustomobject]@{ Slug = 'night-01-deploy';  Source = 'unit_deploy.mp4' }
    [pscustomobject]@{ Slug = 'night-02-defense'; Source = 'guardian_defense.mp4' }
    [pscustomobject]@{ Slug = 'night-03-hero';    Source = 'hero_skill.mp4' }
    [pscustomobject]@{ Slug = 'night-04-duel';    Source = 'boss_duel.mp4' }
    [pscustomobject]@{ Slug = 'night-05-season';  Source = 'season_gate.mp4' }
)

# --- helpers ---------------------------------------------------------------
function Assert-Tool {
    param([string]$Name)
    $cmd = Get-Command $Name -ErrorAction SilentlyContinue
    if (-not $cmd) {
        throw "$Name not found on PATH. Install ffmpeg (expected at C:\ffmpeg\bin) and retry."
    }
    return $cmd.Source
}

function Assert-Path {
    param([string]$Path, [string]$What)
    if (-not (Test-Path -LiteralPath $Path)) {
        throw "$What not found: $Path"
    }
    return (Resolve-Path -LiteralPath $Path).Path
}

function Invoke-FF {
    param([string]$Exe, [string[]]$FFArgs)
    Write-Verbose "$Exe $($FFArgs -join ' ')"
    $output = & $Exe @FFArgs 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "$Exe failed (exit $LASTEXITCODE):`n$($output -join "`n")"
    }
    return $output
}

function Get-MediaDuration {
    param([string]$Path)
    $raw = & $script:FFprobe -v error -show_entries format=duration -of csv=p=0 -- $Path
    if ($LASTEXITCODE -ne 0) { throw "ffprobe could not read duration of $Path" }
    return [double]::Parse(($raw | Select-Object -First 1).Trim(), [Globalization.CultureInfo]::InvariantCulture)
}

function Measure-Level {
    <# Peak/RMS dBFS of a slice, via ffmpeg astats. #>
    param([string]$Path, [double]$Start = 0, [double]$Duration = 0)
    $ffArgs = @('-hide_banner', '-nostats')
    if ($Start -gt 0) { $ffArgs += @('-ss', ('{0}' -f $Start)) }
    $ffArgs += @('-i', $Path)
    $filter = 'astats=measure_perchannel=none'
    if ($Duration -gt 0) { $filter = ('atrim=0:{0},' -f $Duration) + $filter }
    $ffArgs += @('-af', $filter, '-f', 'null', '-')
    $out = & $script:FFmpeg @ffArgs 2>&1
    $peak = ($out | Select-String -Pattern 'Peak level dB:\s*(\S+)').Matches.Groups[1].Value
    $rms  = ($out | Select-String -Pattern 'RMS level dB:\s*(\S+)').Matches.Groups[1].Value
    return [pscustomobject]@{ Peak = $peak; Rms = $rms }
}

# --- setup -----------------------------------------------------------------
$script:FFmpeg  = Assert-Tool 'ffmpeg'
$script:FFprobe = Assert-Tool 'ffprobe'

if (-not $RepoRoot) { $RepoRoot = Split-Path -Parent $PSScriptRoot }
$RepoRoot = Assert-Path $RepoRoot 'Repository root'

$VideoOutDir = Join-Path $RepoRoot 'assets\daynight'
$AudioOutDir = Join-Path $RepoRoot 'assets\audio'

Write-Host "repo      : $RepoRoot"
Write-Host "ffmpeg    : $script:FFmpeg"

# --- video -----------------------------------------------------------------
if ($Only -in @('all', 'video')) {
    $RawClipsDir = Assert-Path $RawClipsDir 'Raw clips folder'
    Write-Host "raw clips : $RawClipsDir"

    # Fail before encoding anything if a single source is missing.
    $missing = @()
    foreach ($clip in $Clips) {
        if (-not (Test-Path -LiteralPath (Join-Path $RawClipsDir $clip.Source))) { $missing += $clip.Source }
    }
    if ($missing.Count -gt 0) {
        throw "Missing source clip(s) in ${RawClipsDir}: $($missing -join ', ')"
    }

    if (-not (Test-Path -LiteralPath $VideoOutDir)) {
        New-Item -ItemType Directory -Path $VideoOutDir -Force | Out-Null
    }

    $results = @()
    foreach ($clip in $Clips) {
        $src      = Join-Path $RawClipsDir $clip.Source
        $outMp4   = Join-Path $VideoOutDir ($clip.Slug + '.mp4')
        $outWebp  = Join-Path $VideoOutDir ($clip.Slug + '.webp')
        $trim     = if ($TrimSeconds.ContainsKey($clip.Slug)) { [double]$TrimSeconds[$clip.Slug] } else { 0 }

        $ffArgs = @('-y', '-hide_banner', '-v', 'error', '-i', $src)
        if ($trim -gt 0) { $ffArgs += @('-t', ('{0}' -f $trim)) }
        $ffArgs += @(
            '-an',                                              # drop audio: autoplay + no clash with lobby BGM
            '-vf', ('scale={0}:{1}:flags=lanczos' -f $VideoWidth, $VideoHeight),
            '-r', "$VideoFps",
            '-c:v', 'libx264',
            '-crf', "$VideoCrf",
            '-preset', $VideoPreset,
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart',
            '-map_metadata', '-1',
            '-map_chapters', '-1',   # sources carry a QT chapter track we do not copy
            $outMp4
        )
        Invoke-FF -Exe $script:FFmpeg -FFArgs $ffArgs | Out-Null

        # Poster from the MIDPOINT of the encoded clip (first frame is a fade-in).
        $dur = Get-MediaDuration -Path $outMp4
        $mid = [math]::Round($dur / 2.0, 3)
        $posterArgs = @(
            '-y', '-hide_banner', '-v', 'error',
            '-ss', ('{0}' -f $mid),
            '-i', $outMp4,
            '-frames:v', '1',
            '-c:v', 'libwebp',
            '-quality', "$PosterQuality",
            '-compression_level', '6',
            $outWebp
        )
        Invoke-FF -Exe $script:FFmpeg -FFArgs $posterArgs | Out-Null

        $mp4Kb  = [math]::Round((Get-Item -LiteralPath $outMp4).Length / 1KB, 1)
        $webpKb = [math]::Round((Get-Item -LiteralPath $outWebp).Length / 1KB, 1)
        $results += [pscustomobject]@{
            Slug     = $clip.Slug
            Seconds  = [math]::Round($dur, 2)
            PosterAt = $mid
            Mp4KB    = $mp4Kb
            WebpKB   = $webpKb
            OverBudget = ($mp4Kb -gt $PerClipBudgetKB)
        }
        Write-Host ("  {0,-16} {1,6:N2}s  mp4 {2,7:N1} KB  poster {3,6:N1} KB @ {4}s" -f `
            $clip.Slug, $dur, $mp4Kb, $webpKb, $mid)
    }

    $totalMp4  = ($results | Measure-Object -Property Mp4KB  -Sum).Sum
    $totalWebp = ($results | Measure-Object -Property WebpKB -Sum).Sum
    Write-Host ''
    Write-Host ("MP4 total  : {0:N1} KB / {1} KB budget" -f $totalMp4, $TotalBudgetKB)
    Write-Host ("WebP total : {0:N1} KB" -f $totalWebp)
    Write-Host ("Largest MP4: {0:N1} KB / {1} KB per-clip budget" -f (($results | Measure-Object -Property Mp4KB -Maximum).Maximum), $PerClipBudgetKB)

    $over = $results | Where-Object { $_.OverBudget }
    if ($over) {
        Write-Warning ("Over per-clip budget: {0}. Trim instead of raising crf, e.g. -TrimSeconds @{{ 'night-02-defense' = 6 }}" -f (($over.Slug) -join ', '))
    }
    if ($totalMp4 -gt $TotalBudgetKB) {
        Write-Warning "Over total budget. Trim the longest clip; do not raise crf."
    }
}

# --- audio -----------------------------------------------------------------
if ($Only -in @('all', 'audio')) {
    $AudioSource = Assert-Path $AudioSource 'Lobby BGM source'
    Write-Host ''
    Write-Host "bgm source: $AudioSource"

    if (-not (Test-Path -LiteralPath $AudioOutDir)) {
        New-Item -ItemType Directory -Path $AudioOutDir -Force | Out-Null
    }
    $outMp3 = Join-Path $AudioOutDir 'lobby-theme.mp3'
    $srcDur = Get-MediaDuration -Path $AudioSource

    $ffArgs = @('-y', '-hide_banner', '-v', 'error', '-i', $AudioSource, '-vn')
    if ($AudioFade) {
        $fadeOutStart = [math]::Round($srcDur - 1.0, 3)
        $ffArgs += @('-af', ('afade=t=in:st=0:d=0.3,afade=t=out:st={0}:d=1.0' -f $fadeOutStart))
    }
    $ffArgs += @(
        '-c:a', 'libmp3lame',
        '-b:a', $AudioBitrate,
        '-ar', "$AudioRate",
        '-ac', "$AudioChannels",
        '-map_metadata', '-1',
        $outMp3
    )
    Invoke-FF -Exe $script:FFmpeg -FFArgs $ffArgs | Out-Null

    $mp3Kb = [math]::Round((Get-Item -LiteralPath $outMp3).Length / 1KB, 1)
    Write-Host ("  lobby-theme.mp3  {0:N2}s  {1:N1} KB  fade={2}" -f (Get-MediaDuration -Path $outMp3), $mp3Kb, [bool]$AudioFade)

    if ($ReportSeam) {
        $dur  = Get-MediaDuration -Path $outMp3
        $head = Measure-Level -Path $outMp3 -Duration 0.25
        $tail = Measure-Level -Path $outMp3 -Start ([math]::Round($dur - 0.25, 3))
        Write-Host ''
        Write-Host 'Loop seam measurement (evidence for the -AudioFade decision):'
        Write-Host ("  first 0.25s : peak {0} dBFS / rms {1} dBFS" -f $head.Peak, $head.Rms)
        Write-Host ("  last  0.25s : peak {0} dBFS / rms {1} dBFS" -f $tail.Peak, $tail.Rms)
        Write-Host '  A seam only clicks when these two differ by a large step. If both ends'
        Write-Host '  are near silence, -AudioFade changes nothing audible and stays off.'
        & $script:FFmpeg -hide_banner -nostats -i $outMp3 -af 'silencedetect=noise=-60dB:d=0.1' -f null - 2>&1 |
            Select-String -Pattern 'silence_(start|end|duration)' | ForEach-Object { Write-Host "  $_" }
    }
}

Write-Host ''
Write-Host 'done.'
