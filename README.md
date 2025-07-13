# AI Stock Trading Platform

An automated stock trading platform that uses machine learning to analyze markets and execute trades with virtual money. The platform features a clean, modern UI with Bootstrap styling and dark mode support.

## Features

### 🤖 AI-Powered Trading
- **Machine Learning Model**: Uses TensorFlow.js to make trading decisions
- **Market Analysis**: Real-time analysis of multiple market indicators
- **Automated Trading**: Executes trades based on AI recommendations
- **Risk Management**: Configurable stop-loss and take-profit levels

### 📊 Market Analysis
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

### ⚙️ Customizable Settings
- **Risk Levels**: Conservative, Moderate, or Aggressive trading
- **Position Sizing**: Adjustable maximum position size (5-25%)
- **Stop Loss**: Configurable stop-loss percentage (1-10%)
- **Take Profit**: Adjustable take-profit targets (5-25%)

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Bootstrap 5, Font Awesome
- **Charts**: Chart.js
- **Machine Learning**: TensorFlow.js
- **APIs**: Mock data (easily replaceable with real stock APIs)

## Getting Started

1. **Clone or Download** the project files
2. **Open `index.html`** in a modern web browser
3. **Start Trading**: The AI will begin analyzing markets automatically

### File Structure
```
Stock Trader/
├── index.html          # Main application file
├── script.js           # Trading logic and ML implementation
├── styles.css          # Custom styling and animations
└── README.md          # This documentation
```

## How It Works

### 1. Market Data Collection
The platform simulates real market data for major stocks including:
- Apple (AAPL)
- Google (GOOGL)
- Microsoft (MSFT)
- Amazon (AMZN)
- Tesla (TSLA)
- Meta (META)
- NVIDIA (NVDA)
- Netflix (NFLX)

### 2. AI Analysis Process
1. **Data Processing**: Normalizes market data for ML model
2. **Technical Analysis**: Calculates RSI, MACD, and other indicators
3. **Sentiment Scoring**: Evaluates market sentiment
4. **ML Prediction**: Neural network predicts BUY/HOLD/SELL
5. **Confidence Assessment**: Determines trade confidence level

### 3. Trading Execution
- **Automated Trading**: Executes trades every 5 seconds
- **Risk Management**: Applies stop-loss and take-profit rules
- **Position Sizing**: Limits position size based on settings
- **Portfolio Balance**: Maintains cash and position balance

### 4. Performance Monitoring
- **Real-time Updates**: Portfolio value updates continuously
- **Trade History**: Displays recent trading activity
- **Performance Charts**: Visual representation of portfolio growth
- **P&L Tracking**: Tracks profits and losses

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
Replace the `fetchMarketData()` function in `script.js` with real API calls:

```javascript
async fetchMarketData() {
    // Replace with real API call
    // Example: Alpha Vantage, IEX Cloud, Finnhub
    const response = await fetch('YOUR_API_ENDPOINT');
    const data = await response.json();
    return processApiData(data);
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

## Disclaimer

This is a virtual trading platform for educational purposes only. It uses simulated market data and virtual money. This should not be used for actual financial decisions without proper research and risk assessment.

## License

This project is open source and available under the MIT License.
