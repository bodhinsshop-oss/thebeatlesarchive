param(
  [Parameter(Mandatory=$true)] [string]$FtpHost,
  [Parameter(Mandatory=$true)] [string]$Username,
  [Parameter(Mandatory=$true)] [string]$Password,
  [Parameter(Mandatory=$true)] [string]$LocalPath,
  [Parameter(Mandatory=$false)] [string]$RemotePath = "/"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Ensure TLS 1.2 for FTPS
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

if (!(Test-Path -Path $LocalPath)) { throw "LocalPath not found: $LocalPath" }

function Upload-File {
  param(
    [string]$LocalFile,
    [string]$RemoteFile
  )
  $uri = "ftp://$FtpHost$RemoteFile"
  $request = [System.Net.FtpWebRequest]::Create($uri)
  $request.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
  $request.Credentials = New-Object System.Net.NetworkCredential($Username, $Password)
  $request.EnableSsl = $true
  $request.UsePassive = $true
  $request.Proxy = $null

  $content = [System.IO.File]::ReadAllBytes($LocalFile)
  $request.ContentLength = $content.Length

  $requestStream = $request.GetRequestStream()
  $requestStream.Write($content, 0, $content.Length)
  $requestStream.Close()

  $response = $request.GetResponse()
  $response.Close()
}

function Ensure-RemoteDirectory {
  param(
    [string]$RemoteDir
  )
  # Attempt MKD; ignore error if exists
  $uri = "ftp://$FtpHost$RemoteDir"
  $request = [System.Net.FtpWebRequest]::Create($uri)
  $request.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
  $request.Credentials = New-Object System.Net.NetworkCredential($Username, $Password)
  $request.EnableSsl = $true
  $request.UsePassive = $true
  $request.Proxy = $null
  try { $request.GetResponse() | Out-Null } catch { }
}

Write-Host "Deploying via FTP to $FtpHost $RemotePath" -ForegroundColor Cyan

$root = (Resolve-Path $LocalPath).Path
Get-ChildItem -Path $root -Recurse -File | ForEach-Object {
  $rel = $_.FullName.Substring($root.Length).TrimStart('\\')
  $relUnix = $rel -replace "\\", "/"
  $remoteFile = ($RemotePath.TrimEnd('/')) + "/" + $relUnix
  $remoteDir = (Split-Path -Path $remoteFile -Parent) -replace "\\", "/"
  Ensure-RemoteDirectory -RemoteDir $remoteDir
  Write-Host ("→ " + $relUnix) -ForegroundColor Gray
  Upload-File -LocalFile $_.FullName -RemoteFile $remoteFile
}

Write-Host "FTP deploy complete." -ForegroundColor Green
