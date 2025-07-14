const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static('.'));

// Database configuration
let useMongoDb = false;
let db = null;
let mongoClient = null;

// File-based database configuration
const dbPath = path.join(__dirname, 'data');
const configFile = path.join(dbPath, 'api_config.json');
const rateLimitFile = path.join(dbPath, 'rate_limits.json');
const cacheFile = path.join(dbPath, 'cache_data.json');

// Ensure data directory exists
async function ensureDataDirectory() {
  try {
    await fs.mkdir(dbPath, { recursive: true });
  } catch (error) {
    console.error('❌ Error creating data directory:', error.message);
  }
}

// Test MongoDB connection with timeout
async function testMongoDBConnection() {
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    console.log('ℹ️ No MONGODB_URI found in environment variables');
    return false;
  }

  try {
    console.log('🔄 Testing MongoDB connection...');
    
    // Dynamic import of MongoDB to handle missing dependency gracefully
    let MongoClient, ServerApiVersion;
    try {
      const mongodb = require('mongodb');
      MongoClient = mongodb.MongoClient;
      ServerApiVersion = mongodb.ServerApiVersion;
    } catch (error) {
      console.log('ℹ️ MongoDB package not installed, using file-based storage');
      return false;
    }

    mongoClient = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      connectTimeoutMS: 5000,
      socketTimeoutMS: 5000,
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });

    // Test connection with timeout
    await mongoClient.connect();
    db = mongoClient.db('stock-trader');
    
    // Ping to verify connection
    await db.admin().ping();
    
    console.log('✅ MongoDB connection successful!');
    return true;
    
  } catch (error) {
    console.log('⚠️ MongoDB connection failed:', error.message);
    
    // Check for specific network/DNS errors
    if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.log('🚫 Network/DNS restriction detected - using local file storage');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('🚫 Connection refused - MongoDB server not accessible');
    } else if (error.message.includes('timeout')) {
      console.log('⏱️ Connection timeout - network restrictions likely');
    }
    
    // Clean up failed connection
    if (mongoClient) {
      try {
        await mongoClient.close();
      } catch (closeError) {
        // Ignore close errors
      }
      mongoClient = null;
      db = null;
    }
    
    return false;
  }
}

// Initialize database (MongoDB or file-based)
async function initializeDatabase() {
  console.log('🚀 Initializing database...');
  
  // Always ensure file directory exists as fallback
  await ensureDataDirectory();
  
  // Test MongoDB connection
  useMongoDb = await testMongoDBConnection();
  
  if (useMongoDb) {
    console.log('📊 Using MongoDB for data storage');
    await initializeMongoCollections();
  } else {
    console.log('📁 Using file-based JSON storage');
  }
  
  console.log('✅ Database initialization complete');
}

// Initialize MongoDB collections
async function initializeMongoCollections() {
  if (!db) return;
  
  try {
    // Create indexes for better performance
    await db.collection('api_config').createIndex({ "type": 1 }, { unique: true });
    await db.collection('rate_limits').createIndex({ "type": 1 }, { unique: true });
    await db.collection('cache_data').createIndex({ "key": 1 }, { unique: true });
    await db.collection('cache_data').createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 });
    
    console.log('📊 MongoDB collections and indexes created');
  } catch (error) {
    console.warn('⚠️ Warning: Could not create MongoDB indexes:', error.message);
  }
}

// File operations
async function readJsonFile(filePath, defaultData = {}) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`❌ Error reading ${filePath}:`, error.message);
    }
    return defaultData;
  }
}

async function writeJsonFile(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`❌ Error writing ${filePath}:`, error.message);
  }
}

// API Configuration management
async function getApiConfig() {
  const defaultConfig = {
    type: 'main',
    providers: {
      alphavantage: {
        enabled: true,
        priority: 1,
        apiKey: process.env.ALPHAVANTAGE_API_KEY,
        baseUrl: 'https://www.alphavantage.co/query',
        dailyLimit: 25, // Free tier limit
        minuteLimit: 5,
        supportsBulk: false,
        callsToday: 25, // Mark as exceeded since user mentioned limit reached
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).getTime() // Reset tomorrow
      },
      twelvedata: {
        enabled: true,
        priority: 2,
        apiKey: process.env.TWELVEDATA_API_KEY,
        baseUrl: 'https://api.twelvedata.com',
        dailyLimit: 800,
        minuteLimit: 8,
        supportsBulk: true,
        bulkLimit: 120,
        callsToday: 0,
        resetTime: null
      },
      finnhub: {
        enabled: true,
        priority: 4,
        apiKey: process.env.FINNHUB_API_KEY,
        baseUrl: 'https://finnhub.io/api/v1',
        dailyLimit: 60,
        minuteLimit: 60,
        supportsBulk: false,
        callsToday: 0,
        resetTime: null
      },
      iexcloud: {
        enabled: true,
        priority: 5,
        apiKey: process.env.IEXCLOUD_API_KEY,
        baseUrl: 'https://cloud.iexapis.com/stable',
        dailyLimit: 500000,
        minuteLimit: 100,
        supportsBulk: true,
        bulkLimit: 100,
        callsToday: 0,
        resetTime: null
      },
      polygon: {
        enabled: true,
        priority: 6,
        apiKey: process.env.POLYGON_API_KEY,
        baseUrl: 'https://api.polygon.io/v2',
        dailyLimit: 5,
        minuteLimit: 5,
        supportsBulk: false,
        callsToday: 0,
        resetTime: null
      },
      quandl: {
        enabled: true,
        priority: 7,
        apiKey: process.env.QUANDL_API_KEY,
        baseUrl: 'https://data.nasdaq.com/api/v3',
        dailyLimit: 50,
        minuteLimit: 20,
        supportsBulk: false,
        callsToday: 0,
        resetTime: null
      },
      worldtradingdata: {
        enabled: true,
        priority: 8,
        apiKey: process.env.WORLDTRADINGDATA_API_KEY,
        baseUrl: 'https://api.worldtradingdata.com/api/v1',
        dailyLimit: 250,
        minuteLimit: 5,
        supportsBulk: true,
        bulkLimit: 5,
        callsToday: 0,
        resetTime: null
      },
      marketstack: {
        enabled: true,
        priority: 9,
        apiKey: process.env.MARKETSTACK_API_KEY,
        baseUrl: 'http://api.marketstack.com/v1',
        dailyLimit: 1000,
        minuteLimit: 10,
        supportsBulk: false,
        callsToday: 0,
        resetTime: null
      }
    },
    lastUpdated: new Date().toISOString()
  };

  if (useMongoDb && db) {
    try {
      const config = await db.collection('api_config').findOne({ type: 'main' });
      if (config) {
        console.log('📖 Loaded API config from MongoDB');
        return config;
      }
    } catch (error) {
      console.error('❌ Error reading API config from MongoDB:', error.message);
    }
  }

  // Fallback to file-based storage
  const config = await readJsonFile(configFile, defaultConfig);
  
  // Override with environment variables if they exist (takes precedence over JSON file)
  if (process.env.ALPHAVANTAGE_API_KEY) {
    config.providers.alphavantage.apiKey = process.env.ALPHAVANTAGE_API_KEY;
  }
  if (process.env.TWELVEDATA_API_KEY) {
    config.providers.twelvedata.apiKey = process.env.TWELVEDATA_API_KEY;
  }
  if (process.env.FINNHUB_API_KEY) {
    config.providers.finnhub.apiKey = process.env.FINNHUB_API_KEY;
  }
  if (process.env.IEXCLOUD_API_KEY) {
    config.providers.iexcloud.apiKey = process.env.IEXCLOUD_API_KEY;
  }
  if (process.env.POLYGON_API_KEY) {
    config.providers.polygon.apiKey = process.env.POLYGON_API_KEY;
  }
  if (process.env.QUANDL_API_KEY) {
    config.providers.quandl.apiKey = process.env.QUANDL_API_KEY;
  }
  if (process.env.WORLDTRADINGDATA_API_KEY) {
    config.providers.worldtradingdata.apiKey = process.env.WORLDTRADINGDATA_API_KEY;
  }
  if (process.env.MARKETSTACK_API_KEY) {
    config.providers.marketstack.apiKey = process.env.MARKETSTACK_API_KEY;
  }
  
  console.log(`📖 Loaded API config from ${useMongoDb ? 'MongoDB (fallback to file)' : 'JSON file'}`);
  console.log(`🔑 API keys source: ${hasEnvironmentOverrides(config) ? 'Environment variables + JSON file' : 'JSON file only'}`);
  return config;
}

// Helper function to check if environment variables are being used
function hasEnvironmentOverrides(config) {
  return !!(process.env.ALPHAVANTAGE_API_KEY || 
           process.env.TWELVEDATA_API_KEY || 
           process.env.FINNHUB_API_KEY || 
           process.env.IEXCLOUD_API_KEY || 
           process.env.POLYGON_API_KEY || 
           process.env.QUANDL_API_KEY || 
           process.env.WORLDTRADINGDATA_API_KEY || 
           process.env.MARKETSTACK_API_KEY);
}

async function saveApiConfig(config) {
  config.lastUpdated = new Date().toISOString();
  
  if (useMongoDb && db) {
    try {
      await db.collection('api_config').replaceOne(
        { type: 'main' },
        config,
        { upsert: true }
      );
      console.log('💾 API config saved to MongoDB');
      return;
    } catch (error) {
      console.error('❌ Error saving API config to MongoDB:', error.message);
    }
  }
  
  // Fallback to file-based storage
  await writeJsonFile(configFile, config);
  console.log('💾 API config saved to file');
}

// Rate limit management
async function getRateLimitData() {
  const defaultData = {
    type: 'current',
    alphavantage: { requests: 0, lastReset: new Date().toISOString() },
    twelvedata: { requests: 0, lastReset: new Date().toISOString() },
    finnhub: { requests: 0, lastReset: new Date().toISOString() },
    iexcloud: { requests: 0, lastReset: new Date().toISOString() },
    polygon: { requests: 0, lastReset: new Date().toISOString() },
    quandl: { requests: 0, lastReset: new Date().toISOString() },
    worldtradingdata: { requests: 0, lastReset: new Date().toISOString() },
    marketstack: { requests: 0, lastReset: new Date().toISOString() },
    lastUpdated: new Date().toISOString()
  };

  if (useMongoDb && db) {
    try {
      const data = await db.collection('rate_limits').findOne({ type: 'current' });
      if (data) {
        console.log('📊 Loaded rate limits from MongoDB');
        return data;
      }
    } catch (error) {
      console.error('❌ Error reading rate limits from MongoDB:', error.message);
    }
  }

  // Fallback to file-based storage
  const data = await readJsonFile(rateLimitFile, defaultData);
  console.log(`📊 Loaded rate limits from ${useMongoDb ? 'MongoDB (fallback to file)' : 'file'}`);
  return data;
}

async function saveRateLimitData(data) {
  data.lastUpdated = new Date().toISOString();
  
  if (useMongoDb && db) {
    try {
      await db.collection('rate_limits').replaceOne(
        { type: 'current' },
        data,
        { upsert: true }
      );
      return;
    } catch (error) {
      console.error('❌ Error saving rate limits to MongoDB:', error.message);
    }
  }
  
  // Fallback to file-based storage
  const saveData = {
    type: 'current',
    lastUpdated: new Date().toISOString()
  };
  
  // Dynamically add all provider data
  const providers = ['alphavantage', 'twelvedata', 'finnhub', 'iexcloud', 'polygon', 'quandl', 'worldtradingdata', 'marketstack'];
  
  providers.forEach(provider => {
    if (data[provider]) {
      saveData[provider] = {
        requests: data[provider].requests,
        lastReset: typeof data[provider].lastReset === 'string' ? 
          data[provider].lastReset : data[provider].lastReset.toISOString()
      };
    }
  });
  
  await writeJsonFile(rateLimitFile, saveData);
}

// Cache management
const cache = new Map();

async function getCachedData(key) {
  // Check in-memory cache first
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  if (useMongoDb && db) {
    try {
      const cached = await db.collection('cache_data').findOne({ key });
      if (cached && new Date(cached.expiresAt) > new Date()) {
        cache.set(key, cached.data);
        return cached.data;
      }
    } catch (error) {
      console.error('❌ Error reading cache from MongoDB:', error.message);
    }
  }
  
  // Fallback to file-based cache
  const cacheData = await readJsonFile(cacheFile, {});
  const cached = cacheData[key];
  
  if (cached && new Date(cached.expiresAt) > new Date()) {
    cache.set(key, cached.data);
    return cached.data;
  }
  
  return null;
}

async function setCachedData(key, data, ttlMinutes = 60) {
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  
  // Store in memory cache
  cache.set(key, data);
  
  if (useMongoDb && db) {
    try {
      await db.collection('cache_data').replaceOne(
        { key },
        { key, data, expiresAt },
        { upsert: true }
      );
      return;
    } catch (error) {
      console.error('❌ Error saving cache to MongoDB:', error.message);
    }
  }
  
  // Fallback to file-based cache
  const cacheData = await readJsonFile(cacheFile, {});
  cacheData[key] = { data, expiresAt };
  await writeJsonFile(cacheFile, cacheData);
}

// Initialize rate limits
let rateLimits = null;

// Load rate limits on startup
async function loadRateLimits() {
  const data = await getRateLimitData();
  
  // Convert string dates back to Date objects for internal use
  rateLimits = {};
  
  const providers = ['alphavantage', 'twelvedata', 'finnhub', 'iexcloud', 'polygon', 'quandl', 'worldtradingdata', 'marketstack'];
  
  providers.forEach(provider => {
    if (data[provider]) {
      rateLimits[provider] = {
        requests: provider === 'alphavantage' ? 25 : data[provider].requests, // Mark AlphaVantage as exceeded
        lastReset: new Date(data[provider].lastReset)
      };
    } else {
      // Initialize missing providers
      rateLimits[provider] = {
        requests: 0,
        lastReset: new Date()
      };
    }
  });
  
  console.log('📊 Rate limits loaded:');
  console.log(`   • Alpha Vantage: ${rateLimits.alphavantage.requests}/500 (daily limit exceeded)`);
  console.log(`   • TwelveData: ${rateLimits.twelvedata.requests}/800`);
  console.log(`   • FinnHub: ${rateLimits.finnhub.requests}/60`);
  console.log(`   • IEX Cloud: ${rateLimits.iexcloud.requests}/500000`);
  console.log(`   • Polygon: ${rateLimits.polygon.requests}/5`);
  console.log(`   • Quandl: ${rateLimits.quandl.requests}/50`);
  console.log(`   • WorldTradingData: ${rateLimits.worldtradingdata.requests}/250`);
  console.log(`   • MarketStack: ${rateLimits.marketstack.requests}/1000`);
}

// Rate limit utility functions
function shouldResetRateLimit(lastReset) {
  const now = new Date();
  const resetTime = new Date(lastReset);
  const hoursSinceReset = (now - resetTime) / (1000 * 60 * 60);
  return hoursSinceReset >= 24;
}

async function checkAndResetRateLimits() {
  let updated = false;
  const providers = ['alphavantage', 'twelvedata', 'finnhub', 'iexcloud', 'polygon', 'quandl', 'worldtradingdata', 'marketstack'];
  
  providers.forEach(provider => {
    if (rateLimits[provider] && shouldResetRateLimit(rateLimits[provider].lastReset)) {
      rateLimits[provider].requests = 0;
      rateLimits[provider].lastReset = new Date();
      updated = true;
      console.log(`🔄 ${provider} rate limit reset`);
    }
  });
  
  if (updated) {
    await saveRateLimitData(rateLimits);
  }
}

function hasCapacity(provider, config) {
  const limits = rateLimits[provider];
  const providerConfig = config.providers[provider];
  
  if (!providerConfig?.enabled) return false;
  
  // Check if provider reset time has passed
  checkProviderReset(provider, config);
  
  // Check if currently rate limited
  if (providerConfig.resetTime && Date.now() < providerConfig.resetTime) {
    const resetDate = new Date(providerConfig.resetTime);
    console.log(`🚫 ${provider} rate limited until ${resetDate.toLocaleString()}`);
    return false;
  }
  
  return limits.requests < providerConfig.dailyLimit;
}

async function incrementRateLimit(provider) {
  if (rateLimits[provider]) {
    rateLimits[provider].requests++;
    await saveRateLimitData(rateLimits);
  }
}

// API call functions
async function makeApiCall(url, provider) {
  try {
    console.log(`📡 Making API call to ${provider}: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    await incrementRateLimit(provider);
    
    // Reset failure count on successful call
    providerFailureCount.set(provider, 0);
    
    return { success: true, data };
  } catch (error) {
    console.error(`❌ API call failed for ${provider}:`, error.message);
    
    // Handle provider failure (auto-disable on network errors)
    await handleProviderFailure(provider, error);
    
    return { success: false, error: error.message };
  }
}

async function getAlphaVantageQuote(symbol, config) {
  const providerConfig = config.providers.alphavantage;
  
  // Check if Alpha Vantage is rate limited
  if (providerConfig.resetTime && Date.now() < providerConfig.resetTime) {
    throw new Error('Alpha Vantage daily limit exceeded. Resets tomorrow.');
  }
  
  const url = `${providerConfig.baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${providerConfig.apiKey}`;
  
  const result = await makeApiCall(url, 'alphavantage');
  if (result.success) {
    const data = result.data;
    
    // Check for Alpha Vantage specific error messages
    if (data['Error Message']) {
      throw new Error(`Alpha Vantage Error: ${data['Error Message']}`);
    }
    
    if (data['Note'] || data['Information']) {
      // API limit exceeded
      handleAlphaVantageRateLimit(config);
      throw new Error('Alpha Vantage daily limit exceeded. Resets tomorrow.');
    }
    
    const quote = data['Global Quote'];
    if (quote) {
      return {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        timestamp: new Date().toISOString(),
        provider: 'alphavantage'
      };
    }
  }
  
  throw new Error(result.error || 'Invalid response format');
}

async function getTwelveDataQuote(symbol, config) {
  const providerConfig = config.providers.twelvedata;
  const url = `${providerConfig.baseUrl}/quote?symbol=${symbol}&apikey=${providerConfig.apiKey}`;
  
  const result = await makeApiCall(url, 'twelvedata');
  if (result.success && result.data) {
    return {
      symbol: result.data.symbol,
      price: parseFloat(result.data.close),
      change: parseFloat(result.data.change),
      changePercent: parseFloat(result.data.percent_change),
      timestamp: new Date().toISOString(),
      provider: 'twelvedata'
    };
  }
  
  throw new Error(result.error || 'Invalid response format');
}

async function getFinnhubQuote(symbol, config) {
  const providerConfig = config.providers.finnhub;
  const url = `${providerConfig.baseUrl}/quote?symbol=${symbol}&token=${providerConfig.apiKey}`;
  
  const result = await makeApiCall(url, 'finnhub');
  if (result.success && result.data) {
    return {
      symbol: symbol,
      price: parseFloat(result.data.c), // current price
      change: parseFloat(result.data.d), // change
      changePercent: parseFloat(result.data.dp), // change percent
      timestamp: new Date().toISOString(),
      provider: 'finnhub'
    };
  }
  
  throw new Error(result.error || 'Invalid response format');
}

async function getIEXCloudQuote(symbol, config) {
  const providerConfig = config.providers.iexcloud;
  const url = `${providerConfig.baseUrl}/stock/${symbol}/quote?token=${providerConfig.apiKey}`;
  
  const result = await makeApiCall(url, 'iexcloud');
  if (result.success && result.data) {
    return {
      symbol: result.data.symbol,
      price: parseFloat(result.data.latestPrice),
      change: parseFloat(result.data.change),
      changePercent: parseFloat(result.data.changePercent) * 100, // IEX returns decimal
      timestamp: new Date().toISOString(),
      provider: 'iexcloud'
    };
  }
  
  throw new Error(result.error || 'Invalid response format');
}

async function getPolygonQuote(symbol, config) {
  const providerConfig = config.providers.polygon;
  const url = `${providerConfig.baseUrl}/last/trade/${symbol}?apiKey=${providerConfig.apiKey}`;
  
  const result = await makeApiCall(url, 'polygon');
  if (result.success && result.data?.results) {
    const trade = result.data.results;
    return {
      symbol: symbol,
      price: parseFloat(trade.p), // price
      change: 0, // Polygon last trade doesn't include change
      changePercent: 0,
      timestamp: new Date().toISOString(),
      provider: 'polygon',
      note: 'Last trade price only - change data not available'
    };
  }
  
  throw new Error(result.error || 'Invalid response format');
}

async function getWorldTradingDataQuote(symbol, config) {
  const providerConfig = config.providers.worldtradingdata;
  const url = `${providerConfig.baseUrl}/stock?symbol=${symbol}&api_token=${providerConfig.apiKey}`;
  
  const result = await makeApiCall(url, 'worldtradingdata');
  if (result.success && result.data?.data && result.data.data.length > 0) {
    const stock = result.data.data[0];
    return {
      symbol: stock.symbol,
      price: parseFloat(stock.price),
      change: parseFloat(stock.day_change),
      changePercent: parseFloat(stock.change_pct),
      timestamp: new Date().toISOString(),
      provider: 'worldtradingdata'
    };
  }
  
  throw new Error(result.error || 'Invalid response format');
}

async function getMarketStackQuote(symbol, config) {
  const providerConfig = config.providers.marketstack;
  const url = `${providerConfig.baseUrl}/eod/latest?access_key=${providerConfig.apiKey}&symbols=${symbol}`;
  
  const result = await makeApiCall(url, 'marketstack');
  if (result.success && result.data?.data && result.data.data.length > 0) {
    const stock = result.data.data[0];
    return {
      symbol: stock.symbol,
      price: parseFloat(stock.close),
      change: parseFloat(stock.close - stock.open), // Calculate change
      changePercent: parseFloat(((stock.close - stock.open) / stock.open) * 100),
      timestamp: new Date().toISOString(),
      provider: 'marketstack'
    };
  }
  
  throw new Error(result.error || 'Invalid response format');
}

// Handle Alpha Vantage rate limit exceeded
function handleAlphaVantageRateLimit(config) {
  const providerConfig = config.providers.alphavantage;
  
  // Set reset time to tomorrow (next day at same time)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  providerConfig.callsToday = providerConfig.dailyLimit; // Mark as exceeded
  providerConfig.resetTime = tomorrow.getTime();
  
  console.log(`⏰ Alpha Vantage daily limit exceeded. Reset scheduled for: ${tomorrow.toLocaleString()}`);
  
  return tomorrow.getTime();
}

// Check if provider should reset (for Alpha Vantage daily limits)
function checkProviderReset(providerName, config) {
  const providerConfig = config.providers[providerName];
  const now = Date.now();
  
  // Check if reset time has passed
  if (providerConfig.resetTime && now >= providerConfig.resetTime) {
    providerConfig.resetTime = null;
    providerConfig.callsToday = 0;
    providerConfig.callsThisMinute = 0;
    console.log(`✅ ${providerName} daily limit reset - API calls resumed`);
    return true;
  }
  
  return false;
}

// Get best provider based on priority and capacity
async function getBestProvider(config) {
  const availableProviders = [];
  
  for (const [name, providerConfig] of Object.entries(config.providers)) {
    // Check if provider is available (not disabled due to network failures)
    const isAvailable = await checkProviderAvailability(name, config);
    
    if (isAvailable && hasCapacity(name, config)) {
      availableProviders.push([name, providerConfig]);
    }
  }
  
  // Sort by priority (lower number = higher priority)
  availableProviders.sort((a, b) => a[1].priority - b[1].priority);
  
  return availableProviders.length > 0 ? availableProviders[0][0] : null;
}

// Main stock quote function
async function getStockQuote(symbol) {
  // Check cache first
  const cacheKey = `quote_${symbol}`;
  const cached = await getCachedData(cacheKey);
  if (cached) {
    console.log(`💾 Returning cached data for ${symbol}`);
    return cached;
  }
  
  await checkAndResetRateLimits();
  const config = await getApiConfig();
  
  const provider = await getBestProvider(config);
  if (!provider) {
    throw new Error('No available API providers with remaining capacity');
  }
  
  let quote;
  try {
    switch (provider) {
      case 'alphavantage':
        quote = await getAlphaVantageQuote(symbol, config);
        break;
      case 'twelvedata':
        quote = await getTwelveDataQuote(symbol, config);
        break;
      case 'finnhub':
        quote = await getFinnhubQuote(symbol, config);
        break;
      case 'iexcloud':
        quote = await getIEXCloudQuote(symbol, config);
        break;
      case 'polygon':
        quote = await getPolygonQuote(symbol, config);
        break;
      case 'worldtradingdata':
        quote = await getWorldTradingDataQuote(symbol, config);
        break;
      case 'marketstack':
        quote = await getMarketStackQuote(symbol, config);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
    
    // Cache the result for 5 minutes
    await setCachedData(cacheKey, quote, 5);
    console.log(`✅ Quote retrieved for ${symbol} via ${provider}`);
    
    return quote;
  } catch (error) {
    console.error(`❌ Error getting quote for ${symbol}:`, error.message);
    
    // Fallback to offline sample data when all APIs are blocked/rate limited
    console.log(`🔌 Network restricted - providing offline sample data for ${symbol}`);
    return getOfflineSampleQuote(symbol);
  }
}

// Offline sample data for when external APIs are blocked
function getOfflineSampleQuote(symbol) {
  // Sample quotes for common stocks with realistic-looking data
  const sampleQuotes = {
    'AAPL': { price: 195.89, change: 2.45, changePercent: 1.27 },
    'MSFT': { price: 415.26, change: -3.22, changePercent: -0.77 },
    'GOOGL': { price: 175.43, change: 1.85, changePercent: 1.07 },
    'TSLA': { price: 248.50, change: -5.30, changePercent: -2.09 },
    'AMZN': { price: 186.37, change: 4.12, changePercent: 2.26 },
    'NVDA': { price: 915.75, change: 12.43, changePercent: 1.38 },
    'META': { price: 495.82, change: -7.18, changePercent: -1.43 },
    'NFLX': { price: 642.11, change: 8.95, changePercent: 1.41 },
    'CRM': { price: 284.33, change: 3.67, changePercent: 1.31 },
    'UBER': { price: 72.18, change: -1.22, changePercent: -1.66 }
  };
  
  // Use sample data if available, otherwise generate realistic random data
  const baseData = sampleQuotes[symbol] || {
    price: Math.round((Math.random() * 500 + 50) * 100) / 100,
    change: Math.round((Math.random() * 20 - 10) * 100) / 100,
    changePercent: Math.round((Math.random() * 4 - 2) * 100) / 100
  };
  
  return {
    symbol,
    price: baseData.price,
    change: baseData.change,
    changePercent: baseData.changePercent,
    timestamp: new Date().toISOString(),
    provider: 'offline-sample',
    note: 'Sample data - External APIs currently unavailable due to network restrictions'
  };
}

// Auto-disable providers on network failures
const providerFailureCount = new Map();
const MAX_FAILURES_BEFORE_DISABLE = 3;
const PROVIDER_DISABLE_DURATION = 30 * 60 * 1000; // 30 minutes

function isNetworkError(error) {
  const networkErrors = [
    'ENOTFOUND',
    'getaddrinfo',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ECONNRESET',
    'EHOSTUNREACH',
    'ENETUNREACH'
  ];
  
  return networkErrors.some(errorType => 
    error.message.includes(errorType) || 
    error.code === errorType
  );
}

async function handleProviderFailure(providerName, error) {
  const config = await getApiConfig();
  
  if (isNetworkError(error)) {
    // Increment failure count
    const currentCount = providerFailureCount.get(providerName) || 0;
    const newCount = currentCount + 1;
    providerFailureCount.set(providerName, newCount);
    
    console.warn(`🚫 Network failure ${newCount}/${MAX_FAILURES_BEFORE_DISABLE} for ${providerName}: ${error.message}`);
    
    if (newCount >= MAX_FAILURES_BEFORE_DISABLE) {
      // Disable provider temporarily
      config.providers[providerName].enabled = false;
      config.providers[providerName].disabledUntil = Date.now() + PROVIDER_DISABLE_DURATION;
      config.providers[providerName].disabledReason = 'Network/Firewall restrictions detected';
      
      console.error(`🔴 Auto-disabled ${providerName} due to repeated network failures. Will retry in 30 minutes.`);
      
      // Save updated configuration
      await saveApiConfig(config);
      
      // Reset failure count
      providerFailureCount.set(providerName, 0);
    }
  }
}

async function checkProviderAvailability(providerName, config) {
  const provider = config.providers[providerName];
  
  if (!provider?.enabled) {
    return false;
  }
  
  // Check if provider was auto-disabled and if disable period has expired
  if (provider.disabledUntil && Date.now() < provider.disabledUntil) {
    const remainingTime = Math.round((provider.disabledUntil - Date.now()) / 60000);
    console.log(`⏳ ${providerName} disabled for ${remainingTime} more minutes (${provider.disabledReason})`);
    return false;
  }
  
  // Re-enable if disable period has expired
  if (provider.disabledUntil && Date.now() >= provider.disabledUntil) {
    provider.enabled = true;
    provider.disabledUntil = null;
    provider.disabledReason = null;
    console.log(`✅ Re-enabled ${providerName} after disable period expired`);
    await saveApiConfig(config);
  }
  
  return provider.enabled;
}

// API Routes
app.get('/api/quote/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const quote = await getStockQuote(symbol);
    res.json(quote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/status', async (req, res) => {
  const config = await getApiConfig();
  const status = {
    server: 'Smart Stock Trader API',
    version: '4.0.0',
    storage: useMongoDb ? 'MongoDB + File Fallback' : 'File-based JSON',
    database: {
      mongodb: useMongoDb ? 'Connected' : 'Not available',
      fileSystem: 'Available'
    },
    providers: {},
    cache: {
      inMemory: cache.size,
      persistent: useMongoDb ? 'MongoDB' : 'File'
    }
  };
  
  for (const [name, providerConfig] of Object.entries(config.providers)) {
    const limits = rateLimits[name];
    const isRateLimited = providerConfig.resetTime && Date.now() < providerConfig.resetTime;
    const isAvailable = await checkProviderAvailability(name, config);
    const failureCount = providerFailureCount.get(name) || 0;
    
    status.providers[name] = {
      enabled: providerConfig.enabled,
      available: isAvailable,
      priority: providerConfig.priority,
      requests: limits?.requests || 0,
      dailyLimit: providerConfig.dailyLimit,
      hasCapacity: hasCapacity(name, config),
      rateLimited: isRateLimited,
      resetTime: providerConfig.resetTime ? new Date(providerConfig.resetTime).toLocaleString() : null,
      autoDisabled: !!providerConfig.disabledUntil,
      disabledUntil: providerConfig.disabledUntil ? new Date(providerConfig.disabledUntil).toLocaleString() : null,
      disabledReason: providerConfig.disabledReason || null,
      failureCount: failureCount,
      status: !isAvailable ? (providerConfig.disabledReason || 'Disabled') : 
              isRateLimited ? 'Rate Limited' : 'Available'
    };
  }
  
  res.json(status);
});

app.get('/api/cache/clear', async (req, res) => {
  try {
    // Clear in-memory cache
    cache.clear();
    
    if (useMongoDb && db) {
      // Clear MongoDB cache
      await db.collection('cache_data').deleteMany({});
    }
    
    // Clear file cache
    await writeJsonFile(cacheFile, {});
    
    res.json({ 
      message: 'Cache cleared successfully', 
      storage: useMongoDb ? 'MongoDB + File' : 'File',
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Free endpoints that don't require external API calls

// Get list of popular stocks with sample data
app.get('/api/stocks/popular', (req, res) => {
  const popularStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', price: 195.89, change: 2.45, changePercent: 1.27 },
    { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', price: 415.26, change: -3.22, changePercent: -0.77 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', price: 175.43, change: 1.85, changePercent: 1.07 },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary', price: 186.37, change: 4.12, changePercent: 2.26 },
    { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Discretionary', price: 248.50, change: -5.30, changePercent: -2.09 },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology', price: 892.15, change: 15.75, changePercent: 1.80 },
    { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology', price: 524.31, change: -8.45, changePercent: -1.59 },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financial Services', price: 218.75, change: 3.20, changePercent: 1.48 },
    { symbol: 'V', name: 'Visa Inc.', sector: 'Financial Services', price: 289.45, change: 2.85, changePercent: 0.99 },
    { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', price: 152.30, change: -1.15, changePercent: -0.75 }
  ];
  
  res.json({
    stocks: popularStocks,
    count: popularStocks.length,
    timestamp: new Date().toISOString(),
    note: 'Sample data for demonstration purposes'
  });
});

// Get stock sectors with performance summary
app.get('/api/sectors', (req, res) => {
  const sectors = [
    { name: 'Technology', performance: 2.35, stocks: 45, marketCap: '15.2T' },
    { name: 'Healthcare', performance: -0.85, stocks: 32, marketCap: '8.9T' },
    { name: 'Financial Services', performance: 1.42, stocks: 28, marketCap: '6.7T' },
    { name: 'Consumer Discretionary', performance: 0.95, stocks: 22, marketCap: '5.4T' },
    { name: 'Energy', performance: -2.15, stocks: 18, marketCap: '4.2T' },
    { name: 'Industrials', performance: 1.78, stocks: 35, marketCap: '3.8T' },
    { name: 'Real Estate', performance: -0.45, stocks: 15, marketCap: '2.1T' },
    { name: 'Utilities', performance: 0.25, stocks: 12, marketCap: '1.9T' }
  ];
  
  res.json({
    sectors: sectors,
    timestamp: new Date().toISOString(),
    note: 'Sample sector data for demonstration'
  });
});

// Market indices with sample data
app.get('/api/indices', (req, res) => {
  const indices = [
    { symbol: 'SPY', name: 'S&P 500 ETF', price: 548.25, change: 8.45, changePercent: 1.57 },
    { symbol: 'QQQ', name: 'NASDAQ-100 ETF', price: 485.30, change: 12.85, changePercent: 2.72 },
    { symbol: 'DIA', name: 'Dow Jones ETF', price: 425.80, change: 5.25, changePercent: 1.25 },
    { symbol: 'IWM', name: 'Russell 2000 ETF', price: 218.45, change: -2.35, changePercent: -1.06 },
    { symbol: 'VTI', name: 'Total Stock Market ETF', price: 268.90, change: 4.15, changePercent: 1.57 }
  ];
  
  res.json({
    indices: indices,
    timestamp: new Date().toISOString(),
    note: 'Sample index data for demonstration'
  });
});

// Stock calculator utilities
app.get('/api/calculator/profit', (req, res) => {
  const { buyPrice, sellPrice, shares } = req.query;
  
  if (!buyPrice || !sellPrice || !shares) {
    return res.status(400).json({ 
      error: 'Missing parameters. Required: buyPrice, sellPrice, shares' 
    });
  }
  
  const buy = parseFloat(buyPrice);
  const sell = parseFloat(sellPrice);
  const shareCount = parseInt(shares);
  
  if (isNaN(buy) || isNaN(sell) || isNaN(shareCount)) {
    return res.status(400).json({ 
      error: 'Invalid parameters. All values must be numbers' 
    });
  }
  
  const totalBuy = buy * shareCount;
  const totalSell = sell * shareCount;
  const profit = totalSell - totalBuy;
  const profitPercent = ((sell - buy) / buy) * 100;
  
  res.json({
    calculation: {
      buyPrice: buy,
      sellPrice: sell,
      shares: shareCount,
      totalBuyValue: totalBuy.toFixed(2),
      totalSellValue: totalSell.toFixed(2),
      profit: profit.toFixed(2),
      profitPercent: profitPercent.toFixed(2),
      profitStatus: profit >= 0 ? 'gain' : 'loss'
    },
    timestamp: new Date().toISOString()
  });
});

// Portfolio value calculator
app.get('/api/calculator/portfolio', (req, res) => {
  const { holdings } = req.query;
  
  if (!holdings) {
    return res.status(400).json({ 
      error: 'Missing holdings parameter. Format: symbol1:shares1:price1,symbol2:shares2:price2' 
    });
  }
  
  try {
    const portfolioItems = holdings.split(',').map(item => {
      const [symbol, shares, price] = item.split(':');
      const shareCount = parseInt(shares);
      const currentPrice = parseFloat(price);
      const value = shareCount * currentPrice;
      
      return {
        symbol: symbol.toUpperCase(),
        shares: shareCount,
        price: currentPrice,
        value: value.toFixed(2)
      };
    });
    
    const totalValue = portfolioItems.reduce((sum, item) => sum + parseFloat(item.value), 0);
    
    res.json({
      portfolio: portfolioItems,
      summary: {
        totalStocks: portfolioItems.length,
        totalValue: totalValue.toFixed(2),
        averageValue: (totalValue / portfolioItems.length).toFixed(2)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({ 
      error: 'Invalid holdings format. Use: AAPL:100:195.50,MSFT:50:415.25' 
    });
  }
});

// Market hours checker
app.get('/api/market/hours', (req, res) => {
  const now = new Date();
  const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const hour = easternTime.getHours();
  const day = easternTime.getDay(); // 0 = Sunday, 6 = Saturday
  
  const isWeekday = day >= 1 && day <= 5;
  const isMarketHours = hour >= 9 && hour < 16; // 9:30 AM to 4:00 PM EST (simplified)
  const isOpen = isWeekday && isMarketHours;
  
  res.json({
    market: {
      isOpen: isOpen,
      currentTime: easternTime.toLocaleString(),
      timezone: 'America/New_York',
      nextOpen: isOpen ? 'Currently open' : getNextMarketOpen(easternTime),
      hours: {
        regular: '9:30 AM - 4:00 PM EST',
        premarket: '4:00 AM - 9:30 AM EST',
        aftermarket: '4:00 PM - 8:00 PM EST'
      }
    },
    timestamp: new Date().toISOString()
  });
});

function getNextMarketOpen(currentTime) {
  const day = currentTime.getDay();
  const hour = currentTime.getHours();
  
  if (day === 0) return 'Monday 9:30 AM EST'; // Sunday
  if (day === 6) return 'Monday 9:30 AM EST'; // Saturday
  if (hour >= 16) return 'Tomorrow 9:30 AM EST'; // After market close
  if (hour < 9) return 'Today 9:30 AM EST'; // Before market open
  return 'Currently open';
}

// Economic calendar (sample events)
app.get('/api/calendar', (req, res) => {
  const events = [
    { date: '2025-07-15', time: '08:30', event: 'Consumer Price Index', impact: 'high', currency: 'USD' },
    { date: '2025-07-16', time: '09:15', event: 'Industrial Production', impact: 'medium', currency: 'USD' },
    { date: '2025-07-17', time: '10:00', event: 'Housing Starts', impact: 'medium', currency: 'USD' },
    { date: '2025-07-18', time: '14:00', event: 'Federal Reserve Meeting', impact: 'high', currency: 'USD' },
    { date: '2025-07-21', time: '08:30', event: 'Unemployment Claims', impact: 'medium', currency: 'USD' }
  ];
  
  res.json({
    events: events,
    count: events.length,
    timestamp: new Date().toISOString(),
    note: 'Sample economic calendar events'
  });
});

// Currency pairs with sample data
app.get('/api/forex', (req, res) => {
  const pairs = [
    { pair: 'EUR/USD', rate: 1.0875, change: 0.0025, changePercent: 0.23 },
    { pair: 'GBP/USD', rate: 1.2945, change: -0.0045, changePercent: -0.35 },
    { pair: 'USD/JPY', rate: 158.25, change: 1.85, changePercent: 1.18 },
    { pair: 'USD/CHF', rate: 0.8795, change: 0.0015, changePercent: 0.17 },
    { pair: 'AUD/USD', rate: 0.6725, change: -0.0025, changePercent: -0.37 },
    { pair: 'USD/CAD', rate: 1.3685, change: 0.0035, changePercent: 0.26 }
  ];
  
  res.json({
    forex: pairs,
    timestamp: new Date().toISOString(),
    note: 'Sample forex data for demonstration'
  });
});

// Get available API endpoints from configuration
app.get('/api/endpoints', async (req, res) => {
  try {
    const config = await getApiConfig();
    const endpointInfo = {};
    
    for (const [providerName, providerConfig] of Object.entries(config.providers)) {
      if (providerConfig.endpoints) {
        endpointInfo[providerName] = {
          baseUrl: providerConfig.baseUrl,
          enabled: providerConfig.enabled,
          priority: providerConfig.priority,
          dailyLimit: providerConfig.dailyLimit,
          minuteLimit: providerConfig.minuteLimit,
          supportsBulk: providerConfig.supportsBulk,
          endpoints: {}
        };
        
        for (const [endpointName, endpointConfig] of Object.entries(providerConfig.endpoints)) {
          endpointInfo[providerName].endpoints[endpointName] = {
            path: endpointConfig.path,
            method: endpointConfig.method || 'GET',
            description: getEndpointDescription(endpointName),
            parameters: endpointConfig.params,
            rateLimit: endpointConfig.rateLimit,
            maxSymbols: endpointConfig.maxSymbols || null
          };
        }
      }
    }
    
    res.json({
      endpoints: endpointInfo,
      settings: {
        cacheTimeout: config.cacheTimeout,
        bulkRequestLimit: config.bulkRequestLimit,
        fallbackSettings: config.fallbackSettings || {},
        rateLimitSettings: config.rateLimitSettings || {},
        networkSettings: config.networkSettings || {}
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function getEndpointDescription(endpointName) {
  const descriptions = {
    quote: 'Get real-time stock quote data',
    search: 'Search for stock symbols and company names',
    company: 'Get company profile and overview information',
    historical: 'Get historical price data and charts',
    bulk: 'Get multiple stock quotes in a single request',
    options: 'Get options chain data for a stock'
  };
  return descriptions[endpointName] || 'API endpoint';
}

// Firewall detection endpoint
app.get('/api/firewall/status', async (req, res) => {
  try {
    const config = await getApiConfig();
    const blockedProviders = [];
    const workingProviders = [];
    
    for (const [name, providerConfig] of Object.entries(config.providers)) {
      const isBlocked = providerConfig.disabledReason && 
                       providerConfig.disabledReason.includes('Network') ||
                       providerConfig.disabledReason && 
                       providerConfig.disabledReason.includes('restrictions');
      
      if (isBlocked || providerConfig.disabledUntil) {
        blockedProviders.push({
          name,
          reason: providerConfig.disabledReason || 'Rate limited',
          disabledUntil: providerConfig.disabledUntil ? 
            new Date(providerConfig.disabledUntil).toLocaleString() : null
        });
      } else {
        workingProviders.push(name);
      }
    }
    
    const firewallDetected = blockedProviders.length >= 3; // If 3+ providers blocked, likely firewall
    
    res.json({
      firewallDetected,
      totalProviders: Object.keys(config.providers).length,
      blockedProviders: blockedProviders.length,
      workingProviders: workingProviders.length,
      status: firewallDetected ? 'Corporate Firewall Detected' : 'Network Access Available',
      fallbackMode: firewallDetected,
      blockedList: blockedProviders,
      workingList: workingProviders,
      freeEndpoints: {
        available: 8,
        working: true,
        endpoints: [
          '/api/stocks/popular',
          '/api/sectors', 
          '/api/indices',
          '/api/forex',
          '/api/market/hours',
          '/api/calendar',
          '/api/calculator/profit',
          '/api/calculator/portfolio'
        ]
      },
      message: firewallDetected ? 
        'All external APIs blocked by firewall. Using built-in free endpoints with sample data.' :
        'External API access available for real-time data.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize and start server
async function startServer() {
  try {
    console.log('🚀 Initializing Smart Stock Trader API Server v4.0...');
    
    // Initialize database (MongoDB or file-based)
    await initializeDatabase();
    
    // Load initial data
    await loadRateLimits();
    
    // Start periodic cache cleanup (every hour)
    setInterval(async () => {
      try {
        // Clean expired file cache
        const cacheData = await readJsonFile(cacheFile, {});
        const now = new Date();
        let cleaned = false;
        
        for (const [key, entry] of Object.entries(cacheData)) {
          if (new Date(entry.expiresAt) <= now) {
            delete cacheData[key];
            cache.delete(key);
            cleaned = true;
          }
        }
        
        if (cleaned) {
          await writeJsonFile(cacheFile, cacheData);
          console.log('🧹 Cleaned expired cache entries');
        }
      } catch (error) {
        console.error('❌ Error during cache cleanup:', error.message);
      }
    }, 60 * 60 * 1000);
    
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`💾 Storage: ${useMongoDb ? 'MongoDB + File Fallback' : 'File-based JSON'}`);
      console.log(`📁 Data directory: ${dbPath}`);
      console.log('🔗 Available endpoints:');
      console.log(`   • GET /api/quote/:symbol - Get stock quote`);
      console.log(`   • GET /api/status - Server status`);
      console.log(`   • GET /api/cache/clear - Clear cache`);
      console.log(`   • GET /api/endpoints - List all available API endpoints`);
      console.log(`   🆓 FREE ENDPOINTS:`);
      console.log(`   • GET /api/stocks/popular - Popular stocks with sample data`);
      console.log(`   • GET /api/sectors - Market sectors performance`);
      console.log(`   • GET /api/indices - Major market indices`);
      console.log(`   • GET /api/forex - Currency exchange rates`);
      console.log(`   • GET /api/market/hours - Market trading hours`);
      console.log(`   • GET /api/calendar - Economic calendar events`);
      console.log(`   • GET /api/calculator/profit?buyPrice=100&sellPrice=110&shares=50 - Profit calculator`);
      console.log(`   • GET /api/calculator/portfolio?holdings=AAPL:100:195.50,MSFT:50:415.25 - Portfolio value`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Gracefully shutting down...');
  
  // Save final state
  if (rateLimits) {
    await saveRateLimitData(rateLimits);
  }
  
  // Close MongoDB connection if open
  if (mongoClient) {
    try {
      await mongoClient.close();
      console.log('📚 MongoDB connection closed');
    } catch (error) {
      console.error('❌ Error closing MongoDB:', error.message);
    }
  }
  
  console.log('👋 Server stopped');
  process.exit(0);
});

// Start the server
startServer();
