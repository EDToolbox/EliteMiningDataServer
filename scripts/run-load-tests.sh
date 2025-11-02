#!/bin/bash

# GitHub Actions k6 Load Testing Helper Script
# This script automatically detects the best k6 test to run based on environment

set -e

echo "🚀 Starting k6 Load Testing..."

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo "❌ k6 is not installed. Installing k6..."
    
    # Install k6 on Ubuntu/Debian
    if command -v apt-get &> /dev/null; then
        sudo gpg -k
        sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
        echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
        sudo apt-get update
        sudo apt-get install -y k6
    else
        echo "❌ Unsupported platform for automatic k6 installation"
        exit 1
    fi
fi

# Check k6 version
echo "✅ k6 version: $(k6 version)"

# Set default target URL
TARGET_URL=${TEST_BASE_URL:-"http://localhost:3000"}
echo "🎯 Target URL: $TARGET_URL"

# Check if server is available
echo "🔍 Checking server availability..."
if curl -f "$TARGET_URL/api/health" >/dev/null 2>&1; then
    echo "✅ Server is available at $TARGET_URL"
    echo "🎯 Running full Elite Mining API load test..."
    
    # Run the CI-friendly version which handles the server properly
    if [ -f "tests/load/api-load-test-ci.js" ]; then
        k6 run tests/load/api-load-test-ci.js --out json=k6-results-full.json
    else
        echo "⚠️ CI test not found, running original test..."
        k6 run tests/load/api-load-test.js --out json=k6-results-original.json
    fi
else
    echo "⚠️ Server not available at $TARGET_URL"
    echo "🔄 Running CI-friendly fallback test..."
    
    # Run CI version with fallback
    if [ -f "tests/load/api-load-test-ci.js" ]; then
        k6 run tests/load/api-load-test-ci.js --out json=k6-results-ci.json
    elif [ -f "tests/load/k6-demo.js" ]; then
        echo "🎪 Running demo test as final fallback..."
        k6 run tests/load/k6-demo.js --out json=k6-results-demo.json
    else
        echo "❌ No suitable k6 test files found"
        exit 1
    fi
fi

echo "🏁 k6 Load Testing completed!"

# Find and display results
RESULTS_FILE=""
for file in k6-results-*.json; do
    if [ -f "$file" ]; then
        RESULTS_FILE="$file"
        break
    fi
done

if [ -n "$RESULTS_FILE" ]; then
    echo "📊 Results saved to: $RESULTS_FILE"
    
    # Display key metrics if jq is available
    if command -v jq &> /dev/null; then
        echo ""
        echo "📈 Key Metrics:"
        echo "─────────────────────────────────────"
        
        AVG_DURATION=$(jq -r '.metrics.http_req_duration.values.avg // "N/A"' "$RESULTS_FILE")
        P95_DURATION=$(jq -r '.metrics.http_req_duration.values["p(95)"] // "N/A"' "$RESULTS_FILE")
        TOTAL_REQUESTS=$(jq -r '.metrics.http_reqs.values.count // "N/A"' "$RESULTS_FILE")
        FAILED_RATE=$(jq -r '.metrics.http_req_failed.values.rate // "N/A"' "$RESULTS_FILE")
        
        echo "• Average Response Time: ${AVG_DURATION}ms"
        echo "• P95 Response Time: ${P95_DURATION}ms"  
        echo "• Total Requests: $TOTAL_REQUESTS"
        echo "• Failure Rate: $(echo "$FAILED_RATE * 100" | bc -l 2>/dev/null || echo "$FAILED_RATE")%"
        echo "─────────────────────────────────────"
    fi
else
    echo "⚠️ No results file found"
fi

echo "✅ k6 Load Testing script completed successfully!"