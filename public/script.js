// AI Stock Trading Platform
class StockTradingBot {
    constructor() {
        this.isActive = true;
        this.portfolio = {
            cash: 10000,
            positions: {},
            totalValue: 10000,
            dailyPnL: 0,
            totalPnL: 0
        };
        this.trades = [];
        this.marketData = {};
        this.mlModel = null;
        this.settings = {
            riskLevel: 'moderate',
            maxPositionSize: 0.1,
            stopLoss: 0.05,
            takeProfit: 0.15
        };
        this.watchedSymbols = [
            // Technology Giants
            'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META', 'NVDA', 'NFLX', 'ADBE',
            'CRM', 'ORCL', 'IBM', 'INTC', 'AMD', 'QCOM', 'AVGO', 'TXN',
            
            // Electric Vehicles & Transportation
            'TSLA', 'NIO', 'LCID', 'RIVN', 'F', 'GM', 'UBER', 'LYFT',
            
            // Finance & Banking
            'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'V', 'MA', 'PYPL', 'SQ',
            
            // Healthcare & Biotech
            'JNJ', 'PFE', 'UNH', 'ABBV', 'TMO', 'DHR', 'ABT', 'MRK', 'GILD', 'AMGN',
            
            // Consumer & Retail
            'WMT', 'HD', 'COST', 'TGT', 'LOW', 'SBUX', 'MCD', 'NKE', 'LULU', 'DIS',
            
            // Energy & Oil
            'XOM', 'CVX', 'COP', 'EOG', 'SLB', 'OXY', 'DVN', 'MPC', 'VLO', 'PSX',
            
            // Aerospace & Defense
            'BA', 'LMT', 'RTX', 'NOC', 'GD', 'LHX', 'TDG', 'HWM',
            
            // Telecommunications
            'VZ', 'T', 'TMUS', 'CHTR', 'CMCSA', 'DIS', 'NFLX',
            
            // Real Estate & REITs
            'AMT', 'PLD', 'CCI', 'EQIX', 'PSA', 'EXR', 'AVB', 'EQR',
            
            // Industrials
            'CAT', 'DE', 'MMM', 'HON', 'UPS', 'FDX', 'GE', 'EMR', 'ETN', 'ITW',
            
            // Materials & Mining
            'LIN', 'APD', 'ECL', 'FCX', 'NEM', 'GOLD', 'AA', 'X', 'CLF', 'VALE',
            
            // Semiconductors
            'TSM', 'ASML', 'MU', 'AMAT', 'LRCX', 'KLAC', 'MRVL', 'MCHP', 'ADI', 'XLNX',
            
            // Cloud & Software
            'SNOW', 'PLTR', 'ROKU', 'TWLO', 'ZM', 'DOCU', 'OKTA', 'NOW', 'WDAY', 'DDOG',
            
            // E-commerce & Digital
            'SHOP', 'EBAY', 'ETSY', 'PINS', 'SNAP', 'TWTR', 'SPOT', 'ZG', 'ABNB',
            
            // Gaming & Entertainment
            'ATVI', 'EA', 'TTWO', 'RBLX', 'U', 'NTES', 'SE', 'BILI',
            
            // Cryptocurrency Related
            'COIN', 'RIOT', 'MARA', 'MSTR', 'SQ', 'HOOD',
            
            // Green Energy & Solar
            'ENPH', 'SEDG', 'FSLR', 'SPWR', 'RUN', 'NOVA', 'BE', 'PLUG',
            
            // Food & Beverage
            'KO', 'PEP', 'MO', 'PM', 'STZ', 'TAP', 'KHC', 'GIS', 'K', 'CPB'
        ];
        this.chart = null;
        this.performanceData = [];
        this.sectorWeights = {};
        
        // Simplified API configuration for client-side (server handles all complexity)
        this.apiConfig = {
            enabled: true,
            baseUrl: 'http://localhost:3001/api',
            cacheTimeout: 60000,
            dataCache: new Map(),
            bulkRequestLimit: 50
        };
        
        this.initializeUI();
        this.initializeChart();
        this.initializeSectorData();
        this.initializeML();
        this.startTrading();
    }

    initializeUI() {
        // Dark mode toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        darkModeToggle.addEventListener('change', this.toggleDarkMode.bind(this));
        
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            darkModeToggle.checked = true;
            document.documentElement.setAttribute('data-theme', 'dark');
        }

        // AI toggle button
        document.getElementById('toggleAI').addEventListener('click', this.toggleAI.bind(this));
        
        // Refresh analysis button
        document.getElementById('refreshAnalysis').addEventListener('click', this.analyzeMarkets.bind(this));
        
        // Settings sliders
        document.getElementById('maxPositionSize').addEventListener('input', this.updatePositionSize.bind(this));
        document.getElementById('stopLoss').addEventListener('input', this.updateStopLoss.bind(this));
        document.getElementById('takeProfit').addEventListener('input', this.updateTakeProfit.bind(this));
        
        // Update settings button
        document.getElementById('updateSettings').addEventListener('click', this.saveSettings.bind(this));
        
        // Risk level selector
        document.getElementById('riskLevel').addEventListener('change', this.updateRiskLevel.bind(this));
    }

    initializeChart() {
        const ctx = document.getElementById('portfolioChart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Portfolio Value',
                    data: [],
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
        
        // Initialize with starting value
        this.updateChart();
    }

    initializeSectorData() {
        // Define sector classifications and typical price ranges
        this.sectorData = {
            'Technology': {
                stocks: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META', 'NVDA', 'NFLX', 'ADBE', 'CRM', 'ORCL', 'IBM', 'INTC', 'AMD', 'QCOM', 'AVGO', 'TXN'],
                priceRange: [50, 800],
                volatilityRange: [0.15, 0.4]
            },
            'Electric Vehicles': {
                stocks: ['TSLA', 'NIO', 'LCID', 'RIVN', 'F', 'GM', 'UBER', 'LYFT'],
                priceRange: [10, 300],
                volatilityRange: [0.25, 0.6]
            },
            'Finance': {
                stocks: ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'V', 'MA', 'PYPL', 'SQ'],
                priceRange: [30, 500],
                volatilityRange: [0.12, 0.3]
            },
            'Healthcare': {
                stocks: ['JNJ', 'PFE', 'UNH', 'ABBV', 'TMO', 'DHR', 'ABT', 'MRK', 'GILD', 'AMGN'],
                priceRange: [40, 600],
                volatilityRange: [0.1, 0.25]
            },
            'Consumer': {
                stocks: ['WMT', 'HD', 'COST', 'TGT', 'LOW', 'SBUX', 'MCD', 'NKE', 'LULU', 'DIS'],
                priceRange: [25, 400],
                volatilityRange: [0.12, 0.3]
            },
            'Energy': {
                stocks: ['XOM', 'CVX', 'COP', 'EOG', 'SLB', 'OXY', 'DVN', 'MPC', 'VLO', 'PSX'],
                priceRange: [20, 200],
                volatilityRange: [0.2, 0.5]
            },
            'Aerospace': {
                stocks: ['BA', 'LMT', 'RTX', 'NOC', 'GD', 'LHX', 'TDG', 'HWM'],
                priceRange: [100, 500],
                volatilityRange: [0.15, 0.35]
            },
            'Telecommunications': {
                stocks: ['VZ', 'T', 'TMUS', 'CHTR', 'CMCSA'],
                priceRange: [15, 150],
                volatilityRange: [0.1, 0.25]
            },
            'Real Estate': {
                stocks: ['AMT', 'PLD', 'CCI', 'EQIX', 'PSA', 'EXR', 'AVB', 'EQR'],
                priceRange: [50, 300],
                volatilityRange: [0.12, 0.28]
            },
            'Industrials': {
                stocks: ['CAT', 'DE', 'MMM', 'HON', 'UPS', 'FDX', 'GE', 'EMR', 'ETN', 'ITW'],
                priceRange: [30, 400],
                volatilityRange: [0.15, 0.35]
            },
            'Materials': {
                stocks: ['LIN', 'APD', 'ECL', 'FCX', 'NEM', 'GOLD', 'AA', 'X', 'CLF', 'VALE'],
                priceRange: [10, 300],
                volatilityRange: [0.2, 0.45]
            },
            'Semiconductors': {
                stocks: ['TSM', 'ASML', 'MU', 'AMAT', 'LRCX', 'KLAC', 'MRVL', 'MCHP', 'ADI', 'XLNX'],
                priceRange: [40, 700],
                volatilityRange: [0.2, 0.5]
            },
            'Cloud Software': {
                stocks: ['SNOW', 'PLTR', 'ROKU', 'TWLO', 'ZM', 'DOCU', 'OKTA', 'NOW', 'WDAY', 'DDOG'],
                priceRange: [15, 400],
                volatilityRange: [0.3, 0.7]
            },
            'E-commerce': {
                stocks: ['SHOP', 'EBAY', 'ETSY', 'PINS', 'SNAP', 'TWTR', 'SPOT', 'ZG', 'ABNB'],
                priceRange: [10, 200],
                volatilityRange: [0.25, 0.6]
            },
            'Gaming': {
                stocks: ['ATVI', 'EA', 'TTWO', 'RBLX', 'U', 'NTES', 'SE', 'BILI'],
                priceRange: [20, 150],
                volatilityRange: [0.2, 0.5]
            },
            'Cryptocurrency': {
                stocks: ['COIN', 'RIOT', 'MARA', 'MSTR', 'HOOD'],
                priceRange: [5, 300],
                volatilityRange: [0.4, 0.8]
            },
            'Green Energy': {
                stocks: ['ENPH', 'SEDG', 'FSLR', 'SPWR', 'RUN', 'NOVA', 'BE', 'PLUG'],
                priceRange: [5, 200],
                volatilityRange: [0.3, 0.7]
            },
            'Food & Beverage': {
                stocks: ['KO', 'PEP', 'MO', 'PM', 'STZ', 'TAP', 'KHC', 'GIS', 'K', 'CPB'],
                priceRange: [30, 150],
                volatilityRange: [0.08, 0.2]
            }
        };
        
        // Create reverse lookup for stock to sector mapping
        this.stockToSector = {};
        for (const [sector, data] of Object.entries(this.sectorData)) {
            for (const stock of data.stocks) {
                this.stockToSector[stock] = sector;
            }
        }
    }

    getSectorForStock(symbol) {
        return this.stockToSector[symbol] || 'Other';
    }

    async initializeML() {
        try {
            // Create a simple neural network for trading decisions
            this.mlModel = tf.sequential({
                layers: [
                    tf.layers.dense({inputShape: [10], units: 64, activation: 'relu'}),
                    tf.layers.dropout({rate: 0.2}),
                    tf.layers.dense({units: 32, activation: 'relu'}),
                    tf.layers.dropout({rate: 0.2}),
                    tf.layers.dense({units: 16, activation: 'relu'}),
                    tf.layers.dense({units: 3, activation: 'softmax'}) // Buy, Hold, Sell
                ]
            });

            this.mlModel.compile({
                optimizer: tf.train.adam(0.001),
                loss: 'categoricalCrossentropy',
                metrics: ['accuracy']
            });

            console.log('ML Model initialized successfully');
        } catch (error) {
            console.error('Error initializing ML model:', error);
        }
    }

    toggleDarkMode() {
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    }

    toggleAI() {
        this.isActive = !this.isActive;
        const button = document.getElementById('toggleAI');
        const statusIndicator = document.getElementById('aiStatus');
        const statusText = document.getElementById('aiStatusText');
        
        if (this.isActive) {
            button.innerHTML = '<i class="fas fa-pause"></i> Pause AI';
            statusIndicator.className = 'status-indicator status-active';
            statusText.textContent = 'Active';
        } else {
            button.innerHTML = '<i class="fas fa-play"></i> Start AI';
            statusIndicator.className = 'status-indicator status-inactive';
            statusText.textContent = 'Paused';
        }
    }

    updatePositionSize() {
        const value = document.getElementById('maxPositionSize').value;
        document.getElementById('positionSizeValue').textContent = value;
        this.settings.maxPositionSize = parseFloat(value) / 100;
    }

    updateStopLoss() {
        const value = document.getElementById('stopLoss').value;
        document.getElementById('stopLossValue').textContent = value;
        this.settings.stopLoss = parseFloat(value) / 100;
    }

    updateTakeProfit() {
        const value = document.getElementById('takeProfit').value;
        document.getElementById('takeProfitValue').textContent = value;
        this.settings.takeProfit = parseFloat(value) / 100;
    }

    updateRiskLevel() {
        this.settings.riskLevel = document.getElementById('riskLevel').value;
    }

    saveSettings() {
        const button = document.getElementById('updateSettings');
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check me-2"></i>Saved!';
        button.classList.add('btn-success');
        button.classList.remove('btn-primary');
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('btn-success');
            button.classList.add('btn-primary');
        }, 2000);
    }

    async fetchMarketData() {
        // Check if AI is paused - if so, halt all API calls
        if (!this.isActive) {
            console.log('🛑 API calls halted - AI is paused');
            return {};
        }
        
        // Check if APIs are enabled
        if (!this.apiConfig.enabled) {
            console.warn('⚠️ API is disabled. Please enable API configuration.');
            return {};
        }
        
        // Fetch real market data using new unified endpoint
        try {
            console.log('🚀 Fetching market data using bulk endpoint...');
            const marketData = await this.fetchBulkMarketData();
            if (Object.keys(marketData).length > 0) {
                console.log(`✅ Successfully fetched data for ${Object.keys(marketData).length} symbols`);
                this.marketData = { ...this.marketData, ...marketData };
                return this.marketData;
            } else {
                console.warn('⚠️ No data returned from bulk endpoint');
                return {};
            }
        } catch (error) {
            console.error('❌ Failed to fetch market data:', error.message);
            console.log('⚠️ Trading halted due to API failures');
            return {};
        }
    }

    async fetchBulkMarketData() {
        try {
            const response = await fetch(`${this.apiConfig.baseUrl}/market/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    symbols: this.watchedSymbols
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.success) {
                console.log(`📊 Bulk fetch: ${result.stats.successful}/${result.stats.requested} symbols in ${result.stats.duration}ms`);
                return result.data;
            } else {
                throw new Error(result.error || 'Bulk fetch failed');
            }
            
        } catch (error) {
            console.error('❌ Bulk market data failed:', error.message);
            // Fallback to individual requests
            return await this.fetchIndividualMarketData();
        }
    }

    async fetchIndividualMarketData() {
        const batchSize = 5;
        const allData = {};
        
        console.log('🔄 Falling back to individual stock requests...');
        
        // Process symbols in batches
        for (let i = 0; i < this.watchedSymbols.length; i += batchSize) {
            if (!this.isActive) {
                console.log('🛑 Individual fetching halted - AI paused');
                break;
            }
            
            const batch = this.watchedSymbols.slice(i, i + batchSize);
            const batchPromises = batch.map(symbol => this.getStockData(symbol));
            
            try {
                const batchResults = await Promise.allSettled(batchPromises);
                
                batchResults.forEach((result, index) => {
                    if (result.status === 'fulfilled' && result.value) {
                        allData[batch[index]] = result.value;
                    }
                });
                
                // Wait between batches
                if (i + batchSize < this.watchedSymbols.length) {
                    await this.delay(2000);
                }
            } catch (error) {
                console.error(`Error processing batch ${i}-${i + batchSize}:`, error);
            }
        }
        
        return allData;
    }

    async getStockData(symbol) {
        try {
            // Check cache first
            const cached = this.apiConfig.dataCache.get(symbol);
            if (cached && Date.now() - cached.timestamp < this.apiConfig.cacheTimeout) {
                return cached.data;
            }

            const response = await fetch(`${this.apiConfig.baseUrl}/stock/${symbol}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                // Cache the result
                this.apiConfig.dataCache.set(symbol, {
                    data: result.data,
                    timestamp: Date.now()
                });
                
                return result.data;
            } else {
                throw new Error(result.error || 'Stock fetch failed');
            }
            
        } catch (error) {
            console.warn(`❌ Failed to fetch ${symbol}:`, error.message);
            return null;
        }
    }

    async analyzeMarkets() {
        const analysisDiv = document.getElementById('marketAnalysis');
        const refreshButton = document.getElementById('refreshAnalysis');
        
        try {
            // Show loading state
            refreshButton.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Analyzing...';
            refreshButton.disabled = true;
            
            analysisDiv.innerHTML = `
                <div class="text-center p-4">
                    <output class="d-block">
                        <div class="spinner-border text-primary mb-3" aria-hidden="true"></div>
                        <span class="visually-hidden">Loading market analysis...</span>
                        <h6 class="mb-2">Analyzing Market Conditions</h6>
                        <div class="progress mb-3" style="height: 6px;">
                            <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 0%"></div>
                        </div>
                        <small class="text-muted">
                            <i class="fas fa-chart-line me-1"></i>
                            Processing ${this.watchedSymbols.length} stocks across ${Object.keys(this.sectorData).length} sectors...
                        </small>
                    </output>
                </div>
            `;

            await this.fetchMarketData();
            
            // Simulate analysis delay with progress updates
            for (let i = 0; i <= 100; i += 20) {
                await new Promise(resolve => setTimeout(resolve, 300));
                const progressBar = analysisDiv.querySelector('.progress-bar');
                if (progressBar) {
                    progressBar.style.width = `${i}%`;
                }
            }
            
            const analysis = this.performMarketAnalysis();
            this.displayAnalysis(analysis);
            
            // Update button state
            refreshButton.innerHTML = '<i class="fas fa-check text-success"></i> Updated';
            setTimeout(() => {
                refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
                refreshButton.disabled = false;
            }, 2000);
            
        } catch (error) {
            console.error('Error analyzing markets:', error);
            analysisDiv.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Analysis Failed</strong><br>
                    Unable to analyze market conditions. Please check your connection and try again.
                    <button class="btn btn-sm btn-outline-danger mt-2" onclick="this.closest('.alert').remove()">
                        <i class="fas fa-times"></i> Dismiss
                    </button>
                </div>
            `;
            
            refreshButton.innerHTML = '<i class="fas fa-exclamation-triangle text-danger"></i> Retry';
            refreshButton.disabled = false;
        }
    }

    performMarketAnalysis() {
        const analysis = [];
        
        for (const [symbol, data] of Object.entries(this.marketData)) {
            const score = this.calculateTradingScore(data);
            const confidence = this.calculateConfidence(data);
            const recommendation = this.getRecommendation(score);
            
            analysis.push({
                symbol,
                score,
                confidence,
                recommendation,
                price: data.price,
                change: data.change,
                rsi: data.rsi,
                sentiment: data.sentiment
            });
        }
        
        // Sort by score (best opportunities first)
        analysis.sort((a, b) => b.score - a.score);
        return analysis;
    }

    calculateTradingScore(data) {
        let score = 0;
        
        // RSI scoring (oversold/overbought)
        if (data.rsi < 30) score += 30; // Oversold - good buy opportunity
        else if (data.rsi > 70) score -= 20; // Overbought - avoid buying
        else score += 10; // Neutral
        
        // MACD scoring
        if (data.macd > 0) score += 15;
        else score -= 10;
        
        // Volatility scoring (moderate volatility preferred)
        if (data.volatility > 0.05 && data.volatility < 0.15) score += 20;
        else if (data.volatility > 0.2) score -= 15;
        
        // Volume scoring
        if (data.volume > 500000) score += 10;
        
        // Sentiment scoring
        score += data.sentiment * 25;
        
        // Recent price change
        if (data.change > 0.02) score += 10;
        else if (data.change < -0.02) score -= 5;
        
        return Math.max(0, Math.min(100, score));
    }

    calculateConfidence(data) {
        const factors = [
            data.volume > 300000 ? 1 : 0,
            data.volatility < 0.2 ? 1 : 0,
            Math.abs(data.rsi - 50) < 20 ? 1 : 0,
            data.sentiment > 0.3 ? 1 : 0
        ];
        
        const confidence = factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
        return confidence;
    }

    getRecommendation(score) {
        if (score > 70) return 'BUY';
        else if (score > 40) return 'HOLD';
        else return 'SELL';
    }

    displayAnalysis(analysis) {
        const analysisDiv = document.getElementById('marketAnalysis');
        
        // Calculate market status
        const buyRecommendations = analysis.filter(s => s.recommendation === 'BUY').length;
        const sellRecommendations = analysis.filter(s => s.recommendation === 'SELL').length;
        const holdRecommendations = analysis.filter(s => s.recommendation === 'HOLD').length;
        const avgConfidence = analysis.reduce((sum, s) => sum + s.confidence, 0) / analysis.length;
        const avgScore = analysis.reduce((sum, s) => sum + s.score, 0) / analysis.length;
        
        // Calculate sector performance
        const sectorPerformance = {};
        for (const stock of analysis) {
            const sector = this.getSectorForStock(stock.symbol);
            if (!sectorPerformance[sector]) {
                sectorPerformance[sector] = {
                    stocks: [],
                    avgScore: 0,
                    avgConfidence: 0,
                    buyCount: 0,
                    sellCount: 0
                };
            }
            sectorPerformance[sector].stocks.push(stock);
            if (stock.recommendation === 'BUY') sectorPerformance[sector].buyCount++;
            if (stock.recommendation === 'SELL') sectorPerformance[sector].sellCount++;
        }
        
        // Calculate sector averages
        for (const data of Object.values(sectorPerformance)) {
            data.avgScore = data.stocks.reduce((sum, s) => sum + s.score, 0) / data.stocks.length;
            data.avgConfidence = data.stocks.reduce((sum, s) => sum + s.confidence, 0) / data.stocks.length;
        }
        
        // Determine market sentiment
        let marketSentiment = 'Neutral';
        let sentimentClass = 'bg-warning';
        if (buyRecommendations > sellRecommendations && avgScore > 60) {
            marketSentiment = 'Bullish';
            sentimentClass = 'bg-success';
        } else if (sellRecommendations > buyRecommendations && avgScore < 40) {
            marketSentiment = 'Bearish';
            sentimentClass = 'bg-danger';
        }
        
        // Get top performing sectors
        const topSectors = Object.entries(sectorPerformance)
            .sort(([,a], [,b]) => b.avgScore - a.avgScore)
            .slice(0, 3);
        
        let html = `
            <div class="mb-4 p-3 rounded" style="background: var(--card-bg); border: 1px solid var(--border-color);">
                <div class="row">
                    <div class="col-md-4">
                        <h6 class="mb-2">
                            <i class="fas fa-chart-line me-2"></i>Market Status
                        </h6>
                        <div class="d-flex align-items-center mb-2">
                            <span class="badge ${sentimentClass} me-2">${marketSentiment}</span>
                            <small class="text-muted">Overall Sentiment</small>
                        </div>
                        <div class="small text-muted">
                            Avg Score: ${avgScore.toFixed(1)} | 
                            Avg Confidence: ${(avgConfidence * 100).toFixed(0)}%
                        </div>
                    </div>
                    <div class="col-md-4">
                        <h6 class="mb-2">
                            <i class="fas fa-pie-chart me-2"></i>Recommendations
                        </h6>
                        <div class="d-flex justify-content-between small">
                            <span class="text-success">BUY: ${buyRecommendations}</span>
                            <span class="text-warning">HOLD: ${holdRecommendations}</span>
                            <span class="text-danger">SELL: ${sellRecommendations}</span>
                        </div>
                        <div class="small text-muted mt-1">
                            Total Stocks: ${this.watchedSymbols.length}
                        </div>
                    </div>
                    <div class="col-md-4">
                        <h6 class="mb-2">
                            <i class="fas fa-industry me-2"></i>Top Sectors
                        </h6>
                        ${topSectors.map(([sector, data]) => `
                            <div class="small mb-1">
                                <span class="fw-bold">${sector}</span>
                                <span class="text-muted ms-2">${data.avgScore.toFixed(0)}</span>
                            </div>
                        `).join('')}
                        <div class="small text-muted mt-1">
                            Last Updated: ${new Date().toLocaleTimeString()}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Show top 12 stocks instead of 8 for better coverage
        for (const stock of analysis.slice(0, 12)) {
            const confidenceClass = stock.confidence > 0.7 ? 'confidence-high' : 
                                  stock.confidence > 0.4 ? 'confidence-medium' : 'confidence-low';
            
            const changeClass = stock.change > 0 ? 'profit' : 'loss';
            const changeIcon = stock.change > 0 ? 'fa-arrow-up' : 'fa-arrow-down';
            
            // Get volatility indicator
            const volatility = this.marketData[stock.symbol]?.volatility || 0;
            const volatilityClass = volatility > 0.3 ? 'text-danger' : volatility > 0.2 ? 'text-warning' : 'text-success';
            const volatilityIcon = volatility > 0.3 ? 'fa-exclamation-triangle' : volatility > 0.2 ? 'fa-minus-circle' : 'fa-check-circle';
            
            const sector = this.getSectorForStock(stock.symbol);
            
            html += `
                <div class="d-flex justify-content-between align-items-center mb-3 p-3 rounded" style="background: var(--card-bg); border: 1px solid var(--border-color);">
                    <div>
                        <div class="d-flex align-items-center">
                            <strong>${stock.symbol}</strong>
                            <span class="badge bg-secondary ms-2 small">${sector}</span>
                            <span class="ml-indicator ${confidenceClass} ms-2">
                                ${Math.round(stock.confidence * 100)}% Confidence
                            </span>
                            <i class="fas ${volatilityIcon} ${volatilityClass} ms-2" title="Volatility: ${(volatility * 100).toFixed(1)}%"></i>
                        </div>
                        <small class="text-muted">
                            RSI: ${stock.rsi.toFixed(1)} | 
                            Sentiment: ${(stock.sentiment * 100).toFixed(0)}% |
                            Vol: ${(volatility * 100).toFixed(1)}%
                        </small>
                    </div>
                    <div class="text-end">
                        <div class="fw-bold">$${stock.price.toFixed(2)}</div>
                        <div class="${changeClass}">
                            <i class="fas ${changeIcon} me-1"></i>
                            ${(stock.change * 100).toFixed(2)}%
                        </div>
                    </div>
                    <div class="text-end">
                        <div class="badge ${stock.recommendation === 'BUY' ? 'bg-success' : stock.recommendation === 'SELL' ? 'bg-danger' : 'bg-warning'}">
                            ${stock.recommendation}
                        </div>
                        <div class="small text-muted">
                            Score: ${stock.score.toFixed(0)}
                        </div>
                    </div>
                </div>
            `;
        }
        
        analysisDiv.innerHTML = html;
        
        // Update market status in header
        this.updateMarketStatusUI(analysis);
    }

    updateMarketStatusUI(analysis) {
        // Update market status in the header if it exists
        const marketStatusElement = document.getElementById('marketStatus');
        if (marketStatusElement) {
            const buyRecommendations = analysis.filter(s => s.recommendation === 'BUY').length;
            const sellRecommendations = analysis.filter(s => s.recommendation === 'SELL').length;
            const avgScore = analysis.reduce((sum, s) => sum + s.score, 0) / analysis.length;
            
            let status = 'Neutral';
            let statusClass = 'text-warning';
            
            if (buyRecommendations > sellRecommendations && avgScore > 60) {
                status = 'Bullish';
                statusClass = 'text-success';
            } else if (sellRecommendations > buyRecommendations && avgScore < 40) {
                status = 'Bearish';
                statusClass = 'text-danger';
            }
            
            marketStatusElement.innerHTML = `
                <span class="${statusClass}">
                    <i class="fas fa-circle me-1" style="font-size: 0.6rem;"></i>
                    ${status}
                </span>
            `;
        }
    }

    async executeTrade(symbol, action, quantity, price) {
        const trade = {
            id: Date.now(),
            timestamp: new Date(),
            symbol,
            action,
            quantity,
            price,
            status: 'executed',
            pnl: 0
        };
        
        if (action === 'BUY') {
            const cost = quantity * price;
            if (this.portfolio.cash >= cost) {
                this.portfolio.cash -= cost;
                this.portfolio.positions[symbol] = (this.portfolio.positions[symbol] || 0) + quantity;
                this.trades.push(trade);
                this.addTradeToUI(trade);
                this.updatePortfolioUI();
                return true;
            }
            return false;
        } else if (action === 'SELL') {
            if (this.portfolio.positions[symbol] >= quantity) {
                this.portfolio.cash += quantity * price;
                this.portfolio.positions[symbol] -= quantity;
                if (this.portfolio.positions[symbol] === 0) {
                    delete this.portfolio.positions[symbol];
                }
                this.trades.push(trade);
                this.addTradeToUI(trade);
                this.updatePortfolioUI();
                return true;
            }
            return false;
        }
        
        return false;
    }

    addTradeToUI(trade) {
        const activityDiv = document.getElementById('tradingActivity');
        
        if (activityDiv.innerHTML.includes('No trades yet')) {
            activityDiv.innerHTML = '';
        }
        
        const tradeElement = document.createElement('div');
        tradeElement.className = 'trade-row';
        tradeElement.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${trade.symbol}</strong>
                    <span class="badge ${trade.action === 'BUY' ? 'bg-success' : 'bg-danger'} ms-2">
                        ${trade.action}
                    </span>
                </div>
                <div class="text-end">
                    <div>${trade.quantity} shares @ $${trade.price.toFixed(2)}</div>
                    <small class="text-muted">${trade.timestamp.toLocaleTimeString()}</small>
                </div>
            </div>
        `;
        
        activityDiv.insertBefore(tradeElement, activityDiv.firstChild);
        
        // Keep only latest 10 trades visible
        const trades = activityDiv.querySelectorAll('.trade-row');
        if (trades.length > 10) {
            trades[trades.length - 1].remove();
        }
    }

    updatePortfolioUI() {
        // Calculate total portfolio value
        let totalValue = this.portfolio.cash;
        
        for (const [symbol, quantity] of Object.entries(this.portfolio.positions)) {
            if (this.marketData[symbol]) {
                totalValue += quantity * this.marketData[symbol].price;
            }
        }
        
        this.portfolio.totalValue = totalValue;
        this.portfolio.totalPnL = totalValue - 10000;
        
        // Update UI elements
        document.getElementById('portfolioValue').textContent = `$${totalValue.toFixed(2)}`;
        document.getElementById('totalPnL').textContent = `$${this.portfolio.totalPnL.toFixed(2)}`;
        document.getElementById('totalPnL').className = this.portfolio.totalPnL >= 0 ? 'profit' : 'loss';
        
        const activeTrades = Object.keys(this.portfolio.positions).length;
        document.getElementById('activeTrades').textContent = activeTrades;
        document.getElementById('totalTrades').textContent = this.trades.length;
        
        // Update chart
        this.updateChart();
    }

    updateChart() {
        const now = new Date();
        const timeLabel = now.toLocaleTimeString();
        
        this.chart.data.labels.push(timeLabel);
        this.chart.data.datasets[0].data.push(this.portfolio.totalValue);
        
        // Keep only last 20 data points
        if (this.chart.data.labels.length > 20) {
            this.chart.data.labels.shift();
            this.chart.data.datasets[0].data.shift();
        }
        
        this.chart.update('none');
    }

    async makeMLDecision(stockData) {
        if (!this.mlModel) return 'HOLD';
        
        try {
            // Prepare input features
            const features = tf.tensor2d([[
                stockData.price / 500, // Normalized price
                stockData.change,
                stockData.volume / 1000000, // Normalized volume
                stockData.rsi / 100, // Normalized RSI
                stockData.macd,
                stockData.volatility,
                stockData.sentiment,
                stockData.pe / 30, // Normalized PE
                Math.random(), // Market trend (simulated)
                Math.random() // Technical indicator (simulated)
            ]]);
            
            const prediction = this.mlModel.predict(features);
            const predictionData = await prediction.data();
            
            // Get the action with highest probability
            const maxIndex = predictionData.indexOf(Math.max(...predictionData));
            const actions = ['BUY', 'HOLD', 'SELL'];
            
            features.dispose();
            prediction.dispose();
            
            return actions[maxIndex];
        } catch (error) {
            console.error('Error making ML decision:', error);
            return 'HOLD';
        }
    }

    async autoTrade() {
        if (!this.isActive) return;
        
        for (const [symbol, data] of Object.entries(this.marketData)) {
            const mlDecision = await this.makeMLDecision(data);
            const score = this.calculateTradingScore(data);
            const confidence = this.calculateConfidence(data);
            
            // Only make trades with high confidence
            if (confidence < 0.6) continue;
            
            const maxPosition = this.portfolio.totalValue * this.settings.maxPositionSize;
            const sharesCanBuy = Math.floor(maxPosition / data.price);
            
            if (mlDecision === 'BUY' && score > 60 && sharesCanBuy > 0) {
                const quantity = Math.max(1, Math.floor(sharesCanBuy * confidence));
                await this.executeTrade(symbol, 'BUY', quantity, data.price);
            } else if (mlDecision === 'SELL' && this.portfolio.positions[symbol] > 0) {
                const quantity = Math.ceil(this.portfolio.positions[symbol] * confidence);
                await this.executeTrade(symbol, 'SELL', quantity, data.price);
            }
        }
        
        // Check stop loss and take profit
        this.checkStopLossAndTakeProfit();
    }

    checkStopLossAndTakeProfit() {
        for (const [symbol, quantity] of Object.entries(this.portfolio.positions)) {
            if (!this.marketData[symbol]) continue;
            
            const currentPrice = this.marketData[symbol].price;
            const buyTrades = this.trades.filter(t => t.symbol === symbol && t.action === 'BUY');
            
            if (buyTrades.length === 0) continue;
            
            const avgBuyPrice = buyTrades.reduce((sum, trade) => sum + trade.price, 0) / buyTrades.length;
            const changePercent = (currentPrice - avgBuyPrice) / avgBuyPrice;
            
            // Stop loss - sell all shares
            if (changePercent <= -this.settings.stopLoss) {
                this.executeTrade(symbol, 'SELL', quantity, currentPrice);
                console.log(`Stop loss triggered for ${symbol} at ${(changePercent * 100).toFixed(2)}%`);
            }
            // Take profit - sell all shares
            else if (changePercent >= this.settings.takeProfit) {
                this.executeTrade(symbol, 'SELL', quantity, currentPrice);
                console.log(`Take profit triggered for ${symbol} at ${(changePercent * 100).toFixed(2)}%`);
            }
        }
    }

    async startTrading() {
        // Initial market analysis
        await this.analyzeMarkets();
        
        // Start the trading loop
        setInterval(async () => {
            await this.fetchMarketData();
            await this.autoTrade();
            this.updatePortfolioUI();
        }, 5000); // Trade every 5 seconds
        
        // Refresh market analysis every 30 seconds
        setInterval(() => {
            this.analyzeMarkets();
        }, 30000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the trading bot when page loads
document.addEventListener('DOMContentLoaded', () => {
    const tradingBot = new StockTradingBot();
    
    // Make the bot globally accessible for debugging
    window.tradingBot = tradingBot;
});
