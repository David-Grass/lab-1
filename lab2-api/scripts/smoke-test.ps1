# Smoke test for lab2-api (PowerShell, no curl required)
# Usage: .\scripts\smoke-test.ps1 [-BaseUrl "http://localhost:3000"]

param(
  [string]$BaseUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Stop"

function Test-Endpoint {
  param(
    [string]$Name,
    [scriptblock]$Action
  )

  Write-Host ""
  Write-Host "=== $Name ===" -ForegroundColor Cyan
  try {
    & $Action
    Write-Host "OK" -ForegroundColor Green
  } catch {
    Write-Host "FAIL: $($_.Exception.Message)" -ForegroundColor Red
    throw
  }
}

Test-Endpoint "Health" {
  $r = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get
  if (-not $r.ok) { throw "Expected ok: true" }
  Write-Host ($r | ConvertTo-Json -Compress)
}

Test-Endpoint "GET /api/users" {
  $r = Invoke-RestMethod -Uri "$BaseUrl/api/users" -Method Get
  Write-Host "total=$($r.total), items=$($r.items.Count)"
}

Test-Endpoint "POST /api/users (valid)" {
  $body = @{ name = "Test User"; email = "test.user@example.com" } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$BaseUrl/api/users" -Method Post -Body $body -ContentType "application/json"
  Write-Host "created id=$($r.id)"
  $script:UserId = $r.id
}

Test-Endpoint "POST /api/reports (valid)" {
  $body = @{
    title       = "CSRF on login form"
    severity    = "Medium"
    status      = "Open"
    description = "Missing CSRF token on login form submission"
    reporter    = "Test User"
  } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$BaseUrl/api/reports" -Method Post -Body $body -ContentType "application/json"
  Write-Host "created id=$($r.id)"
  $script:ReportId = $r.id
}

Test-Endpoint "POST /api/reports (validation 400)" {
  $body = @{
    title       = "ab"
    severity    = "High"
    status      = "Open"
    description = "short"
    reporter    = "D"
  } | ConvertTo-Json
  try {
    Invoke-RestMethod -Uri "$BaseUrl/api/reports" -Method Post -Body $body -ContentType "application/json"
    throw "Expected 400 error"
  } catch {
    $resp = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($resp.error.code -ne "VALIDATION_ERROR") {
      throw "Expected VALIDATION_ERROR, got $($resp.error.code)"
    }
    Write-Host "error.code=$($resp.error.code), details=$($resp.error.details.Count)"
  }
}

Test-Endpoint "GET /api/reports (filter + pagination)" {
  $uri = '{0}/api/reports?severity=High&status=Open&page=1&pageSize=5&sortBy=id&sortDir=desc' -f $BaseUrl
  $r = Invoke-RestMethod -Uri $uri -Method Get
  Write-Host "total=$($r.total), page=$($r.page), pageSize=$($r.pageSize)"
}

if ($script:ReportId) {
  Test-Endpoint "PATCH /api/reports/:id" {
    $body = @{ status = "InProgress" } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$BaseUrl/api/reports/$($script:ReportId)" -Method Patch -Body $body -ContentType "application/json"
    Write-Host "status=$($r.status)"
  }
}

Test-Endpoint "GET /api/reports/:id (404)" {
  $fakeId = 99999
  try {
    Invoke-RestMethod -Uri "$BaseUrl/api/reports/$fakeId" -Method Get
    throw "Expected 404"
  } catch {
    $resp = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($resp.error.code -ne "NOT_FOUND") {
      throw "Expected NOT_FOUND"
    }
    Write-Host "404 NOT_FOUND as expected"
  }
}

Write-Host ""
Write-Host "All smoke tests passed." -ForegroundColor Green
