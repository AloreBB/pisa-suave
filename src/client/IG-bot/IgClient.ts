import * as puppeteer from 'puppeteer';
import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import UserAgent from "user-agents";
import { Server } from "proxy-chain";
import { IGpassword, IGusername } from "../../secret";
import logger from "../../config/logger";
import { Instagram_cookiesExist, loadCookies, saveCookies } from "../../utils";
import { runAgent } from "../../Agent";
import { getInstagramCommentSchema } from "../../Agent/schema";
import readline from "readline";
import fs from "fs/promises";
import { getShouldExitInteractions } from '../../api/agent';
import { InstagramAnalysisData, PostData, CommentData, ScrapingOptions } from "../../types/instagram";

// Add stealth plugin to puppeteer
puppeteerExtra.use(StealthPlugin());
puppeteerExtra.use(
  AdblockerPlugin({
    // Optionally enable Cooperative Mode for several request interceptors
    interceptResolutionPriority: puppeteer.DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
  })
);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class IgClient {
    private browser: puppeteer.Browser | null = null;
    private page: puppeteer.Page | null = null;
    private username: string;
    private password: string;

    constructor(username?: string, password?: string) {
        // Usar parámetros del constructor O variables de entorno como fallback
        this.username = username || IGusername;
        this.password = password || IGpassword;
    }

    async init() {
        // Verificar credenciales antes de continuar
        if (!this.username || this.username === 'default_IGusername') {
            throw new Error("Instagram username not configured. Please set IGusername in your .env file");
        }
        if (!this.password || this.password === 'default_IGpassword') {
            throw new Error("Instagram password not configured. Please set IGpassword in your .env file");
        }
        
        logger.info(`Initializing Instagram client for user: ${this.username}`);

        // const server = new Server({ port: 8000 });
        // await server.listen();
        // const proxyUrl = server.getProxyUrl();
        // logger.info(`Using proxy URL: ${proxyUrl}`);

        // Center the window on a 1920x1080 screen
        const width = 1280;
        const height = 800;
        const screenWidth = 1920;
        const screenHeight = 1080;
        const left = Math.floor((screenWidth - width) / 2);
        const top = Math.floor((screenHeight - height) / 2);
        
        // Configuración básica y funcional (como estaba originalmente)
        this.browser = await puppeteerExtra.launch({
            headless: false,
            args: [
                `--window-size=${width},${height}`,
                `--window-position=${left},${top}`
            ],
        });
        
        this.page = await this.browser.newPage();
        
        // User agent básico (como estaba originalmente)
        const userAgent = new UserAgent({ deviceCategory: "desktop" });
        await this.page.setUserAgent(userAgent.toString());
        await this.page.setViewport({ width, height });

        if (await Instagram_cookiesExist()) {
            await this.loginWithCookies();
        } else {
            await this.loginWithCredentials();
        }
    }

    private async loginWithCookies() {
        if (!this.page) throw new Error("Page not initialized");
        const cookies = await loadCookies("./cookies/Instagramcookies.json");
        if(cookies.length > 0) {
            await this.page.setCookie(...cookies);
        }
        
        logger.info("Loaded cookies. Navigating to Instagram home page.");
        await this.page.goto("https://www.instagram.com/", {
            waitUntil: "networkidle2",
            timeout: 60000, // Aumentar timeout
        });
        const url = this.page.url();
        if (url.includes("/login/")) {
            logger.warn("Cookies are invalid or expired. Falling back to credentials login.");
            await this.loginWithCredentials();
        } else {
            logger.info("Successfully logged in with cookies.");
        }
    }

    private async loginWithCredentials() {
        if (!this.page || !this.browser) throw new Error("Browser/Page not initialized");
        logger.info(`Logging in with credentials for user: ${this.username}`);
        
        // Primero verificar si la cuenta existe y es accesible
        try {
            await this.page.goto(`https://www.instagram.com/${this.username}/`, {
                waitUntil: "networkidle2",
                timeout: 30000,
            });
            
            // Verificar si el perfil es accesible
            const isPrivate = await this.page.evaluate(() => {
                const privateText = document.querySelector('h2');
                return privateText?.textContent?.includes('This Account is Private') || false;
            });
            
            if (isPrivate) {
                logger.warn(`Profile @${this.username} is private`);
            } else {
                logger.info(`Profile @${this.username} is public and accessible`);
            }
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.warn(`Could not verify profile @${this.username}: ${errorMessage}`);
        }
        
        // Ahora ir a la página de login
        await this.page.goto("https://www.instagram.com/accounts/login/", {
            waitUntil: "networkidle2",
            timeout: 60000, // Aumentar timeout a 60 segundos
        });
        
        // Esperar a que aparezcan los campos de login (como estaba originalmente)
        await this.page.waitForSelector('input[name="username"]');
        await this.page.waitForSelector('input[name="password"]');
        
        // Escribir credenciales (como estaba originalmente)
        await this.page.type('input[name="username"]', this.username);
        await this.page.type('input[name="password"]', this.password);
        
        // Hacer click en el botón de login (como estaba originalmente)
        await this.page.click('button[type="submit"]');
        
        // Esperar navegación con timeout más largo
        await this.page.waitForNavigation({ 
            waitUntil: "networkidle2",
            timeout: 60000 // 60 segundos
        });
        
        // Verificar si el login fue exitoso
        const currentUrl = this.page.url();
        logger.info(`Current URL after login attempt: ${currentUrl}`);
        
        // Esperar un poco más para que se complete la redirección
        await delay(3000);
        
        // Verificar el estado final
        const finalUrl = this.page.url();
        logger.info(`Final URL after delay: ${finalUrl}`);
        
        if (finalUrl.includes('/accounts/login/')) {
            // Verificar si hay mensaje de error
            const errorMessage = await this.page.evaluate(() => {
                const errorElement = document.querySelector('[data-testid="login-error-message"]') || 
                                   document.querySelector('.eiCW-') ||
                                   document.querySelector('[role="alert"]');
                return errorElement ? errorElement.textContent : 'Unknown error';
            });
            
            throw new Error(`Login failed - Still on login page. Error: ${errorMessage}`);
        }
        
        if (finalUrl.includes('/challenge/')) {
            throw new Error('Login failed - Instagram requires additional verification (challenge page). Please complete verification manually first.');
        }
        
        if (finalUrl.includes('/accounts/onetap/')) {
            logger.info('Instagram requires one-tap verification. Attempting simple bypass...');
            
            // Estrategia simple: intentar navegar directamente a la página principal
            try {
                await this.page.goto('https://www.instagram.com/', {
                    waitUntil: "networkidle2",
                    timeout: 30000
                });
                await delay(3000);
                logger.info('Direct navigation to main page completed');
            } catch (error) {
                logger.warn('Direct navigation failed, continuing with current page');
            }
        }
        
        // Verificar si estamos en la página principal o si el login fue exitoso
        const isMainPage = finalUrl === 'https://www.instagram.com/' || 
                          finalUrl === 'https://www.instagram.com' ||
                          finalUrl.includes('/accounts/onetap/') && finalUrl.includes('__coig_login=1');
        
        if (isMainPage || finalUrl.includes('instagram.com') && !finalUrl.includes('/accounts/login/')) {
            logger.info(`Login successful! Current URL: ${finalUrl}`);
            
            // Si estamos en one-tap con parámetro de login, intentar navegar a la página principal
            if (finalUrl.includes('/accounts/onetap/') && finalUrl.includes('__coig_login=1')) {
                logger.info('Navigating to main Instagram page...');
                await this.page.goto('https://www.instagram.com/', {
                    waitUntil: "networkidle2",
                    timeout: 30000
                });
                await delay(2000);
            }
            
            const cookies = await this.page.cookies();
            await saveCookies("./cookies/Instagramcookies.json", cookies);
            logger.info("Successfully logged in and saved cookies.");
            await this.handleNotificationPopup();
        } else {
            throw new Error(`Login failed - Unexpected redirect to: ${finalUrl}`);
        }
    }

    /**
     * Debug: Inspecciona la página actual para entender su estructura
     */
    async debugCurrentPage() {
        if (!this.page) throw new Error("Page not initialized");
        
        logger.info("=== DEBUG: INSPECCIONANDO PÁGINA ACTUAL ===");
        
        try {
            // Obtener información básica de la página
            const currentUrl = this.page.url();
            const title = await this.page.title();
            logger.info(`URL actual: ${currentUrl}`);
            logger.info(`Título: ${title}`);
            
            // Buscar todos los inputs en la página
            const inputs = await this.page.$$('input');
            logger.info(`Total de inputs encontrados: ${inputs.length}`);
            
            for (let i = 0; i < inputs.length; i++) {
                try {
                    const input = inputs[i];
                    const type = await input.evaluate(el => (el as HTMLInputElement).type);
                    const name = await input.evaluate(el => (el as HTMLInputElement).name);
                    const placeholder = await input.evaluate(el => (el as HTMLInputElement).placeholder);
                    const ariaLabel = await input.evaluate(el => (el as HTMLInputElement).getAttribute('aria-label'));
                    
                    logger.info(`Input ${i + 1}: type="${type}", name="${name}", placeholder="${placeholder}", aria-label="${ariaLabel}"`);
                } catch (error) {
                    logger.warn(`Error inspeccionando input ${i + 1}`);
                }
            }
            
            // Buscar botones
            const buttons = await this.page.$$('button, div[role="button"]');
            logger.info(`Total de botones encontrados: ${buttons.length}`);
            
            for (let i = 0; i < Math.min(buttons.length, 10); i++) {
                try {
                    const button = buttons[i];
                    const text = await button.evaluate(el => el.textContent?.trim() || '');
                    const type = await button.evaluate(el => (el as HTMLButtonElement).type || '');
                    
                    logger.info(`Botón ${i + 1}: text="${text}", type="${type}"`);
                } catch (error) {
                    logger.warn(`Error inspeccionando botón ${i + 1}`);
                }
            }
            
            // Verificar si hay algún mensaje de error o redirección
            const bodyText = await this.page.evaluate(() => document.body.textContent || '');
            if (bodyText.includes('redirect') || bodyText.includes('Redirect')) {
                logger.warn("Página contiene texto de redirección");
            }
            
            logger.info("=== FIN DEBUG ===");
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error(`Error durante debug: ${errorMessage}`);
        }
    }

    /**
     * Espera a que el usuario complete la verificación manualmente
     */
    async waitForManualVerification() {
        if (!this.page) throw new Error("Page not initialized");
        
        logger.info("Waiting for manual verification completion...");
        logger.info("Please complete the verification in the browser window, then return here and press Enter.");
        
        // Pausar la ejecución y esperar input del usuario
        await new Promise<void>((resolve) => {
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            
            rl.question('Press Enter after completing verification...', () => {
                rl.close();
                resolve();
            });
        });
        
        logger.info("Manual verification completed, continuing...");
    }

    /**
     * Maneja la verificación one-tap de Instagram de forma automática
     */
    async handleOneTapVerification() {
        if (!this.page) throw new Error("Page not initialized");
        logger.info("Handling one-tap verification automatically...");
        
        try {
            // Esperar a que se cargue la página de verificación
            await delay(3000);
            
            // Estrategia 1: Buscar y hacer click en botones de confirmación
            const buttonSelectors = [
                'button[type="submit"]',
                'button:contains("Continue")',
                'button:contains("Next")',
                'button:contains("Confirm")',
                'button:contains("Verify")',
                'button:contains("Allow")',
                'button:contains("Yes")',
                'button:contains("OK")',
                'div[role="button"]:contains("Continue")',
                'div[role="button"]:contains("Next")'
            ];
            
            for (const selector of buttonSelectors) {
                try {
                    const element = await this.page.$(selector);
                    if (element) {
                        logger.info(`Found button with selector: ${selector}`);
                        await element.hover();
                        await delay(500 + Math.random() * 1000);
                        await element.click();
                        logger.info(`Clicked button: ${selector}`);
                        await delay(3000);
                        return;
                    }
                } catch (error) {
                    continue;
                }
            }
            
            // Estrategia 2: Buscar botones por texto
            const buttons = await this.page.$$('button, div[role="button"]');
            for (const button of buttons) {
                try {
                    const text = await button.evaluate((el) => el.textContent?.toLowerCase() || '');
                    if (text && (text.includes('continue') || text.includes('next') || 
                                text.includes('confirm') || text.includes('verify') || 
                                text.includes('allow') || text.includes('yes') || 
                                text.includes('ok') || text.includes('proceed'))) {
                        logger.info(`Found button with text: ${text}`);
                        await button.hover();
                        await delay(500 + Math.random() * 1000);
                        await button.click();
                        logger.info(`Clicked button: ${text}`);
                        await delay(3000);
                        break;
                    }
                } catch (error) {
                    continue;
                }
            }
            
            // Estrategia 3: Intentar navegar directamente a la página principal
            logger.info("Attempting to navigate directly to main page...");
            await this.page.goto('https://www.instagram.com/', {
                waitUntil: "networkidle2",
                timeout: 30000
            });
            
            logger.info("One-tap verification handling completed");
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.warn(`Error handling one-tap verification: ${errorMessage}`);
            
            // Fallback: intentar navegar a la página principal
            try {
                await this.page.goto('https://www.instagram.com/', {
                    waitUntil: "networkidle2",
                    timeout: 30000
                });
                logger.info("Fallback navigation completed");
            } catch (fallbackError) {
                logger.error("Fallback navigation failed");
            }
        }
    }

    async handleNotificationPopup() {
        if (!this.page) throw new Error("Page not initialized");
        logger.info("Checking for notification popup...");

        try {
            // Wait for the dialog to appear, with a timeout
            const dialogSelector = 'div[role="dialog"]';
            await this.page.waitForSelector(dialogSelector, { timeout: 5000 });
            const dialog = await this.page.$(dialogSelector);

            if (dialog) {
                console.log("Notification dialog found. Searching for 'Not Now' button.");
                const notNowButtonSelectors = ["button", `div[role="button"]`];
                let notNowButton: puppeteer.ElementHandle<Element> | null = null;

                for (const selector of notNowButtonSelectors) {
                    // Search within the dialog context
                    const elements = await dialog.$$(selector);
                    for (const element of elements) {
                        try {
                            const text = await element.evaluate((el) => el.textContent);
                            if (text && text.trim().toLowerCase() === "not now") {
                                notNowButton = element;
                                console.log(`Found 'Not Now' button with selector: ${selector}`);
                                break;
                            }
                        } catch (e) {
                            // Ignore errors from stale elements
                        }
                    }
                    if (notNowButton) break;
                }

                if (notNowButton) {
                    try {
                        console.log("Dismissing 'Not Now' notification popup...");
                        // Using evaluate to click because it can be more reliable
                        await notNowButton.evaluate((btn:any) => btn.click());
                        await delay(1500); // Wait for popup to close
                        console.log("'Not Now' notification popup dismissed.");
                    } catch (e) {
                        console.warn("Failed to click 'Not Now' button. It might be gone or covered.", e);
                    }
                } else {
                    console.log("'Not Now' button not found within the dialog.");
                }
            }
        } catch (error) {
            console.log("No notification popup appeared within the timeout period.");
            // If it times out, it means no popup, which is fine.
        }
    }

    async sendDirectMessage(username: string, message: string) {
        if (!this.page) throw new Error("Page not initialized");
        try {
            await this.sendDirectMessageWithMedia(username, message);
        } catch (error) {
            logger.error("Failed to send direct message", error);
            throw error;
        }
    }

    async sendDirectMessageWithMedia(username: string, message: string, mediaPath?: string) {
        if (!this.page) throw new Error("Page not initialized");
        try {
            await this.page.goto(`https://www.instagram.com/${username}/`, {
                waitUntil: "networkidle2",
            });
            console.log("Navigated to user profile");
            await delay(3000);

            const messageButtonSelectors = ['div[role="button"]', "button", 'a[href*="/direct/t/"]', 'div[role="button"] span', 'div[role="button"] div'];
            let messageButton: puppeteer.ElementHandle<Element> | null = null;
            for (const selector of messageButtonSelectors) {
                const elements = await this.page.$$(selector);
                for (const element of elements) {
                    const text = await element.evaluate((el: Element) => el.textContent);
                    if (text && text.trim() === "Message") {
                        messageButton = element;
                        break;
                    }
                }
                if (messageButton) break;
            }
            if (!messageButton) throw new Error("Message button not found.");
            await messageButton.click();
            await delay(2000); // Wait for message modal to open
            await this.handleNotificationPopup();

            if (mediaPath) {
                const fileInput = await this.page.$('input[type="file"]');
                if (fileInput) {
                    await fileInput.uploadFile(mediaPath);
                    await this.handleNotificationPopup();
                    await delay(2000); // wait for upload
                } else {
                    logger.warn("File input for media not found.");
                }
            }

            const messageInputSelectors = ['textarea[placeholder="Message..."]', 'div[role="textbox"]', 'div[contenteditable="true"]', 'textarea[aria-label="Message"]'];
            let messageInput: puppeteer.ElementHandle<Element> | null = null;
            for (const selector of messageInputSelectors) {
                messageInput = await this.page.$(selector);
                if (messageInput) break;
            }
            if (!messageInput) throw new Error("Message input not found.");
            await messageInput.type(message);
            await this.handleNotificationPopup();
            await delay(2000);

            const sendButtonSelectors = ['div[role="button"]', "button"];
            let sendButton: puppeteer.ElementHandle<Element> | null = null;
            for (const selector of sendButtonSelectors) {
                const elements = await this.page.$$(selector);
                for (const element of elements) {
                    const text = await element.evaluate((el: Element) => el.textContent);
                    if (text && text.trim() === "Send") {
                        sendButton = element;
                        break;
                    }
                }
                if (sendButton) break;
            }
            if (!sendButton) throw new Error("Send button not found.");
            await sendButton.click();
            await this.handleNotificationPopup();
            console.log("Message sent successfully");
        } catch (error) {
            logger.error(`Failed to send DM to ${username}`, error);
            throw error;
        }
    }

    async sendDirectMessagesFromFile(file: Buffer | string, message: string, mediaPath?: string) {
        if (!this.page) throw new Error("Page not initialized");
        logger.info(`Sending DMs from provided file content`);
        let fileContent: string;
        if (Buffer.isBuffer(file)) {
            fileContent = file.toString('utf-8');
        } else {
            fileContent = file;
        }
        const usernames = fileContent.split("\n");
        for (const username of usernames) {
            if (username.trim()) {
                await this.handleNotificationPopup();
                await this.sendDirectMessageWithMedia(username.trim(), message, mediaPath);
                await this.handleNotificationPopup();
                // add delay to avoid being flagged
                await delay(30000);
            }
        }
    }

    async interactWithPosts() {
        if (!this.page) throw new Error("Page not initialized");
        let postIndex = 1; // Start with the first post
        const maxPosts = 20; // Limit to prevent infinite scrolling
        const page = this.page;
        while (postIndex <= maxPosts) {
            // Check for exit flag
            if (typeof getShouldExitInteractions === 'function' && getShouldExitInteractions()) {
                console.log('Exit from interactions requested. Stopping loop.');
                break;
            }
            try {
                const postSelector = `article:nth-of-type(${postIndex})`;
                // Check if the post exists
                if (!(await page.$(postSelector))) {
                    console.log("No more posts found. Ending iteration...");
                    return;
                }
                const likeButtonSelector = `${postSelector} svg[aria-label="Like"]`;
                const likeButton = await page.$(likeButtonSelector);
                let ariaLabel = null;
                if (likeButton) {
                    ariaLabel = await likeButton.evaluate((el: Element) => el.getAttribute("aria-label"));
                }
                if (ariaLabel === "Like" && likeButton) {
                    console.log(`Liking post ${postIndex}...`);
                    await likeButton.click();
                    await page.keyboard.press("Enter");
                    console.log(`Post ${postIndex} liked.`);
                } else if (ariaLabel === "Unlike") {
                    console.log(`Post ${postIndex} is already liked.`);
                } else {
                    console.log(`Like button not found for post ${postIndex}.`);
                }
                // Extract and log the post caption
                const captionSelector = `${postSelector} div.x9f619 span._ap3a div span._ap3a`;
                const captionElement = await page.$(captionSelector);
                let caption = "";
                if (captionElement) {
                    caption = await captionElement.evaluate((el) => (el as HTMLElement).innerText);
                    console.log(`Caption for post ${postIndex}: ${caption}`);
                } else {
                    console.log(`No caption found for post ${postIndex}.`);
                }
                // Check if there is a '...more' link to expand the caption
                const moreLinkSelector = `${postSelector} div.x9f619 span._ap3a span div span.x1lliihq`;
                const moreLink = await page.$(moreLinkSelector);
                if (moreLink && captionElement) {
                    console.log(`Expanding caption for post ${postIndex}...`);
                    await moreLink.click();
                    const expandedCaption = await captionElement.evaluate((el) => (el as HTMLElement).innerText);
                    console.log(
                        `Expanded Caption for post ${postIndex}: ${expandedCaption}`
                    );
                    caption = expandedCaption;
                }
                // Comment on the post
                const commentBoxSelector = `${postSelector} textarea`;
                const commentBox = await page.$(commentBoxSelector);
                if (commentBox) {
                    console.log(`Commenting on post ${postIndex}...`);
                    const prompt = `human-like Instagram comment based on to the following post: "${caption}". make sure the reply\n            Matchs the tone of the caption (casual, funny, serious, or sarcastic).\n            Sound organic—avoid robotic phrasing, overly perfect grammar, or anything that feels AI-generated.\n            Use relatable language, including light slang, emojis (if appropriate), and subtle imperfections like minor typos or abbreviations (e.g., 'lol' or 'omg').\n            If the caption is humorous or sarcastic, play along without overexplaining the joke.\n            If the post is serious (e.g., personal struggles, activism), respond with empathy and depth.\n            Avoid generic praise ('Great post!'); instead, react specifically to the content (e.g., 'The way you called out pineapple pizza haters 😂👏').\n            *Keep it concise (1-2 sentences max) and compliant with Instagram's guidelines (no spam, harassment, etc.).*`;
                    const schema = getInstagramCommentSchema();
                    const result = await runAgent(schema, prompt);
                    const comment = (result[0]?.comment ?? "") as string;
                    await commentBox.type(comment);
                    // New selector approach for the post button
                    const postButton = await page.evaluateHandle(() => {
                        const buttons = Array.from(
                            document.querySelectorAll('div[role="button"]')
                        );
                        return buttons.find(
                            (button) =>
                                button.textContent === "Post" && !button.hasAttribute("disabled")
                        );
                    });
                    // Only click if postButton is an ElementHandle and not null
                    const postButtonElement = postButton && postButton.asElement ? postButton.asElement() : null;
                    if (postButtonElement) {
                        console.log(`Posting comment on post ${postIndex}...`);
                        await (postButtonElement as puppeteer.ElementHandle<Element>).click();
                        console.log(`Comment posted on post ${postIndex}.`);
                        // Wait for comment to be posted and UI to update
                        await delay(2000);
                    } else {
                        console.log("Post button not found.");
                    }
                } else {
                    console.log("Comment box not found.");
                }
                // Wait before moving to the next post
                const waitTime = Math.floor(Math.random() * 5000) + 5000;
                console.log(
                    `Waiting ${waitTime / 1000} seconds before moving to the next post...`
                );
                await delay(waitTime);
                // Extra wait to ensure all actions are complete before scrolling
                await delay(1000);
                // Scroll to the next post
                await page.evaluate(() => {
                    window.scrollBy(0, window.innerHeight);
                });
                postIndex++;
            } catch (error) {
                console.error(`Error interacting with post ${postIndex}:`, error);
                break;
            }
        }
    }

    async scrapeFollowers(targetAccount: string, maxFollowers: number) {
        if (!this.page) throw new Error("Page not initialized");
        const page = this.page;
        try {
            // Navigate to the target account's followers page
            await page.goto(`https://www.instagram.com/${targetAccount}/followers/`, {
                waitUntil: "networkidle2",
            });
            console.log(`Navigated to ${targetAccount}'s followers page`);

            // Wait for the followers modal to load (try robustly)
            try {
                await page.waitForSelector('div a[role="link"] span[title]');
            } catch {
                // fallback: wait for dialog
                await page.waitForSelector('div[role="dialog"]');
            }
            console.log("Followers modal loaded");

            const followers: string[] = [];
            let previousHeight = 0;
            let currentHeight = 0;
            maxFollowers = maxFollowers + 4;
            // Scroll and collect followers until we reach the desired amount or can't scroll anymore
            console.log(maxFollowers);
            while (followers.length < maxFollowers) {
                // Get all follower links in the current view
                const newFollowers = await page.evaluate(() => {
                    const followerElements =
                        document.querySelectorAll('div a[role="link"]');
                    return Array.from(followerElements)
                        .map((element) => element.getAttribute("href"))
                        .filter(
                            (href): href is string => href !== null && href.startsWith("/")
                        )
                        .map((href) => href.substring(1)); // Remove leading slash
                });

                // Add new unique followers to our list
                for (const follower of newFollowers) {
                    if (!followers.includes(follower) && followers.length < maxFollowers) {
                        followers.push(follower);
                        console.log(`Found follower: ${follower}`);
                    }
                }

                // Scroll the followers modal
                await page.evaluate(() => {
                    const dialog = document.querySelector('div[role="dialog"]');
                    if (dialog) {
                        dialog.scrollTop = dialog.scrollHeight;
                    }
                });

                // Wait for potential new content to load
                await delay(1000);

                // Check if we've reached the bottom
                currentHeight = await page.evaluate(() => {
                    const dialog = document.querySelector('div[role="dialog"]');
                    return dialog ? dialog.scrollHeight : 0;
                });

                if (currentHeight === previousHeight) {
                    console.log("Reached the end of followers list");
                    break;
                }

                previousHeight = currentHeight;
            }

            console.log(`Successfully scraped ${followers.length - 4} followers`);
            return followers.slice(4, maxFollowers);
        } catch (error) {
            console.error(`Error scraping followers for ${targetAccount}:`, error);
            throw error;
        }
    }

    /**
     * Analiza posts de Instagram de un usuario específico
     * @param username Usuario de Instagram a analizar
     * @param options Opciones de scraping
     * @returns Datos estructurados del análisis
     */
    async scrapeInstagramAnalysis(
        username: string, 
        options: ScrapingOptions = {}
    ): Promise<InstagramAnalysisData> {
        if (!this.page) throw new Error("Page not initialized");
        
        const {
            daysBack = 30,
            maxPosts = 50,
            maxCommentsPerPost = 10,
            includeMediaUrls = false,
            rateLimitMs = 3000
        } = options;

        try {
            logger.info(`Iniciando análisis de Instagram para @${username}`);
            
            // Navegar al perfil del usuario
            await this.page.goto(`https://www.instagram.com/${username}/`, {
                waitUntil: "networkidle2",
            });
            await delay(2000);

            // Verificar que el perfil existe y no es privado
            const isPrivate = await this.page.evaluate(() => {
                const privateText = document.querySelector('h2');
                return privateText?.textContent?.includes('This Account is Private') || false;
            });

            if (isPrivate) {
                throw new Error(`El perfil @${username} es privado y no se puede analizar`);
            }

            // Obtener URLs de posts recientes
            const postUrls = await this.getPostUrls(username, maxPosts);
            logger.info(`Encontrados ${postUrls.length} posts para analizar`);

            const posts: PostData[] = [];
            let processedCount = 0;

            for (const postUrl of postUrls) {
                try {
                    logger.info(`Procesando post ${processedCount + 1}/${postUrls.length}: ${postUrl}`);
                    
                    const postData = await this.scrapeIndividualPost(
                        postUrl, 
                        maxCommentsPerPost, 
                        includeMediaUrls
                    );
                    
                    if (postData) {
                        posts.push(postData);
                    }

                    processedCount++;
                    
                    // Rate limiting entre posts
                    if (processedCount < postUrls.length) {
                        await delay(rateLimitMs);
                    }

                } catch (error) {
                    logger.error(`Error procesando post ${postUrl}:`, error);
                    continue; // Continuar con el siguiente post
                }
            }

            // Filtrar posts por fecha si es necesario
            const filteredPosts = daysBack < 365 ? 
                this.filterPostsByDate(posts, daysBack) : posts;

            // Generar resumen del análisis
            const summary = this.generateAnalysisSummary(filteredPosts);

            const analysisData: InstagramAnalysisData = {
                username,
                analysisDate: new Date().toISOString(),
                period: `${daysBack} días`,
                totalPosts: filteredPosts.length,
                posts: filteredPosts,
                summary
            };

            logger.info(`Análisis completado para @${username}. Posts analizados: ${filteredPosts.length}`);
            return analysisData;

        } catch (error) {
            logger.error(`Error en análisis de Instagram para @${username}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene URLs de posts recientes de un perfil
     */
    private async getPostUrls(username: string, maxPosts: number): Promise<string[]> {
        if (!this.page) throw new Error("Page not initialized");

        const postUrls: string[] = [];
        let scrollCount = 0;
        const maxScrolls = Math.ceil(maxPosts / 12) + 2; // Instagram muestra ~12 posts por scroll

        while (postUrls.length < maxPosts && scrollCount < maxScrolls) {
            // Extraer URLs de posts visibles
            const newUrls = await this.page.evaluate(() => {
                const postLinks = document.querySelectorAll('a[href*="/p/"]');
                return Array.from(postLinks)
                    .map(link => (link as HTMLAnchorElement).href)
                    .filter(url => url.includes('/p/'))
                    .slice(0, 12); // Máximo 12 por scroll
            });

            // Agregar URLs únicas
            for (const url of newUrls) {
                if (!postUrls.includes(url) && postUrls.length < maxPosts) {
                    postUrls.push(url);
                }
            }

            // Scroll para cargar más posts
            await this.page.evaluate(() => {
                window.scrollBy(0, window.innerHeight);
            });

            await delay(2000);
            scrollCount++;
        }

        return postUrls.slice(0, maxPosts);
    }

    /**
     * Extrae datos de un post individual
     */
    private async scrapeIndividualPost(
        postUrl: string, 
        maxComments: number, 
        includeMediaUrls: boolean
    ): Promise<PostData | null> {
        if (!this.page) throw new Error("Page not initialized");

        try {
            await this.page.goto(postUrl, { waitUntil: "networkidle2" });
            await delay(2000);

            const postData = await this.page.evaluate((maxComments, includeMediaUrls) => {
                // Función de análisis de sentiment
                const analyzeSentiment = (text: string): 'positive' | 'negative' | 'neutral' => {
                    const positiveWords = [
                        'excelente', 'genial', 'me gusta', 'perfecto', '👍', '❤️', '😍', 
                        'hermoso', 'increíble', 'fantástico', 'maravilloso', 'espectacular',
                        'bueno', 'bonito', 'lindo', 'agradable', 'divertido', 'interesante'
                    ];
                    const negativeWords = [
                        'malo', 'terrible', 'no me gusta', '👎', '😞', 'horrible', 
                        'feo', 'aburrido', 'molesto', 'frustrante', 'decepcionante'
                    ];
                    
                    const lowerText = text.toLowerCase();
                    const hasPositive = positiveWords.some(word => lowerText.includes(word));
                    const hasNegative = negativeWords.some(word => lowerText.includes(word));
                    
                    if (hasPositive && !hasNegative) return 'positive';
                    if (hasNegative && !hasPositive) return 'negative';
                    return 'neutral';
                };

                // Extraer ID del post
                const postId = window.location.pathname.split('/p/')[1]?.split('/')[0] || '';

                // Extraer fecha del post
                const timeElement = document.querySelector('time');
                const date = timeElement?.getAttribute('datetime') || new Date().toISOString();

                // Detectar tipo de contenido
                let type: 'image' | 'carousel' | 'video' = 'image';
                if (document.querySelector('video')) {
                    type = 'video';
                } else if (document.querySelector('[aria-label*="carousel"]') || 
                          document.querySelector('button[aria-label*="Next"]') ||
                          document.querySelector('[data-testid="carousel"]')) {
                    type = 'carousel';
                }

                // Extraer likes
                let likes = 0;
                const likesSelectors = [
                    'section button span[title]',
                    'a[href*="/liked_by/"] span',
                    '[data-testid="like-count"]',
                    'section span span',
                    'div[role="button"] span'
                ];

                for (const selector of likesSelectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        const text = element.textContent || '';
                        const match = text.match(/(\d+(?:,\d+)*)/);
                        if (match) {
                            likes = parseInt(match[1].replace(/,/g, '')) || 0;
                            break;
                        }
                    }
                }

                // Extraer caption
                let caption = '';
                const captionSelectors = [
                    'div.x9f619 span._ap3a div span._ap3a',
                    'div[data-testid="post-caption"] span',
                    'article div span span',
                    'div[role="button"] span'
                ];

                for (const selector of captionSelectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        caption = element.textContent || '';
                        break;
                    }
                }

                // Extraer hashtags y menciones
                const hashtags = (caption.match(/#\w+/g) || []).map(tag => tag.slice(1));
                const mentions = (caption.match(/@\w+/g) || []).map(mention => mention.slice(1));

                // Extraer comentarios
                const comments: any[] = [];
                const commentElements = document.querySelectorAll('div[data-testid="comment"]');
                
                for (let i = 0; i < Math.min(commentElements.length, maxComments); i++) {
                    const commentEl = commentElements[i];
                    const usernameEl = commentEl.querySelector('a');
                    const textEl = commentEl.querySelector('span');
                    
                    if (usernameEl && textEl) {
                        const username = usernameEl.textContent || '';
                        const text = textEl.textContent || '';
                        
                        if (text.length >= 5) { // Filtrar comentarios muy cortos
                            comments.push({
                                username,
                                text,
                                sentiment: analyzeSentiment(text)
                            });
                        }
                    }
                }

                // Extraer URLs de media si se solicita
                let mediaUrls: string[] = [];
                if (includeMediaUrls) {
                    const imgElements = document.querySelectorAll('img[src*="instagram"]');
                    mediaUrls = Array.from(imgElements)
                        .map(img => (img as HTMLImageElement).src)
                        .filter(src => src.includes('instagram'));
                }

                return {
                    id: postId,
                    url: window.location.href,
                    date,
                    type,
                    caption,
                    likes,
                    comments,
                    engagement: 0, // Se calculará después
                    hashtags,
                    mentions,
                    mediaUrls
                };
            }, maxComments, includeMediaUrls);

            if (postData) {
                // Calcular engagement rate
                postData.engagement = this.calculateEngagementRate(postData.likes, postData.comments.length);
                return postData;
            }

            return null;

        } catch (error) {
            logger.error(`Error extrayendo datos del post ${postUrl}:`, error);
            return null;
        }
    }

    /**
     * Filtra posts por fecha
     */
    private filterPostsByDate(posts: PostData[], daysBack: number): PostData[] {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysBack);

        return posts.filter(post => {
            const postDate = new Date(post.date);
            return postDate >= cutoffDate;
        });
    }

    /**
     * Calcula el engagement rate de un post
     */
    private calculateEngagementRate(likes: number, comments: number): number {
        // Engagement rate = (likes + comments) / followers * 100
        // Como no tenemos followers, usamos una métrica relativa
        return likes + comments;
    }

    /**
     * Genera resumen del análisis
     */
    private generateAnalysisSummary(posts: PostData[]) {
        if (posts.length === 0) {
            return {
                totalLikes: 0,
                totalComments: 0,
                averageEngagement: 0,
                contentTypeBreakdown: { images: 0, carousels: 0, videos: 0 },
                sentimentBreakdown: { positive: 0, negative: 0, neutral: 0 }
            };
        }

        const totalLikes = posts.reduce((sum, post) => sum + post.likes, 0);
        const totalComments = posts.reduce((sum, post) => sum + post.comments.length, 0);
        const averageEngagement = posts.reduce((sum, post) => sum + post.engagement, 0) / posts.length;

        const contentTypeBreakdown = posts.reduce((acc, post) => {
            if (post.type === 'image') acc.images++;
            else if (post.type === 'carousel') acc.carousels++;
            else if (post.type === 'video') acc.videos++;
            return acc;
        }, { images: 0, carousels: 0, videos: 0 });

        const sentimentBreakdown = posts.reduce((acc, post) => {
            post.comments.forEach(comment => {
                acc[comment.sentiment]++;
            });
            return acc;
        }, { positive: 0, negative: 0, neutral: 0 });

        const mostEngagedPost = posts.reduce((max, post) => 
            post.engagement > max.engagement ? post : max
        );

        return {
            totalLikes,
            totalComments,
            averageEngagement: Math.round(averageEngagement * 100) / 100,
            mostEngagedPost,
            contentTypeBreakdown,
            sentimentBreakdown
        };
    }

    public async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
        }
    }
}

export async function scrapeFollowersHandler(targetAccount: string, maxFollowers: number) {
    const client = new IgClient();
    await client.init();
    const followers = await client.scrapeFollowers(targetAccount, maxFollowers);
    await client.close();
    return followers;
}