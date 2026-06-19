# generate-srs-pdf.ps1
# Script to compile srs.html to srs.pdf using headless Google Chrome

$chromePaths = @(
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "$env:LocalAppData\Google\Chrome\Application\chrome.exe",
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "$env:ProgramFiles(x86)\Google\Chrome\Application\chrome.exe"
)

$chromePath = $null
foreach ($path in $chromePaths) {
    if (Test-Path $path) {
        $chromePath = $path
        break
    }
}

if ($null -eq $chromePath) {
    # Try using 'where.exe' to locate chrome
    try {
        $resolved = where.exe chrome 2>$null | Select-Object -First 1
        if ($resolved -and (Test-Path $resolved)) {
            $chromePath = $resolved
        }
    } catch {}
}

if ($null -eq $chromePath) {
    Write-Error "Google Chrome could not be located on this system. Please ensure Chrome is installed."
    exit 1
}

Write-Host "Found Google Chrome at: $chromePath"

$htmlPath = "C:\cyberkavach2.0\srs.html"
$pdfPath = "C:\cyberkavach2.0\srs.pdf"

if (-not (Test-Path $htmlPath)) {
    Write-Error "HTML file not found at: $htmlPath"
    exit 1
}

Write-Host "Compiling $htmlPath to $pdfPath..."

$arguments = @(
    "--headless",
    "--disable-gpu",
    "--print-to-pdf=$pdfPath",
    "--no-margins",
    $htmlPath
)

$process = Start-Process -FilePath $chromePath -ArgumentList $arguments -Wait -NoNewWindow -PassThru

# Give a slight delay to ensure the file handle is released
Start-Sleep -Seconds 2

if (Test-Path $pdfPath) {
    $fileSize = (Get-Item $pdfPath).Length
    if ($fileSize -gt 0) {
        Write-Host "SRS PDF compiled successfully at $pdfPath ($fileSize bytes)"
    } else {
        Write-Warning "PDF file was created but has 0 bytes. Check for Chrome rendering issues."
    }
} else {
    Write-Error "PDF compilation failed. The output file was not created."
    exit 1
}
