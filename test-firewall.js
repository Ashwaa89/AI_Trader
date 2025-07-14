// Simple API connectivity test script
const fetch = require('node-fetch');

async function testProvider(name, url, description) {
    console.log(`\n🔄 Testing ${name} (${description})...`);
    try {
        const response = await fetch(url, { 
            timeout: 10000,
            headers: {
                'User-Agent': 'Stock-Trader-App/1.0'
            }
        });
        
        if (response.ok) {
            console.log(`✅ ${name}: SUCCESS - Status ${response.status}`);
            return true;
        } else {
            console.log(`⚠️ ${name}: HTTP ${response.status} - ${response.statusText}`);
            return false;
        }
    } catch (error) {
        if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
            console.log(`🚫 ${name}: BLOCKED BY FIREWALL - ${error.message}`);
        } else if (error.message.includes('timeout')) {
            console.log(`⏱️ ${name}: TIMEOUT - May be blocked`);
        } else {
            console.log(`❌ ${name}: ERROR - ${error.message}`);
        }
        return false;
    }
}

async function runTests() {
    console.log('🔥 Testing API Provider Connectivity Through Firewall\n');
    
    const tests = [
        {
            name: 'Alpha Vantage',
            url: 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=demo',
            description: 'Financial APIs'
        },
        {
            name: 'TwelveData', 
            url: 'https://api.twelvedata.com/quote?symbol=AAPL&apikey=demo',
            description: 'Market Data API'
        },
        {
            name: 'Yahoo Finance',
            url: 'https://query1.finance.yahoo.com/v8/finance/chart/AAPL',
            description: 'Yahoo Financial Data'
        },
        {
            name: 'FinnHub',
            url: 'https://finnhub.io/api/v1/quote?symbol=AAPL&token=demo',
            description: 'Real-time Stock API'
        },
        {
            name: 'IEX Cloud',
            url: 'https://cloud.iexapis.com/stable/stock/AAPL/quote?token=demo',
            description: 'Financial Data Platform'
        },
        {
            name: 'Polygon.io',
            url: 'https://api.polygon.io/v2/last/trade/AAPL?apikey=demo',
            description: 'Market Data API'
        },
        {
            name: 'Quandl/NASDAQ',
            url: 'https://data.nasdaq.com/api/v3/datasets/WIKI/AAPL/data.json?api_key=demo&limit=1',
            description: 'Economic Data'
        },
        {
            name: 'WorldTradingData',
            url: 'https://api.worldtradingdata.com/api/v1/stock?symbol=AAPL&api_token=demo',
            description: 'Trading Data API'
        },
        {
            name: 'MarketStack',
            url: 'http://api.marketstack.com/v1/eod/latest?access_key=demo&symbols=AAPL',
            description: 'Stock Market API'
        }
    ];
    
    let successCount = 0;
    const results = [];
    
    for (const test of tests) {
        const success = await testProvider(test.name, test.url, test.description);
        results.push({ name: test.name, success, description: test.description });
        if (success) successCount++;
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n📊 FIREWALL CONNECTIVITY RESULTS:');
    console.log('='*50);
    
    results.forEach(result => {
        const status = result.success ? '✅ ACCESSIBLE' : '🚫 BLOCKED';
        console.log(`${status}: ${result.name} - ${result.description}`);
    });
    
    console.log(`\n📈 Summary: ${successCount}/${results.length} providers accessible through firewall`);
    
    if (successCount === 0) {
        console.log('\n🔒 All external APIs are blocked by firewall.');
        console.log('💡 The system will use built-in free endpoints and sample data.');
    } else {
        console.log(`\n🎯 ${successCount} provider(s) can be used for real market data.`);
    }
}

runTests().catch(console.error);
