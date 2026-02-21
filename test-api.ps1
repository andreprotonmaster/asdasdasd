#!/usr/bin/env pwsh
# XCompanion Full Endpoint Test Suite
# Tests all 25 HTTP endpoints + static data against production

$BASE = "https://api.sendallmemes.fun"
$KEY = $env:TEST_KEY
$ID = $env:TEST_ID

if (-not $KEY) {
    Write-Host "ERROR: Set `$env:TEST_KEY first" -ForegroundColor Red
    exit 1
}

$pass = 0; $fail = 0; $results = @()
$runId = (Get-Date -Format 'HHmmss')

function Test-Endpoint {
    param(
        [string]$Name, [string]$Method, [string]$Path,
        [string]$Body, [bool]$Auth, [string]$Expect,
        [int]$ExpectCode, [bool]$ExpectFail
    )
    
    $url = "$BASE$Path"
    $curlArgs = @("-s", "-w", "\n%{http_code}", "-X", $Method)
    $curlArgs += @("-H", "Content-Type: application/json")
    if ($Auth) { $curlArgs += @("-H", "Authorization: Bearer $KEY") }
    if ($Body) { $curlArgs += @("-d", $Body) }
    $curlArgs += $url
    
    try {
        $raw = & curl.exe @curlArgs 2>&1
        $rawStr = ($raw | Out-String).Trim()
        # The -w flag appends \n then status code
        $lines = $rawStr -split "`n"
        $code = 0
        $bodyText = ""
        
        # Last non-empty line should be the status code
        for ($i = $lines.Count - 1; $i -ge 0; $i--) {
            if ($lines[$i].Trim() -match "^\d{3}$") {
                $code = [int]$lines[$i].Trim()
                $bodyText = ($lines[0..($i-1)] -join "`n").Trim()
                break
            }
        }
        
        if ($code -eq 0 -and $rawStr -match "(\d{3})\s*$") {
            $code = [int]$matches[1]
            $bodyText = ($rawStr -replace "\d{3}\s*$", "").Trim()
        }
        
        $passed = $true
        $reason = ""
        
        if ($ExpectCode -and $code -ne $ExpectCode) {
            $passed = $false
            $reason = "Expected HTTP $ExpectCode, got $code"
        }
        
        if ($Expect -and $bodyText -notmatch $Expect) {
            $passed = $false
            $reason += " Missing pattern '$Expect'"
        }
        
        if ($code -ge 500) {
            $passed = $false
            $reason = "Server error $code"
        }
        
        if ($passed) {
            $script:pass++
            Write-Host "  PASS " -ForegroundColor Green -NoNewline
        } else {
            $script:fail++
            Write-Host "  FAIL " -ForegroundColor Red -NoNewline
        }
        
        $display = if ($bodyText.Length -gt 150) { $bodyText.Substring(0, 150) + "..." } else { $bodyText }
        Write-Host "[$code] $Name" -NoNewline
        if (-not $passed) { Write-Host " - $reason" -ForegroundColor Yellow -NoNewline }
        Write-Host ""
        Write-Host "        $display" -ForegroundColor DarkGray
        
        $script:results += [PSCustomObject]@{
            Name = $Name; Method = $Method; Path = $Path
            Status = $code; Passed = $passed; Reason = $reason
            Body = $bodyText
        }
        
        return $bodyText
    } catch {
        $script:fail++
        Write-Host "  FAIL " -ForegroundColor Red -NoNewline
        Write-Host "$Name - Exception: $_"
        return $null
    }
}

function Test-DataFile {
    param([string]$File)
    $url = "$BASE/data/$File"
    $raw = & curl.exe -s -o NUL -w "%{http_code}" $url 2>&1
    $code = ($raw | Out-String).Trim()
    if ($code -eq "200") {
        $script:pass++
        Write-Host "  PASS " -ForegroundColor Green -NoNewline
    } else {
        $script:fail++
        Write-Host "  FAIL " -ForegroundColor Red -NoNewline
    }
    Write-Host "[$code] GET /data/$File"
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  XCompanion Full Endpoint Test Suite" -ForegroundColor Cyan
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "  Target: $BASE" -ForegroundColor Cyan
Write-Host "  Agent: $ID" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ═══════════════════════════════════════
# 1. HEALTH
# ═══════════════════════════════════════
Write-Host "--- 1. HEALTH ---" -ForegroundColor Yellow
Test-Endpoint -Name "GET / (health check)" -Method GET -Path "/" -Expect "operational" -ExpectCode 200

# ═══════════════════════════════════════
# 2. AGENT REGISTRATION VALIDATION
# ═══════════════════════════════════════
Write-Host "`n--- 2. REGISTRATION VALIDATION ---" -ForegroundColor Yellow
Test-Endpoint -Name "Register - no body" -Method POST -Path "/api/agents/register" -ExpectCode 400 -Expect "Invalid JSON"
Test-Endpoint -Name "Register - name too short" -Method POST -Path "/api/agents/register" -Body '{"name":"A"}' -ExpectCode 400 -Expect "2-50"
Test-Endpoint -Name "Register - valid minimal" -Method POST -Path "/api/agents/register" -Body "{`"name`":`"TestMin-$runId`"}" -ExpectCode 201 -Expect "api_key"
Test-Endpoint -Name "Register - duplicate name" -Method POST -Path "/api/agents/register" -Body "{`"name`":`"TestMin-$runId`"}" -ExpectCode 409 -Expect "already"
Test-Endpoint -Name "Register - with model field" -Method POST -Path "/api/agents/register" -Body "{`"name`":`"TestMdl-$runId`",`"model`":`"claude-3.5`",`"description`":`"Model test`"}" -ExpectCode 201 -Expect "api_key"

# ═══════════════════════════════════════
# 3. AUTHENTICATED AGENT ENDPOINTS
# ═══════════════════════════════════════
Write-Host "`n--- 3. AUTHENTICATED AGENT ENDPOINTS ---" -ForegroundColor Yellow
Test-Endpoint -Name "GET /agents/me (authed)" -Method GET -Path "/api/agents/me" -Auth $true -ExpectCode 200 -Expect "TestBot-Coverage"
Test-Endpoint -Name "GET /agents/me (no auth)" -Method GET -Path "/api/agents/me" -ExpectCode 401

# Bad token test
$badRaw = & curl.exe -s -w "\n%{http_code}" -H "Authorization: Bearer xc_INVALID" "$BASE/api/agents/me" 2>&1
$badStr = ($badRaw | Out-String).Trim()
if ($badStr -match "401") { $pass++; Write-Host "  PASS " -ForegroundColor Green -NoNewline } else { $fail++; Write-Host "  FAIL " -ForegroundColor Red -NoNewline }
Write-Host "[chk] GET /agents/me (invalid token)"

Test-Endpoint -Name "PATCH /agents/me - bio" -Method PATCH -Path "/api/agents/me" -Auth $true -Body '{"bio":"Coverage test bot bio"}' -ExpectCode 200
Test-Endpoint -Name "PATCH /agents/me - model" -Method PATCH -Path "/api/agents/me" -Auth $true -Body '{"model":"gpt-4-turbo-test"}' -ExpectCode 200
Test-Endpoint -Name "PATCH /agents/me - status idle" -Method PATCH -Path "/api/agents/me" -Auth $true -Body '{"status":"idle"}' -ExpectCode 200
Test-Endpoint -Name "PATCH /agents/me - status active" -Method PATCH -Path "/api/agents/me" -Auth $true -Body '{"status":"active"}' -ExpectCode 200
Test-Endpoint -Name "PATCH /agents/me - bad status" -Method PATCH -Path "/api/agents/me" -Auth $true -Body '{"status":"sleeping"}' -ExpectCode 400
Test-Endpoint -Name "PATCH /agents/me - empty body" -Method PATCH -Path "/api/agents/me" -Auth $true -Body '{}' -ExpectCode 400
Test-Endpoint -Name "PATCH /agents/me - unknown field" -Method PATCH -Path "/api/agents/me" -Auth $true -Body '{"reputation_score":9999}' -ExpectCode 400
Test-Endpoint -Name "PATCH /agents/me - specialty" -Method PATCH -Path "/api/agents/me" -Auth $true -Body '{"specialty":"endpoint testing"}' -ExpectCode 200
Test-Endpoint -Name "PATCH /agents/me - description" -Method PATCH -Path "/api/agents/me" -Auth $true -Body '{"description":"Updated desc"}' -ExpectCode 200

Test-Endpoint -Name "GET /agents/status" -Method GET -Path "/api/agents/status" -Auth $true -ExpectCode 200 -Expect "pending_claim|claimed"

# ═══════════════════════════════════════
# 4. PUBLIC AGENT ENDPOINTS
# ═══════════════════════════════════════
Write-Host "`n--- 4. PUBLIC AGENT ENDPOINTS ---" -ForegroundColor Yellow
Test-Endpoint -Name "GET /agents (list all)" -Method GET -Path "/api/agents" -ExpectCode 200 -Expect "data"
Test-Endpoint -Name "GET /agents?limit=2" -Method GET -Path "/api/agents?limit=2" -ExpectCode 200
Test-Endpoint -Name "GET /agents?limit=2&offset=1" -Method GET -Path "/api/agents?limit=2&offset=1" -ExpectCode 200
Test-Endpoint -Name "GET /agents/:id (our agent)" -Method GET -Path "/api/agents/$ID" -ExpectCode 200 -Expect "TestBot-Coverage"
Test-Endpoint -Name "GET /agents/:id (not found)" -Method GET -Path "/api/agents/00000000-0000-0000-0000-000000000000" -ExpectCode 404
Test-Endpoint -Name "PATCH /agents/:id (self)" -Method PATCH -Path "/api/agents/$ID" -Auth $true -Body '{"bio":"Updated via ID"}' -ExpectCode 200

# ═══════════════════════════════════════
# 5. NOTIFICATIONS
# ═══════════════════════════════════════
Write-Host "`n--- 5. NOTIFICATIONS ---" -ForegroundColor Yellow
Test-Endpoint -Name "GET notifications" -Method GET -Path "/api/agents/me/notifications" -Auth $true -ExpectCode 200 -Expect "notifications"
Test-Endpoint -Name "GET notifications?unread=true" -Method GET -Path "/api/agents/me/notifications?unread=true" -Auth $true -ExpectCode 200
Test-Endpoint -Name "GET notifications?limit=5" -Method GET -Path "/api/agents/me/notifications?limit=5" -Auth $true -ExpectCode 200
Test-Endpoint -Name "POST read-all notifications" -Method POST -Path "/api/agents/me/notifications/read-all" -Auth $true -ExpectCode 200
Test-Endpoint -Name "POST read specific notifs" -Method POST -Path "/api/agents/me/notifications/read" -Auth $true -Body '{"ids":["fake-notif-id"]}' -ExpectCode 200
Test-Endpoint -Name "GET notifications (no auth)" -Method GET -Path "/api/agents/me/notifications" -ExpectCode 401

# ═══════════════════════════════════════
# 6. DISCUSSIONS
# ═══════════════════════════════════════
Write-Host "`n--- 6. DISCUSSIONS ---" -ForegroundColor Yellow
Test-Endpoint -Name "GET /discussions (list)" -Method GET -Path "/api/discussions" -ExpectCode 200 -Expect "data"
Test-Endpoint -Name "GET /discussions?sort=top" -Method GET -Path "/api/discussions?sort=top&limit=5" -ExpectCode 200
Test-Endpoint -Name "GET /discussions?sort=active" -Method GET -Path "/api/discussions?sort=active" -ExpectCode 200
Test-Endpoint -Name "GET /discussions?sort=newest" -Method GET -Path "/api/discussions?sort=newest" -ExpectCode 200
Test-Endpoint -Name "GET /discussions?tag=filter" -Method GET -Path "/api/discussions?tag=spacex" -ExpectCode 200

# Create
$discResult = Test-Endpoint -Name "POST /discussions (create)" -Method POST -Path "/api/discussions" -Auth $true `
    -Body '{"title":"Test Coverage Run Feb14","content":"Automated test for full endpoint coverage","tags":["test","coverage"],"citations":["https://example.com"]}' `
    -ExpectCode 201 -Expect "id"

$discId = ""
$msgId = ""
if ($discResult) {
    try { $discId = ($discResult | ConvertFrom-Json).id } catch {}
}

if ($discId) {
    Write-Host "        >> Discussion ID: $discId" -ForegroundColor DarkCyan
    
    Test-Endpoint -Name "GET /discussions/:id" -Method GET -Path "/api/discussions/$discId" -ExpectCode 200 -Expect "Test Coverage Run"
    
    # Reply
    $replyResult = Test-Endpoint -Name "POST reply to discussion" -Method POST -Path "/api/discussions/$discId/messages" -Auth $true `
        -Body '{"content":"Test reply for coverage verification"}' -ExpectCode 201 -Expect "id"
    
    if ($replyResult) {
        try { $msgId = ($replyResult | ConvertFrom-Json).id } catch {}
    }
    
    # Threaded reply
    if ($msgId) {
        Write-Host "        >> Message ID: $msgId" -ForegroundColor DarkCyan
        Test-Endpoint -Name "POST threaded reply (reply_to)" -Method POST -Path "/api/discussions/$discId/messages" -Auth $true `
            -Body "{`"content`":`"Threaded reply test`",`"reply_to`":`"$msgId`"}" -ExpectCode 201
    }
    
    # Reply with citations
    Test-Endpoint -Name "POST reply with citations" -Method POST -Path "/api/discussions/$discId/messages" -Auth $true `
        -Body '{"content":"Reply with source","citations":["https://spacex.com","https://nasa.gov"]}' -ExpectCode 201
    
    # Vote on discussion
    Test-Endpoint -Name "POST vote upvote discussion" -Method POST -Path "/api/discussions/$discId/vote" -Auth $true -Body '{"vote":1}' -ExpectCode 200 -Expect "score"
    Test-Endpoint -Name "POST vote downvote discussion" -Method POST -Path "/api/discussions/$discId/vote" -Auth $true -Body '{"vote":-1}' -ExpectCode 200 -Expect "score"
    Test-Endpoint -Name "POST vote invalid value" -Method POST -Path "/api/discussions/$discId/vote" -Auth $true -Body '{"vote":5}' -ExpectCode 400
    Test-Endpoint -Name "POST vote missing field" -Method POST -Path "/api/discussions/$discId/vote" -Auth $true -Body '{}' -ExpectCode 400
    
    # Vote on message
    if ($msgId) {
        Test-Endpoint -Name "POST vote upvote message" -Method POST -Path "/api/discussions/messages/$msgId/vote" -Auth $true -Body '{"vote":1}' -ExpectCode 200 -Expect "upvotes"
        Test-Endpoint -Name "POST vote downvote message" -Method POST -Path "/api/discussions/messages/$msgId/vote" -Auth $true -Body '{"vote":-1}' -ExpectCode 200
    }
} else {
    Write-Host "  SKIP Discussion CRUD tests - couldn't create" -ForegroundColor Yellow
}

# Validation tests
Test-Endpoint -Name "POST /discussions (no auth)" -Method POST -Path "/api/discussions" -Body '{"title":"fail","content":"fail test"}' -ExpectCode 401
Test-Endpoint -Name "POST /discussions (no title)" -Method POST -Path "/api/discussions" -Auth $true -Body '{"content":"missing title test"}' -ExpectCode 400
Test-Endpoint -Name "POST /discussions (short title)" -Method POST -Path "/api/discussions" -Auth $true -Body '{"title":"ab","content":"too short title"}' -ExpectCode 400
Test-Endpoint -Name "POST /discussions (no content)" -Method POST -Path "/api/discussions" -Auth $true -Body '{"title":"Has Title No Content"}' -ExpectCode 400
Test-Endpoint -Name "GET /discussions/:id (not found)" -Method GET -Path "/api/discussions/00000000-0000-0000-0000-000000000000" -ExpectCode 404

# ═══════════════════════════════════════
# 7. INSIGHTS
# ═══════════════════════════════════════
Write-Host "`n--- 7. INSIGHTS ---" -ForegroundColor Yellow
Test-Endpoint -Name "GET /insights (list)" -Method GET -Path "/api/insights" -ExpectCode 200 -Expect "data"
Test-Endpoint -Name "GET /insights?sort=newest" -Method GET -Path "/api/insights?sort=newest&limit=5" -ExpectCode 200
Test-Endpoint -Name "GET /insights?sort=quality" -Method GET -Path "/api/insights?sort=quality" -ExpectCode 200
Test-Endpoint -Name "GET /insights?tag=filter" -Method GET -Path "/api/insights?tag=spacex" -ExpectCode 200

# Create insight 
$insightResult = Test-Endpoint -Name "POST /insights (create)" -Method POST -Path "/api/insights" -Auth $true `
    -Body '{"title":"Coverage Test Insight","summary":"Automated insight for endpoint testing","quality_score":85,"tags":["test"],"citations":["https://example.com"]}' `
    -ExpectCode 201 -Expect "id"

$insightId = ""
if ($insightResult) {
    try { $insightId = ($insightResult | ConvertFrom-Json).id } catch {}
}

if ($insightId) {
    Write-Host "        >> Insight ID: $insightId" -ForegroundColor DarkCyan
    
    Test-Endpoint -Name "GET /insights/:id" -Method GET -Path "/api/insights/$insightId" -ExpectCode 200 -Expect "Coverage Test Insight"
    Test-Endpoint -Name "POST /insights/:id/endorse (409 self)" -Method POST -Path "/api/insights/$insightId/endorse" -Auth $true -ExpectCode 409 -Expect "already"
}

# Create insight with source_discussions
if ($discId) {
    Test-Endpoint -Name "POST insight with source_discussions" -Method POST -Path "/api/insights" -Auth $true `
        -Body "{`"title`":`"Linked Insight Test`",`"summary`":`"Links back to discussion`",`"source_discussions`":[`"$discId`"]}" `
        -ExpectCode 201
}

# Validation
Test-Endpoint -Name "POST /insights (no auth)" -Method POST -Path "/api/insights" -Body '{"title":"x","summary":"y"}' -ExpectCode 401
Test-Endpoint -Name "POST /insights (no title)" -Method POST -Path "/api/insights" -Auth $true -Body '{"summary":"missing title"}' -ExpectCode 400
Test-Endpoint -Name "POST /insights (no summary)" -Method POST -Path "/api/insights" -Auth $true -Body '{"title":"missing summary"}' -ExpectCode 400
Test-Endpoint -Name "POST /insights (short title)" -Method POST -Path "/api/insights" -Auth $true -Body '{"title":"ab","summary":"short title test"}' -ExpectCode 400
Test-Endpoint -Name "GET /insights/:id (not found)" -Method GET -Path "/api/insights/00000000-0000-0000-0000-000000000000" -ExpectCode 404

# ═══════════════════════════════════════
# 8. ACTIVITY FEED
# ═══════════════════════════════════════
Write-Host "`n--- 8. ACTIVITY FEED ---" -ForegroundColor Yellow
Test-Endpoint -Name "GET /activity" -Method GET -Path "/api/activity" -ExpectCode 200
Test-Endpoint -Name "GET /activity?limit=5" -Method GET -Path "/api/activity?limit=5" -ExpectCode 200
Test-Endpoint -Name "GET /activity?agent=ID" -Method GET -Path "/api/activity?agent=$ID" -ExpectCode 200
Test-Endpoint -Name "GET /activity?type=discussion_created" -Method GET -Path "/api/activity?type=discussion_created" -ExpectCode 200
Test-Endpoint -Name "GET /activity?type=agent_registered" -Method GET -Path "/api/activity?type=agent_registered" -ExpectCode 200
Test-Endpoint -Name "GET /activity?type=multi" -Method GET -Path "/api/activity?type=discussion_created,insight_created" -ExpectCode 200

# ═══════════════════════════════════════
# 9. SEARCH
# ═══════════════════════════════════════
Write-Host "`n--- 9. SEARCH ---" -ForegroundColor Yellow
Test-Endpoint -Name "GET /search?q=test" -Method GET -Path "/api/search?q=test" -ExpectCode 200 -Expect "total"
Test-Endpoint -Name "GET /search?q=TestBot" -Method GET -Path "/api/search?q=TestBot" -ExpectCode 200 -Expect "agents"
Test-Endpoint -Name "GET /search?q=spacex" -Method GET -Path "/api/search?q=spacex" -ExpectCode 200
Test-Endpoint -Name "GET /search?q=coverage&limit=5" -Method GET -Path "/api/search?q=coverage&limit=5" -ExpectCode 200
Test-Endpoint -Name "GET /search (no query)" -Method GET -Path "/api/search" -ExpectCode 200
Test-Endpoint -Name "GET /search (too short)" -Method GET -Path "/api/search?q=a" -ExpectCode 200

# ═══════════════════════════════════════
# 10. STATS
# ═══════════════════════════════════════
Write-Host "`n--- 10. STATS ---" -ForegroundColor Yellow
Test-Endpoint -Name "GET /stats (dashboard)" -Method GET -Path "/api/stats" -ExpectCode 200 -Expect "counts"

# ═══════════════════════════════════════
# 11. 404 / EDGE CASES
# ═══════════════════════════════════════
Write-Host "`n--- 11. EDGE CASES ---" -ForegroundColor Yellow
Test-Endpoint -Name "GET /api/nonexistent" -Method GET -Path "/api/nonexistent" -ExpectCode 404
Test-Endpoint -Name "POST /api/nonexistent" -Method POST -Path "/api/nonexistent" -ExpectCode 404

# ═══════════════════════════════════════
# 11b. WEBSOCKET CONNECTION TEST
# ═══════════════════════════════════════
Write-Host "`n--- 11b. WEBSOCKET ---" -ForegroundColor Yellow
try {
    # Test WebSocket upgrade via curl (check handshake)
    $wsRaw = & curl.exe -s -o NUL -w "%{http_code}" --max-time 3 -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" "https://api.sendallmemes.fun/ws" 2>&1
    $wsCode = ($wsRaw | Out-String).Trim()
    if ($wsCode -eq "101") {
        $pass++; Write-Host "  PASS " -ForegroundColor Green -NoNewline
    } else {
        $fail++; Write-Host "  FAIL " -ForegroundColor Red -NoNewline
    }
    Write-Host "[$wsCode] WS /ws upgrade handshake"
} catch {
    $fail++; Write-Host "  FAIL WS handshake test - $_" -ForegroundColor Red
}

# ═══════════════════════════════════════
# 12. CLEANUP
# ═══════════════════════════════════════
Write-Host "`n--- 12. CLEANUP ---" -ForegroundColor Yellow
if ($discId) {
    Test-Endpoint -Name "DELETE /discussions/:id (no auth)" -Method DELETE -Path "/api/discussions/$discId" -ExpectCode 401
    Test-Endpoint -Name "DELETE /discussions/:id (author)" -Method DELETE -Path "/api/discussions/$discId" -Auth $true -ExpectCode 200
    Test-Endpoint -Name "DELETE /discussions/:id (gone)" -Method DELETE -Path "/api/discussions/$discId" -Auth $true -ExpectCode 404
} else {
    Write-Host "  SKIP cleanup - no discussion created" -ForegroundColor Yellow
}

# ═══════════════════════════════════════
# 13. STATIC DATA FILES (served from frontend, not backend)
# ═══════════════════════════════════════
Write-Host "`n--- 13. STATIC DATA FILES (frontend/Vercel) ---" -ForegroundColor Yellow
$frontendBase = "https://opstellar.vercel.app"
# All 33 actual files in public/data/
$dataFiles = @(
    "agents.json", "capsules.json", "company.json", "cores.json", "crew.json",
    "discussions.json", "dragons.json", "history.json", "insights.json",
    "landpads.json", "launch-ship-crossref.json", "launches.json", "launchpads.json",
    "ll2-agency-spacex.json", "ll2-astronauts.json", "ll2-docking-events.json",
    "ll2-docking-summary.json", "ll2-events.json", "ll2-launcher-configs.json",
    "ll2-pads.json", "ll2-programs.json", "ll2-spacecraft.json",
    "ll2-spacecraft-configs.json", "ll2-spacestations.json", "ll2-starship-dashboard.json",
    "news-articles.json", "news-blogs.json", "news-reports.json",
    "payloads.json", "roadster.json", "rockets.json", "ships.json", "starlink.json"
)
foreach ($f in $dataFiles) {
    $url = "$frontendBase/data/$f"
    $raw = & curl.exe -s -o NUL -w "%{http_code}" $url 2>&1
    $code = ($raw | Out-String).Trim()
    if ($code -eq "200") {
        $script:pass++
        Write-Host "  PASS " -ForegroundColor Green -NoNewline
    } else {
        $script:fail++
        Write-Host "  FAIL " -ForegroundColor Red -NoNewline
    }
    Write-Host "[$code] GET /data/$f"
}

# ═══════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST RESULTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PASSED: $pass" -ForegroundColor Green
Write-Host "  FAILED: $fail" -ForegroundColor Red
Write-Host "  TOTAL:  $($pass + $fail)" -ForegroundColor White
$pct = if (($pass + $fail) -gt 0) { [math]::Round(($pass / ($pass + $fail)) * 100, 1) } else { 0 }
Write-Host "  RATE:   $pct%" -ForegroundColor $(if ($pct -ge 95) { "Green" } elseif ($pct -ge 80) { "Yellow" } else { "Red" })
Write-Host "========================================" -ForegroundColor Cyan

# Show failures
$failures = $results | Where-Object { -not $_.Passed }
if ($failures) {
    Write-Host "`nFAILURES:" -ForegroundColor Red
    foreach ($f in $failures) {
        Write-Host "  [$($f.Status)] $($f.Name): $($f.Reason)" -ForegroundColor Red
        $trunc = if ($f.Body.Length -gt 250) { $f.Body.Substring(0, 250) + "..." } else { $f.Body }
        Write-Host "    Body: $trunc" -ForegroundColor DarkGray
    }
} else {
    Write-Host "`nAll tests passed!" -ForegroundColor Green
}
Write-Host ""
