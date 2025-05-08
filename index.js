require('dotenv').config(); 
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Start a fake HTTP server to keep Render happy
app.get('/', (req, res) => {
  res.send('KingsChat bot is running.');
});

app.listen(port, () => {
  console.log(`[HTTP] Web server running on port ${port}`);
});

const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const tempUserDir = path.join(os.tmpdir(), uuidv4());

let options = new chrome.Options();
options.addArguments(
  `--user-data-dir=${tempUserDir}`,
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--headless',
  '--disable-gpu'
);


let driver = new Builder().forBrowser('chrome').setChromeOptions(options).build();


let searchQueries = []; // Global array to store search queries

let searchQuery = []; // Stores only search_req values


// Function to fetch search queries from the API

async function fetchSearchResults() {

    try {

        const response = await fetch('https://kingslist.pro/app/default/api/search-req.php', {

            method: 'GET',

            headers: {

                'Accept': 'application/json',

                'Content-Type': 'application/json'

            }

        });


        if (!response.ok) {

            throw new Error(`HTTP error! Status: ${response.status}`);

        }


        const data = await response.json();

        if (data.status === 'success' && Array.isArray(data.data)) {

            searchQueries = data.data; // Store full response (including id and search_req)

            searchQuery = searchQueries.map(query => query.search_req); // Extract only search_req values


            // Save the IDs to a variable for later use

            const searchIds = searchQueries.map(query => query.id);


            // Display the IDs to confirm they are available

            console.log('[DEBUG] Search IDs:', searchIds);


            console.log('[DEBUG] Updated search queries:', searchQuery);

            console.log('[DEBUG] Full search queries with IDs:', searchQueries); // Log full data including IDs


            // Return both searchQuery and searchIds

            return { searchQuery, searchIds };

        } else {

            console.log('[DEBUG] No new search queries found.');

            return { searchQuery: [], searchIds: [] }; // Return empty arrays if no data is found

        }

    } catch (error) {

        console.error('[DEBUG] Error fetching search queries:', error);

        return { searchQuery: [], searchIds: [] }; // Return empty arrays in case of error

    }

}


// Define the update function

// async function updateAutomate(id, data) {

//     const url = `https://kingslist.pro/app/default/api/automate.php?id=${id}`; // Replace with your full API URL

//     const options = {

//         method: 'PUT', // or 'PATCH'

//         headers: {

//             'Content-Type': 'application/json',

//             'Accept': 'application/json',

//         },

//         body: JSON.stringify(data), // Convert the data to JSON

//     };


//     try {

//         const response = await fetch(url, options);


//         if (!response.ok) {

//             throw new Error(`HTTP error! Status: ${response.status}`);

//         }


//         const result = await response.json();

//         console.log('Update successful:', result);

//         return result;

//     } catch (error) {

//         console.error('Error updating record:', error);

//     }

// }

async function updateAutomate(id, data) {
    const url = `https://kingslist.pro/app/default/api/automate.php?id=${id}`;
    
    // Enhanced debug logging
    console.log('🔍 Starting updateAutomate with:', {
        url,
        data,
        stringifiedData: JSON.stringify(data)
    });

    const options = {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify(data),
    };

    try {
        console.log('🔄 Attempting API request...');
        const response = await fetch(url, options);
        
        console.log('📄 Raw response:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
        });

        if (!response.ok) {
            let errorBody;
            try {
                errorBody = await response.text();
                console.error('❌ API Error Response Body:', errorBody);
                errorBody = JSON.parse(errorBody);
            } catch (e) {
                console.error('⚠️ Could not parse error response:', e);
            }
            
            throw new Error(
                `HTTP ${response.status} - ${response.statusText}\n` +
                `Details: ${errorBody?.message || 'No error details provided'}`
            );
        }

        const result = await response.json();
        console.log('✅ Update successful:', result);
        return result;

    } catch (error) {
        console.error('🚨 Full update error:', {
            errorName: error.name,
            errorMessage: error.message,
            errorStack: error.stack,
            requestDetails: {
                url,
                method: 'PUT',
                payload: data
            }
        });
        
        // Additional diagnostic request
        try {
            console.log('🔧 Running diagnostic GET request...');
            const diagnosticResponse = await fetch(url);
            console.log('🩺 Diagnostic check:', {
                status: diagnosticResponse.status,
                exists: diagnosticResponse.ok,
                currentData: await diagnosticResponse.json().catch(() => 'Could not parse')
            });
        } catch (diagError) {
            console.error('⚠️ Diagnostic failed:', diagError);
        }
        
        throw error; // Re-throw after logging
    }
}

// Get access token and update the database

async function getAccessToken() {

    try {

        console.log("🔵 Extracting accessToken from cookies...");


        // Debug: Check if driver is defined

        if (!driver) {

            throw new Error("Driver is undefined.");

        }


        // Wait for the accessToken cookie to be set

        let accessTokenCookie;

        try {

            await driver.wait(async () => {

                const cookies = await driver.manage().getCookies();

                accessTokenCookie = cookies.find(cookie => cookie.name === 'accessToken');

                return accessTokenCookie !== undefined; // Return true if the cookie is found

            }, 10000); // Wait up to 10 seconds

        } catch (error) {

            console.error("❌ Timeout while waiting for accessToken cookie:", error);

            return null;

        }


        if (accessTokenCookie) {

            console.log("✅ Access Token Found:", accessTokenCookie.value);


            // Update the database with the new access token

            const automateId = 1; // Replace with the actual ID

            const updateData = {

                login_status: 1, // Example value, replace with actual logic if needed

                accesstoken: accessTokenCookie.value, // Use the retrieved access token

            };


            // Call the update function

            
            await updateAutomate(automateId, updateData);


            return accessTokenCookie.value; // Return the actual token value

        } else {

            console.log("❌ Access Token Not Found.");

            return null;

        }

    } catch (error) {

        console.error("❌ Error getting accessToken:", error);

        return null;

    }

}


// Login function

async function loginToKingsChat() {

    try {

        console.log("[DEBUG] Navigating to KingsChat login page...");

        await driver.get('https://accounts.kingsch.at/?client_id=com.kingschat&post_redirect=true&scopes=%5B%22kingschat%22%5D&redirect_uri=https%3A%2F%2Fkingschat.online%2F');


        console.log("[DEBUG] Waiting for login form...");

        await driver.wait(until.elementLocated(By.xpath("//button[contains(text(),'Username or email')]")), 20000);

        let usernameTabButton = await driver.findElement(By.xpath("//button[contains(text(),'Username or email')]"));

        await usernameTabButton.click();


        console.log("[DEBUG] Entering credentials...");

        let usernameField = await driver.wait(until.elementLocated(By.xpath("//input[@name='login']")), 20000);

        await usernameField.sendKeys(process.env.KC_EMAIL);


        let passwordField = await driver.findElement(By.xpath("//input[@name='password']"));

        await passwordField.sendKeys(process.env.KC_PASS);


        console.log("[DEBUG] Clicking login button...");

        let loginButton = await driver.findElement(By.xpath("//button[contains(text(),'Log In')]"));

        await loginButton.click();


        console.log('[DEBUG] Waiting for login to complete...');

        // Wait for a specific element that indicates login success

        // await driver.wait(until.elementLocated(By.xpath("//div[contains(text(),'Welcome')]")), 20000);


        console.log('[DEBUG] Logged in successfully!');


        // Get access token

        const accessToken = await getAccessToken();

        if (accessToken) {

            console.log("✅ Access Token Retrieved:", accessToken);

            return { success: true, accessToken };

        } else {

            console.log("❌ Failed to retrieve Access Token.");

            return { success: false, accessToken: null };

        }

    } catch (error) {

        console.log(`[DEBUG] Login failed: ${error.message}`);

        return { success: false, accessToken: null };

    }

}


// Update search result

async function updateSearchResults(searchIds, searchResults) {

    console.log(`[DEBUG] Updating search results for I😫 ${searchIds}`);

    const url = `https://kingslist.pro/app/default/api/search.php?id=${searchIds}`; // Ensure searchIds is a valid ID

    const options = {

        method: 'PUT', // Use PUT or PATCH depending on API

        headers: {

            'Content-Type': 'application/json',

            'Accept': 'application/json',

        },

        body: JSON.stringify({

            search_res: searchResults, // Removed extra JSON.stringify

            search_status: 1, // Mark search as completed

        }),

    };


    try {

        const response = await fetch(url, options);

        const result = await response.json();

        console.log('[DEBUG] Search results updated successfully:', result);

        return result;

    } catch (error) {

        console.error('[DEBUG] Error updating search results:', error);

        return null;

    }

}


// Extract search results from window.__NUXT__

async function extractSearchResultsFromWindow() {

    try {

        // Inject JavaScript to access the window.__NUXT__ object

        const searchResults = await driver.executeScript(`

            if (window.__NUXT__ && window.__NUXT__.state && window.__NUXT__.state.search && window.__NUXT__.state.search.usersList) {

                return window.__NUXT__.state.search.usersList.map(user => ({

                    userId: user.userId,

                    username: user.username,

                    name: user.name,

                    avatarUrl: user.avatarUrl

                }));

            }

            return [];

        `);


        return searchResults;

    } catch (error) {

        console.error('[DEBUG] Error extracting search results from window.__NUXT__:', error);

        return [];

    }

}


// Search function

async function searchInKingsChat(searchQuery, searchIds) {

    try {

        console.log(`[DEBUG] Searching for: ${searchQuery}`);


        const searchField = await driver.wait(until.elementLocated(By.xpath("//input[contains(@class, 'MenuSearch__input')]")), 80000);

        await driver.wait(until.elementIsVisible(searchField), 80000);


        await searchField.click();

        await searchField.sendKeys(Key.CONTROL, "a", Key.BACK_SPACE);

        await driver.sleep(1000);


        await searchField.sendKeys(searchQuery, Key.RETURN);


        console.log("[DEBUG] Waiting for search results...");

        await driver.sleep(2000);


        // Extract search results from window.__NUXT__

        const searchResults = await extractSearchResultsFromWindow();


        if (searchResults.length === 0) {

            console.warn(`[DEBUG] No results found for "${searchQuery}".`);

            return [];

        }


        console.log(`[DEBUG] Results for "${searchQuery}":`, JSON.stringify(searchResults, null, 2));


        // Update the search results in the database

        await updateSearchResults(searchIds, searchResults);


        return searchResults;

    } catch (error) {

        console.error(`[DEBUG] Error searching "${searchQuery}":`, error.message);

        return [];

    }

}


// Check if session is valid

async function isSessionValid() {

    try {

        console.log("[DEBUG] Checking session validity...");

        const cookies = await driver.manage().getCookies();

        return cookies.some(cookie => cookie.name === 'accessToken');

    } catch (error) {

        console.error("[DEBUG] Error checking session validity:", error);

        return false;

    }

}


// Restart browser and login

async function restartBrowserAndLogin() {

    console.log("[DEBUG] Restarting browser...");

    await driver.quit(); // Close the existing browser

    driver = new Builder().forBrowser('chrome').setChromeOptions(options).build(); // Reinitialize the browser
    // driver = new Builder().forBrowser('chrome').build(); // Reinitialize the browser

    console.log("[DEBUG] Browser restarted. Logging in...");

    const { success } = await loginToKingsChat();

    return success;

}


// Main function

(async function main() {

    console.log("[DEBUG] Starting KingsChat automation...");


    while (true) {

        try {

            if (!(await isSessionValid())) {

                console.log("[DEBUG] Session is invalid. Restarting browser and logging in...");

                const success = await restartBrowserAndLogin();

                if (!success) {

                    console.log("[DEBUG] Login failed. Retrying in 10 seconds...");

                    await new Promise(resolve => setTimeout(resolve, 100));

                    continue;

                }

            }


            console.log("[DEBUG] Fetching search queries...");

            const { searchQuery, searchIds } = await fetchSearchResults();


            if (searchQuery.length === 0) {

                console.log("[DEBUG] No search queries available. Retrying in 10 seconds...");

                await new Promise(resolve => setTimeout(resolve, 100));

                continue;

            }


            console.log("[DEBUG] Performing search loop...");

            for (let i = 0; i < searchQuery.length; i++) {

                const query = searchQuery[i];

                const id = searchIds[i];


                console.log(`[DEBUG] Searching for "${query}" with I😫 ${id}...`);

                const searchResults = await searchInKingsChat(query, id);


                if (searchResults.length > 0) {

                    console.log(`[DEBUG] Found ${searchResults.length} results for "${query}".`);

                } else {

                    console.log(`[DEBUG] No results found for "${query}".`);

                }


                console.log("[DEBUG] Waiting 5 seconds before the next search...");

                await new Promise(resolve => setTimeout(resolve, 5000));


                if (!(await isSessionValid())) {

                    console.log("[DEBUG] Session expired. Restarting browser...");

                    break;

                }

            }

        } catch (error) {

            console.error(`[DEBUG] Error encountered: ${error.message}`);

            console.log("[DEBUG] Retrying in 10 seconds...");

            await new Promise(resolve => setTimeout(resolve, 100));

        }

    }

})();

// Run token fetching every 30 minutes (1800000 milliseconds)
setInterval(async () => {
    console.log('[SCHEDULED TASK] Running getAccessToken at', new Date().toLocaleString());
  
    const result = await loginToKingsChat();
  
    if (result.success) {
      console.log('[SUCCESS] Token refreshed:', result.accessToken);
    } else {
      console.log('[FAILURE] Could not refresh token.');
    }
  
  }, 30 * 60 * 1000); // 30 minutes
  