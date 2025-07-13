// AI Stock Trading Platform
class StockTradingBot {
    constructor() {
        this.isActive = true;
        this.startingValue = 50; // Starting portfolio value in pounds
        this.portfolio = {
            cash: 50,
            positions: {},
            totalValue: 50,
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
        
        // Pagination and sorting state
        this.analysisState = {
            currentPage: 1,
            itemsPerPage: 12,
            sortBy: 'score',
            sortOrder: 'desc',
            allAnalysis: []
        };
        
        this.initializeUI();
        this.initializeChart();
        this.initializeSectorData();
        this.initializeML();
        this.startTrading();
    }

    initializeUI() {
        // Dark mode toggle - dark mode is now default
        const darkModeToggle = document.getElementById('darkModeToggle');
        darkModeToggle.addEventListener('change', this.toggleDarkMode.bind(this));
        
        // Check for saved theme preference or set dark as default
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            darkModeToggle.checked = false;
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            // Default to dark mode
            darkModeToggle.checked = true;
            document.documentElement.removeAttribute('data-theme'); // Use default (dark) styles
            localStorage.setItem('theme', 'dark');
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

        // Initialize stock detail modal
        this.initializeStockModal();
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
                            color: 'rgba(255, 255, 255, 0.9)', // More visible white color
                            callback: function(value) {
                                return '£' + value.toLocaleString();
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        title: {
                            color: 'rgba(255, 255, 255, 0.9)'
                        }
                    },
                    x: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.9)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        title: {
                            color: 'rgba(255, 255, 255, 0.9)'
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
            // Switch to dark mode (default)
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            // Switch to light mode
            document.documentElement.setAttribute('data-theme', 'light');
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
        try {
            // Simulate API call - in real implementation, use actual stock API
            const mockData = {};
            
            for (const symbol of this.watchedSymbols) {
                const sector = this.getSectorForStock(symbol);
                const sectorInfo = this.sectorData[sector] || {
                    priceRange: [50, 300],
                    volatilityRange: [0.15, 0.4]
                };
                
                // Generate sector-appropriate base price
                const [minPrice, maxPrice] = sectorInfo.priceRange;
                const basePrice = minPrice + Math.random() * (maxPrice - minPrice);
                
                // Generate sector-appropriate volatility
                const [minVol, maxVol] = sectorInfo.volatilityRange;
                const volatility = minVol + Math.random() * (maxVol - minVol);
                
                // Price change based on volatility
                const change = (Math.random() - 0.5) * volatility; // Sector-appropriate change range
                
                mockData[symbol] = {
                    symbol,
                    sector,
                    price: basePrice * (1 + change),
                    change: change,
                    volume: Math.floor(Math.random() * 2000000) + 100000, // Higher volume range
                    marketCap: basePrice * (1000000000 + Math.random() * 500000000000), // Varied market caps
                    pe: 8 + Math.random() * 40, // PE ratios from 8-48
                    volatility: volatility,
                    rsi: 20 + Math.random() * 60, // RSI from 20-80
                    macd: (Math.random() - 0.5) * 3, // MACD signal
                    sentiment: Math.random(),
                    beta: 0.5 + Math.random() * 2, // Beta from 0.5 to 2.5
                    dividendYield: Math.random() * 0.06, // Dividend yield up to 6%
                    fiftyTwoWeekHigh: basePrice * (1.1 + Math.random() * 0.4),
                    fiftyTwoWeekLow: basePrice * (0.6 + Math.random() * 0.3)
                };
            }
            
            this.marketData = mockData;
            return mockData;
        } catch (error) {
            console.error('Error fetching market data:', error);
            throw error;
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
        
        // Store all analysis data for pagination and sorting
        this.analysisState.allAnalysis = analysis;
        
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
                    <div class="col-md-3">
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
                    <div class="col-md-3">
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
                    <div class="col-md-3">
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
                    <div class="col-md-3">
                        <h6 class="mb-2">
                            <i class="fas fa-cog me-2"></i>View Controls
                        </h6>
                        <div class="row g-2">
                            <div class="col-6">
                                <select class="form-select form-select-sm" id="sortBySelect" onchange="window.tradingBot.updateSorting()">
                                    <option value="score">Score</option>
                                    <option value="symbol">Symbol</option>
                                    <option value="price">Price</option>
                                    <option value="change">Change</option>
                                    <option value="confidence">Confidence</option>
                                    <option value="recommendation">Action</option>
                                </select>
                            </div>
                            <div class="col-6">
                                <select class="form-select form-select-sm" id="itemsPerPageSelect" onchange="window.tradingBot.updateItemsPerPage()">
                                    <option value="12">12 per page</option>
                                    <option value="24">24 per page</option>
                                    <option value="48">48 per page</option>
                                    <option value="all">Show All</option>
                                </select>
                            </div>
                        </div>
                        <button class="btn btn-sm btn-outline-secondary mt-2 w-100" onclick="window.tradingBot.toggleSortOrder()">
                            <i class="fas fa-sort"></i> 
                            <span id="sortOrderText">${this.analysisState.sortOrder === 'desc' ? 'High to Low' : 'Low to High'}</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add sorting controls and stock list
        html += this.renderStockList();
        
        analysisDiv.innerHTML = html;
        
        // Set current values in dropdowns
        document.getElementById('sortBySelect').value = this.analysisState.sortBy;
        document.getElementById('itemsPerPageSelect').value = this.analysisState.itemsPerPage;
        
        // Update market status in header
        this.updateMarketStatusUI(analysis);
    }

    renderStockList() {
        if (!this.analysisState.allAnalysis || this.analysisState.allAnalysis.length === 0) {
            return '<div class="text-center text-muted py-4">No analysis data available</div>';
        }

        // Sort the analysis data
        const sortedAnalysis = this.sortAnalysis([...this.analysisState.allAnalysis]);
        
        // Calculate pagination
        const totalItems = sortedAnalysis.length;
        const itemsPerPage = this.analysisState.itemsPerPage === 'all' ? totalItems : parseInt(this.analysisState.itemsPerPage);
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const startIndex = (this.analysisState.currentPage - 1) * itemsPerPage;
        const endIndex = this.analysisState.itemsPerPage === 'all' ? totalItems : startIndex + itemsPerPage;
        const currentPageItems = sortedAnalysis.slice(startIndex, endIndex);
        
        let html = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="text-muted">
                    Showing ${startIndex + 1}-${Math.min(endIndex, totalItems)} of ${totalItems} stocks
                </div>
                ${this.analysisState.itemsPerPage !== 'all' ? this.renderPaginationControls(totalPages) : ''}
            </div>
        `;

        // Render stock items
        for (const stock of currentPageItems) {
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
                <div class="d-flex justify-content-between align-items-center mb-3 p-3 rounded stock-item" 
                     style="background: var(--card-bg); border: 1px solid var(--border-color); cursor: pointer; transition: all 0.2s ease;"
                     onclick="window.tradingBot.showStockDetail('${stock.symbol}')"
                     onmouseenter="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.1)'"
                     onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                    <div>
                        <div class="d-flex align-items-center">
                            <strong>${stock.symbol}</strong>
                            <span class="badge bg-secondary ms-2 small">${sector}</span>
                            <span class="ml-indicator ${confidenceClass} ms-2">
                                ${Math.round(stock.confidence * 100)}% Confidence
                            </span>
                            <i class="fas ${volatilityIcon} ${volatilityClass} ms-2" title="Volatility: ${(volatility * 100).toFixed(1)}%"></i>
                            <i class="fas fa-external-link-alt ms-2 text-muted" style="font-size: 0.8rem;" title="Click for detailed analysis"></i>
                        </div>
                        <small class="text-muted">
                            RSI: ${stock.rsi.toFixed(1)} | 
                            Sentiment: ${(stock.sentiment * 100).toFixed(0)}% |
                            Vol: ${(volatility * 100).toFixed(1)}%
                        </small>
                    </div>
                    <div class="text-end">
                        <div class="fw-bold">£${stock.price.toFixed(2)}</div>
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

        // Add pagination at bottom if needed
        if (this.analysisState.itemsPerPage !== 'all' && totalPages > 1) {
            html += `
                <div class="d-flex justify-content-center mt-4">
                    ${this.renderPaginationControls(totalPages)}
                </div>
            `;
        }

        return html;
    }

    renderPaginationControls(totalPages) {
        if (totalPages <= 1) return '';
        
        const currentPage = this.analysisState.currentPage;
        let pagination = '<nav aria-label="Stock analysis pagination"><ul class="pagination pagination-sm justify-content-center">';
        
        // Previous button
        pagination += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <button class="page-link" onclick="window.tradingBot.goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i>
                </button>
            </li>
        `;
        
        // Page numbers
        const maxVisiblePages = 7;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        // Adjust start if we're near the end
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // First page + ellipsis if needed
        if (startPage > 1) {
            pagination += `
                <li class="page-item">
                    <button class="page-link" onclick="window.tradingBot.goToPage(1)">1</button>
                </li>
            `;
            if (startPage > 2) {
                pagination += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }
        
        // Visible page numbers
        for (let i = startPage; i <= endPage; i++) {
            pagination += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <button class="page-link" onclick="window.tradingBot.goToPage(${i})">${i}</button>
                </li>
            `;
        }
        
        // Last page + ellipsis if needed
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pagination += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
            pagination += `
                <li class="page-item">
                    <button class="page-link" onclick="window.tradingBot.goToPage(${totalPages})">${totalPages}</button>
                </li>
            `;
        }
        
        // Next button
        pagination += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <button class="page-link" onclick="window.tradingBot.goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                    <i class="fas fa-chevron-right"></i>
                </button>
            </li>
        `;
        
        pagination += '</ul></nav>';
        return pagination;
    }

    sortAnalysis(analysis) {
        const { sortBy, sortOrder } = this.analysisState;
        
        return analysis.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'symbol':
                    aValue = a.symbol;
                    bValue = b.symbol;
                    break;
                case 'price':
                    aValue = a.price;
                    bValue = b.price;
                    break;
                case 'change':
                    aValue = a.change;
                    bValue = b.change;
                    break;
                case 'confidence':
                    aValue = a.confidence;
                    bValue = b.confidence;
                    break;
                case 'recommendation':
                    // Custom sorting for recommendations: BUY > HOLD > SELL
                    const recommendationOrder = { 'BUY': 3, 'HOLD': 2, 'SELL': 1 };
                    aValue = recommendationOrder[a.recommendation];
                    bValue = recommendationOrder[b.recommendation];
                    break;
                case 'score':
                default:
                    aValue = a.score;
                    bValue = b.score;
                    break;
            }
            
            // Handle string vs number comparison
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                const comparison = aValue.localeCompare(bValue);
                return sortOrder === 'asc' ? comparison : -comparison;
            } else {
                const comparison = aValue - bValue;
                return sortOrder === 'asc' ? comparison : -comparison;
            }
        });
    }

    // Control methods for pagination and sorting
    goToPage(page) {
        const totalItems = this.analysisState.allAnalysis.length;
        const itemsPerPage = this.analysisState.itemsPerPage === 'all' ? totalItems : parseInt(this.analysisState.itemsPerPage);
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        
        if (page >= 1 && page <= totalPages) {
            this.analysisState.currentPage = page;
            this.refreshAnalysisDisplay();
        }
    }

    updateSorting() {
        const sortBySelect = document.getElementById('sortBySelect');
        this.analysisState.sortBy = sortBySelect.value;
        this.analysisState.currentPage = 1; // Reset to first page when sorting changes
        this.refreshAnalysisDisplay();
    }

    updateItemsPerPage() {
        const itemsPerPageSelect = document.getElementById('itemsPerPageSelect');
        this.analysisState.itemsPerPage = itemsPerPageSelect.value;
        this.analysisState.currentPage = 1; // Reset to first page when items per page changes
        this.refreshAnalysisDisplay();
    }

    toggleSortOrder() {
        this.analysisState.sortOrder = this.analysisState.sortOrder === 'asc' ? 'desc' : 'asc';
        const sortOrderText = document.getElementById('sortOrderText');
        if (sortOrderText) {
            sortOrderText.textContent = this.analysisState.sortOrder === 'desc' ? 'High to Low' : 'Low to High';
        }
        this.refreshAnalysisDisplay();
    }

    refreshAnalysisDisplay() {
        if (this.analysisState.allAnalysis && this.analysisState.allAnalysis.length > 0) {
            this.displayAnalysis(this.analysisState.allAnalysis);
        }
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

    initializeStockModal() {
        // Initialize the candlestick chart for the modal
        this.modalChart = null;
        this.selectedStock = null;
        
        // Add event listeners for modal buttons
        document.getElementById('quickBuyBtn').addEventListener('click', this.handleQuickBuy.bind(this));
        document.getElementById('quickSellBtn').addEventListener('click', this.handleQuickSell.bind(this));
    }

    showStockDetail(symbol) {
        this.selectedStock = symbol;
        const stockData = this.marketData[symbol];
        
        if (!stockData) {
            console.error('No data available for', symbol);
            return;
        }

        // Update modal title
        document.getElementById('modalStockSymbol').textContent = symbol;
        
        // Populate stock info panel
        this.populateStockInfo(stockData);
        
        // Create candlestick chart
        this.createCandlestickChart(symbol);
        
        // Populate technical analysis
        this.populateTechnicalAnalysis(stockData);
        
        // Populate trade history
        this.populateTradeHistory(symbol);
        
        // Populate AI predictions
        this.populateAIPredictions(stockData);
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('stockDetailModal'));
        modal.show();
    }

    populateStockInfo(stockData) {
        const sector = this.getSectorForStock(stockData.symbol);
        const infoPanel = document.getElementById('stockInfoPanel');
        
        const changeClass = stockData.change >= 0 ? 'text-success' : 'text-danger';
        const changeIcon = stockData.change >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
        
        infoPanel.innerHTML = `
            <div class="mb-3 p-3 border rounded">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h4 class="mb-0">£${stockData.price.toFixed(2)}</h4>
                    <span class="${changeClass}">
                        <i class="fas ${changeIcon} me-1"></i>
                        ${(stockData.change * 100).toFixed(2)}%
                    </span>
                </div>
                <span class="badge bg-secondary">${sector}</span>
            </div>
            
            <div class="row g-3">
                <div class="col-6">
                    <div class="text-center p-2 border rounded">
                        <small class="text-muted d-block">Market Cap</small>
                        <strong>£${(stockData.marketCap / 1e9).toFixed(1)}B</strong>
                    </div>
                </div>
                <div class="col-6">
                    <div class="text-center p-2 border rounded">
                        <small class="text-muted d-block">P/E Ratio</small>
                        <strong>${stockData.pe.toFixed(1)}</strong>
                    </div>
                </div>
                <div class="col-6">
                    <div class="text-center p-2 border rounded">
                        <small class="text-muted d-block">Volume</small>
                        <strong>${(stockData.volume / 1e6).toFixed(1)}M</strong>
                    </div>
                </div>
                <div class="col-6">
                    <div class="text-center p-2 border rounded">
                        <small class="text-muted d-block">Beta</small>
                        <strong>${stockData.beta.toFixed(2)}</strong>
                    </div>
                </div>
                <div class="col-6">
                    <div class="text-center p-2 border rounded">
                        <small class="text-muted d-block">52W High</small>
                        <strong>£${stockData.fiftyTwoWeekHigh.toFixed(2)}</strong>
                    </div>
                </div>
                <div class="col-6">
                    <div class="text-center p-2 border rounded">
                        <small class="text-muted d-block">52W Low</small>
                        <strong>£${stockData.fiftyTwoWeekLow.toFixed(2)}</strong>
                    </div>
                </div>
            </div>
            
            <div class="mt-3">
                <div class="d-flex justify-content-between mb-1">
                    <small>Dividend Yield</small>
                    <small><strong>${(stockData.dividendYield * 100).toFixed(2)}%</strong></small>
                </div>
                <div class="d-flex justify-content-between mb-1">
                    <small>Volatility</small>
                    <small><strong>${(stockData.volatility * 100).toFixed(1)}%</strong></small>
                </div>
                <div class="d-flex justify-content-between">
                    <small>Sentiment Score</small>
                    <small><strong>${(stockData.sentiment * 100).toFixed(0)}%</strong></small>
                </div>
            </div>
        `;
    }

    createCandlestickChart(symbol) {
        const ctx = document.getElementById('candlestickChart').getContext('2d');
        
        // Generate 30 days of historical data
        const historicalData = this.generateHistoricalData(symbol, 30);
        
        // Destroy existing chart if it exists
        if (this.modalChart) {
            this.modalChart.destroy();
        }
        
        // Create simple line chart
        this.modalChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: historicalData.map(d => d.date),
                datasets: [
                    {
                        label: 'Close Price',
                        data: historicalData.map(d => d.close),
                        borderColor: '#4f46e5',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        fill: true,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        tension: 0.1
                    },
                    {
                        label: 'Volume',
                        data: historicalData.map(d => d.volume / 1000000),
                        type: 'bar',
                        backgroundColor: 'rgba(156, 163, 175, 0.3)',
                        borderColor: 'rgba(156, 163, 175, 0.7)',
                        borderWidth: 1,
                        yAxisID: 'volume',
                        order: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Date',
                            color: 'rgba(255, 255, 255, 0.9)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.9)',
                            maxRotation: 45
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Price (£)',
                            color: 'rgba(255, 255, 255, 0.9)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.9)',
                            callback: function(value) {
                                return '£' + value.toFixed(2);
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    volume: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Volume (M)',
                            color: 'rgba(255, 255, 255, 0.9)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.9)',
                            callback: function(value) {
                                return value.toFixed(1) + 'M';
                            }
                        },
                        grid: {
                            drawOnChartArea: false,
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        max: Math.max(...historicalData.map(d => d.volume / 1000000)) * 1.2
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: 'rgba(255, 255, 255, 0.9)'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                return 'Date: ' + context[0].label;
                            },
                            label: function(context) {
                                if (context.datasetIndex === 0) {
                                    return 'Close: £' + context.parsed.y.toFixed(2);
                                } else {
                                    return `Volume: ${context.parsed.y.toFixed(1)}M`;
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    generateHistoricalData(symbol, days) {
        const stockData = this.marketData[symbol];
        const data = [];
        const basePrice = stockData.price;
        let currentPrice = basePrice;
        
        for (let i = days; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            // Generate price movement
            const change = (Math.random() - 0.5) * stockData.volatility * 0.5;
            currentPrice = Math.max(0.01, currentPrice * (1 + change));
            
            data.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                close: currentPrice,
                volume: stockData.volume * (0.7 + Math.random() * 0.6) // Vary volume by ±30%
            });
        }
        
        return data;
    }

    populateTechnicalAnalysis(stockData) {
        const panel = document.getElementById('technicalAnalysisPanel');
        
        // Calculate additional technical indicators
        const sma20 = stockData.price * (0.98 + Math.random() * 0.04);
        const sma50 = stockData.price * (0.95 + Math.random() * 0.1);
        
        // Technical analysis scoring
        let technicalScore = 0;
        let signals = [];
        
        if (stockData.rsi < 30) {
            signals.push({ type: 'bullish', text: 'RSI Oversold - Buy Signal' });
            technicalScore += 20;
        } else if (stockData.rsi > 70) {
            signals.push({ type: 'bearish', text: 'RSI Overbought - Sell Signal' });
            technicalScore -= 15;
        }
        
        if (stockData.macd > 0) {
            signals.push({ type: 'bullish', text: 'MACD Positive - Bullish Momentum' });
            technicalScore += 15;
        } else {
            signals.push({ type: 'bearish', text: 'MACD Negative - Bearish Momentum' });
            technicalScore -= 10;
        }
        
        if (stockData.price > sma20) {
            signals.push({ type: 'bullish', text: 'Price above SMA(20) - Uptrend' });
            technicalScore += 10;
        }
        
        panel.innerHTML = `
            <div class="row g-3 mb-3">
                <div class="col-6">
                    <div class="text-center p-2 border rounded">
                        <small class="text-muted d-block">RSI</small>
                        <strong class="${stockData.rsi < 30 ? 'text-success' : stockData.rsi > 70 ? 'text-danger' : 'text-warning'}">
                            ${stockData.rsi.toFixed(1)}
                        </strong>
                    </div>
                </div>
                <div class="col-6">
                    <div class="text-center p-2 border rounded">
                        <small class="text-muted d-block">MACD</small>
                        <strong class="${stockData.macd > 0 ? 'text-success' : 'text-danger'}">
                            ${stockData.macd.toFixed(3)}
                        </strong>
                    </div>
                </div>
                <div class="col-6">
                    <div class="text-center p-2 border rounded">
                        <small class="text-muted d-block">SMA(20)</small>
                        <strong>£${sma20.toFixed(2)}</strong>
                    </div>
                </div>
                <div class="col-6">
                    <div class="text-center p-2 border rounded">
                        <small class="text-muted d-block">SMA(50)</small>
                        <strong>£${sma50.toFixed(2)}</strong>
                    </div>
                </div>
            </div>
            
            <div class="mb-3">
                <h6 class="mb-2">Technical Signals</h6>
                <div class="signals-container">
                    ${signals.map(signal => `
                        <div class="d-flex align-items-center mb-2">
                            <i class="fas fa-circle me-2 ${signal.type === 'bullish' ? 'text-success' : 'text-danger'}" style="font-size: 0.6rem;"></i>
                            <small>${signal.text}</small>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="technical-score">
                <div class="d-flex justify-content-between align-items-center">
                    <span>Technical Score:</span>
                    <span class="badge ${technicalScore > 30 ? 'bg-success' : technicalScore > 0 ? 'bg-warning' : 'bg-danger'}">
                        ${technicalScore}/100
                    </span>
                </div>
                <div class="progress mt-2" style="height: 6px;">
                    <div class="progress-bar ${technicalScore > 30 ? 'bg-success' : technicalScore > 0 ? 'bg-warning' : 'bg-danger'}" 
                         style="width: ${Math.max(0, technicalScore)}%"></div>
                </div>
            </div>
        `;
    }

    populateTradeHistory(symbol) {
        const panel = document.getElementById('tradeHistoryPanel');
        const trades = this.trades.filter(trade => trade.symbol === symbol);
        
        if (trades.length === 0) {
            panel.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-inbox fa-2x mb-3"></i>
                    <p>No trades found for ${symbol}</p>
                </div>
            `;
            return;
        }
        
        // Calculate P&L for trades
        const tradesWithPnL = trades.map(trade => {
            const currentPrice = this.marketData[symbol].price;
            let pnl = 0;
            
            if (trade.action === 'BUY') {
                pnl = (currentPrice - trade.price) * trade.quantity;
            } else {
                pnl = (trade.price - currentPrice) * trade.quantity;
            }
            
            return { ...trade, pnl };
        });
        
        const totalPnL = tradesWithPnL.reduce((sum, trade) => sum + trade.pnl, 0);
        
        panel.innerHTML = `
            <div class="mb-3 p-3 border rounded">
                <div class="d-flex justify-content-between">
                    <span>Total Trades:</span>
                    <strong>${trades.length}</strong>
                </div>
                <div class="d-flex justify-content-between">
                    <span>Total P&L:</span>
                    <strong class="${totalPnL >= 0 ? 'text-success' : 'text-danger'}">
                        ${totalPnL >= 0 ? '+' : ''}£${totalPnL.toFixed(2)}
                    </strong>
                </div>
            </div>
            
            <div class="trades-list" style="max-height: 200px; overflow-y: auto;">
                ${tradesWithPnL.slice(-10).reverse().map(trade => `
                    <div class="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                        <div>
                            <span class="badge ${trade.action === 'BUY' ? 'bg-success' : 'bg-danger'} me-2">
                                ${trade.action}
                            </span>
                            <span>${trade.quantity} shares @ £${trade.price.toFixed(2)}</span>
                        </div>
                        <div class="text-end">
                            <div class="small ${trade.pnl >= 0 ? 'text-success' : 'text-danger'}">
                                ${trade.pnl >= 0 ? '+' : ''}£${trade.pnl.toFixed(2)}
                            </div>
                            <div class="small text-muted">
                                ${trade.timestamp.toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async populateAIPredictions(stockData) {
        const panel = document.getElementById('aiPredictionPanel');
        
        try {
            // Get ML prediction
            const mlDecision = await this.makeMLDecision(stockData);
            const score = this.calculateTradingScore(stockData);
            const confidence = this.calculateConfidence(stockData);
            
            // Generate price prediction
            const priceChange = (Math.random() - 0.5) * stockData.volatility * 2;
            const predictedPrice = stockData.price * (1 + priceChange);
            
            // Risk assessment
            let riskLevel = 'Low';
            let riskClass = 'success';
            if (stockData.volatility > 0.3) {
                riskLevel = 'High';
                riskClass = 'danger';
            } else if (stockData.volatility > 0.2) {
                riskLevel = 'Medium';
                riskClass = 'warning';
            }
            
            panel.innerHTML = `
                <div class="row g-3">
                    <div class="col-md-4">
                        <div class="text-center p-3 border rounded">
                            <div class="h5 mb-2">
                                <span class="badge ${mlDecision === 'BUY' ? 'bg-success' : mlDecision === 'SELL' ? 'bg-danger' : 'bg-warning'}">
                                    ${mlDecision}
                                </span>
                            </div>
                            <small class="text-muted">AI Recommendation</small>
                            <div class="mt-2">
                                <div class="small">Confidence: ${(confidence * 100).toFixed(0)}%</div>
                                <div class="progress mt-1" style="height: 4px;">
                                    <div class="progress-bar bg-primary" style="width: ${confidence * 100}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-4">
                        <div class="text-center p-3 border rounded">
                            <div class="h5 mb-2">£${predictedPrice.toFixed(2)}</div>
                            <small class="text-muted">7-Day Price Target</small>
                            <div class="mt-2">
                                <div class="small ${priceChange >= 0 ? 'text-success' : 'text-danger'}">
                                    ${priceChange >= 0 ? '+' : ''}${(priceChange * 100).toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-4">
                        <div class="text-center p-3 border rounded">
                            <div class="h5 mb-2">
                                <span class="badge bg-${riskClass}">${riskLevel}</span>
                            </div>
                            <small class="text-muted">Risk Level</small>
                            <div class="mt-2">
                                <div class="small">Score: ${score.toFixed(0)}/100</div>
                                <div class="progress mt-1" style="height: 4px;">
                                    <div class="progress-bar bg-${riskClass}" style="width: ${score}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="mt-4">
                    <h6 class="mb-3">AI Analysis Summary</h6>
                    <div class="p-3 border rounded bg-light">
                        <p class="mb-2">
                            <strong>Market Position:</strong> 
                            Based on technical indicators and market sentiment, ${stockData.symbol} shows 
                            ${mlDecision.toLowerCase() === 'buy' ? 'strong buying potential' : 
                              mlDecision.toLowerCase() === 'sell' ? 'selling pressure' : 'neutral positioning'}.
                        </p>
                        <p class="mb-2">
                            <strong>Key Factors:</strong>
                            RSI at ${stockData.rsi.toFixed(1)} indicates 
                            ${stockData.rsi < 30 ? 'oversold conditions' : stockData.rsi > 70 ? 'overbought conditions' : 'neutral momentum'}.
                            Current volatility of ${(stockData.volatility * 100).toFixed(1)}% suggests ${riskLevel.toLowerCase()} risk.
                        </p>
                        <p class="mb-0">
                            <strong>Recommendation:</strong>
                            ${mlDecision === 'BUY' ? 'Consider buying with proper position sizing and stop-loss protection.' :
                              mlDecision === 'SELL' ? 'Consider reducing position or implementing protective stops.' :
                              'Monitor for clearer signals before making significant position changes.'}
                        </p>
                    </div>
                </div>
            `;
            
        } catch (error) {
            console.error('Error generating AI predictions:', error);
            panel.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Unable to generate AI predictions at this time.
                </div>
            `;
        }
    }

    async handleQuickBuy() {
        if (!this.selectedStock) return;
        
        const stockData = this.marketData[this.selectedStock];
        const maxPosition = this.portfolio.totalValue * this.settings.maxPositionSize;
        const quantity = Math.max(1, Math.floor(maxPosition / stockData.price));
        
        const success = await this.executeTrade(this.selectedStock, 'BUY', quantity, stockData.price);
        
        if (success) {
            // Update the trade history in the modal
            this.populateTradeHistory(this.selectedStock);
            
            // Show success message
            const button = document.getElementById('quickBuyBtn');
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check me-2"></i>Purchased!';
            button.classList.add('btn-outline-success');
            button.classList.remove('btn-success');
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.classList.remove('btn-outline-success');
                button.classList.add('btn-success');
            }, 2000);
        }
    }

    async handleQuickSell() {
        if (!this.selectedStock) return;
        
        const position = this.portfolio.positions[this.selectedStock];
        if (!position || position <= 0) {
            alert('No shares to sell for ' + this.selectedStock);
            return;
        }
        
        const stockData = this.marketData[this.selectedStock];
        const quantity = Math.min(position, Math.ceil(position * 0.5)); // Sell half position
        
        const success = await this.executeTrade(this.selectedStock, 'SELL', quantity, stockData.price);
        
        if (success) {
            // Update the trade history in the modal
            this.populateTradeHistory(this.selectedStock);
            
            // Show success message
            const button = document.getElementById('quickSellBtn');
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check me-2"></i>Sold!';
            button.classList.add('btn-outline-danger');
            button.classList.remove('btn-danger');
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.classList.remove('btn-outline-danger');
                button.classList.add('btn-danger');
            }, 2000);
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
            const totalCost = quantity * price;
            if (totalCost <= this.portfolio.cash) {
                this.portfolio.cash -= totalCost;
                this.portfolio.positions[symbol] = (this.portfolio.positions[symbol] || 0) + quantity;
                this.trades.push(trade);
                this.addTradeToUI(trade);
                this.updatePortfolioUI();
                return true;
            }
        } else if (action === 'SELL') {
            const currentPosition = this.portfolio.positions[symbol] || 0;
            if (quantity <= currentPosition) {
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
                    <span class="badge ${trade.action === 'BUY' ? 'bg-success' : 'bg-danger'}">${trade.action}</span>
                    <strong class="ms-2">${trade.symbol}</strong>
                    <span class="ms-2">${trade.quantity} shares @ £${trade.price.toFixed(2)}</span>
                </div>
                <div class="text-end">
                    <div class="fw-bold">£${(trade.quantity * trade.price).toFixed(2)}</div>
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

    async makeMLDecision(stockData) {
        if (!this.mlModel) {
            // Fallback to rule-based decision
            const score = this.calculateTradingScore(stockData);
            if (score > 70) return 'BUY';
            else if (score < 40) return 'SELL';
            else return 'HOLD';
        }

        try {
            // Prepare input features for ML model
            const features = tf.tensor2d([
                [
                    stockData.rsi / 100,
                    stockData.macd,
                    stockData.volatility,
                    stockData.sentiment,
                    stockData.change,
                    stockData.volume / 1000000,
                    stockData.pe / 50,
                    stockData.beta,
                    stockData.dividendYield,
                    (stockData.price - stockData.fiftyTwoWeekLow) / (stockData.fiftyTwoWeekHigh - stockData.fiftyTwoWeekLow)
                ]
            ]);

            const prediction = this.mlModel.predict(features);
            const predictionArray = await prediction.data();
            
            // Clean up tensors
            features.dispose();
            prediction.dispose();
            
            // Find the action with highest probability
            const maxIndex = predictionArray.indexOf(Math.max(...predictionArray));
            const actions = ['BUY', 'HOLD', 'SELL'];
            
            return actions[maxIndex];
        } catch (error) {
            console.error('ML prediction error:', error);
            return 'HOLD';
        }
    }

    async autoTrade() {
        if (!this.isActive || !this.marketData) return;

        // Get best trading opportunities
        const analysis = this.performMarketAnalysis();
        const topStocks = analysis.slice(0, 3); // Top 3 opportunities

        for (const stock of topStocks) {
            const stockData = this.marketData[stock.symbol];
            const mlDecision = await this.makeMLDecision(stockData);
            
            if (mlDecision === 'BUY' && stock.score > 75 && stock.confidence > 0.6) {
                const maxInvestment = this.portfolio.totalValue * this.settings.maxPositionSize;
                const quantity = Math.floor(maxInvestment / stockData.price);
                
                if (quantity > 0 && maxInvestment <= this.portfolio.cash) {
                    await this.executeTrade(stock.symbol, 'BUY', quantity, stockData.price);
                    console.log(`Auto-bought ${quantity} shares of ${stock.symbol} at £${stockData.price.toFixed(2)}`);
                }
            } else if (mlDecision === 'SELL' && stock.score < 30) {
                const currentPosition = this.portfolio.positions[stock.symbol] || 0;
                if (currentPosition > 0) {
                    const sellQuantity = Math.ceil(currentPosition * 0.5); // Sell half position
                    await this.executeTrade(stock.symbol, 'SELL', sellQuantity, stockData.price);
                    console.log(`Auto-sold ${sellQuantity} shares of ${stock.symbol} at £${stockData.price.toFixed(2)}`);
                }
            }
        }
    }

    async startTrading() {
        console.log('Starting AI trading bot...');
        
        // Initial market analysis
        await this.analyzeMarkets();
        
        // Set up trading intervals
        setInterval(async () => {
            if (!this.isActive) return;
            
            await this.fetchMarketData();
            await this.autoTrade();
            this.updatePortfolioUI();
        }, 5000); // Trade every 5 seconds
        
        // Refresh market analysis every 30 seconds
        setInterval(() => {
            this.analyzeMarkets();
        }, 30000);
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
        this.portfolio.totalPnL = totalValue - this.startingValue;
        
        // Update UI elements
        document.getElementById('portfolioValue').textContent = `£${totalValue.toFixed(2)}`;
        document.getElementById('totalPnL').textContent = `£${this.portfolio.totalPnL.toFixed(2)}`;
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
        
        this.chart.update();
    }

    renderStockList() {
        if (!this.analysisState.allAnalysis || this.analysisState.allAnalysis.length === 0) {
            return '<div class="text-center text-muted py-4">No analysis data available</div>';
        }

        // Sort the analysis data
        const sortedAnalysis = this.sortAnalysis([...this.analysisState.allAnalysis]);
        
        // Calculate pagination
        const totalItems = sortedAnalysis.length;
        const itemsPerPage = this.analysisState.itemsPerPage === 'all' ? totalItems : parseInt(this.analysisState.itemsPerPage);
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const startIndex = (this.analysisState.currentPage - 1) * itemsPerPage;
        const endIndex = this.analysisState.itemsPerPage === 'all' ? totalItems : startIndex + itemsPerPage;
        const currentPageItems = sortedAnalysis.slice(startIndex, endIndex);
        
        let html = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="text-muted">
                    Showing ${startIndex + 1}-${Math.min(endIndex, totalItems)} of ${totalItems} stocks
                </div>
                ${this.analysisState.itemsPerPage !== 'all' ? this.renderPaginationControls(totalPages) : ''}
            </div>
        `;

        // Render stock items
        for (const stock of currentPageItems) {
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
                <div class="d-flex justify-content-between align-items-center mb-3 p-3 rounded stock-item" 
                     style="background: var(--card-bg); border: 1px solid var(--border-color); cursor: pointer; transition: all 0.2s ease;"
                     onclick="window.tradingBot.showStockDetail('${stock.symbol}')"
                     onmouseenter="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.1)'"
                     onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                    <div>
                        <div class="d-flex align-items-center">
                            <strong>${stock.symbol}</strong>
                            <span class="badge bg-secondary ms-2 small">${sector}</span>
                            <span class="ml-indicator ${confidenceClass} ms-2">
                                ${Math.round(stock.confidence * 100)}% Confidence
                            </span>
                            <i class="fas ${volatilityIcon} ${volatilityClass} ms-2" title="Volatility: ${(volatility * 100).toFixed(1)}%"></i>
                            <i class="fas fa-external-link-alt ms-2 text-muted" style="font-size: 0.8rem;" title="Click for detailed analysis"></i>
                        </div>
                        <small class="text-muted">
                            RSI: ${stock.rsi.toFixed(1)} | 
                            Sentiment: ${(stock.sentiment * 100).toFixed(0)}% |
                            Vol: ${(volatility * 100).toFixed(1)}%
                        </small>
                    </div>
                    <div class="text-end">
                        <div class="fw-bold">£${stock.price.toFixed(2)}</div>
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

        // Add pagination at bottom if needed
        if (this.analysisState.itemsPerPage !== 'all' && totalPages > 1) {
            html += `
                <div class="d-flex justify-content-center mt-4">
                    ${this.renderPaginationControls(totalPages)}
                </div>
            `;
        }

        return html;
    }

    renderPaginationControls(totalPages) {
        if (totalPages <= 1) return '';
        
        const currentPage = this.analysisState.currentPage;
        let pagination = '<nav aria-label="Stock analysis pagination"><ul class="pagination pagination-sm justify-content-center">';
        
        // Previous button
        pagination += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <button class="page-link" onclick="window.tradingBot.goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i>
                </button>
            </li>
        `;
        
        // Page numbers
        const maxVisiblePages = 7;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        // Adjust start if we're near the end
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // First page + ellipsis if needed
        if (startPage > 1) {
            pagination += `
                <li class="page-item">
                    <button class="page-link" onclick="window.tradingBot.goToPage(1)">1</button>
                </li>
            `;
            if (startPage > 2) {
                pagination += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }
        
        // Visible page numbers
        for (let i = startPage; i <= endPage; i++) {
            pagination += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <button class="page-link" onclick="window.tradingBot.goToPage(${i})">${i}</button>
                </li>
            `;
        }
        
        // Last page + ellipsis if needed
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pagination += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
            pagination += `
                <li class="page-item">
                    <button class="page-link" onclick="window.tradingBot.goToPage(${totalPages})">${totalPages}</button>
                </li>
            `;
        }
        
        // Next button
        pagination += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <button class="page-link" onclick="window.tradingBot.goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                    <i class="fas fa-chevron-right"></i>
                </button>
            </li>
        `;
        
        pagination += '</ul></nav>';
        return pagination;
    }

    sortAnalysis(analysis) {
        const { sortBy, sortOrder } = this.analysisState;
        
        return analysis.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'symbol':
                    aValue = a.symbol;
                    bValue = b.symbol;
                    break;
                case 'price':
                    aValue = a.price;
                    bValue = b.price;
                    break;
                case 'change':
                    aValue = a.change;
                    bValue = b.change;
                    break;
                case 'confidence':
                    aValue = a.confidence;
                    bValue = b.confidence;
                    break;
                case 'recommendation':
                    // Custom sorting for recommendations: BUY > HOLD > SELL
                    const recommendationOrder = { 'BUY': 3, 'HOLD': 2, 'SELL': 1 };
                    aValue = recommendationOrder[a.recommendation];
                    bValue = recommendationOrder[b.recommendation];
                    break;
                case 'score':
                default:
                    aValue = a.score;
                    bValue = b.score;
                    break;
            }
            
            // Handle string vs number comparison
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                const comparison = aValue.localeCompare(bValue);
                return sortOrder === 'asc' ? comparison : -comparison;
            } else {
                const comparison = aValue - bValue;
                return sortOrder === 'asc' ? comparison : -comparison;
            }
        });
    }

    // Control methods for pagination and sorting
    goToPage(page) {
        const totalItems = this.analysisState.allAnalysis.length;
        const itemsPerPage = this.analysisState.itemsPerPage === 'all' ? totalItems : parseInt(this.analysisState.itemsPerPage);
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        
        if (page >= 1 && page <= totalPages) {
            this.analysisState.currentPage = page;
            this.refreshAnalysisDisplay();
        }
    }

    updateSorting() {
        const sortBySelect = document.getElementById('sortBySelect');
        this.analysisState.sortBy = sortBySelect.value;
        this.analysisState.currentPage = 1; // Reset to first page when sorting changes
        this.refreshAnalysisDisplay();
    }

    updateItemsPerPage() {
        const itemsPerPageSelect = document.getElementById('itemsPerPageSelect');
        this.analysisState.itemsPerPage = itemsPerPageSelect.value;
        this.analysisState.currentPage = 1; // Reset to first page when items per page changes
        this.refreshAnalysisDisplay();
    }

    toggleSortOrder() {
        this.analysisState.sortOrder = this.analysisState.sortOrder === 'asc' ? 'desc' : 'asc';
        const sortOrderText = document.getElementById('sortOrderText');
        if (sortOrderText) {
            sortOrderText.textContent = this.analysisState.sortOrder === 'desc' ? 'High to Low' : 'Low to High';
        }
        this.refreshAnalysisDisplay();
    }

    refreshAnalysisDisplay() {
        if (this.analysisState.allAnalysis && this.analysisState.allAnalysis.length > 0) {
            this.displayAnalysis(this.analysisState.allAnalysis);
        }
    }
}

// Initialize the trading bot when page loads
document.addEventListener('DOMContentLoaded', () => {
    const tradingBot = new StockTradingBot();
    
    // Make the bot globally accessible for debugging
    window.tradingBot = tradingBot;
});
