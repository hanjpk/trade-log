const fs = require('fs');
const path = require('path');

async function updateCryptoList() {
  try {
    console.log('Fetching latest crypto list from CoinGecko...');
    
    const response = await fetch('https://api.coingecko.com/api/v3/coins/list');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch crypto list: ${response.status}`);
    }
    
    const data = await response.json();
    
    const filePath = path.join(__dirname, '../lib/data/crypto-list.json');
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    
    console.log(`✅ Successfully updated crypto list with ${data.length} cryptocurrencies`);
    console.log(`📁 File saved to: ${filePath}`);
  } catch (error) {
    console.error('❌ Error updating crypto list:', error.message);
    process.exit(1);
  }
}

updateCryptoList(); 