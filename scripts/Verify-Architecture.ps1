$ErrorActionPreference = 'Stop'

$databaseConfig = Get-Content -LiteralPath 'apps/api/src/database/database.config.ts' -Raw
if ($databaseConfig -notmatch 'synchronize:\s*false') { throw 'TypeORM synchronize must remain false.' }

$migrationCount = (Get-ChildItem -LiteralPath 'apps/api/src/database/migrations' -Filter '*.ts').Count
if ($migrationCount -lt 1) { throw 'At least one committed TypeORM migration is required.' }

$packageText = Get-Content -LiteralPath 'apps/api/package.json' -Raw
foreach ($forbidden in @('bullmq', 'ioredis', '@nestjs/jwt', 'passport')) {
  if ($packageText -match [regex]::Escape('"' + $forbidden + '"')) { throw "Deferred dependency is forbidden in this Demo: $forbidden" }
}

$service = Get-Content -LiteralPath 'apps/api/src/referrals/referrals.service.ts' -Raw
if ($service -notmatch 'dataSource\.transaction') { throw 'Referral acceptance must use a DataSource transaction.' }
if ($service -match 'JSON\.stringify\(\{[^\r\n]*\b(email|input)\s*:') { throw 'Referral logs must not include full email fields.' }

Write-Output 'Architecture constraints passed.'
