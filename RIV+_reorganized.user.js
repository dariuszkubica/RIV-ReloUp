// ==UserScript==
// @name         RIV+
// @namespace    KTW1
// @version      3.9.3
// @author       Dariusz Kubica (kubicdar)
// @copyright    2025+, Dariusz Kubica (https://github.com/dariuszkubica)
// @license      Licensed with the consent of the author
// @description  Enhanced warehouse analysis with smart session monitoring, location tracking, real-time updates, and automatic session initialization
// @match        https://dub.prod.item-visibility.returns.amazon.dev/*
// @grant        none
// @run-at       document-start
// @homepageURL  https://github.com/dariuszkubica/RIV-ReloUp
// @supportURL   https://github.com/dariuszkubica/RIV-ReloUp/issues
// @downloadURL  https://raw.githubusercontent.com/dariuszkubica/RIV-ReloUp/main/RIV+.user.js
// @updateURL    https://raw.githubusercontent.com/dariuszkubica/RIV-ReloUp/main/RIV+.user.js
// ==/UserScript==

(function() {
    'use strict';
    
    // ========================================================================
    // TABLE OF CONTENTS
    // ========================================================================
    // 1. CORE MODULE - Basic functionality, metadata, and session management
    // 2. CATEGORY MAPPER - Sortation category to destination mapping
    // 3. UPDATE CHECKER - Auto-update functionality
    // 4. UI ENHANCEMENTS - Table modifications and copy functionality
    // 5. CSV EXPORT - Data collection and export functionality
    // 6. DASHBOARD - Quick overview functionality
    // 7. PALLETLAND - Comprehensive analysis functionality
    // 8. SETTINGS - User preferences and configuration
    // 9. INITIALIZATION - Script startup and event binding
    // ========================================================================
    
    
    // ========================================================================
    // 1. CORE MODULE - Basic functionality and session management
    // ========================================================================
    
    /**
     * Core Module - Handles script initialization, metadata extraction, and session management
     */
    const Core = {
        
        // Script version auto-extraction
        getScriptVersion: function() {
            const scriptElement = document.querySelector('script[src*="ReloUp"]') || 
                                 Array.from(document.scripts).find(s => s.textContent.includes('@version'));
            
            if (scriptElement && scriptElement.textContent) {
                const versionMatch = scriptElement.textContent.match(/@version\s+([\d.]+)/);
                if (versionMatch) return versionMatch[1];
            }
            
            // Fallback: try to extract from current script source
            try {
                const currentScript = document.currentScript || 
                                     document.querySelector('script[data-userscript-name*="ReloUp"]');
                if (currentScript && currentScript.textContent) {
                    const match = currentScript.textContent.match(/@version\s+([\d.]+)/);
                    if (match) return match[1];
                }
            } catch (e) {
                console.warn('Error extracting version from current script:', e);
            }
            
            // Final fallback
            return '2.9.3';
        },
        
        // Script metadata auto-extraction
        getScriptMetadata: function() {
            const defaultMetadata = {
                author: 'kubicdar',
                authorFull: 'Dariusz Kubica (kubicdar)',
                namespace: 'KTW1',
                homepageURL: 'https://github.com/dariuszkubica/RIV-ReloUp',
                supportURL: 'https://github.com/dariuszkubica/RIV-ReloUp/issues',
                downloadURL: 'https://raw.githubusercontent.com/dariuszkubica/RIV-ReloUp/main/RIV%20-%20ReloUp.user.js'
            };
            
            try {
                // Try to extract from script element first
                const scriptElement = document.querySelector('script[src*="ReloUp"]') || 
                                     Array.from(document.scripts).find(s => s.textContent.includes('@author'));
                
                if (scriptElement && scriptElement.textContent) {
                    const text = scriptElement.textContent;
                    const metadata = { ...defaultMetadata };
                    
                    // Extract author
                    const authorMatch = text.match(/@author\s+(.+?)(?:\n|$)/);
                    if (authorMatch) {
                        metadata.authorFull = authorMatch[1].trim();
                        // Extract just username from "Name (username)" format
                        const usernameMatch = authorMatch[1].match(/\(([^)]+)\)/);
                        metadata.author = usernameMatch ? usernameMatch[1] : authorMatch[1].trim();
                    }
                    
                    // Extract namespace
                    const namespaceMatch = text.match(/@namespace\s+(.+?)(?:\n|$)/);
                    if (namespaceMatch) {
                        metadata.namespace = namespaceMatch[1].trim();
                    }
                    
                    // Extract URLs
                    const homepageMatch = text.match(/@homepageURL\s+(.+?)(?:\n|$)/);
                    if (homepageMatch) {
                        metadata.homepageURL = homepageMatch[1].trim();
                    }
                    
                    const supportMatch = text.match(/@supportURL\s+(.+?)(?:\n|$)/);
                    if (supportMatch) {
                        metadata.supportURL = supportMatch[1].trim();
                    }
                    
                    const downloadMatch = text.match(/@downloadURL\s+(.+?)(?:\n|$)/);
                    if (downloadMatch) {
                        metadata.downloadURL = downloadMatch[1].trim();
                    }
                    
                    return metadata;
                }
                
                // Fallback: try current script source
                const currentScript = document.currentScript;
                if (currentScript && currentScript.textContent) {
                    const text = currentScript.textContent;
                    const metadata = { ...defaultMetadata };
                    
                    const authorMatch = text.match(/@author\s+(.+?)(?:\n|$)/);
                    if (authorMatch) {
                        metadata.authorFull = authorMatch[1].trim();
                        const usernameMatch = authorMatch[1].match(/\(([^)]+)\)/);
                        metadata.author = usernameMatch ? usernameMatch[1] : authorMatch[1].trim();
                    }
                    
                    const namespaceMatch = text.match(/@namespace\s+(.+?)(?:\n|$)/);
                    if (namespaceMatch) {
                        metadata.namespace = namespaceMatch[1].trim();
                    }
                    
                    return metadata;
                }
            } catch (e) {
                console.warn('Failed to extract script metadata, using defaults:', e);
            }
            
            return defaultMetadata;
        },
        
        // Get current logged-in user from the application
        getCurrentUser: function() {
            console.log('🔍 Attempting to detect current user from application...');
            
            // Method 1: Try to extract from cookies first (most reliable for Amazon systems)
            try {
                const cookies = document.cookie;
                console.log('🍪 Checking cookies for user info...');
                
                // Amazon systems often use these cookie patterns
                const cookiePatterns = [
                    /fcmenu-employeeLogin=([^;]+)/,
                    /employee[-_]?login=([^;]+)/i,
                    /user[-_]?name?=([^;]+)/i,
                    /associate[-_]?id?=([^;]+)/i,
                    /login[-_]?id?=([^;]+)/i
                ];
                
                for (const pattern of cookiePatterns) {
                    const match = cookies.match(pattern);
                    if (match && match[1]) {
                        const user = decodeURIComponent(match[1]);
                        if (user && user.length > 2 && user.length < 20 && /^[a-zA-Z0-9]+$/.test(user)) {
                            console.log('✅ Found user from cookies:', user);
                            return user;
                        }
                    }
                }
            } catch (e) {
                console.warn('Error checking cookies:', e);
            }
            
            // Method 2: Try to extract from page elements
            try {
                console.log('🔍 Checking UI elements for user info...');
                
                const selectors = [
                    '[data-testid*="user"]', '[id*="user"]', '[class*="user"]',
                    '[data-testid*="employee"]', '[id*="employee"]', '[class*="employee"]',
                    '[data-testid*="login"]', '[id*="login"]', '[class*="login"]',
                    'header [class*="name"]', 'nav [class*="user"]',
                    '.user-info', '.employee-info', '.login-info'
                ];
                
                for (const selector of selectors) {
                    try {
                        const elements = document.querySelectorAll(selector);
                        for (const element of elements) {
                            const text = (element.textContent || element.innerText || '').trim();
                            if (text && text.length > 2 && text.length < 20 && /^[a-zA-Z0-9]+$/.test(text) && 
                                !text.toLowerCase().includes('user') && !text.toLowerCase().includes('login')) {
                                console.log('✅ Found potential user from UI element:', text, 'from', selector);
                                return text;
                            }
                        }
                    } catch (e) {
                        // Continue with next selector
                    }
                }
            } catch (e) {
                console.warn('Error checking UI elements:', e);
            }
            
            // Method 3: Check localStorage/sessionStorage
            try {
                console.log('🔍 Checking localStorage and sessionStorage...');
                
                const storageObjects = [localStorage, sessionStorage];
                const storageNames = ['localStorage', 'sessionStorage'];
                
                for (let i = 0; i < storageObjects.length; i++) {
                    const storage = storageObjects[i];
                    const storageName = storageNames[i];
                    
                    try {
                        const keys = Object.keys(storage);
                        for (const key of keys) {
                            if (key.toLowerCase().includes('user') || key.toLowerCase().includes('employee') || 
                                key.toLowerCase().includes('login') || key.toLowerCase().includes('associate')) {
                                const value = storage.getItem(key);
                                
                                if (value && !value.startsWith('{') && !value.startsWith('[')) {
                                    // Simple string value
                                    if (value.length > 2 && value.length < 20 && /^[a-zA-Z0-9]+$/.test(value)) {
                                        console.log(`✅ Found potential user from ${storageName}:`, value);
                                        return value;
                                    }
                                } else if (value) {
                                    // Try to parse JSON
                                    try {
                                        const parsed = JSON.parse(value);
                                        const userFields = ['username', 'user', 'employee', 'login', 'associate', 'employeeLogin', 'userLogin'];
                                        
                                        for (const field of userFields) {
                                            if (parsed[field] && typeof parsed[field] === 'string') {
                                                const userValue = parsed[field];
                                                if (userValue.length > 2 && userValue.length < 20 && /^[a-zA-Z0-9]+$/.test(userValue)) {
                                                    console.log(`✅ Found potential user from ${storageName} JSON:`, userValue);
                                                    return userValue;
                                                }
                                            }
                                        }
                                    } catch (e) {
                                        // Ignore JSON parse errors
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        console.warn(`Error checking ${storageName}:`, e);
                    }
                }
            } catch (e) {
                console.warn('Error checking storage:', e);
            }
            
            console.log('❌ Could not detect current user from application');
            return null;
        },
        
        // Initialize core components
        init: function() {
            console.log('🚀 RIV - ReloUp script starting (Reorganized & Speed Optimized)...');
            
            // Get script version and metadata
            this.version = this.getScriptVersion();
            this.metadata = this.getScriptMetadata();
            
            console.log(`📋 Script version: ${this.version}`);
            console.log(`👤 Script author: ${this.metadata.author}`);
            
            return {
                version: this.version,
                metadata: this.metadata
            };
        },
        
        // Enhanced container search with silent mode option (used by Dashboard and PalletLand)
        performContainerSearch: async function(containerId, silent = false) {
            const sessionData = SessionManager.get();
            
            // Use captured session data or fallback values
            let warehouseId = sessionData.warehouseId || 'CDPL1';
            let associate = sessionData.associate || 'System';
            
            // If we don't have session data, try multiple extraction methods
            if (!sessionData.warehouseId || !sessionData.associate) {
                try {
                    // Method 1: Extract from DOM elements and scripts
                    const scripts = document.querySelectorAll('script[type="application/json"], script:not([src])');
                    for (const script of scripts) {
                        const text = script.textContent || script.innerText;
                        if (text && (text.includes('warehouseId') || text.includes('associate'))) {
                            // Look for JSON-like structures
                            const warehouseMatch = text.match(/["']?warehouseId["']?\s*[:=]\s*["']([A-Z0-9]{3,10})["']/i);
                            const associateMatch = text.match(/["']?(?:associate|username|user)["']?\s*[:=]\s*["']([A-Z0-9]{3,20})["']/i);
                            
                            if (warehouseMatch && warehouseMatch[1] !== 'CDPL1') {
                                warehouseId = warehouseMatch[1];
                            }
                            if (associateMatch && associateMatch[1] !== 'System') {
                                associate = associateMatch[1];
                            }
                        }
                    }
                    
                    // Method 2: Check URL parameters or path
                    const url = window.location.href;
                    const warehouseUrlMatch = url.match(/warehouse[=/]([A-Z0-9]{3,10})/i);
                    const userUrlMatch = url.match(/user[=/]([A-Z0-9]{3,20})/i);
                    
                    if (warehouseUrlMatch) {
                        warehouseId = warehouseUrlMatch[1];
                    }
                    if (userUrlMatch) {
                        associate = userUrlMatch[1];
                    }
                    
                } catch (e) {
                    if (!silent) {
                        console.warn('🔧 Could not extract session data, using defaults:', e.message);
                    }
                }
            }
            
            // Update session data if we have valid values
            if (warehouseId !== 'CDPL1' && associate !== 'System') {
                SessionManager.update(warehouseId, associate);
            }
            
            if (!silent) {
                console.log(`🔍 Performing search for ${containerId} with warehouseId: ${warehouseId}, associate: ${associate}`);
            }
            
            const requestData = {
                containerId: containerId,
                warehouseId: warehouseId,
                associate: associate,
                includeChildren: true,
                mode: "SEARCH",
                locale: "pl-PL",
                movingContainers: []
            };
            
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/api/getContainer', true);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.setRequestHeader('Accept', 'application/json, text/plain, */*');
                
                // Copy headers from real requests if available
                try {
                    const cookies = document.cookie;
                    if (cookies) {
                        xhr.setRequestHeader('Cookie', cookies);
                    }
                    
                    // Try to copy other important headers from a recent request
                    const lastRequest = sessionStorage.getItem('lastRequestHeaders');
                    if (lastRequest) {
                        const headers = JSON.parse(lastRequest);
                        Object.keys(headers).forEach(key => {
                            if (!['content-type', 'accept', 'cookie'].includes(key.toLowerCase())) {
                                xhr.setRequestHeader(key, headers[key]);
                            }
                        });
                    }
                } catch (e) {
                    if (!silent) {
                        console.warn('Could not set additional headers');
                    }
                }
                
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                        if (!silent) {
                            console.log(`📡 API Response for ${containerId}: Status ${xhr.status}`);
                        }
                        
                        if (xhr.status === 200) {
                            try {
                                const data = JSON.parse(xhr.responseText);
                                
                                // Debug sortation categories (only if not silent)
                                if (!silent && data.childContainers && data.childContainers.length > 0) {
                                    const firstContainer = data.childContainers[0];
                                    if (firstContainer.sortationCategories) {
                                        console.log(`📋 ${containerId} sortationCategories:`, firstContainer.sortationCategories);
                                    }
                                }
                                
                                if (!silent) {
                                    console.log(`✅ Success for ${containerId}:`, data.childContainers ? `${data.childContainers.length} containers` : 'No containers');
                                }
                                resolve(data);
                            } catch (e) {
                                if (!silent) {
                                    console.error(`❌ Parse error for ${containerId}:`, e.message);
                                }
                                reject(new Error(`Parse error: ${e.message}`));
                            }
                        } else {
                            if (!silent) {
                                console.error(`❌ HTTP error for ${containerId}: ${xhr.status} ${xhr.statusText}`);
                                console.error('Request data:', requestData);
                                console.error('Response text:', xhr.responseText);
                                
                                // For 400 errors, suggest session data issues
                                if (xhr.status === 400) {
                                    console.error(`🚫 Likely cause: Invalid session parameters. Try refreshing the page and using the main search function first to capture valid session data.`);
                                }
                            }
                            
                            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                        }
                    }
                };
                
                xhr.onerror = () => {
                    if (!silent) {
                        console.error(`❌ Network error for ${containerId}`);
                    }
                    reject(new Error('Network error'));
                };
                
                if (!silent) {
                    console.log(`🚀 Sending request for ${containerId}:`, requestData);
                }
                xhr.send(JSON.stringify(requestData));
            });
        },
        
        // Fast API request with session management (optimized for speed)
        getContainerDetails: async function(containerId, warehouseId = null, associate = null) {
            const sessionData = SessionManager.get();
            
            // Use global session data if available, otherwise use provided parameters
            const actualWarehouseId = sessionData.warehouseId || warehouseId;
            const actualAssociate = sessionData.associate || associate;
            
            const requestData = {
                containerId: containerId,
                warehouseId: actualWarehouseId,
                associate: actualAssociate,
                includeChildren: true,
                mode: "SEARCH",
                locale: "pl-PL",
                movingContainers: []
            };
            
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/api/getContainer', true);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.setRequestHeader('Accept', 'application/json, text/plain, */*');
                
                // Copy important headers
                try {
                    const cookies = document.cookie;
                    if (cookies) {
                        xhr.setRequestHeader('Cookie', cookies);
                    }
                } catch (e) {}
                
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            try {
                                const data = JSON.parse(xhr.responseText);
                                resolve(data);
                            } catch (e) {
                                reject(new Error(`Parse error: ${e.message}`));
                            }
                        } else {
                            // Log detailed error for debugging
                            if (xhr.status === 400) {
                                console.warn(`⚠️ HTTP 400 for ${containerId} - Invalid request parameters:`, {
                                    warehouseId: actualWarehouseId,
                                    associate: actualAssociate,
                                    response: xhr.responseText
                                });
                            }
                            reject(new Error(`HTTP ${xhr.status}`));
                        }
                    }
                };
                
                xhr.onerror = () => reject(new Error('Network error'));
                xhr.send(JSON.stringify(requestData));
            });
        },
        
        // Fast parallel processing of child containers (used by Dashboard and PalletLand)
        processChildContainersFast: async function(childContainers, progressCallback = null) {
            const concurrencyLimit = 5;
            let processedCount = 0;
            let successCount = 0;
            let errorCount = 0;
            let skippedCount = 0;
            const totalContainers = childContainers.length;
            const results = [];
            
            console.log(`⚡ Starting fast processing of ${totalContainers} containers (max ${concurrencyLimit} concurrent)...`);
            
            // Process in batches to control concurrency
            for (let i = 0; i < childContainers.length; i += concurrencyLimit) {
                const batch = childContainers.slice(i, i + concurrencyLimit);
                
                const batchPromises = batch.map(async (container) => {
                    try {
                        processedCount++;
                        
                        // Skip already processed containers
                        if (container.processed) {
                            skippedCount++;
                            if (progressCallback) {
                                progressCallback({
                                    processed: processedCount,
                                    total: totalContainers,
                                    successful: successCount,
                                    errors: errorCount,
                                    skipped: skippedCount,
                                    currentContainer: container.containerId
                                });
                            }
                            return null;
                        }
                        
                        // Use silent search to avoid console spam
                        const data = await Core.getContainerDetails(container.containerId);
                        
                        container.processed = true;
                        successCount++;
                        
                        // Update progress
                        if (progressCallback) {
                            progressCallback({
                                processed: processedCount,
                                total: totalContainers,
                                successful: successCount,
                                errors: errorCount,
                                skipped: skippedCount,
                                currentContainer: container.containerId
                            });
                        }
                        
                        return {
                            container: container,
                            data: data,
                            success: true
                        };
                        
                    } catch (error) {
                        errorCount++;
                        console.warn(`⚠️ Error processing ${container.containerId}:`, error.message);
                        
                        // Update progress
                        if (progressCallback) {
                            progressCallback({
                                processed: processedCount,
                                total: totalContainers,
                                successful: successCount,
                                errors: errorCount,
                                skipped: skippedCount,
                                currentContainer: container.containerId
                            });
                        }
                        
                        return {
                            container: container,
                            error: error.message,
                            success: false
                        };
                    }
                });
                
                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults.filter(result => result !== null));
            }
            
            console.log(`✅ Fast processing complete: ${successCount} successful, ${errorCount} errors, ${skippedCount} skipped`);
            
            return {
                results: results,
                summary: {
                    total: totalContainers,
                    successful: successCount,
                    errors: errorCount,
                    skipped: skippedCount
                }
            };
        }
    };
    
    /**
     * Session Management Module - Handles session data with localStorage persistence
     */
    const SessionManager = {
        
        // Session data structure
        data: {
            warehouseId: null,
            associate: null,
            sessionId: null,
            lastCaptured: null
        },
        
        // Save session data to localStorage
        save: function() {
            try {
                const dataToSave = {
                    warehouseId: this.data.warehouseId,
                    associate: this.data.associate,
                    sessionId: this.data.sessionId,
                    lastCaptured: this.data.lastCaptured
                };
                localStorage.setItem('riv_session_data', JSON.stringify(dataToSave));
                console.log('📄 Session data saved to localStorage:', dataToSave);
            } catch (e) {
                console.warn('Failed to save session data to localStorage:', e);
            }
        },
        
        // Load session data from localStorage
        load: function() {
            try {
                const saved = localStorage.getItem('riv_session_data');
                if (saved) {
                    const data = JSON.parse(saved);
                    // Only restore if the data is relatively recent (within 24 hours)
                    const lastCaptured = data.lastCaptured ? new Date(data.lastCaptured) : null;
                    const now = new Date();
                    const dayInMs = 24 * 60 * 60 * 1000;
                    
                    // More lenient validation - allow script author if it's real captured data
                    const isValidAssociate = data.associate && 
                                            data.associate !== 'System';
                    
                    if (lastCaptured && (now - lastCaptured) < dayInMs && isValidAssociate) {
                        this.data.warehouseId = data.warehouseId;
                        this.data.associate = data.associate;
                        this.data.sessionId = data.sessionId;
                        this.data.lastCaptured = data.lastCaptured;
                        console.log('📥 Valid session data restored from localStorage:', data);
                        return true;
                    } else {
                        if (!isValidAssociate) {
                            console.log('🚫 Stored session data contains invalid associate, clearing');
                        } else {
                            console.log('📅 Stored session data is too old, ignoring');
                        }
                        localStorage.removeItem('riv_session_data');
                    }
                }
            } catch (e) {
                console.warn('Failed to load session data from localStorage:', e);
            }
            return false;
        },
        
        // Update session data and save automatically
        update: function(warehouseId, associate, sessionId = null) {
            this.data.warehouseId = warehouseId;
            this.data.associate = associate;
            this.data.sessionId = sessionId;
            this.data.lastCaptured = new Date().toISOString();
            this.save();
        },
        
        // Get current session data
        get: function() {
            return { ...this.data };
        },
        
        // Clear session data
        clear: function() {
            this.data = {
                warehouseId: null,
                associate: null,
                sessionId: null,
                lastCaptured: null
            };
            localStorage.removeItem('riv_session_data');
            console.log('🗑️ Session data cleared');
        },
        
        // Automatically trigger session data capture at startup
        autoTriggerSessionCapture: async function() {
            console.log('🚀 Auto-triggering session data capture at startup...');
            
            try {
                console.log('🔍 Checking for existing valid session data...');
                
                // Check if we have valid session data
                if (this.data.warehouseId && this.data.associate) {
                    const isValid = this.data.warehouseId !== 'CDPL1' && 
                                   this.data.associate !== 'System';
                    
                    if (isValid) {
                        console.log('✅ Already have valid session data, skipping automatic capture:', {
                            warehouseId: this.data.warehouseId,
                            associate: this.data.associate
                        });
                        return true;
                    }
                }
                
                // Wait a bit to allow the page to fully load and for getCurrentUser() to work better
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Try to extract from URL parameters, page elements, or localStorage
                let warehouseId = null;
                let associate = null;
                
                // Method 1: Try to extract from URL path or search params
                const currentUrl = window.location.href;
                const urlParams = new URLSearchParams(window.location.search);
                
                // Check if warehouse info is in URL
                if (urlParams.has('warehouse')) {
                    warehouseId = urlParams.get('warehouse');
                }
                
                // Method 2: Try to extract from page elements/scripts
                const scripts = document.querySelectorAll('script:not([src])');
                for (const script of scripts) {
                    const text = script.textContent;
                    if (text && (text.includes('warehouseId') || text.includes('warehouse') || text.includes('associate') || text.includes('employee'))) {
                        // Look for warehouse patterns in embedded JavaScript
                        const warehouseMatches = text.match(/["']warehouseId["']\s*[:=]\s*["']([A-Z0-9]+)["']/g);
                        const associateMatches = text.match(/["'](?:associate|employeeLogin|username|user)["']\s*[:=]\s*["']([A-Za-z0-9]+)["']/g);
                        
                        if (warehouseMatches && warehouseMatches.length > 0) {
                            const match = warehouseMatches[0].match(/["']([A-Z0-9]+)["']$/);
                            if (match && match[1] !== 'CDPL1') {
                                warehouseId = match[1];
                            }
                        }
                        
                        if (associateMatches && associateMatches.length > 0) {
                            const match = associateMatches[0].match(/["']([A-Za-z0-9]+)["']$/);
                            if (match && match[1] !== 'System') {
                                associate = match[1];
                            }
                        }
                    }
                }
                
                // Method 3: Use dynamic values (fallback)
                if (!warehouseId) {
                    warehouseId = Core.metadata?.namespace; // From @namespace in script header
                }
                
                if (!associate) {
                    console.log('🚫 No associate found in page extraction - trying to get current user');
                    associate = Core.getCurrentUser();
                    
                    if (!associate) {
                        console.log('🚫 No associate found - automatic capture disabled');
                        console.log('💡 Use manual search to capture real user session data');
                        return false;
                    }
                }
                
                // Only reject if associate is clearly a system value
                if (associate === 'System') {
                    console.log('🚫 Associate is system value:', associate);
                    console.log('💡 Waiting for real user interaction to capture correct data');
                    return false;
                }
                
                console.log('🔧 Extracted session data for startup request:', {
                    warehouseId: warehouseId,
                    associate: associate,
                    source: 'startup-extraction'
                });
                
                // Create request data with extracted session info
                const requestData = {
                    containerId: "DZ", // Generic search that should work
                    warehouseId: warehouseId,
                    associate: associate,
                    includeChildren: true,
                    mode: "SEARCH",
                    locale: "pl-PL",
                    movingContainers: []
                };
                
                console.log('📡 Making automatic session capture request...');
                
                try {
                    const response = await fetch('https://dub.prod.item-visibility.returns.amazon.dev/api/getContainer', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(requestData)
                    });
                    
                    if (response.ok) {
                        console.log('✅ Session capture request successful');
                        this.update(warehouseId, associate);
                        return true;
                    } else {
                        console.log('⚠️ Session capture request failed with status:', response.status);
                        return false;
                    }
                } catch (error) {
                    console.log('❌ Session capture request error:', error.message);
                    return false;
                }
                
            } catch (error) {
                console.warn('❌ Error during automatic session capture:', error.message);
                return false;
            }
        },
        
        // Setup XHR interceptor for automatic session capture
        setupXHRInterceptor: function() {
            console.log('🔧 Setting up XHR interceptor for session capture');
            
            // Enhanced XHR interceptor for session management
            const originalXHRSend = XMLHttpRequest.prototype.send;
            
            XMLHttpRequest.prototype.send = function(data) {
                const xhr = this;
                
                if (this._url && this._url.includes('getContainer') && data) {
                    try {
                        // Capture session data from real API requests
                        const requestData = JSON.parse(data);
                        if (requestData.warehouseId && requestData.associate) {
                            // Only update if we get non-default values (allow script author for real API calls)
                            const isValidData = requestData.warehouseId !== 'CDPL1' && 
                                               requestData.associate !== 'System';
                            
                            if (isValidData) {
                                SessionManager.update(requestData.warehouseId, requestData.associate);
                                console.log(`🔐 Valid session data captured from real API: warehouseId=${requestData.warehouseId}, associate=${requestData.associate}`);
                            } else {
                                console.warn(`🚫 Skipped invalid session data: warehouseId=${requestData.warehouseId}, associate=${requestData.associate}`);
                            }
                        }
                        
                        // Store request headers for future use
                        try {
                            const headers = {};
                            // Note: We can't directly access request headers from XHR, but we can try to infer them
                            sessionStorage.setItem('lastRequestHeaders', JSON.stringify(headers));
                        } catch (e) {}
                        
                    } catch (e) {
                        console.warn('Could not parse request data for session capture:', e.message);
                    }
                }
                
                return originalXHRSend.call(this, data);
            };
            
            // Minimal XHR open interceptor
            const originalXHROpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function(method, url, ...args) {
                this._method = method;
                this._url = url;
                return originalXHROpen.call(this, method, url, ...args);
            };
        }
    };
    
    // ========================================================================
    // 2. CATEGORY MAPPER - Sortation category to destination mapping
    // ========================================================================
    
    /**
     * Category Mapper Module - Maps sortation categories to main destinations
     */
    const CategoryMapper = {
        
        // Category to Main Destination mapping
        destinationMap: {
        '6 - NON TECH TTA' : 'BTS2',
        '4 - FAST PROCESSING TTA': 'BTS2',
        'S&A FAST PROCESSING TTA': 'KTW1',
        'NON TECH TTA LCJ4' : 'LCJ4',
        'APPAREL SIDELINE': 'KTW1',
        '1 - TECH TTA SIDELINE': 'BTS2',
        '3 - S&A FAST PROCESSING SIDELINE': 'KTW1',
        'TECH TTA LCJ4 SIDELINE': 'LCJ4',
        'NON TECH TTA LCJ4 SIDELINE': 'LCJ4',
        '7 - HRV URGENT': 'BTS2',
        'SHOES URGENT': 'KTW1',
        'APPAREL URGENT': 'KTW1',
        '8 - BMVD URGENT': 'LCJ4',
        'URGENT LCJ4': 'LCJ4',

        //OLD
        '1 - TECH TTA' : 'BTS2',
        'Tech TTA LCJ4' : 'LCJ4'
        },
        
        // Get main destination for category
        getMainDestination: function(sortationCategory) {
            if (!sortationCategory || sortationCategory === 'N/A' || sortationCategory === 'Empty') {
                return 'Unknown';
            }
            
            // Handle multiple categories separated by commas
            const categories = sortationCategory.split(',').map(cat => cat.trim());
            const destinations = new Set();
            
            categories.forEach(category => {
                const destination = this.destinationMap[category] || 'Unknown';
                destinations.add(destination);
            });
            
            // If multiple destinations, join them
            return Array.from(destinations).sort().join(', ');
        }
    };
    
    // ========================================================================
    // 3. TODO: UPDATE CHECKER - Auto-update functionality (to be added)
    // ========================================================================
    
    // ========================================================================
    // 4. UI ENHANCEMENTS - Table modifications, menu options and interface elements
    // ========================================================================
    
    /**
     * UI Enhancement Module - Handles interface modifications and menu options
     */
    const UIEnhancements = {
        
        // Add Dashboard, PalletLand and Settings to footer menu
        addMenuOptions: function() {
            const footer = document.querySelector('.footer-container[data-testid="footer"]');
            if (!footer) {
                // Try again after a short delay if footer not found
                setTimeout(() => this.addMenuOptions(), 1000);
                return;
            }

            // Check if we already added our menu items
            if (footer.querySelector('[data-riv-menu-item]')) {
                return;
            }

            // Dashboard menu item
            const dashboardItem = document.createElement('a');
            dashboardItem.href = '#';
            dashboardItem.setAttribute('data-riv-menu-item', 'dashboard');
            dashboardItem.onclick = function(e) {
                e.preventDefault();
                Dashboard.show();
            };
            dashboardItem.innerHTML = `
                <div class="footer-item">
                    <span class="css-1ox0ukt">
                        <span aria-label="" role="img" aria-hidden="true" class="css-34iy07">
                            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor"/>
                            </svg>
                        </span>
                    </span>
                    <p class="css-1fz4hyd" mdn-text="">Dashboard</p>
                </div>
            `;

            // PalletLand menu item
            const palletlandItem = document.createElement('a');
            palletlandItem.href = '#';
            palletlandItem.setAttribute('data-riv-menu-item', 'palletland');
            palletlandItem.onclick = function(e) {
                e.preventDefault();
                PalletLand.show();
            };
            palletlandItem.innerHTML = `
                <div class="footer-item">
                    <span class="css-1ox0ukt">
                        <span aria-label="" role="img" aria-hidden="true" class="css-34iy07">
                            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                                <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z" fill="currentColor"/>
                            </svg>
                        </span>
                    </span>
                    <p class="css-1fz4hyd" mdn-text="">Palletland</p>
                </div>
            `;

            // Settings menu item
            const settingsItem = document.createElement('a');
            settingsItem.href = '#';
            settingsItem.setAttribute('data-riv-menu-item', 'settings');
            settingsItem.onclick = function(e) {
                e.preventDefault();
                SettingsManager.showModal();
            };
            settingsItem.innerHTML = `
                <div class="footer-item">
                    <span class="css-1ox0ukt">
                        <span aria-label="" role="img" aria-hidden="true" class="css-34iy07">
                            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                                <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z" fill="currentColor"/>
                            </svg>
                        </span>
                    </span>
                    <p class="css-1fz4hyd" mdn-text="">Settings</p>
                </div>
            `;

            // Add items to footer
            footer.appendChild(dashboardItem);
            footer.appendChild(palletlandItem);
            footer.appendChild(settingsItem);
            
            // Apply visibility settings
            this.updateMenuVisibility();
        },
        
        // Update menu visibility based on settings
        updateMenuVisibility: function() {
            const palletlandMenuItem = document.querySelector('[data-riv-menu-item="palletland"]');
            if (palletlandMenuItem) {
                const settings = SettingsManager.get();
                palletlandMenuItem.style.display = settings.showPalletLand ? 'block' : 'none';
            }
        },
        
        // Initialize UI enhancements
        init: function() {
            // Add menu options when DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.addMenuOptions());
            } else {
                this.addMenuOptions();
            }
            
            console.log('🎨 UI Enhancements initialized');
        }
    };
    
    // ========================================================================
    // 5. TODO: CSV EXPORT - Data collection and export functionality (to be added)
    // ========================================================================
    
    // ========================================================================
    // 6. DASHBOARD - Quick overview functionality
    // ========================================================================
    
    /**
     * Dashboard Module - Quick overview system for Drop Zone analysis
     */
    const Dashboard = {
        
        // Dashboard state
        isActive: false,
        data: [],
        
        // Show dashboard modal
        show: function() {
            console.log('🔥 DEBUG: Dashboard.show() called - This should open Dashboard modal');
            if (this.isActive) return; // Already showing dashboard
            
            this.isActive = true;
            
            // Create modal overlay instead of replacing page content
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                z-index: 999999;
                overflow-y: auto;
                padding: 20px;
            `;
            
            // Create dashboard content container
            const dashboardContainer = document.createElement('div');
            dashboardContainer.id = 'dashboard-app';
            dashboardContainer.style.cssText = `
                min-height: calc(100vh - 40px);
                max-width: 1400px;
                margin: 0 auto;
                background: #f8f9fa;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            `;
            
            dashboardContainer.innerHTML = `
                    <!-- Dashboard Header -->
                    <header style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 20px 30px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: center; max-width: 1400px; margin: 0 auto;">
                            <div>
                                <h1 style="margin: 0; font-size: 28px; font-weight: 600;">📊 Dashboard (Quick Overview)</h1>
                                <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Quick Drop Zone Overview System</p>
                            </div>
                            <button id="close-dashboard" style="
                                background: rgba(255,255,255,0.2);
                                border: 1px solid rgba(255,255,255,0.3);
                                color: white;
                                padding: 10px 20px;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 14px;
                                transition: all 0.3s ease;
                            " onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
                               onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                                ← Back to RIV
                            </button>
                        </div>
                    </header>

                    <!-- Dashboard Content -->
                    <main style="max-width: 1400px; margin: 0 auto; padding: 30px;">
                        <!-- Control Panel -->
                        <div style="background: white; border-radius: 12px; padding: 25px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <div style="display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap;">
                                <button id="refresh-dashboard" style="
                                    background: #28a745;
                                    color: white;
                                    border: none;
                                    padding: 12px 24px;
                                    border-radius: 6px;
                                    cursor: pointer;
                                    font-size: 14px;
                                    font-weight: 500;
                                    transition: all 0.3s ease;
                                    box-shadow: 0 2px 4px rgba(40,167,69,0.3);
                                ">🔄 Refresh</button>
                                
                                <button id="deep-scan-dashboard" style="
                                    background: #17a2b8;
                                    color: white;
                                    border: none;
                                    padding: 12px 24px;
                                    border-radius: 6px;
                                    cursor: pointer;
                                    font-size: 14px;
                                    font-weight: 500;
                                    transition: all 0.3s ease;
                                    box-shadow: 0 2px 4px rgba(23,162,184,0.3);
                                    margin-left: 10px;
                                ">🔍 Full Scan</button>
                                
                                <button id="export-dashboard" disabled style="
                                    background: #6c757d;
                                    color: white;
                                    border: none;
                                    padding: 12px 24px;
                                    border-radius: 6px;
                                    cursor: pointer;
                                    font-size: 14px;
                                    font-weight: 500;
                                    transition: all 0.3s ease;
                                    opacity: 0.6;
                                ">📊 Export CSV</button>
                                
                                <div style="flex: 1;"></div>
                                
                                <div style="
                                    display: flex;
                                    align-items: center;
                                    gap: 10px;
                                    padding: 8px 16px;
                                    background: #f8f9fa;
                                    border-radius: 6px;
                                    font-size: 13px;
                                    color: #666;
                                ">
                                    <span>🕒</span>
                                    <span id="last-scan-time">Loading...</span>
                                </div>
                            </div>
                            
                            <div id="scan-progress" style="display: none; background: #f8f9fa; padding: 20px; border-radius: 8px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                    <span id="progress-text" style="font-weight: 500; color: #495057;">Scanning Drop Zones...</span>
                                    <span id="progress-percentage" style="font-weight: 600; color: #28a745;">0%</span>
                                </div>
                                <div style="background: #dee2e6; height: 10px; border-radius: 5px; overflow: hidden;">
                                    <div id="progress-bar" style="background: linear-gradient(90deg, #28a745, #20c997); height: 100%; width: 0%; transition: width 0.3s ease; border-radius: 5px;"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Dashboard Content Area -->
                        <div id="dashboard-content">
                            <div style="
                                text-align: center;
                                padding: 80px 20px;
                                background: white;
                                border-radius: 12px;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                            ">
                                <div style="font-size: 48px; margin-bottom: 20px; opacity: 0.3;">📊</div>
                                <h3 style="color: #495057; margin-bottom: 10px; font-weight: 500;">Loading Dashboard Data...</h3>
                                <p style="color: #6c757d; margin-bottom: 30px;">Fetching Drop Zone overview automatically</p>
                            </div>
                        </div>
                    </main>
            `;
            
            overlay.appendChild(dashboardContainer);
            document.body.appendChild(overlay);

            // Add CSS for hover effects
            const style = document.createElement('style');
            style.textContent = `
                #refresh-dashboard:hover { background: #218838 !important; transform: translateY(-1px); }
                #deep-scan-dashboard:hover { background: #138496 !important; transform: translateY(-1px); }
                #export-dashboard:not(:disabled):hover { background: #545b62 !important; transform: translateY(-1px); opacity: 1 !important; }
                #close-dashboard:hover { background: rgba(255,255,255,0.3) !important; }
            `;
            document.head.appendChild(style);

            // Event listeners
            document.getElementById('close-dashboard').onclick = () => this.close(overlay);
            document.getElementById('refresh-dashboard').onclick = () => this.startScan(false); // Surface scan
            document.getElementById('deep-scan-dashboard').onclick = () => this.startScan(true); // Deep scan
            document.getElementById('export-dashboard').onclick = () => this.exportData();
            
            // Close on overlay click
            overlay.onclick = (e) => {
                if (e.target === overlay) this.close(overlay);
            };
            
            // Auto-start scan when dashboard opens
            setTimeout(() => {
                this.startScan();
            }, 2000); // Delay to allow session capture
        },
        
        // Close dashboard
        close: function(overlay) {
            if (!this.isActive) return;
            
            this.isActive = false;
            
            // Remove modal overlay
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        },
        
        // Generate Dashboard destinations based on user configuration
        generateDestinations: function() {
            const destinations = [];
            const settings = SettingsManager.get();
            
            // Process each enabled dashboard segment with its full prefix
            settings.dashboardSegments.forEach(segmentConfig => {
                if (segmentConfig.enabled && segmentConfig.prefix && segmentConfig.prefix.trim()) {
                    for (let i = segmentConfig.from; i <= segmentConfig.to; i++) {
                        const dzNumber = i.toString().padStart(2, '0');
                        destinations.push(`${segmentConfig.prefix}${dzNumber}`);
                    }
                }
            });
            
            // Add custom dashboard destinations
            if (settings.dashboardCustomDestinations) {
                const customDests = settings.dashboardCustomDestinations
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0);
                
                destinations.push(...customDests);
            }
            
            return destinations;
        },
        
        // Start dashboard scan
        startScan: async function(deepScan = false) {
            console.log(`🔥 DEBUG: Dashboard.startScan() called - scanning Dashboard destinations (${deepScan ? 'deep' : 'surface'} scan)`);
            this.data = [];
            const progressDiv = document.getElementById('scan-progress');
            const progressBar = document.getElementById('progress-bar');
            const progressText = document.getElementById('progress-text');
            const progressPercentage = document.getElementById('progress-percentage');
            const refreshBtn = document.getElementById('refresh-dashboard');
            const deepScanBtn = document.getElementById('deep-scan-dashboard');
            const exportBtn = document.getElementById('export-dashboard');
            
            const sessionData = SessionManager.get();
            
            // Check session data first
            if (!sessionData.warehouseId || !sessionData.associate || 
                sessionData.warehouseId === 'CDPL1' || sessionData.associate === 'System') {
                
                // Show session data error without starting scan
                const dashboardContent = document.getElementById('dashboard-content');
                if (dashboardContent) {
                    dashboardContent.innerHTML = `
                        <div style="
                            background: white;
                            border-radius: 12px;
                            padding: 40px;
                            text-align: center;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                            border: 2px solid #ffc107;
                        ">
                            <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
                            <h3 style="color: #856404; margin-bottom: 15px; font-weight: 600;">Brak danych sesji</h3>
                            <p style="color: #666; margin-bottom: 20px; line-height: 1.5;">
                                Aby Dashboard mógł działać poprawnie, należy najpierw:
                            </p>
                            <div style="
                                background: #fff3cd;
                                border: 1px solid #ffeaa7;
                                border-radius: 8px;
                                padding: 20px;
                                margin: 20px 0;
                                text-align: left;
                            ">
                                <h4 style="color: #856404; margin: 0 0 10px 0;">🔍 Instrukcja:</h4>
                                <ol style="color: #856404; margin: 0; padding-left: 20px;">
                                    <li>Wróć do głównej strony RIV</li>
                                    <li>Wyszukaj dowolną Drop Zone z towarem</li>
                                    <li>Poczekaj na załadowanie wyników</li>
                                    <li>Wróć do Dashboard i spróbuj ponownie</li>
                                </ol>
                            </div>
                            <p style="color: #6c757d; font-size: 13px; margin-top: 15px;">
                                Dashboard potrzebuje aktywnych danych sesji aby wykonywać zapytania do systemu.
                            </p>
                        </div>
                    `;
                }
                
                console.log('❌ Dashboard scan aborted - invalid session data');
                return;
            }
            
            // Show progress and disable buttons
            progressDiv.style.display = 'block';
            refreshBtn.disabled = true;
            exportBtn.disabled = true;
            
            // Show scanning type message
            if (deepScan) {
                progressText.textContent = 'Starting Dashboard full scan - accurate unit counting...';
            } else {
                progressText.textContent = 'Starting Dashboard surface scan - pallets only (no units)...';
            }
            progressPercentage.textContent = 'Starting';
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Generate drop zone list based on configuration
            const dropZones = this.generateDestinations();
            
            if (dropZones.length === 0) {
                progressText.textContent = 'No destinations configured. Please check Dashboard settings.';
                progressPercentage.textContent = 'Error';
                refreshBtn.disabled = false;
                deepScanBtn.disabled = false;
                exportBtn.disabled = false;
                return;
            }
            
            console.log(`Dashboard will scan ${dropZones.length} destinations:`, dropZones);
            
            const totalZones = dropZones.length;
            let completedZones = 0;
            
            // Process zones in batches (optimized for deep scanning)
            const batchSize = 2; // Smaller batches for deep scanning accuracy
            const batches = [];
            
            for (let i = 0; i < dropZones.length; i += batchSize) {
                batches.push(dropZones.slice(i, i + batchSize));
            }
            
            for (const batch of batches) {
                const batchPromises = batch.map(async (dropZoneId) => {
                    try {
                        progressText.textContent = `Scanning ${dropZoneId}...`;
                        
                        // First do a search to get proper data structure
                        const searchDetails = await this.performContainerSearch(dropZoneId);
                        
                        let totalPallets = 0;
                        let totalUnits = 0;
                        let sortationCategory = 'N/A';
                        let status = 'Empty';
                        
                        if (searchDetails && searchDetails.childContainers && searchDetails.childContainers.length > 0) {
                            status = 'Active';
                            totalPallets = searchDetails.childContainers.length;
                            
                            // Collect all unique sortation categories from all pallets
                            const allCategories = new Set();
                            
                            for (const pallet of searchDetails.childContainers) {
                                // Check for sortationCategories array
                                if (pallet.sortationCategories && Array.isArray(pallet.sortationCategories)) {
                                    pallet.sortationCategories.forEach(cat => {
                                        if (cat && cat !== 'N/A' && cat !== 'Empty') {
                                            allCategories.add(cat);
                                        }
                                    });
                                } else if (pallet.sortationCategory && pallet.sortationCategory !== 'N/A' && pallet.sortationCategory !== 'Empty') {
                                    allCategories.add(pallet.sortationCategory);
                                }
                            }
                            
                            // Join all categories with separator
                            sortationCategory = allCategories.size > 0 ? Array.from(allCategories).sort().join(', ') : 'N/A';
                            
                            if (deepScan) {
                                // Deep scan: Get actual units from each pallet
                                progressText.textContent = `Full scanning ${dropZoneId} - ${totalPallets} pallets...`;
                                
                                for (const pallet of searchDetails.childContainers) {
                                    try {
                                        // Get detailed contents of this pallet
                                        const palletDetails = await this.performContainerSearch(pallet.containerId);
                                        
                                        if (palletDetails && palletDetails.childContainers && Array.isArray(palletDetails.childContainers)) {
                                            // Count units in this pallet
                                            const palletUnits = palletDetails.childContainers.reduce((sum, tote) => {
                                                return sum + (tote.numOfChildContainers || 0);
                                            }, 0);
                                            
                                            totalUnits += palletUnits;
                                            
                                            console.log(`📦 ${dropZoneId} > ${pallet.containerId}: ${palletDetails.childContainers.length} totes, ${palletUnits} units`);
                                        } else {
                                            // Fallback: use numOfChildContainers from parent data
                                            totalUnits += (pallet.numOfChildContainers || 0);
                                        }
                                    } catch (palletError) {
                                        console.warn(`⚠️ Error scanning pallet ${pallet.containerId}:`, palletError.message);
                                        // Fallback: use numOfChildContainers from parent data
                                        totalUnits += (pallet.numOfChildContainers || 0);
                                    }
                                }
                            } else {
                                // Surface scan: Don't count units to avoid misleading data
                                totalUnits = 0; // Not counted in surface scan
                                
                                console.log(`📄 ${dropZoneId} surface scan: ${totalPallets} pallets (units not counted)`);
                            }
                            
                            console.log(`🏁 ${dropZoneId} summary: ${totalPallets} pallets${deepScan ? `, ${totalUnits} accurate units` : ' (units not scanned)'}`);
                        }
                        
                        return {
                            dropZoneId,
                            totalPallets,
                            totalUnits,
                            sortationCategory,
                            status,
                            lastUpdated: new Date().toLocaleString('pl-PL')
                        };
                        
                    } catch (error) {
                        // HTTP 400 usually means the drop zone is empty or doesn't exist
                        if (error.message.includes('HTTP 400')) {
                            console.log(`🚧 ${dropZoneId}: Empty or non-existent (HTTP 400) - marking as Empty`);
                            return {
                                dropZoneId,
                                totalPallets: 0,
                                totalUnits: 0,
                                sortationCategory: 'Empty',
                                status: 'Empty',
                                lastUpdated: new Date().toLocaleString('pl-PL')
                            };
                        } else {
                            console.warn(`❌ Error scanning ${dropZoneId}:`, error.message);
                            return {
                                dropZoneId,
                                totalPallets: 0,
                                totalUnits: 0,
                                sortationCategory: 'Error',
                                status: 'Error',
                                lastUpdated: new Date().toLocaleString('pl-PL')
                            };
                        }
                    }
                });
                
                // Wait for batch to complete
                const batchResults = await Promise.all(batchPromises);
                this.data.push(...batchResults);
                
                completedZones += batch.length;
                const percentage = Math.round((completedZones / totalZones) * 100);
                
                progressBar.style.width = `${percentage}%`;
                progressPercentage.textContent = `${percentage}%`;
                progressText.textContent = `Scanned ${completedZones}/${totalZones} zones`;
                
                // Update dashboard display with current data
                this.updateDisplay();
            }
            
            // Hide progress and enable buttons
            progressDiv.style.display = 'none';
            refreshBtn.disabled = false;
            deepScanBtn.disabled = false;
            exportBtn.disabled = false;
            exportBtn.style.opacity = '1';
            
            // Update last scan time
            const lastScanElement = document.getElementById('last-scan-time');
            if (lastScanElement) {
                lastScanElement.textContent = `Last scan: ${new Date().toLocaleString('pl-PL')}`;
            }
            
            console.log('Dashboard scan complete:', this.data);
        },
        
        // Search function for Dashboard (using Core API)
        performContainerSearch: async function(containerId, silent = false) {
            try {
                // Use the enhanced search from Core module
                return await Core.performContainerSearch(containerId, silent);
            } catch (error) {
                if (!silent) {
                    console.error(`❌ Dashboard search error for ${containerId}:`, error.message);
                }
                throw error;
            }
        },
        
        // Update dashboard display
        updateDisplay: function() {
            const contentDiv = document.getElementById('dashboard-content');
            if (!contentDiv || this.data.length === 0) return;
            
            // Calculate summary stats
            const totalZones = this.data.length;
            const activeZones = this.data.filter(dz => dz.status === 'Active').length;
            const emptyZones = this.data.filter(dz => dz.status === 'Empty').length;
            const errorZones = this.data.filter(dz => dz.status === 'Error').length;
            const totalPalletsAll = this.data.reduce((sum, dz) => sum + dz.totalPallets, 0);
            const totalUnitsAll = this.data.reduce((sum, dz) => sum + dz.totalUnits, 0);
            
            // Group by main destinations and sortation category
            const destinationStats = {};
            const sortationStats = {};
            
            this.data.forEach(dz => {
                if (dz.status === 'Active') {
                    // Count sortation categories - handle multiple categories separated by commas
                    const sortCat = dz.sortationCategory;
                    if (sortCat && sortCat !== 'N/A' && sortCat !== 'Empty') {
                        // Split by comma and process each category separately
                        const categories = sortCat.split(',').map(cat => cat.trim()).filter(cat => cat && cat !== 'N/A' && cat !== 'Empty');
                        
                        categories.forEach(category => {
                            if (!sortationStats[category]) {
                                sortationStats[category] = { zones: 0, pallets: 0, units: 0 };
                            }
                            // For multiple categories in one zone, count fractional contribution
                            const contribution = 1 / categories.length;
                            sortationStats[category].zones += contribution;
                            sortationStats[category].pallets += Math.round(dz.totalPallets * contribution);
                            sortationStats[category].units += Math.round(dz.totalUnits * contribution);
                            
                            // Group by main destination
                            const mainDestination = CategoryMapper.getMainDestination(category);
                            if (!destinationStats[mainDestination]) {
                                destinationStats[mainDestination] = { 
                                    zones: 0, 
                                    pallets: 0, 
                                    units: 0, 
                                    categories: new Set(),
                                    categoryDetails: {} // Track per-category stats
                                };
                            }
                            
                            // Add to category details
                            if (!destinationStats[mainDestination].categoryDetails[category]) {
                                destinationStats[mainDestination].categoryDetails[category] = {
                                    zones: 0,
                                    pallets: 0,
                                    units: 0,
                                    locations: {} // Track per-location data
                                };
                            }
                            
                            // Add location data
                            if (!destinationStats[mainDestination].categoryDetails[category].locations[dz.dropZoneId]) {
                                destinationStats[mainDestination].categoryDetails[category].locations[dz.dropZoneId] = {
                                    pallets: 0,
                                    units: 0
                                };
                            }
                            
                            const palletContribution = Math.round(dz.totalPallets * contribution);
                            const unitContribution = Math.round(dz.totalUnits * contribution);
                            
                            destinationStats[mainDestination].zones += contribution;
                            destinationStats[mainDestination].pallets += palletContribution;
                            destinationStats[mainDestination].units += unitContribution;
                            destinationStats[mainDestination].categories.add(category);
                            
                            destinationStats[mainDestination].categoryDetails[category].zones += contribution;
                            destinationStats[mainDestination].categoryDetails[category].pallets += palletContribution;
                            destinationStats[mainDestination].categoryDetails[category].units += unitContribution;
                            
                            // Update location-specific data
                            destinationStats[mainDestination].categoryDetails[category].locations[dz.dropZoneId].pallets += palletContribution;
                            destinationStats[mainDestination].categoryDetails[category].locations[dz.dropZoneId].units += unitContribution;
                        });
                    }
                }
            });
            
            contentDiv.innerHTML = `
                <!-- Summary Statistics -->
                <div style="background: white; border-radius: 12px; padding: 25px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h3 style="margin: 0 0 20px 0; color: #333;">📊 Summary Statistics</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin-bottom: 25px;">
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #28a745;">${activeZones}</div>
                            <div style="font-size: 14px; color: #666;">Active Zones</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #6c757d;">${emptyZones}</div>
                            <div style="font-size: 14px; color: #666;">Empty Zones</div>
                        </div>
                        ${errorZones > 0 ? `
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #dc3545;">${errorZones}</div>
                            <div style="font-size: 14px; color: #666;">Error Zones</div>
                        </div>
                        ` : ''}
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #17a2b8;">${totalPalletsAll}</div>
                            <div style="font-size: 14px; color: #666;">Total Pallets</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #fd7e14;">${totalUnitsAll}</div>
                            <div style="font-size: 14px; color: #666;">Total Units</div>
                        </div>
                    </div>
                    
                </div>
                
                <!-- Main Destinations -->
                ${Object.keys(destinationStats).length > 0 ? `
                <div style="background: white; border-radius: 12px; padding: 25px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h3 style="margin: 0 0 20px 0; color: #333;">🎯 Main Destinations</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
                        ${Object.keys(destinationStats).sort().map(destination => {
                            const stats = destinationStats[destination];
                            const categoryCount = stats.categories.size;
                            const colors = {
                                'BTS2': '#007bff',
                                'KTW1': '#28a745', 
                                'LCJ4': '#ffc107',
                                'WRO1': '#6f42c1',
                                'Unknown': '#6c757d'
                            };
                            const color = colors[destination] || '#6c757d';
                            
                            return `
                            <div style="padding: 20px; background: linear-gradient(135deg, ${color}15, ${color}08); border-radius: 12px; border-left: 4px solid ${color}; position: relative;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                    <div style="font-weight: bold; color: ${color}; font-size: 18px;">${destination}</div>
                                    <div style="background: ${color}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">${categoryCount} categories</div>
                                </div>
                                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 10px;">
                                    <div style="text-align: center;">
                                        <div style="font-size: 20px; font-weight: bold; color: ${color};">${Math.round(stats.zones)}</div>
                                        <div style="font-size: 11px; color: #666;">Zones</div>
                                    </div>
                                    <div style="text-align: center;">
                                        <div style="font-size: 20px; font-weight: bold; color: ${color};">${stats.pallets}</div>
                                        <div style="font-size: 11px; color: #666;">Pallets</div>
                                    </div>
                                    <div style="text-align: center;">
                                        <div style="font-size: 20px; font-weight: bold; color: ${color};">${stats.units}</div>
                                        <div style="font-size: 11px; color: #666;">Units</div>
                                    </div>
                                </div>
                                <!-- Location-Category-Pallets table -->
                                ${stats.categoryDetails && Object.keys(stats.categoryDetails).length > 0 ? `
                                <div style="margin-top: 12px;">
                                    <div style="font-size: 12px; font-weight: bold; color: #495057; margin-bottom: 8px;">Location Details:</div>
                                    <div style="max-height: 150px; overflow-y: auto; border: 1px solid #e0e0e0; border-radius: 6px;">
                                        <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px; padding: 6px 8px; background: #f8f9fa; font-size: 10px; font-weight: bold; color: #495057; border-bottom: 1px solid #e0e0e0;">
                                            <div>Location</div>
                                            <div>Category</div>
                                            <div style="text-align: center;">Pallets</div>
                                        </div>
                                        ${Object.entries(stats.categoryDetails).map(([category, details]) => 
                                            Object.entries(details.locations || {}).map(([location, data]) => `
                                                <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px; padding: 4px 8px; font-size: 9px; border-bottom: 1px solid #f0f0f0;">
                                                    <div style="color: #6c757d; overflow: hidden; text-overflow: ellipsis;">${location}</div>
                                                    <div style="color: #495057; overflow: hidden; text-overflow: ellipsis;">${category}</div>
                                                    <div style="text-align: center; font-weight: bold; color: ${color};">${data.pallets || 0}</div>
                                                </div>
                                            `).join('')
                                        ).join('')}
                                    </div>
                                </div>
                                ` : `
                                <div style="font-size: 11px; color: #888; line-height: 1.3;">
                                    Categories: ${Array.from(stats.categories).slice(0, 2).join(', ')}${stats.categories.size > 2 ? ` +${stats.categories.size - 2} more` : ''}
                                </div>
                                `}
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                ` : ''}
                
                <!-- Sortation Categories -->
                ${Object.keys(sortationStats).length > 0 ? `
                <div style="background: white; border-radius: 12px; padding: 25px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h3 style="margin: 0 0 20px 0; color: #333;">🏷️ Sortation Categories</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                        ${Object.keys(sortationStats).sort().map(category => `
                            <div style="padding: 15px; background: #f1f3f4; border-radius: 8px; border-left: 4px solid #007bff;">
                                <div style="font-weight: bold; color: #495057; margin-bottom: 8px; font-size: 14px;">${category}</div>
                                <div style="font-size: 12px; color: #6c757d;">Zones: <strong>${Math.round(sortationStats[category].zones)}</strong></div>
                                <div style="font-size: 12px; color: #6c757d;">Pallets: <strong>${sortationStats[category].pallets}</strong></div>
                                <div style="font-size: 12px; color: #6c757d;">Units: <strong>${sortationStats[category].units}</strong></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <!-- Detailed Zone List -->
                <div style="background: white; border-radius: 12px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h3 style="margin: 0 0 20px 0; color: #333;">📋 Zone Details</h3>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                            <thead>
                                <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                                    <th style="text-align: left; padding: 12px; font-weight: 600; color: #495057;">Drop Zone</th>
                                    <th style="text-align: center; padding: 12px; font-weight: 600; color: #495057;">Status</th>
                                    <th style="text-align: center; padding: 12px; font-weight: 600; color: #495057;">Pallets</th>
                                    <th style="text-align: center; padding: 12px; font-weight: 600; color: #495057;">Units</th>
                                    <th style="text-align: left; padding: 12px; font-weight: 600; color: #495057;">Categories</th>
                                    <th style="text-align: center; padding: 12px; font-weight: 600; color: #495057;">Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.data.map(dz => {
                                    const statusColors = {
                                        'Active': '#28a745',
                                        'Empty': '#6c757d', 
                                        'Error': '#dc3545'
                                    };
                                    const color = statusColors[dz.status] || '#6c757d';
                                    
                                    return `
                                    <tr style="border-bottom: 1px solid #dee2e6;">
                                        <td style="padding: 10px; font-weight: 500; color: #495057;">${dz.dropZoneId}</td>
                                        <td style="padding: 10px; text-align: center;">
                                            <span style="background: ${color}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">
                                                ${dz.status}
                                            </span>
                                        </td>
                                        <td style="padding: 10px; text-align: center; font-weight: bold; color: #17a2b8;">${dz.totalPallets}</td>
                                        <td style="padding: 10px; text-align: center; font-weight: bold; color: #fd7e14;">${dz.totalUnits}</td>
                                        <td style="padding: 10px; color: #6c757d; max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${dz.sortationCategory}</td>
                                        <td style="padding: 10px; text-align: center; font-size: 11px; color: #6c757d;">${dz.lastUpdated}</td>
                                    </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        },
        
        // Export dashboard data to CSV
        exportData: function() {
            if (this.data.length === 0) {
                alert('No data to export. Please run a scan first.');
                return;
            }
            
            // Prepare CSV data
            const csvData = this.data.map(dz => ({
                'Drop Zone ID': dz.dropZoneId,
                'Status': dz.status,
                'Total Pallets': dz.totalPallets,
                'Total Units': dz.totalUnits,
                'Sortation Category': dz.sortationCategory,
                'Last Updated': dz.lastUpdated
            }));
            
            const settings = SettingsManager.get();
            const timestamp = settings.includeTimestamp ? 
                new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) : '';
            const filename = settings.includeTimestamp ? 
                `${settings.filenamePrefix}_dashboard_${timestamp}.csv` : 
                `${settings.filenamePrefix}_dashboard.csv`;
            
            // Simple CSV conversion
            if (csvData.length === 0) return '';
            
            const headers = Object.keys(csvData[0]);
            const csvContent = [
                headers.join(','),
                ...csvData.map(row => 
                    headers.map(header => {
                        const value = row[header];
                        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                            return `"${value.replace(/"/g, '""')}"`;
                        }
                        return value;
                    }).join(',')
                )
            ].join('\n');
            
            // Download CSV
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            
            console.log('Dashboard data exported:', csvData.length, 'records');
        }
    };
    
    // === PALLETLAND MODULE ===
    const PalletLand = {
        data: [],
        isActive: false,
        
        // Generate destinations based on configuration
        generateDestinations: function() {
            const destinations = [];
            
            // Process each enabled segment with its full prefix
            SettingsManager.settings.palletlandSegments.forEach(segmentConfig => {
                if (segmentConfig.enabled && segmentConfig.prefix && segmentConfig.prefix.trim()) {
                    for (let i = segmentConfig.from; i <= segmentConfig.to; i++) {
                        const dzNumber = i.toString().padStart(2, '0');
                        destinations.push(`${segmentConfig.prefix}${dzNumber}`);
                    }
                }
            });
            
            // Add custom destinations
            if (SettingsManager.settings.palletlandCustomDestinations) {
                const customDests = SettingsManager.settings.palletlandCustomDestinations
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0);
                
                destinations.push(...customDests);
            }
            
            return destinations;
        },
        
        // Show PalletLand modal
        show: function() {
            console.log('🔥 DEBUG: PalletLand.show() called - opening PalletLand modal');
            if (this.isActive) return; // Already showing a modal
            
            this.isActive = true;
            
            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                z-index: 999999;
                overflow-y: auto;
                padding: 20px;
            `;
            
            // Create palletland content container
            const palletlandContainer = document.createElement('div');
            palletlandContainer.id = 'palletland-app';
            palletlandContainer.style.cssText = `
                min-height: calc(100vh - 40px);
                max-width: 1400px;
                margin: 0 auto;
                background: #f8f9fa;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            `;
            
            palletlandContainer.innerHTML = `
                    <!-- PalletLand Header -->
                    <header style="
                        background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
                        color: white;
                        padding: 20px 30px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: center; max-width: 1400px; margin: 0 auto;">
                            <div>
                                <h1 style="margin: 0; font-size: 28px; font-weight: 600;">🎯 Palletland (Full Analysis)</h1>
                                <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Comprehensive Drop Zone Analysis System</p>
                            </div>
                            <button id="close-palletland" style="
                                background: rgba(255,255,255,0.2);
                                border: 1px solid rgba(255,255,255,0.3);
                                color: white;
                                padding: 10px 20px;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 14px;
                                transition: all 0.3s ease;
                            " onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
                               onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                                ← Back to RIV
                            </button>
                        </div>
                    </header>

                    <!-- PalletLand Content -->
                    <main style="max-width: 1400px; margin: 0 auto; padding: 20px;">
                        <!-- Control Panel -->
                        <div style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
                            <div style="display: flex; gap: 12px; margin-bottom: 15px; flex-wrap: wrap;">
                                <button id="refresh-palletland" style="
                                    background: #6f42c1;
                                    color: white;
                                    border: none;
                                    padding: 10px 20px;
                                    border-radius: 6px;
                                    cursor: pointer;
                                    font-size: 14px;
                                    font-weight: 500;
                                    transition: all 0.3s ease;
                                    box-shadow: 0 2px 4px rgba(111,66,193,0.3);
                                " onmouseover="this.style.background='#5a31a1'" onmouseout="this.style.background='#6f42c1'">🔄 Refresh</button>
                                
                                <button id="export-palletland" disabled style="
                                    background: #6c757d;
                                    color: white;
                                    border: none;
                                    padding: 10px 20px;
                                    border-radius: 6px;
                                    cursor: pointer;
                                    font-size: 14px;
                                    font-weight: 500;
                                    transition: all 0.3s ease;
                                    opacity: 0.7;
                                " onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='0.7'">📊 Export CSV</button>
                                
                                <div style="
                                    margin-left: auto;
                                    display: flex;
                                    align-items: center;
                                    gap: 15px;
                                    font-size: 13px;
                                    color: #666;
                                ">
                                    <span>🕒</span>
                                    <span id="palletland-last-scan-time">Loading...</span>
                                </div>
                            </div>
                            
                            <div id="palletland-scan-progress" style="display: none; background: #f8f9fa; padding: 15px; border-radius: 6px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                    <span id="palletland-progress-text" style="font-weight: 500; color: #495057;">Scanning Drop Zones...</span>
                                    <span id="palletland-progress-percentage" style="color: #6c757d; font-size: 14px;">0%</span>
                                </div>
                                <div style="background: #dee2e6; height: 6px; border-radius: 3px; overflow: hidden;">
                                    <div id="palletland-progress-bar" style="background: linear-gradient(90deg, #6f42c1, #764ba2); height: 100%; width: 0%; transition: width 0.3s ease;"></div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- PalletLand Content Area -->
                        <div id="palletland-content">
                            <div style="
                                text-align: center;
                                padding: 50px 20px;
                                background: white;
                                border-radius: 8px;
                                box-shadow: 0 2px 6px rgba(0,0,0,0.08);
                            ">
                                <div style="font-size: 40px; margin-bottom: 15px; opacity: 0.3;">🎯</div>
                                <h3 style="color: #495057; margin-bottom: 8px; font-weight: 500;">Loading Palletland Data...</h3>
                                <p style="color: #6c757d; margin-bottom: 20px;">Ready for Analysis</p>
                            </div>
                        </div>
                    </main>
            `;
            
            overlay.appendChild(palletlandContainer);
            document.body.appendChild(overlay);
            
            // Set up event handlers
            document.getElementById('close-palletland').onclick = () => this.close(overlay);
            document.getElementById('refresh-palletland').onclick = () => this.startScan();
            document.getElementById('export-palletland').onclick = () => this.exportData();
            
            // Close on overlay click
            overlay.onclick = (e) => {
                if (e.target === overlay) this.close(overlay);
            };
            
            // Auto-start scan when palletland opens
            setTimeout(() => this.startScan(), 500);
        },
        
        // Close PalletLand modal
        close: function(overlay) {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            this.isActive = false;
        },
        
        // Start comprehensive zone scan
        startScan: async function() {
            console.log('🔥 DEBUG: PalletLand.startScan() called - starting comprehensive scan');
            this.data = [];
            const progressDiv = document.getElementById('palletland-scan-progress');
            const progressBar = document.getElementById('palletland-progress-bar');
            const progressText = document.getElementById('palletland-progress-text');
            const progressPercentage = document.getElementById('palletland-progress-percentage');
            const refreshBtn = document.getElementById('refresh-palletland');
            const exportBtn = document.getElementById('export-palletland');
            
            // Check session data first
            const sessionData = SessionManager.get();
            if (!sessionData.warehouseId || !sessionData.associate || 
                sessionData.warehouseId === 'CDPL1' || sessionData.associate === 'System') {
                
                // Show session data error
                const palletlandContent = document.getElementById('palletland-content');
                if (palletlandContent) {
                    palletlandContent.innerHTML = `
                        <div style="
                            background: white;
                            border-radius: 12px;
                            padding: 40px;
                            text-align: center;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                            border: 2px solid #6f42c1;
                        ">
                            <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
                            <h3 style="color: #5a31a1; margin-bottom: 15px; font-weight: 600;">Brak danych sesji</h3>
                            <p style="color: #666; margin-bottom: 20px; line-height: 1.5;">
                                Aby PalletLand mógł działać poprawnie, należy najpierw:
                            </p>
                            <div style="
                                background: #f8f4ff;
                                border: 1px solid #d4b9ff;
                                border-radius: 8px;
                                padding: 20px;
                                margin: 20px 0;
                                text-align: left;
                            ">
                                <h4 style="color: #5a31a1; margin: 0 0 10px 0;">🔍 Instrukcja:</h4>
                                <ol style="color: #5a31a1; margin: 0; padding-left: 20px;">
                                    <li>Wróć do głównej strony RIV</li>
                                    <li>Wyszukaj dowolną Drop Zone z towarem</li>
                                    <li>Poczekaj na załadowanie wyników</li>
                                    <li>Wróć do PalletLand i spróbuj ponownie</li>
                                </ol>
                            </div>
                            <p style="color: #6c757d; font-size: 13px; margin-top: 15px;">
                                PalletLand potrzebuje aktywnych danych sesji aby wykonywać zapytania do systemu.
                            </p>
                        </div>
                    `;
                }
                
                console.log('❌ PalletLand scan aborted - invalid session data');
                return;
            }
            
            // Show progress and disable buttons
            progressDiv.style.display = 'block';
            refreshBtn.disabled = true;
            exportBtn.disabled = true;
            
            // Generate drop zone list
            const dropZones = this.generateDestinations();
            console.log('Generated PalletLand destinations:', dropZones);
            
            if (dropZones.length === 0) {
                alert('No drop zones configured. Please check your PalletLand settings.');
                progressDiv.style.display = 'none';
                refreshBtn.disabled = false;
                exportBtn.disabled = false;
                return;
            }
            
            // Show scanning status
            progressText.textContent = 'Starting PalletLand full scan - accurate unit counting...';
            progressPercentage.textContent = 'Starting';
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const totalZones = dropZones.length;
            let completedZones = 0;
            
            // Process zones in smaller batches for deep scanning accuracy
            const BATCH_SIZE = 2;
            
            for (let i = 0; i < dropZones.length; i += BATCH_SIZE) {
                const batch = dropZones.slice(i, i + BATCH_SIZE);
                const batchPromises = batch.map(async (dropZoneId) => {
                    try {
                        progressText.textContent = `Scanning ${dropZoneId}...`;
                        
                        // Use Core API for searching
                        const searchDetails = await Core.performContainerSearch(dropZoneId, true);
                        
                        let totalPallets = 0;
                        let totalUnits = 0;
                        let sortationCategory = 'N/A';
                        let status = 'Empty';
                        
                        if (searchDetails && searchDetails.childContainers && searchDetails.childContainers.length > 0) {
                            status = 'Active';
                            totalPallets = searchDetails.childContainers.length;
                            
                            // Collect all unique sortation categories from all pallets
                            const allCategories = new Set();
                            
                            for (const pallet of searchDetails.childContainers) {
                                // Check for sortationCategories array
                                if (pallet.sortationCategories && Array.isArray(pallet.sortationCategories)) {
                                    pallet.sortationCategories.forEach(cat => {
                                        if (cat && cat !== 'N/A' && cat !== 'Empty') {
                                            allCategories.add(cat);
                                        }
                                    });
                                } else if (pallet.sortationCategory && pallet.sortationCategory !== 'N/A' && pallet.sortationCategory !== 'Empty') {
                                    allCategories.add(pallet.sortationCategory);
                                }
                            }
                            
                            // Join all categories with separator
                            sortationCategory = allCategories.size > 0 ? Array.from(allCategories).sort().join(', ') : 'N/A';
                            
                            // Deep scan: Get actual units from each pallet for accuracy
                            progressText.textContent = `Full scanning ${dropZoneId} - ${totalPallets} pallets...`;
                            
                            for (const pallet of searchDetails.childContainers) {
                                try {
                                    // Get detailed contents of this pallet
                                    const palletDetails = await Core.performContainerSearch(pallet.containerId, true);
                                    
                                    if (palletDetails && palletDetails.childContainers && Array.isArray(palletDetails.childContainers)) {
                                        // Count units in this pallet
                                        const palletUnits = palletDetails.childContainers.reduce((sum, tote) => {
                                            return sum + (tote.numOfChildContainers || 0);
                                        }, 0);
                                        
                                        totalUnits += palletUnits;
                                    }
                                } catch (palletError) {
                                    console.warn(`⚠️ Error scanning pallet ${pallet.containerId}:`, palletError.message);
                                    // Continue with other pallets even if one fails
                                }
                            }
                        }
                        
                        return {
                            dropZoneId: dropZoneId,
                            status: status,
                            palletCount: totalPallets,
                            unitCount: totalUnits,
                            sortationCategory: sortationCategory,
                            lastUpdated: new Date().toLocaleTimeString()
                        };
                    } catch (error) {
                        console.warn(`❌ Error scanning ${dropZoneId}:`, error.message);
                        
                        // Check if it's just an empty zone
                        if (error.message.includes('HTTP 400') || error.message.includes('not found') || error.message.includes('empty')) {
                            return {
                                dropZoneId: dropZoneId,
                                status: 'Empty',
                                palletCount: 0,
                                unitCount: 0,
                                sortationCategory: 'N/A',
                                lastUpdated: new Date().toLocaleTimeString()
                            };
                        } else {
                            return {
                                dropZoneId: dropZoneId,
                                status: 'Error',
                                palletCount: 0,
                                unitCount: 0,
                                sortationCategory: 'Error',
                                lastUpdated: new Date().toLocaleTimeString()
                            };
                        }
                    }
                });
                
                // Wait for batch to complete
                const batchResults = await Promise.all(batchPromises);
                this.data.push(...batchResults);
                
                completedZones += batch.length;
                const percentage = Math.round((completedZones / totalZones) * 100);
                
                progressBar.style.width = `${percentage}%`;
                progressPercentage.textContent = `${percentage}%`;
                progressText.textContent = `Scanned ${completedZones}/${totalZones} zones`;
                
                // Update display
                this.updateDisplay();
                
                // Small delay for progress visibility
                if (i + BATCH_SIZE < dropZones.length) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }
            
            // Final update
            progressText.textContent = `Scan complete! Found ${this.data.filter(d => d.status === 'Active').length} active zones`;
            progressPercentage.textContent = '100%';
            progressBar.style.width = '100%';
            
            // Hide progress and enable buttons
            progressDiv.style.display = 'none';
            refreshBtn.disabled = false;
            exportBtn.disabled = false;
            
            // Update last scan time
            const lastScanElement = document.getElementById('palletland-last-scan-time');
            if (lastScanElement) {
                lastScanElement.textContent = `Last scan: ${new Date().toLocaleString('pl-PL')}`;
            }
            
            console.log('PalletLand scan complete:', this.data);
        },
        
        // Update display with comprehensive data (original PalletLand design)
        updateDisplay: function() {
            const contentDiv = document.getElementById('palletland-content');
            if (!contentDiv || this.data.length === 0) return;
            
            // Calculate summary stats (using different field names than Dashboard)
            const totalZones = this.data.length;
            const activeZones = this.data.filter(dz => dz.status === 'Active').length;
            const emptyZones = this.data.filter(dz => dz.status === 'Empty').length;
            const errorZones = this.data.filter(dz => dz.status === 'Error').length;
            const totalPalletsAll = this.data.reduce((sum, dz) => sum + (dz.palletCount || 0), 0);
            const totalUnitsAll = this.data.reduce((sum, dz) => sum + (dz.unitCount || 0), 0);
            
            console.log(`🎯 PalletLand Stats: ${totalPalletsAll} pallets, ${totalUnitsAll} units from ${this.data.length} zones`);
            
            // Group by category (A, B, C, D) and sortation category
            const categoryStats = {};
            const sortationStats = {};
            const destinationStats = {};
            
            this.data.forEach(dz => {
                const category = dz.dropZoneId.match(/DZ-CDPL-([ABCD])/)?.[1] || 'Unknown';
                if (!categoryStats[category]) {
                    categoryStats[category] = { total: 0, active: 0, empty: 0, error: 0, pallets: 0, units: 0 };
                }
                categoryStats[category].total++;
                if (dz.status === 'Active') {
                    categoryStats[category].active++;
                    categoryStats[category].pallets += dz.palletCount || 0;
                    categoryStats[category].units += dz.unitCount || 0;
                    
                    // Count sortation categories - handle multiple categories separated by commas
                    const sortCat = dz.sortationCategory;
                    if (sortCat && sortCat !== 'N/A' && sortCat !== 'Empty') {
                        // Split by comma and process each category separately
                        const categories = sortCat.split(',').map(cat => cat.trim()).filter(cat => cat && cat !== 'N/A' && cat !== 'Empty');
                        
                        categories.forEach(category => {
                            if (!sortationStats[category]) {
                                sortationStats[category] = { zones: 0, pallets: 0, units: 0 };
                            }
                            // For multiple categories in one zone, count fractional contribution
                            const contribution = 1 / categories.length;
                            const palletContribution = Math.round((dz.palletCount || 0) * contribution);
                            const unitContribution = Math.round((dz.unitCount || 0) * contribution);
                            
                            sortationStats[category].zones += contribution;
                            sortationStats[category].pallets += palletContribution;
                            sortationStats[category].units += unitContribution;
                            
                            // Group by main destination
                            const mainDestination = CategoryMapper.getMainDestination(category);
                            if (!destinationStats[mainDestination]) {
                                destinationStats[mainDestination] = { 
                                    zones: 0, 
                                    pallets: 0, 
                                    units: 0, 
                                    categories: new Set(),
                                    categoryDetails: {} // Track per-category stats
                                };
                            }
                            
                            // Add to category details
                            if (!destinationStats[mainDestination].categoryDetails[category]) {
                                destinationStats[mainDestination].categoryDetails[category] = {
                                    zones: 0,
                                    pallets: 0,
                                    units: 0,
                                    locations: {}
                                };
                            }
                            
                            // Track location details
                            if (!destinationStats[mainDestination].categoryDetails[category].locations[dz.dropZoneId]) {
                                destinationStats[mainDestination].categoryDetails[category].locations[dz.dropZoneId] = {
                                    pallets: 0,
                                    units: 0
                                };
                            }
                            
                            // Update main destination stats
                            destinationStats[mainDestination].zones += contribution;
                            destinationStats[mainDestination].pallets += palletContribution;
                            destinationStats[mainDestination].units += unitContribution;
                            destinationStats[mainDestination].categories.add(category);
                            
                            destinationStats[mainDestination].categoryDetails[category].zones += contribution;
                            destinationStats[mainDestination].categoryDetails[category].pallets += palletContribution;
                            destinationStats[mainDestination].categoryDetails[category].units += unitContribution;
                            
                            destinationStats[mainDestination].categoryDetails[category].locations[dz.dropZoneId].pallets += palletContribution;
                            destinationStats[mainDestination].categoryDetails[category].locations[dz.dropZoneId].units += unitContribution;
                        });
                    }
                } else if (dz.status === 'Empty') {
                    categoryStats[category].empty++;
                } else if (dz.status === 'Error') {
                    categoryStats[category].error++;
                }
            });
            
            contentDiv.innerHTML = `
                <!-- Summary Statistics -->
                <div style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
                    <h3 style="margin: 0 0 12px 0; color: #333; font-size: 18px;">🎯 Palletland Summary Statistics</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; margin-bottom: 15px;">
                        <div style="text-align: center;">
                            <div style="font-size: 22px; font-weight: bold; color: #28a745;">${activeZones}</div>
                            <div style="font-size: 13px; color: #666;">Active Zones</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 22px; font-weight: bold; color: #6c757d;">${emptyZones}</div>
                            <div style="font-size: 13px; color: #666;">Empty Zones</div>
                        </div>
                        ${errorZones > 0 ? `
                        <div style="text-align: center;">
                            <div style="font-size: 22px; font-weight: bold; color: #dc3545;">${errorZones}</div>
                            <div style="font-size: 13px; color: #666;">Error Zones</div>
                        </div>
                        ` : ''}
                        <div style="text-align: center;">
                            <div style="font-size: 22px; font-weight: bold; color: #6f42c1;">${totalPalletsAll}</div>
                            <div style="font-size: 13px; color: #666;">Total Pallets</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 22px; font-weight: bold; color: #764ba2;">${totalUnitsAll}</div>
                            <div style="font-size: 13px; color: #666;">Total Units</div>
                        </div>
                    </div>
                    
                    <!-- Category Breakdown -->
                    <h4 style="margin: 15px 0 10px 0; color: #555; font-size: 16px;">📂 By Category:</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
                        ${Object.keys(categoryStats).sort().map(category => `
                            <div style="padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid ${category === 'A' ? '#28a745' : category === 'B' ? '#17a2b8' : category === 'C' ? '#ffc107' : '#6f42c1'};">
                                <div style="font-weight: bold; color: #495057; margin-bottom: 6px; font-size: 14px;">Category ${category}</div>
                                <div style="font-size: 11px; color: #6c757d;">Active: <strong>${categoryStats[category].active}</strong> / ${categoryStats[category].total}</div>
                                <div style="font-size: 11px; color: #6c757d;">Pallets: <strong>${categoryStats[category].pallets}</strong></div>
                                <div style="font-size: 11px; color: #6c757d;">Units: <strong>${categoryStats[category].units}</strong></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Main Destinations -->
                ${Object.keys(destinationStats).length > 0 ? `
                <div style="background: white; border-radius: 12px; padding: 25px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h3 style="margin: 0 0 20px 0; color: #333;">🎯 Main Destinations</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
                        ${Object.keys(destinationStats).sort().map(destination => {
                            const stats = destinationStats[destination];
                            const categoryCount = stats.categories.size;
                            const colors = {
                                'BTS2': '#007bff',
                                'KTW1': '#28a745', 
                                'LCJ4': '#ffc107',
                                'WRO1': '#6f42c1',
                                'Unknown': '#6c757d'
                            };
                            const color = colors[destination] || '#6c757d';
                            
                            return `
                            <div style="padding: 20px; background: linear-gradient(135deg, ${color}15, ${color}08); border-radius: 12px; border-left: 4px solid ${color}; position: relative;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                    <div style="font-weight: bold; color: ${color}; font-size: 18px;">${destination}</div>
                                    <div style="background: ${color}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">${categoryCount} categories</div>
                                </div>
                                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 10px;">
                                    <div style="text-align: center;">
                                        <div style="font-size: 20px; font-weight: bold; color: ${color};">${Math.round(stats.zones)}</div>
                                        <div style="font-size: 11px; color: #666;">Zones</div>
                                    </div>
                                    <div style="text-align: center;">
                                        <div style="font-size: 20px; font-weight: bold; color: ${color};">${stats.pallets}</div>
                                        <div style="font-size: 11px; color: #666;">Pallets</div>
                                    </div>
                                    <div style="text-align: center;">
                                        <div style="font-size: 20px; font-weight: bold; color: ${color};">${stats.units}</div>
                                        <div style="font-size: 11px; color: #666;">Units</div>
                                    </div>
                                </div>
                                <!-- Location-Category-Pallets table -->
                                ${stats.categoryDetails && Object.keys(stats.categoryDetails).length > 0 ? `
                                <div style="margin-top: 12px;">
                                    <div style="font-size: 12px; font-weight: bold; color: #495057; margin-bottom: 8px;">Location Details:</div>
                                    <div style="max-height: 150px; overflow-y: auto; border: 1px solid #e0e0e0; border-radius: 6px;">
                                        <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px; padding: 6px 8px; background: #f8f9fa; font-size: 10px; font-weight: bold; color: #495057; border-bottom: 1px solid #e0e0e0;">
                                            <div>Location</div>
                                            <div>Category</div>
                                            <div style="text-align: center;">Pallets</div>
                                        </div>
                                        ${Object.entries(stats.categoryDetails).map(([category, details]) => 
                                            Object.entries(details.locations || {}).map(([location, data]) => `
                                                <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px; padding: 4px 8px; font-size: 9px; border-bottom: 1px solid #f0f0f0;">
                                                    <div style="color: #6c757d; overflow: hidden; text-overflow: ellipsis;">${location}</div>
                                                    <div style="color: #495057; overflow: hidden; text-overflow: ellipsis;">${category}</div>
                                                    <div style="text-align: center; font-weight: bold; color: ${color};">${data.pallets || 0}</div>
                                                </div>
                                            `).join('')
                                        ).join('')}
                                    </div>
                                </div>
                                ` : `
                                <div style="font-size: 11px; color: #888; line-height: 1.3;">
                                    Categories: ${Array.from(stats.categories).slice(0, 2).join(', ')}${stats.categories.size > 2 ? ` +${stats.categories.size - 2} more` : ''}
                                </div>
                                `}
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                ` : ''}
                
                <!-- Sortation Categories -->
                ${Object.keys(sortationStats).length > 0 ? `
                <div style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
                    <h3 style="margin: 0 0 12px 0; color: #333; font-size: 18px;">🏷️ Sortation Categories</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
                        ${Object.keys(sortationStats).sort().map(category => `
                            <div style="padding: 12px; background: #f1f3f4; border-radius: 6px; border-left: 3px solid #6f42c1;">
                                <div style="font-weight: bold; color: #495057; margin-bottom: 6px; font-size: 13px;">${category}</div>
                                <div style="font-size: 11px; color: #6c757d;">Zones: <strong>${Math.round(sortationStats[category].zones)}</strong></div>
                                <div style="font-size: 11px; color: #6c757d;">Pallets: <strong>${sortationStats[category].pallets}</strong></div>
                                <div style="font-size: 11px; color: #6c757d;">Units: <strong>${sortationStats[category].units}</strong></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <!-- Drop Zone Table -->
                <div style="background: white; border-radius: 12px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h3 style="margin: 0 0 20px 0; color: #333;">📋 Drop Zone Details</h3>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="border-bottom: 2px solid #dee2e6;">
                                    <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #495057;">Drop Zone</th>
                                    <th style="padding: 12px 8px; text-align: center; font-weight: 600; color: #495057;">Status</th>
                                    <th style="padding: 12px 8px; text-align: center; font-weight: 600; color: #495057;">Pallets</th>
                                    <th style="padding: 12px 8px; text-align: center; font-weight: 600; color: #495057;">Units</th>
                                    <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #495057;">Sortation Category</th>
                                    <th style="padding: 12px 8px; text-align: center; font-weight: 600; color: #495057;">Last Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.data.map((dz, index) => {
                                    const statusColor = dz.status === 'Active' ? '#28a745' : 
                                                       dz.status === 'Empty' ? '#6c757d' : '#dc3545';
                                    const categoryColor = dz.dropZoneId.includes('-A') ? '#28a745' :
                                                         dz.dropZoneId.includes('-B') ? '#17a2b8' :
                                                         dz.dropZoneId.includes('-C') ? '#ffc107' : '#6f42c1';
                                    
                                    return `
                                    <tr style="border-bottom: 1px solid #dee2e6; ${index % 2 === 0 ? 'background: #f8f9fa;' : ''}">
                                        <td style="padding: 10px 8px; font-weight: 500; color: ${categoryColor};">${dz.dropZoneId}</td>
                                        <td style="padding: 10px 8px; text-align: center;">
                                            <span style="display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; 
                                                         color: white; background: ${statusColor};">${dz.status}</span>
                                        </td>
                                        <td style="padding: 10px 8px; text-align: center; font-weight: 600;">${dz.palletCount || 0}</td>
                                        <td style="padding: 10px 8px; text-align: center; font-weight: 600; color: #6f42c1;">${dz.unitCount || 0}</td>
                                        <td style="padding: 10px 8px; font-weight: 500;">${dz.sortationCategory || 'N/A'}</td>
                                        <td style="padding: 10px 8px; text-align: center; font-size: 11px; color: #6c757d;">${dz.lastUpdated || 'Unknown'}</td>
                                    </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        },
        
        // Export PalletLand data to CSV
        exportData: function() {
            if (this.data.length === 0) {
                alert('No data to export. Please run an analysis first.');
                return;
            }
            
            // Prepare CSV data
            const csvHeader = 'Drop Zone,Status,Pallets,Units,Sortation Category,Last Updated\\n';
            const csvRows = this.data.map(zone => {
                return [
                    zone.dropZoneId,
                    zone.status,
                    zone.palletCount || 0,
                    zone.unitCount || 0,
                    `"${zone.sortationCategory || 'N/A'}"`,
                    zone.lastUpdated
                ].join(',');
            }).join('\\n');
            
            // Create and download file
            const csvContent = csvHeader + csvRows;
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `palletland-analysis-${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);
            
            console.log('✅ PalletLand CSV exported successfully');
        }
    };
    
    // ========================================================================
    // ========================================================================
    
    // ========================================================================
    // 8. SETTINGS - User preferences and configuration
    // ========================================================================
    
    /**
     * Settings Management Module - Handles user preferences and configuration
     */
    const SettingsManager = {
        
        // Default settings configuration
        defaultSettings: {
            showPalletLand: true, // Show PalletLand option in menu
            batchSize: 5,
            showCopyTooltip: true,
            highlightCopiedCell: true,
            filenamePrefix: 'RIV',
            includeTimestamp: true,
            // PalletLand configuration
            palletlandSegments: [
                { prefix: 'DZ-CDPL-A', from: 1, to: 50, enabled: true },
                { prefix: 'DZ-CDPL-B', from: 1, to: 50, enabled: true },
                { prefix: 'DZ-CDPL-C', from: 1, to: 50, enabled: true }
            ],
            palletlandCustomDestinations: '',
            // Dashboard configuration
            dashboardSegments: [
                { prefix: 'DZ-CD', from: 1, to: 26, enabled: true }
            ],
            dashboardCustomDestinations: 'DZ-CD-ALL'
        },
        
        // Current settings (loaded from localStorage or defaults)
        settings: null,
        
        // Initialize settings
        init: function() {
            this.settings = { ...this.defaultSettings };
            this.load();
            this.setupGlobalFunctions();
        },
        
        // Load settings from localStorage
        load: function() {
            try {
                const saved = localStorage.getItem('riv-reloup-settings');
                if (saved) {
                    this.settings = { ...this.settings, ...JSON.parse(saved) };
                    console.log('📋 Settings loaded from localStorage');
                }
            } catch (e) {
                console.warn('Could not load settings:', e);
            }
        },
        
        // Save settings to localStorage
        save: function() {
            try {
                localStorage.setItem('riv-reloup-settings', JSON.stringify(this.settings));
                console.log('💾 Settings saved to localStorage');
                
                // Refresh menu visibility
                UIEnhancements.updateMenuVisibility();
            } catch (e) {
                console.warn('Could not save settings:', e);
            }
        },
        
        // Get current settings
        get: function() {
            return { ...this.settings };
        },
        
        // Update a specific setting
        set: function(key, value) {
            this.settings[key] = value;
            this.save();
        },
        
        // Update settings from modal form
        updateFromModal: function() {
            // Get values from modal elements
            const filenamePrefixInput = document.getElementById('filename-prefix');
            const includeTimestampInput = document.getElementById('include-timestamp');
            const showPalletLandInput = document.getElementById('show-palletland');
            
            // PalletLand settings
            const customDestInput = document.getElementById('custom-destinations');
            
            // Dashboard settings
            const dashboardCustomDestInput = document.getElementById('dashboard-custom-destinations');

            this.settings.filenamePrefix = filenamePrefixInput?.value || 'RIV';
            this.settings.includeTimestamp = includeTimestampInput?.checked || false;
            this.settings.showPalletLand = showPalletLandInput?.checked ?? true; // Default true if undefined
            
            // PalletLand settings
            this.settings.palletlandCustomDestinations = customDestInput?.value || '';
            
            // Dashboard settings
            this.settings.dashboardCustomDestinations = dashboardCustomDestInput?.value || '';
            
            // Segments are already updated in real-time via the global update functions
            this.save();
        },
        
        // Apply settings to modal form
        applyToModal: function() {
            const filenamePrefixInput = document.getElementById('filename-prefix');
            const includeTimestampInput = document.getElementById('include-timestamp');
            const showPalletLandInput = document.getElementById('show-palletland');
            
            // PalletLand settings
            const customDestInput = document.getElementById('custom-destinations');
            
            // Dashboard settings
            const dashboardCustomDestInput = document.getElementById('dashboard-custom-destinations');

            if (filenamePrefixInput) filenamePrefixInput.value = this.settings.filenamePrefix;
            if (includeTimestampInput) includeTimestampInput.checked = this.settings.includeTimestamp;
            if (showPalletLandInput) showPalletLandInput.checked = this.settings.showPalletLand;
            
            // PalletLand settings
            if (customDestInput) customDestInput.value = this.settings.palletlandCustomDestinations || '';
            
            // Dashboard settings
            if (dashboardCustomDestInput) dashboardCustomDestInput.value = this.settings.dashboardCustomDestinations || '';
            
            // Load segments configuration
            this.loadSegments();
            this.loadDashboardSegments();
        },
        
        // Setup global functions for segment management (needed for onclick handlers)
        setupGlobalFunctions: function() {
            // PalletLand segment management functions (global for onclick access)
            window.updateSegmentEnabled = (index, enabled) => {
                if (this.settings.palletlandSegments[index]) {
                    this.settings.palletlandSegments[index].enabled = enabled;
                }
            };

            window.updateSegmentPrefix = (index, prefix) => {
                if (this.settings.palletlandSegments[index]) {
                    this.settings.palletlandSegments[index].prefix = prefix;
                }
            };

            window.updateSegmentFrom = (index, from) => {
                if (this.settings.palletlandSegments[index]) {
                    this.settings.palletlandSegments[index].from = parseInt(from) || 1;
                }
            };

            window.updateSegmentTo = (index, to) => {
                if (this.settings.palletlandSegments[index]) {
                    this.settings.palletlandSegments[index].to = parseInt(to) || 50;
                }
            };

            window.removeSegment = (index) => {
                this.settings.palletlandSegments.splice(index, 1);
                this.loadSegments();
            };

            // Dashboard segment management functions
            window.updateDashboardSegmentEnabled = (index, enabled) => {
                if (this.settings.dashboardSegments[index]) {
                    this.settings.dashboardSegments[index].enabled = enabled;
                }
            };

            window.updateDashboardSegmentPrefix = (index, prefix) => {
                if (this.settings.dashboardSegments[index]) {
                    this.settings.dashboardSegments[index].prefix = prefix;
                }
            };

            window.updateDashboardSegmentFrom = (index, from) => {
                if (this.settings.dashboardSegments[index]) {
                    this.settings.dashboardSegments[index].from = parseInt(from) || 1;
                }
            };

            window.updateDashboardSegmentTo = (index, to) => {
                if (this.settings.dashboardSegments[index]) {
                    this.settings.dashboardSegments[index].to = parseInt(to) || 26;
                }
            };

            window.removeDashboardSegment = (index) => {
                this.settings.dashboardSegments.splice(index, 1);
                this.loadDashboardSegments();
            };
        },
        
        // Load and display PalletLand segments in modal
        loadSegments: function() {
            const container = document.getElementById('segments-container');
            if (!container) return;
            
            container.innerHTML = this.settings.palletlandSegments
                .map((segment, index) => this.createSegmentElement(segment, index))
                .join('');
                
            // Setup event listeners for Add Segment button
            const addBtn = document.getElementById('add-segment');
            if (addBtn) {
                addBtn.onclick = () => this.addNewSegment();
            }
        },
        
        // Add new PalletLand segment
        addNewSegment: function() {
            this.settings.palletlandSegments.push({ prefix: 'DZ-NEW-', from: 1, to: 50, enabled: true });
            this.loadSegments();
        },
        
        // Load and display Dashboard segments in modal
        loadDashboardSegments: function() {
            const container = document.getElementById('dashboard-segments-container');
            if (!container) return;
            
            container.innerHTML = this.settings.dashboardSegments
                .map((segment, index) => this.createDashboardSegmentElement(segment, index))
                .join('');
                
            // Setup event listeners for Add Dashboard Segment button
            const addBtn = document.getElementById('add-dashboard-segment');
            if (addBtn) {
                addBtn.onclick = () => this.addNewDashboardSegment();
            }
        },
        
        // Add new Dashboard segment
        addNewDashboardSegment: function() {
            this.settings.dashboardSegments.push({ prefix: 'DZ-NEW-', from: 1, to: 26, enabled: true });
            this.loadDashboardSegments();
        },
        
        // Create HTML for Dashboard segment element
        createDashboardSegmentElement: function(segment, index) {
            return `
                <div style="margin-bottom: 8px; display: flex; align-items: center; flex-wrap: wrap; gap: 5px; padding: 8px; background: white; border-radius: 4px;">
                    <input type="checkbox" ${segment.enabled ? 'checked' : ''} 
                           onchange="updateDashboardSegmentEnabled(${index}, this.checked)"
                           style="margin-right: 5px;">
                    <span style="margin-right: 5px; font-size: 12px;">prefix:</span>
                    <input type="text" value="${segment.prefix}" 
                           onchange="updateDashboardSegmentPrefix(${index}, this.value)"
                           style="width: 120px; margin-right: 8px; padding: 3px; font-family: monospace; font-weight: bold;">
                    <span style="margin-right: 5px; font-size: 12px;">from:</span>
                    <input type="number" value="${segment.from}" min="1" max="999" 
                           onchange="updateDashboardSegmentFrom(${index}, this.value)"
                           style="width: 50px; margin-right: 8px; padding: 3px;">
                    <span style="margin-right: 5px; font-size: 12px;">to:</span>
                    <input type="number" value="${segment.to}" min="1" max="999" 
                           onchange="updateDashboardSegmentTo(${index}, this.value)"
                           style="width: 50px; margin-right: 8px; padding: 3px;">
                    <button type="button" onclick="removeDashboardSegment(${index})" 
                            style="background: #ff4444; color: white; border: none; border-radius: 2px; padding: 2px 6px; cursor: pointer; font-size: 11px;">×</button>
                </div>
            `;
        },
        
        // Create HTML for PalletLand segment element
        createSegmentElement: function(segment, index) {
            return `
                <div class="segment-item" data-index="${index}" style="display: flex; align-items: center; margin-bottom: 8px; padding: 8px; border: 1px solid #ccc; border-radius: 3px; background: #fff;">
                    <input type="checkbox" ${segment.enabled ? 'checked' : ''} 
                           onchange="updateSegmentEnabled(${index}, this.checked)" 
                           style="margin-right: 8px;">
                    <input type="text" value="${segment.prefix}" placeholder="DZ-CDPL-A" 
                           onchange="updateSegmentPrefix(${index}, this.value)"
                           style="width: 120px; margin-right: 8px; padding: 3px; font-family: monospace; font-weight: bold;">
                    <span style="margin-right: 5px; font-size: 12px;">from:</span>
                    <input type="number" value="${segment.from}" min="1" max="999" 
                           onchange="updateSegmentFrom(${index}, this.value)"
                           style="width: 50px; margin-right: 8px; padding: 3px;">
                    <span style="margin-right: 5px; font-size: 12px;">to:</span>
                    <input type="number" value="${segment.to}" min="1" max="999" 
                           onchange="updateSegmentTo(${index}, this.value)"
                           style="width: 50px; margin-right: 8px; padding: 3px;">
                    <button type="button" onclick="removeSegment(${index})" 
                            style="background: #ff4444; color: white; border: none; border-radius: 2px; padding: 2px 6px; cursor: pointer; font-size: 11px;">×</button>
                </div>
            `;
        },
        
        // Show settings modal
        showModal: function() {
            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
            `;

            // Create modal content
            const modal = document.createElement('div');
            modal.style.cssText = `
                background: white;
                border-radius: 8px;
                padding: 20px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            `;

            modal.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
                    <h2 style="margin: 0; color: #333;">RIV - ReloUp Settings</h2>
                    <button id="close-settings" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">&times;</button>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #555; margin-bottom: 10px;">🎨 Interface Settings</h3>
                    
                    <label style="display: block; margin-bottom: 10px;">
                        <input type="checkbox" id="show-palletland" style="margin-right: 10px;">
                        Show Palletland option in footer menu
                    </label>
                    
                    <div style="background: #e8f4f8; padding: 10px; border-radius: 4px; font-size: 12px; color: #0c5460; margin-bottom: 15px;">
                        <strong>Note:</strong> Uncheck to hide Palletland from the footer menu if you only need Dashboard functionality.
                    </div>
                </div>

                <div style="margin-bottom: 20px;">
                    <h3 style="color: #555; margin-bottom: 10px;">📦 Palletland Configuration</h3>
                    
                    <div style="margin-bottom: 15px;">
                        <div style="margin-bottom: 15px;">
                            <h4 style="color: #666; margin-bottom: 10px;">Destination Segments:</h4>
                            <div id="segments-container" style="border: 1px solid #ddd; padding: 10px; border-radius: 4px; background: #f9f9f9;">
                                <!-- Segments will be dynamically generated here -->
                            </div>
                            <button type="button" id="add-segment" style="margin-top: 10px; padding: 5px 10px; background: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">+ Add Segment</button>
                        </div>
                        
                        <label style="display: block; margin-bottom: 10px;">
                            Custom destinations (one per line):
                            <textarea id="custom-destinations" placeholder="DZ-SPECIAL-01&#10;DZ-TEST-A05&#10;DZ-CUSTOM-B12" 
                                      style="width: 100%; height: 60px; margin-top: 5px; padding: 5px; font-family: monospace; font-size: 12px;"></textarea>
                        </label>
                    </div>
                    
                    <div style="background: #e8f4f8; padding: 10px; border-radius: 4px; font-size: 12px; color: #0c5460;">
                        <strong>Example:</strong> Prefix "DZ-CDPL-A" (1-25) + Prefix "DZ-SPEC-TEST" (10-15) = DZ-CDPL-A01...A25, DZ-SPEC-TEST10...TEST15
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #555; margin-bottom: 10px;">📊 Dashboard Configuration</h3>
                    
                    <div style="margin-bottom: 15px;">
                        <div style="margin-bottom: 15px;">
                            <h4 style="color: #666; margin-bottom: 10px;">Dashboard Segments:</h4>
                            <div id="dashboard-segments-container" style="border: 1px solid #ddd; padding: 10px; border-radius: 4px; background: #f9f9f9;">
                                <!-- Dashboard segments will be dynamically generated here -->
                            </div>
                            <button type="button" id="add-dashboard-segment" style="margin-top: 10px; padding: 5px 10px; background: #17a2b8; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">+ Add Dashboard Segment</button>
                        </div>
                        
                        <label style="display: block; margin-bottom: 10px;">
                            Custom Dashboard destinations (one per line):
                            <textarea id="dashboard-custom-destinations" placeholder="DZ-CDALL&#10;DZ-SPECIAL&#10;DZ-OVERFLOW" 
                                      style="width: 100%; height: 60px; margin-top: 5px; padding: 5px; font-family: monospace; font-size: 12px;"></textarea>
                        </label>
                    </div>
                    
                    <div style="background: #e1f5fe; padding: 10px; border-radius: 4px; font-size: 12px; color: #0277bd;">
                        <strong>Dashboard vs Palletland:</strong> Dashboard is for quick overview (fewer zones), Palletland for comprehensive analysis (many zones)
                    </div>
                </div>

                <div style="margin-bottom: 20px;">
                    <h3 style="color: #555; margin-bottom: 10px;">🎯 Category to Destination Mapping</h3>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <h4 style="color: #666; margin: 0 0 10px 0;">Current Mapping:</h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px; max-height: 200px; overflow-y: auto;">
                            <div style="background: white; padding: 10px; border-radius: 4px; border-left: 3px solid #007bff;">
                                <div style="font-weight: bold; font-size: 12px; color: #007bff; margin-bottom: 5px;">BTS2</div>
                                <div style="font-size: 10px; color: #666; line-height: 1.3;">6 - NON TECH TTA<br>4 - FAST PROCESSING TTA<br>7 - HRV URGENT<br>+2 more...</div>
                            </div>
                            <div style="background: white; padding: 10px; border-radius: 4px; border-left: 3px solid #28a745;">
                                <div style="font-weight: bold; font-size: 12px; color: #28a745; margin-bottom: 5px;">KTW1</div>
                                <div style="font-size: 10px; color: #666; line-height: 1.3;">S&A FAST PROCESSING TTA<br>APPAREL SIDELINE<br>SHOES URGENT<br>+3 more...</div>
                            </div>
                            <div style="background: white; padding: 10px; border-radius: 4px; border-left: 3px solid #ffc107;">
                                <div style="font-weight: bold; font-size: 12px; color: #ffc107; margin-bottom: 5px;">LCJ4</div>
                                <div style="font-size: 10px; color: #666; line-height: 1.3;">NON TECH TTA LCJ4<br>8 - BMVD URGENT<br>URGENT LCJ4<br>+3 more...</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="background: #e1f5fe; padding: 10px; border-radius: 4px; font-size: 12px; color: #0277bd;">
                        <strong>How it works:</strong> Categories from your Drop Zone analysis are automatically grouped into main destinations (BTS2, KTW1, LCJ4) for better logistics overview.
                    </div>
                </div>

                <div style="margin-bottom: 20px;">
                    <h3 style="color: #555; margin-bottom: 10px;">📁 Export Settings</h3>
                    <label style="display: block; margin-bottom: 10px;">
                        Filename prefix: 
                        <input type="text" id="filename-prefix" value="RIV" style="margin-left: 10px; padding: 5px;">
                    </label>
                    <label style="display: block; margin-bottom: 10px;">
                        <input type="checkbox" id="include-timestamp" checked style="margin-right: 10px;">
                        Include timestamp in filename
                    </label>
                </div>

                <div style="margin-bottom: 20px;">
                    <h3 style="color: #555; margin-bottom: 10px;">ℹ️ Script Info</h3>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                        <p style="margin: 0 0 10px 0; font-family: monospace; font-size: 12px;">
                            <strong>Version:</strong> ${Core.version || '3.9.3'}<br>
                            <strong>Author:</strong> ${Core.metadata?.authorFull || 'Dariusz Kubica (kubicdar)'}<br>
                            <strong>GitHub:</strong> <a href="${Core.metadata?.homepageURL || 'https://github.com/dariuszkubica/RIV-ReloUp'}" target="_blank" style="color: #007bff;">Repository</a>
                        </p>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; margin-top: 20px;">
                    <button id="save-settings" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Save Settings</button>
                    <button id="reset-settings" style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Reset to Defaults</button>
                </div>
            `;

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // Apply current settings to modal
            this.applyToModal();

            // Event listeners
            document.getElementById('close-settings').onclick = () => overlay.remove();
            document.getElementById('save-settings').onclick = () => {
                this.updateFromModal();
                overlay.remove();
            };
            document.getElementById('reset-settings').onclick = () => {
                if (confirm('Reset all settings to defaults? This cannot be undone.')) {
                    this.settings = { ...this.defaultSettings };
                    this.save();
                    this.applyToModal();
                }
            };

            // Close on overlay click
            overlay.onclick = (e) => {
                if (e.target === overlay) overlay.remove();
            };
        }
    };
    
    // ========================================================================
    // 9. INITIALIZATION - Script startup and basic setup
    // ========================================================================
    
    // Initialize the script core
    console.log('🚀 Initializing RIV - ReloUp (Reorganized)...');
    
    // Initialize core components
    const scriptInfo = Core.init();
    
    // Load session data
    const sessionRestored = SessionManager.load();
    if (sessionRestored) {
        console.log('🔄 Session data successfully restored from previous session');
    }
    
    // Setup XHR interceptor for automatic session capture
    SessionManager.setupXHRInterceptor();
    
    // Initialize settings manager
    SettingsManager.init();
    
    // Initialize UI enhancements (menu, interface modifications)
    UIEnhancements.init();
    
    // Auto-load session data in background
    setTimeout(async () => {
        // Attempt automatic session capture at startup
        if (!sessionRestored) {
            console.log('🚀 Attempting automatic session capture...');
            const success = await SessionManager.autoTriggerSessionCapture();
            if (success) {
                console.log('✅ Automatic session capture successful at startup');
            } else {
                console.log('⚠️ Automatic session capture failed - waiting for user interaction');
            }
        }
    }, 3000); // 3 second delay to allow page to load
    
    console.log('✅ Core initialization completed');
    console.log(`📊 CategoryMapper loaded with ${Object.keys(CategoryMapper.destinationMap).length} category mappings`);
    console.log('⚙️ Settings Manager initialized');
    console.log('🎨 UI Enhancements initialized');
    
    // Expose core modules for debugging (optional)
    if (typeof window !== 'undefined') {
        window.RIV_Core = Core;
        window.RIV_SessionManager = SessionManager;
        window.RIV_CategoryMapper = CategoryMapper;
        window.RIV_SettingsManager = SettingsManager;
        window.RIV_UIEnhancements = UIEnhancements;
        window.RIV_Dashboard = Dashboard;
        
        // Global function to show settings modal (for footer menu integration)
        window.showRIVSettings = () => SettingsManager.showModal();
        window.showRIVDashboard = () => Dashboard.show();
        
        // Global debug functions for checking localStorage session data (accessible from console)
        window.rivCheckStoredSession = function() {
            console.log('🔍 Checking stored session data...');
            
            const sessionData = SessionManager.get();
            console.log('Current SessionManager data:', sessionData);
            
            try {
                const stored = localStorage.getItem('riv_session_data');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    console.log('Raw localStorage data:', parsed);
                    
                    const lastCaptured = parsed.lastCaptured ? new Date(parsed.lastCaptured) : null;
                    const now = new Date();
                    const dayInMs = 24 * 60 * 60 * 1000;
                    const hoursAgo = lastCaptured ? Math.round((now - lastCaptured) / (60 * 60 * 1000)) : 'never';
                    
                    console.log(`📅 Last captured: ${hoursAgo} hours ago`);
                    console.log(`✅ Valid data: ${sessionData.warehouseId && sessionData.associate && sessionData.warehouseId !== 'CDPL1'}`);
                } else {
                    console.log('❌ No stored session data found');
                }
            } catch (e) {
                console.error('Error reading stored session data:', e);
            }
        };

        // Global debug function for clearing stored session data (accessible from console)
        window.rivClearStoredSession = function() {
            console.log('🗑️ Clearing stored session data...');
            SessionManager.clear();
            console.log('✅ Session data cleared. Refresh page to start fresh.');
        };

        // Global debug function for testing current user detection (accessible from console)
        window.rivTestCurrentUser = function() {
            console.log('🧪 Testing current user detection...');
            const detectedUser = Core.getCurrentUser();
            console.log('Detected user:', detectedUser);
            return detectedUser;
        };
        
        // Global debug function for testing automatic session capture (accessible from console)
        window.rivTestSessionCapture = async function() {
            console.log('🧪 Testing automatic session capture...');
            try {
                const success = await SessionManager.autoTriggerSessionCapture();
                console.log('Session capture result:', success);
                console.log('Updated session data:', SessionManager.get());
                return success;
            } catch (error) {
                console.error('Session capture test failed:', error);
                return false;
            }
        };
        
        // Global function to manually set session data with known working values
        window.rivSetKnownSession = function(customAssociate = null) {
            console.log('🔧 Setting known working session data...');
            const associate = customAssociate || Core.getCurrentUser() || 'kubicdar';
            const knownGood = {
                warehouseId: 'KTW1', // Known good warehouse
                associate: associate,
                sessionId: null
            };
            
            SessionManager.update(knownGood.warehouseId, knownGood.associate, knownGood.sessionId);
            console.log('✅ Session data set to working values:', knownGood);
            console.log('💡 You can now try Dashboard or PalletLand scans');
        };
    }
    
})();