# ==============================================================================
# NEXUS ENTERPRISE ERP — FRONTEND WEB SERVER (Port 8080)
# ==============================================================================
param([int]$Port = 8080)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = $ScriptDir

$Listener = New-Object System.Net.HttpListener
$Listener.Prefixes.Add("http://localhost:$Port/")

try {
    $Listener.Start()
} catch {
    Write-Host "[ERROR] Could not bind to port $Port. Is it already in use?" -ForegroundColor Red
    exit 1
}

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "  NEXUS ENTERPRISE ERP — FRONTEND WEB APPLICATION ONLINE                " -ForegroundColor Yellow
Write-Host "  URL: http://localhost:$Port/                                           " -ForegroundColor Green
Write-Host "  Backend API Gateway: Connected via js/config.js (Default: :3000)      " -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan

$mimeMap = @{
    '.html' = 'text/html; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.svg'  = 'image/svg+xml'
    '.ico'  = 'image/x-icon'
    '.webp' = 'image/webp'
}

Start-Process "http://localhost:$Port/"

while ($Listener.IsListening) {
    try {
        $Context = $Listener.GetContext()
        $Request = $Context.Request
        $Response = $Context.Response

        $Path = $Request.Url.AbsolutePath
        if ($Path -eq '/' -or [string]::IsNullOrWhiteSpace($Path)) {
            $Path = '/index.html'
        }

        $FilePath = Join-Path $Root ($Path.TrimStart('/').Replace('/', '\'))

        if (Test-Path $FilePath -PathType Leaf) {
            $Ext = [System.IO.Path]::GetExtension($FilePath).ToLower()
            $ContentType = if ($mimeMap.ContainsKey($Ext)) { $mimeMap[$Ext] } else { 'application/octet-stream' }
            $Response.ContentType = $ContentType
            $Response.AddHeader('Access-Control-Allow-Origin', '*')

            $Bytes = [System.IO.File]::ReadAllBytes($FilePath)
            $Response.ContentLength64 = $Bytes.Length
            $Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
            $Response.StatusCode = 200
        } else {
            $Response.StatusCode = 404
        }
        $Response.OutputStream.Close()
    } catch {}
}
