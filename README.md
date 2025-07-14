# AI Stock T### 📡 Smart Server Backend
- **Multi-Provider API**: 8 providers including Alpha Vantage, TwelveData, Yahoo Finance, FinnHub, IEX Cloud, Polygon, Quandl, WorldTradingData, MarketStack
- **Auto-Disable System**: Automatically disables providers on network failures
- **Smart Fallbacks**: Intelligent provider selection and failover
- **Rate Limit Management**: Advanced rate limiting with persistence
- **Free Endpoints**: 8+ endpoints that work without external APIs
- **Corporate Firewall Compatible**: Works in restricted network environments Platform

An automated stock trading platform with intelligent server-side API management, smart provider fallbacks, and comprehensive market data endpoints. Features a modern web interface with real-time data and virtual trading capabilities.

## Features

### 🤖 AI-Powered Trading
- **Machine Learning Model**: Uses TensorFlow.js to make trading decisions
- **Market Analysis**: Real-time analysis of multiple market indicators
- **Automated Trading**: Executes trades based on AI recommendations
- **Risk Management**: Configurable stop-loss and take-profit levels

### � Smart Server Backend
- **Multi-Provider API**: Alpha Vantage, TwelveData, Yahoo Finance integration
- **Auto-Disable System**: Automatically disables providers on network failures
- **Smart Fallbacks**: Intelligent provider selection and failover
- **Rate Limit Management**: Advanced rate limiting with persistence
- **Free Endpoints**: 8+ endpoints that work without external APIs

### �📊 Market Analysis
- **Technical Indicators**: RSI, MACD, volatility analysis
- **Sentiment Analysis**: Market sentiment scoring
- **Volume Analysis**: Trading volume considerations
- **Confidence Scoring**: AI confidence levels for each recommendation

### 💼 Portfolio Management
- **Virtual Money**: Start with $10,000 virtual capital
- **Real-time Tracking**: Live portfolio value updates
- **P&L Monitoring**: Profit and loss tracking
- **Position Management**: Automatic position sizing

### 🎨 User Interface
- **Bootstrap 5**: Modern, responsive design
- **Dark Mode**: Toggle between light and dark themes
- **Real-time Charts**: Interactive portfolio performance charts
- **Mobile Responsive**: Works on all device sizes

## Technology Stack

### Frontend
- **HTML5, CSS3, JavaScript (ES6+)**
- **Bootstrap 5, Font Awesome**
- **Chart.js for data visualization**
- **TensorFlow.js for machine learning**

### Backend
- **Node.js with Express**
- **MongoDB (optional) with file-based fallback**
- **Smart API provider management**
- **JSON-based configuration system**

## Getting Started

### Quick Start (Frontend Only)
1. **Open `index.html`** in a modern web browser
2. **Start Trading**: The AI will begin with sample data

### Full Setup (With Backend Server)
1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment** (optional):
   ```bash
   # Copy .env.example to .env and add your API keys
   ALPHAVANTAGE_API_KEY=your_key_here
   TWELVEDATA_API_KEY=your_key_here
   MONGODB_URI=your_mongodb_uri_here
   ```

3. **Start the Server**:
   ```bash
   npm start
   # or for development:
   npm run dev
   ```

4. **Access the Application**:
   - Open http://localhost:3001 in your browser
   - The server provides both API endpoints and serves the frontend

## API Endpoints

### Core Endpoints
- **GET /api/quote/:symbol** - Get stock quote with smart fallback
- **GET /api/status** - Server and provider status
- **GET /api/endpoints** - Available API endpoint documentation

### Free Endpoints (No External APIs Required)
- **GET /api/stocks/popular** - Popular stocks with sample data
- **GET /api/sectors** - Market sectors performance
- **GET /api/indices** - Major market indices (SPY, QQQ, DIA, etc.)
- **GET /api/forex** - Currency exchange rates
- **GET /api/market/hours** - Trading hours and market status
- **GET /api/calendar** - Economic calendar events
- **GET /api/calculator/profit** - Profit/loss calculator
- **GET /api/calculator/portfolio** - Portfolio value calculator

## API Providers

The system supports 8 API providers with generous free tiers:

### Primary Providers
1. **Alpha Vantage** - 500 calls/day free
   - Real-time quotes, company data, historical data
   - Get key: https://www.alphavantage.co/support/#api-key

2. **TwelveData** - 800 calls/day free
   - Real-time quotes, bulk requests (120 symbols)
   - Get key: https://twelvedata.com/

3. **Yahoo Finance** - 2000 calls/day (unofficial limits)
   - Quotes, historical data, options data
   - No API key required

### Additional Providers
4. **FinnHub** - 60 calls/minute free
   - Real-time quotes, company profiles, news sentiment
   - Get key: https://finnhub.io/

5. **IEX Cloud** - 500,000 calls/month free
   - High-volume usage, batch requests (100 symbols)
   - Get key: https://iexcloud.io/

6. **Polygon.io** - 5 calls/minute free
   - Last trade data, aggregates, ticker details
   - Get key: https://polygon.io/

7. **Quandl/NASDAQ** - 50 calls/day free
   - Financial datasets, economic data
   - Get key: https://data.nasdaq.com/

8. **WorldTradingData** - 250 calls/day free
   - Stock quotes, search, historical data
   - Get key: https://www.worldtradingdata.com/

9. **MarketStack** - 1000 calls/month free
   - End-of-day data, intraday data, exchanges
   - Get key: https://marketstack.com/

### File Structure
```
Stock Trader/
├── index.html              # Main application file
├── script.js               # Trading logic and ML implementation
├── styles.css              # Custom styling and animations
├── server.js               # Smart backend server with auto-disable
├── package.json            # Node.js dependencies
├── .env.example            # Environment variable template
├── data/
│   ├── api-config.json     # API provider configuration with endpoints
│   ├── rate-limits.json    # Runtime rate limit tracking
│   └── cache_data.json     # API response cache
└── README.md              # This documentation
```

## Server Features

### Smart API Management
- **Multi-Provider Support**: 8 providers with automatic failover
- **Auto-Disable System**: Detects network failures and disables problematic providers
- **Intelligent Fallbacks**: Automatically switches to available providers
- **Rate Limit Tracking**: Persistent rate limit management across restarts

### Configuration Management
- **JSON-Based Config**: Easy provider configuration in `data/api-config.json`
- **Runtime Updates**: Configuration changes persist automatically
- **File-Based Fallback**: Works without MongoDB in corporate environments
- **Environment Variables**: Secure API key management

### Corporate-Friendly
- **Firewall Detection**: Automatically handles blocked external APIs
- **Offline Mode**: Provides sample data when external APIs are unavailable
- **File-Based Storage**: No database requirements
- **Zero Configuration**: Works out of the box

## How It Works

### 1. Market Data Collection
The platform supports both real and simulated market data:

**Real Market Data (via Backend)**:
- Alpha Vantage API for detailed stock information
- TwelveData API for bulk requests and international markets
- Yahoo Finance API for free, high-volume access

**Simulated Data (Frontend)**:
- Covers major stocks (AAPL, GOOGL, MSFT, AMZN, TSLA, etc.)
- Realistic price movements and volatility
- Automatic fallback when APIs are unavailable

### 2. Smart Provider Management
1. **Priority-Based Selection**: Tries providers in order of preference
2. **Failure Detection**: Monitors for network errors (ENOTFOUND, etc.)
3. **Auto-Disable**: Temporarily disables failed providers (30 minutes)
4. **Auto-Recovery**: Re-enables providers after cooldown period
5. **Configuration Persistence**: Saves state across server restarts

### 3. AI Analysis Process
1. **Data Processing**: Normalizes market data for ML model
2. **Technical Analysis**: Calculates RSI, MACD, and other indicators
3. **Sentiment Scoring**: Evaluates market sentiment
4. **ML Prediction**: Neural network predicts BUY/HOLD/SELL
5. **Confidence Assessment**: Determines trade confidence level

### 4. Trading Execution
- **Automated Trading**: Executes trades every 5 seconds
- **Risk Management**: Applies stop-loss and take-profit rules
- **Position Sizing**: Limits position size based on settings
- **Portfolio Balance**: Maintains cash and position balance

## Configuration Options

### Risk Levels
- **Conservative**: Lower volatility, smaller positions
- **Moderate**: Balanced approach (default)
- **Aggressive**: Higher risk, larger potential returns

### Position Management
- **Max Position Size**: 5-25% of portfolio per trade
- **Stop Loss**: 1-10% maximum loss per position
- **Take Profit**: 5-25% target profit per position

## Customization

### Adding Real Market Data
The backend server automatically handles real market data with smart provider management:

```javascript
// Backend automatically tries providers in order:
// 1. Alpha Vantage (most accurate, rate limited)
// 2. TwelveData (good for bulk requests)
// 3. Yahoo Finance (free, high volume)
// 4. Sample data (when all providers fail)
```

To add your own API keys, copy `.env.example` to `.env` and add your keys:
```bash
# Copy the example file
cp .env.example .env

# Then edit .env with your API keys:
ALPHAVANTAGE_API_KEY=your_alpha_vantage_key
TWELVEDATA_API_KEY=your_twelve_data_key
FINNHUB_API_KEY=your_finnhub_key
IEXCLOUD_API_KEY=your_iexcloud_key
POLYGON_API_KEY=your_polygon_key
QUANDL_API_KEY=your_quandl_key
WORLDTRADINGDATA_API_KEY=your_worldtradingdata_key
MARKETSTACK_API_KEY=your_marketstack_key
MONGODB_URI=your_mongodb_connection_string
```

### Configuring API Providers
Modify `data/api-config.json` to customize provider settings:
```json
{
  "providers": {
    "alphavantage": {
      "enabled": true,
      "priority": 1,
      "dailyLimit": 500,
      "minuteLimit": 5
    }
  }
}
```

### Extending the ML Model
The machine learning model can be enhanced by:
- Adding more input features
- Increasing model complexity
- Training with historical data
- Implementing reinforcement learning

### UI Customization
- Modify CSS variables in `styles.css`
- Add new chart types using Chart.js
- Implement additional dashboard widgets
- Customize color schemes and animations

## Performance Notes

- **Virtual Trading**: Uses simulated money for safe testing
- **Real-time Updates**: Updates every 5 seconds for live feel
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Mode**: Automatic theme persistence

## Future Enhancements

- [ ] Real API integration
- [ ] Historical backtesting
- [ ] Advanced charting tools
- [ ] Portfolio analytics
- [ ] Multiple trading strategies
- [ ] Social trading features
- [ ] Email/SMS notifications
- [ ] Export trading history

## Browser Compatibility

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## 🚀 Deployment

### Quick Deploy to Vercel (Recommended)
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign up with GitHub
3. Import your repository and deploy - Done! 🎉

**Why Vercel?**
- ✅ Corporate firewall friendly (`vercel.app` rarely blocked)
- ✅ Automatic deployment on Git commits
- ✅ Free tier with generous limits
- ✅ Perfect for Node.js applications

**Alternative Options:**
- **Netlify**: `netlify.app` - Great for static sites with edge functions
- **Railway**: `railway.app` - Full-stack hosting with database support
- **Render**: `render.com` - Simple deployment with auto-scaling

See `DEPLOYMENT-GUIDE.md` for detailed instructions.

### Live Demo
After deployment, your app will be available at:
- **Main App**: `https://your-app-name.vercel.app/`
- **API Status**: `https://your-app-name.vercel.app/api/status`
- **Firewall Test**: `https://your-app-name.vercel.app/api/firewall/status`

## Disclaimer

This is a virtual trading platform for educational purposes only. It uses simulated market data and virtual money. This should not be used for actual financial decisions without proper research and risk assessment.

## License

This project is open source and available under the MIT License.
