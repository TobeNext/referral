$ErrorActionPreference = 'Stop'
$baseUrl = 'http://127.0.0.1:3000'

function Get-Json([string] $Path) {
  $text = curl.exe --noproxy '*' --fail --silent --show-error "$baseUrl$Path"
  if ($LASTEXITCODE -ne 0) { throw "Request failed: $Path" }
  return $text | ConvertFrom-Json
}

$health = Get-Json '/api/health'
if ($health.status -ne 'ok' -or $health.database -ne 'up') { throw 'Health contract mismatch.' }

$swagger = Get-Json '/api/docs-json'
$requiredPaths = @('/api/health', '/api/demo/inviter', '/api/users/{userId}/invitation', '/api/invitations/{code}', '/api/invitations/{code}/accept', '/api/users/{userId}/referral-summary')
foreach ($path in $requiredPaths) {
  if (-not $swagger.paths.PSObject.Properties.Name.Contains($path)) { throw "Swagger path missing: $path" }
}

$summary = Get-Json '/api/demo/inviter'
if ($summary.creditBalance -ne (($summary.referrals | Measure-Object -Property rewardCredits -Sum).Sum ?? 0)) {
  throw 'Visible referral rewards do not equal the inviter balance.'
}

Write-Output "Running Demo verification passed. Balance=$($summary.creditBalance), referrals=$($summary.successfulReferralCount)."
