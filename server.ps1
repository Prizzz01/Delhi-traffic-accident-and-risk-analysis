# Robust Local HTTP Server for Delhi Traffic Dashboard
param(
    [int]$Port = 8080,
    [string]$Directory = $PSScriptRoot
)

if ([string]::IsNullOrWhiteSpace($Directory)) {
    $Directory = (Get-Location).Path
}

$Directory = [System.IO.Path]::GetFullPath($Directory)

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".csv"  = "text/csv; charset=utf-8"
    ".txt"  = "text/plain; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)

try {
    $listener.Start()
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host " 🚦 Delhi Traffic Analytics Platform Live on Localhost" -ForegroundColor Green
    Write-Host " Local URL : http://localhost:$Port/" -ForegroundColor Yellow
    Write-Host " Directory : $Directory" -ForegroundColor Gray
    Write-Host " Theme     : Twilight Plum (#190019, #2B124C, #522B5B, #854F6C, #DFB6B2, #FBE4D8)" -ForegroundColor Magenta
    Write-Host "============================================================" -ForegroundColor Cyan

    while ($true) {
        $client = $listener.AcceptTcpClient()
        try {
            $stream = $client.GetStream()
            $stream.ReadTimeout = 1500
            $stream.WriteTimeout = 1500
            $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 4096, $true)
            $requestLine = $reader.ReadLine()

            if ([string]::IsNullOrWhiteSpace($requestLine)) {
                $client.Close()
                continue
            }

            # Drain headers
            try {
                while ($true) {
                    $headerLine = $reader.ReadLine()
                    if ([string]::IsNullOrWhiteSpace($headerLine)) { break }
                }
            } catch {}

            $parts = $requestLine.Split(' ')
            if ($parts.Length -lt 2) {
                $client.Close()
                continue
            }

            $rawPath = $parts[1].Split('?')[0]
            $rawPath = [System.Uri]::UnescapeDataString($rawPath).TrimStart('/')

            if ([string]::IsNullOrWhiteSpace($rawPath)) {
                $rawPath = "index.html"
            }

            $targetPath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($Directory, $rawPath))

            if ($targetPath.StartsWith($Directory) -and [System.IO.File]::Exists($targetPath)) {
                $ext = [System.IO.Path]::GetExtension($targetPath).ToLower()
                $contentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
                $fileBytes = [System.IO.File]::ReadAllBytes($targetPath)

                $headerText = "HTTP/1.1 200 OK`r`n" +
                              "Content-Type: $contentType`r`n" +
                              "Content-Length: $($fileBytes.Length)`r`n" +
                              "Access-Control-Allow-Origin: *`r`n" +
                              "Cache-Control: no-cache, no-store, must-revalidate`r`n" +
                              "Connection: close`r`n`r`n"

                $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headerText)
                $stream.Write($headerBytes, 0, $headerBytes.Length)
                $stream.Write($fileBytes, 0, $fileBytes.Length)
                $stream.Flush()
            } else {
                $notFoundBody = [System.Text.Encoding]::UTF8.GetBytes("<h1>404 Not Found</h1><p>Resource '$rawPath' was not found.</p>")
                $headerText = "HTTP/1.1 404 Not Found`r`n" +
                              "Content-Type: text/html; charset=utf-8`r`n" +
                              "Content-Length: $($notFoundBody.Length)`r`n" +
                              "Connection: close`r`n`r`n"

                $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headerText)
                $stream.Write($headerBytes, 0, $headerBytes.Length)
                $stream.Write($notFoundBody, 0, $notFoundBody.Length)
                $stream.Flush()
            }
        } catch {
            # Client disconnected
        } finally {
            $client.Close()
        }
    }
} finally {
    $listener.Stop()
    Write-Host "Server stopped." -ForegroundColor Red
}
