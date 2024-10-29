# Exit script on error
$ErrorActionPreference = "Stop"

# Get the current working directory
$currentWorkingDir = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
$envFilePath = Join-Path $currentWorkingDir "..\.env"
$backendFilePath = Join-Path $currentWorkingDir ".."

# Load env vars
if (Test-Path -Path $envFilePath) {
    Get-Content $envFilePath | ForEach-Object {
        if ($_ -match "^\s*([^#\s]+)\s*=\s*(.+?)\s*$") {
            $name = $matches[1]
            $value = $matches[2]
            [System.Environment]::SetEnvironmentVariable($name, $value)
        }
    }
} else {
    Write-Error ".env file not found!"
    exit 1
}

# Update node_modules and build directories
cd $backendFilePath
Remove-Item -Recurse -Force -Path "./build/*"
npm install
npm run compile

# Sync node_modules and build directories with remote
$rsyncPath = Get-Command rsync -ErrorAction SilentlyContinue
if (-not $rsyncPath) {
    Write-Error "rsync command not found. Please install rsync and try again."
    exit 1
}

# Construct the rsync command
$sourcePath = "$backendFilePath\"
$remotePath = "$env:UGRAD_CWL@$env:UGRAD_SERVER:$env:UGRAD_BACKEND_FILE_PATH"
$rsyncCommand = "rsync -avz --delete `"$sourcePath`" `"$remotePath`""

# Execute the rsync command
Invoke-Expression $rsyncCommand
