const { By, until, Key } = require('selenium-webdriver');

// Login function
async function loginToKingsChat(driver) {
  try {
    await driver.get('https://accounts.kingsch.at/?client_id=com.kingschat&post_redirect=true&scopes=%5B%22kingschat%22%5D&redirect_uri=https%3A%2F%2Fkingschat.online%2Fconversations%2FNjVmOTVlOTgwZWI5NDY0NzRlNmUwY2Jj');
    await driver.wait(until.elementLocated(By.xpath("//button[contains(text(),'Username or email')]")), 20000);
    let usernameTabButton = await driver.findElement(By.xpath("//button[contains(text(),'Username or email')]"));
    await usernameTabButton.click();

    await driver.wait(until.elementLocated(By.xpath("//input[@name='login']")), 20000);
    let usernameField = await driver.findElement(By.xpath("//input[@name='login']"));
    await usernameField.click();
    await usernameField.sendKeys('');

    let passwordField = await driver.findElement(By.xpath("//input[@name='password']"));
    await passwordField.click();
    await passwordField.sendKeys('');

    let loginButton = await driver.findElement(By.xpath("//button[contains(text(),'Log In')]"));
    await loginButton.click();

    //await driver.wait(until.elementLocated(By.xpath("//div[contains(@class, 'profile-icon')]")), 60000);
    console.log('Logged in successfully to KingsChat!');
  } catch (error) {
    console.log(`Error during login: ${error}`);
    throw error;
  }
}

// Search function
async function searchInKingsChat(driver, searchQuery = 'iammajestic') {
  try {
    console.log("Initiating search in KingsChat...");

    // Locate the search field and perform the search
    const searchField = await driver.wait(
      until.elementLocated(By.xpath("//input[contains(@class, 'MenuSearch__input')]")),
      80000
    );
    await driver.wait(until.elementIsVisible(searchField), 80000);
    console.log("Entering search query:", searchQuery);
    await searchField.sendKeys(searchQuery, Key.RETURN);

    // Wait for results to load
    await driver.sleep(2000); // Wait for 2 seconds after entering the search term

    const mainContainer = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class, 'SearchPeopleList__main-container')]")),
      80000
    );
    await driver.wait(until.elementIsVisible(mainContainer), 80000);

    // Get results
    const avatarElements = await mainContainer.findElements(By.xpath(".//img[contains(@class, 'SearchPeopleList__avatar')]"));
    const nameElements = await mainContainer.findElements(By.xpath(".//span[contains(@class, 'SearchPeopleList__name')]"));
    const usernameElements = await mainContainer.findElements(By.xpath(".//span[contains(@class, 'SearchPeopleList__username')]"));

    console.log("Avatar count:", avatarElements.length);
    console.log("Name count:", nameElements.length);
    console.log("Username count:", usernameElements.length);

    if (avatarElements.length === 0 || nameElements.length === 0 || usernameElements.length === 0) {
      console.warn("No search results found.");
      return [];
    }

    let users = [];
    for (let i = 0; i < nameElements.length; i++) {
      const avatarUrl = await avatarElements[i]?.getAttribute('src') || 'No avatar';
      const nameText = await nameElements[i]?.getText() || 'No name';
      const usernameText = await usernameElements[i]?.getText() || 'No username';
      users.push({ avatar: avatarUrl, name: nameText, username: usernameText });
    }

    console.log("Search Results:", JSON.stringify(users, null, 2));
    return users;
  } catch (error) {
    console.error("Error during search:", error.message);
    throw error;
  }
}

// API module function
async function apiModule(searchResults) {
  try {
    console.log("Processing search results with API module...");
    // Add your API logic here
    console.log("Search results processed:", searchResults);
  } catch (error) {
    console.error("Error in API module:", error.message);
    throw error;
  }
}

// Export all functions
module.exports = {
  loginToKingsChat,
  searchInKingsChat,
  apiModule,
};