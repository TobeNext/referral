$ErrorActionPreference = 'Stop'
$baseUrl = 'http://127.0.0.1:3000'

function Invoke-Json([string] $Method, [string] $Path, [string] $Body = '', [string] $Token = '') {
  $arguments = @('--noproxy', '*', '--fail', '--silent', '--show-error', '-X', $Method, '-H', 'Content-Type: application/json')
  if ($Token) { $arguments += @('-H', "Authorization: Bearer $Token") }
  if ($Body) { $arguments += @('--data', $Body) }
  $arguments += "$baseUrl$Path"
  $text = & curl.exe @arguments
  if ($LASTEXITCODE -ne 0) { throw "Request failed: $Method $Path" }
  return $text | ConvertFrom-Json
}

$health = Invoke-Json 'GET' '/api/health'
if ($health.status -ne 'ok' -or $health.database -ne 'up') { throw 'Health contract mismatch.' }

$swagger = Invoke-Json 'GET' '/api/docs-json'
$requiredPaths = @('/api/health', '/api/auth/login', '/api/auth/me', '/api/auth/reset-password', '/api/users/me/invitation', '/api/invitations/{token}', '/api/invitations/{token}/accept', '/api/users/me/referral-summary')
foreach ($path in $requiredPaths) {
  if (-not $swagger.paths.PSObject.Properties.Name.Contains($path)) { throw "Swagger path missing: $path" }
}

$demoPassword = if ($env:DEMO_INVITER_PASSWORD) { $env:DEMO_INVITER_PASSWORD } else { 'AliceDemo1234' }
$loginBody = @{ email = 'alice@example.com'; password = $demoPassword } | ConvertTo-Json -Compress
$login = Invoke-Json 'POST' '/api/auth/login' $loginBody
if (-not $login.accessToken -or $login.user.mustResetPassword) { throw 'Alice login contract mismatch.' }

$summary = Invoke-Json 'GET' '/api/users/me/referral-summary' '' $login.accessToken
$visibleReward = ($summary.referrals | Measure-Object -Property rewardCredits -Sum).Sum
if ($null -eq $visibleReward) { $visibleReward = 0 }
if ($summary.creditBalance -ne $visibleReward) { throw 'Visible referral rewards do not equal the inviter balance.' }

$invitation = Invoke-Json 'POST' '/api/users/me/invitation' '' $login.accessToken
if ($invitation.token -notmatch '^[A-HJ-NP-Z2-9]{12}$' -or $invitation.path -ne "/i/$($invitation.token)") { throw 'Opaque invitation token contract mismatch.' }

Write-Output "Running Demo verification passed. User=$($login.user.email), balance=$($summary.creditBalance), referrals=$($summary.successfulReferralCount), invitationPath=$($invitation.path)."
