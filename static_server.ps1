# Simple static file server for frontend UI on port 8080
param([int]$Port = 8080)
$Root = "c:\Users\DELL\Desktop\ERP Landing page"
$Listener = New-Object System.Net.HttpListener
$Listener.Prefixes.Add("http://localhost:$Port/")
$Listener.Start()
Write-Host "Frontend static server listening on http://localhost:$Port/"

$mimeMap = @{
    '.html' = 'text/html; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.svg'  = 'image/svg+xml'
    '.ico'  = 'image/x-icon'
}

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
