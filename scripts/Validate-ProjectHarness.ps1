$ErrorActionPreference = 'Stop'

$required = @(
  '.agents/AGENTS.md',
  '.agents/agents/MainOrchestrator.md',
  '.agents/agents/Planner.md',
  '.agents/agents/Coder.md',
  '.agents/agents/Reviewer.md',
  '.agents/agents/ConstraintVerifier.md',
  '.agents/agents/Maintainer.md',
  '.agents/instructions/code.md',
  '.agents/instructions/unitTest.md',
  '.agents/instructions/business-map.md',
  '.agents/verification/verification-harness.md',
  '.agents/constraints/executable-constraints.md',
  '.agents/skills/observability.md',
  '.agents/maintenance/doc-gardening.md',
  '.agents/maintenance/debt-garbage-collection.md',
  '.github/hooks/project-harness-session.json',
  '.github/hooks/scripts/project-harness-session-guard.mjs'
)

foreach ($path in $required) {
  if (-not (Test-Path -LiteralPath $path)) { throw "Missing required harness file: $path" }
}

$map = Get-Content -LiteralPath '.agents/instructions/business-map.md' -Raw
$refs = [regex]::Matches($map, 'Reference: `([^`]+)`')
if ($refs.Count -eq 0) { throw 'Business map contains no references.' }
foreach ($ref in $refs) {
  if (-not (Test-Path -LiteralPath $ref.Groups[1].Value)) { throw "Broken business reference: $($ref.Groups[1].Value)" }
}

Get-Content -LiteralPath '.github/hooks/project-harness-session.json' -Raw | ConvertFrom-Json | Out-Null
node --check '.github/hooks/scripts/project-harness-session-guard.mjs'
Write-Output 'Project harness validation passed.'
