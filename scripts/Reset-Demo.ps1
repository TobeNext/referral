$ErrorActionPreference = 'Stop'
$volume = 'referral-demo-data'
$exists = docker volume ls --format '{{.Name}}' | Where-Object { $_ -eq $volume }
if (-not $exists) {
  Write-Output 'The dedicated Demo volume does not exist; stopping containers only.'
  docker compose down
  exit $LASTEXITCODE
}
$project = docker volume inspect $volume --format '{{ index .Labels "com.docker.compose.project" }}'
if ($project -ne 'referral-demo') { throw "Refusing to remove volume '$volume': unexpected Compose project '$project'." }
Write-Output "Removing only dedicated Compose volume: $volume"
docker compose down -v
exit $LASTEXITCODE
