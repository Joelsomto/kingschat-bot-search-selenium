const { Builder } = require('selenium-webdriver');
const { loginToKingsChat, searchInKingsChat, apiModule } = require('./functions');

(async function main() {
  const driver = await new Builder().forBrowser('chrome').build();

  try {
    console.log("Starting KingsChat automation...");

    // Login to KingsChat
    await loginToKingsChat(driver);
    console.log("Logged into KingsChat.");

    // Search in KingsChat
    const searchQuery = 'iammajestic'; // Example query
    const searchResults = await searchInKingsChat(driver, searchQuery);
    console.log("Search Results Retrieved.");

    // Process search results with apiModule
    if (searchResults && searchResults.length > 0) {
      await apiModule(searchResults);
      console.log("API module processed the search results.");
    } else {
      console.log("No search results found.");
    }

  } catch (error) {
    console.error(`Error encountered: ${error.message}`);
  } finally {
    // Clean up resources
    console.log("Cleaning up resources...");
    //await driver.quit();
  }
})();