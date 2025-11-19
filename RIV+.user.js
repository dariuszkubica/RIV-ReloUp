// ==UserScript==
// @name         RIV+
// @namespace    KTW1
// @version      4.0
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
        
        // Copy to clipboard functionality with Ctrl + LMB
        initializeCopyToClipboard: function() {
            // Add click event listener to document for table elements using capture phase
            document.addEventListener('click', function(event) {
                // Check if Ctrl key is pressed
                if (!event.ctrlKey) return;
                
                // Check if clicked element is within a table cell or is the button itself
                let cell = event.target.closest('td, th');
                if (!cell) return;
                
                // Check if it's within our target tables
                const table = cell.closest('table.searched-container-table');
                if (!table) return;
                
                // Prevent default action and event bubbling immediately
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                
                // Get text content to copy
                let textToCopy = '';
                
                // Check if it's a button with container ID (class css-47ekp)
                const button = cell.querySelector('button.css-47ekp');
                if (button) {
                    textToCopy = button.textContent.trim();
                } else {
                    // Get text from span or direct cell content
                    const span = cell.querySelector('span');
                    textToCopy = span ? span.textContent.trim() : cell.textContent.trim();
                }
                
                // Copy to clipboard
                if (textToCopy) {
                    navigator.clipboard.writeText(textToCopy).then(function() {
                        // Show visual feedback
                        Core.showCopyFeedback(cell, textToCopy);
                        console.log(`📋 Copied to clipboard: ${textToCopy}`);
                    }).catch(function(err) {
                        // Fallback for older browsers
                        Core.fallbackCopyToClipboard(textToCopy);
                        Core.showCopyFeedback(cell, textToCopy);
                        console.log(`📋 Copied to clipboard (fallback): ${textToCopy}`);
                    });
                }
                
                // Return false to ensure no further processing
                return false;
            }, true); // Use capture phase to intercept before button handlers
        },
        
        // Fallback copy function for older browsers
        fallbackCopyToClipboard: function(text) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
            } catch (err) {
                console.warn('Fallback copy failed:', err);
            }
            
            document.body.removeChild(textArea);
        },
        
        // Show visual feedback when text is copied
        showCopyFeedback: function(cell, copiedText) {
            // Create temporary tooltip
            const tooltip = document.createElement('div');
            tooltip.textContent = `Copied: ${copiedText}`;
            tooltip.style.cssText = `
                position: absolute;
                background: #28a745;
                color: white;
                padding: 5px 10px;
                border-radius: 3px;
                font-size: 12px;
                z-index: 10000;
                pointer-events: none;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            `;
            
            // Position tooltip near the clicked cell
            const rect = cell.getBoundingClientRect();
            tooltip.style.left = (rect.left + window.scrollX) + 'px';
            tooltip.style.top = (rect.top + window.scrollY - 30) + 'px';
            
            document.body.appendChild(tooltip);
            
            // Add green border to cell temporarily
            const originalBorder = cell.style.border;
            const originalBackground = cell.style.backgroundColor;
            cell.style.border = '2px solid #28a745';
            cell.style.backgroundColor = 'rgba(40, 167, 69, 0.1)';
            
            // Remove feedback after 1.5 seconds
            setTimeout(() => {
                if (tooltip && tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
                cell.style.border = originalBorder;
                cell.style.backgroundColor = originalBackground;
            }, 1500);
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
        
        // Get destination map from settings (dynamic)
        getDestinationMap: function() {
            const settings = SettingsManager.get();
            return settings.categoryMappings || this.getDefaultDestinationMap();
        },
        
        // Default destination mappings (fallback)
        getDefaultDestinationMap: function() {
            return {
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
                '1 - TECH TTA' : 'BTS2',
                'Tech TTA LCJ4' : 'LCJ4'
            };
        },
        
        // Get main destination for category
        getMainDestination: function(sortationCategory) {
            if (!sortationCategory || sortationCategory === 'N/A' || sortationCategory === 'Empty') {
                return 'Unknown';
            }
            
            const destinationMap = this.getDestinationMap();
            
            // Handle multiple categories separated by commas
            const categories = sortationCategory.split(',').map(cat => cat.trim());
            const destinations = new Set();
            
            categories.forEach(category => {
                const destination = destinationMap[category] || 'Unknown';
                destinations.add(destination);
            });
            
            // If multiple destinations, join them
            return Array.from(destinations).sort().join(', ');
        },
        
        // Test category mapping functionality (for debugging)
        testCategoryMapping: function() {
            console.log('🧪 Testing Category Mapping functionality...');
            
            const testCategories = ['6 - NON TECH TTA', 'S&A FAST PROCESSING TTA', 'UNKNOWN CATEGORY'];
            
            testCategories.forEach(category => {
                const destination = this.getMainDestination(category);
                console.log(`   ${category} -> ${destination}`);
            });
            
            console.log('✅ Category mapping test complete');
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

            // Make footer always visible at bottom while preserving original design
            footer.style.cssText = `
                position: fixed !important;
                bottom: 0 !important;
                left: 0 !important;
                right: 0 !important;
                z-index: 9999 !important;
                display: flex !important;
                justify-content: center !important;
                align-items: baseline !important;
                background-color: #00688D !important;
                box-shadow: 0 -2px 8px rgba(0,0,0,0.15) !important;
                margin: 0 !important;
            `;

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

            // Search menu item
            const searchItem = document.createElement('a');
            searchItem.href = '#';
            searchItem.setAttribute('data-riv-menu-item', 'search');
            searchItem.onclick = function(e) {
                e.preventDefault();
                window.location.href = 'https://dub.prod.item-visibility.returns.amazon.dev/search';
            };
            searchItem.innerHTML = `
                <div class="footer-item">
                    <span class="css-1ox0ukt">
                        <span aria-label="" role="img" aria-hidden="true" class="css-34iy07">
                            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14z" fill="currentColor"/>
                            </svg>
                        </span>
                    </span>
                    <p class="css-1fz4hyd" mdn-text="">Search</p>
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
            footer.appendChild(searchItem);
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
                            <h3 style="color: #856404; margin-bottom: 15px; font-weight: 600;">No Session Data</h3>
                            <p style="color: #666; margin-bottom: 20px; line-height: 1.5;">
                                For Dashboard to work properly, you need to first:
                            </p>
                            <div style="
                                background: #fff3cd;
                                border: 1px solid #ffeaa7;
                                border-radius: 8px;
                                padding: 20px;
                                margin: 20px 0;
                                text-align: left;
                            ">
                                <h4 style="color: #856404; margin: 0 0 10px 0;">🔍 Instructions:</h4>
                                <ol style="color: #856404; margin: 0; padding-left: 20px;">
                                    <li>Go to the Identification page</li>
                                    <li>Search for any empty entry</li>
                                    <li>Return to Dashboard</li>
                                </ol>
                            </div>
                            <p style="color: #6c757d; font-size: 13px; margin-top: 15px;">
                                Dashboard needs active session data to perform system queries.
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
                            <h3 style="color: #5a31a1; margin-bottom: 15px; font-weight: 600;">No Session Data</h3>
                            <p style="color: #666; margin-bottom: 20px; line-height: 1.5;">
                                For PalletLand to work properly, you need to first:
                            </p>
                            <div style="
                                background: #f8f4ff;
                                border: 1px solid #d4b9ff;
                                border-radius: 8px;
                                padding: 20px;
                                margin: 20px 0;
                                text-align: left;
                            ">
                                <h4 style="color: #5a31a1; margin: 0 0 10px 0;">🔍 Instructions:</h4>
                                <ol style="color: #5a31a1; margin: 0; padding-left: 20px;">
                                    <li>Go to the Identification page</li>
                                    <li>Search for any empty entry</li>
                                    <li>Return to PalletLand</li>
                                </ol>
                            </div>
                            <p style="color: #6c757d; font-size: 13px; margin-top: 15px;">
                                PalletLand needs active session data to perform system queries.
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
    // SEARCH MODULE - Enhanced search functionality with advanced deep scan
    // ========================================================================
    
    /**
     * Search Module - Dedicated search functionality for the Search page
     */
    const SearchModule = {
        
        // Enhanced deep scan specifically for Search page usage
        performAdvancedDeepScan: async function(containerId, progressCallback = null) {
            console.log(`🔍 Starting advanced deep scan for: ${containerId}`);
            
            try {
                // Get main container information
                const mainContainer = await Core.performContainerSearch(containerId);
                if (!mainContainer || !mainContainer.childContainers) {
                    throw new Error('Container not found or has no child containers');
                }
                
                const results = {
                    containerId: containerId,
                    containerInfo: mainContainer,
                    totalPallets: mainContainer.childContainers.length,
                    totalUnits: 0,
                    totalTotes: 0,
                    sortationCategories: new Map(),
                    destinationMapping: new Map(),
                    palletDetails: [],
                    allCDDDates: [], // Store all Clean Decant Dates
                    oldestCDD: null, // Will store the oldest CDD
                    scanTimestamp: new Date(),
                    scanDuration: 0
                };
                
                const startTime = Date.now();
                
                if (progressCallback) {
                    progressCallback(`Scanning ${results.totalPallets} pallets...`, 0);
                }
                
                // Deep scan each pallet with enhanced data collection
                for (let i = 0; i < mainContainer.childContainers.length; i++) {
                    const pallet = mainContainer.childContainers[i];
                    
                    try {
                        if (progressCallback) {
                            const progress = ((i + 1) / mainContainer.childContainers.length) * 100;
                            progressCallback(`Deep scanning pallet ${i + 1}/${mainContainer.childContainers.length}: ${pallet.containerId}`, progress);
                        }
                        
                        // Get detailed pallet information
                        const palletData = await Core.performContainerSearch(pallet.containerId, true);
                        
                        if (palletData && palletData.childContainers && Array.isArray(palletData.childContainers)) {
                            const toteCount = palletData.childContainers.length;
                            let palletUnits = 0;
                            let toteDetails = [];
                            
                            // Analyze each tote in the pallet
                            for (const tote of palletData.childContainers) {
                                const toteUnits = tote.numOfChildContainers || 0;
                                palletUnits += toteUnits;
                                
                                // Extract CDD from tote container properties (basic scan)
                                let toteCDD = null;
                                if (tote.containerProperties && tote.containerProperties.cleanDecantDate) {
                                    toteCDD = tote.containerProperties.cleanDecantDate;
                                    results.allCDDDates.push({
                                        date: toteCDD,
                                        toteId: tote.containerId,
                                        palletId: pallet.containerId,
                                        units: toteUnits,
                                        sortationCategory: tote.sortationCategory || 'N/A',
                                        destination: tote.destinationId || 'N/A',
                                        source: 'tote'
                                    });
                                }
                                
                                toteDetails.push({
                                    toteId: tote.containerId,
                                    units: toteUnits,
                                    sortationCategory: (tote.sortationCategories && tote.sortationCategories.length > 0) ? tote.sortationCategories[0] : (tote.sortationCategory || 'N/A'),
                                    destination: tote.destinationId || 'N/A',
                                    status: tote.status || 'N/A',
                                    cdd: toteCDD || 'N/A'
                                });
                                
                                // Track sortation categories
                                if (tote.sortationCategories && Array.isArray(tote.sortationCategories)) {
                                    tote.sortationCategories.forEach(cat => {
                                        if (cat && cat !== 'N/A' && cat !== 'Empty') {
                                            results.sortationCategories.set(cat, (results.sortationCategories.get(cat) || 0) + toteUnits);
                                        }
                                    });
                                } else if (tote.sortationCategory && tote.sortationCategory !== 'N/A' && tote.sortationCategory !== 'Empty') {
                                    results.sortationCategories.set(tote.sortationCategory, (results.sortationCategories.get(tote.sortationCategory) || 0) + toteUnits);
                                }
                                
                                // Track destinations
                                if (tote.destinationId && tote.destinationId !== 'N/A') {
                                    const destination = CategoryMapper.getDestination(tote.destinationId);
                                    results.destinationMapping.set(destination, (results.destinationMapping.get(destination) || 0) + toteUnits);
                                }
                            }
                            
                            results.totalUnits += palletUnits;
                            results.totalTotes += toteCount;
                            
                            // Store detailed pallet information
                            results.palletDetails.push({
                                palletId: pallet.containerId,
                                palletType: pallet.containerType || 'N/A',
                                toteCount: toteCount,
                                unitCount: palletUnits,
                                sortationCategory: pallet.sortationCategory || 'N/A',
                                destination: pallet.destinationId || 'N/A',
                                status: pallet.status || 'N/A',
                                location: pallet.currentLocation || 'N/A',
                                lastModified: pallet.modifiedDate || null,
                                totes: toteDetails
                            });
                            
                            console.log(`📦 Deep scan ${pallet.containerId}: ${toteCount} totes, ${palletUnits} units`);
                            
                        } else {
                            // Fallback for pallets without detailed data
                            const fallbackUnits = pallet.numOfChildContainers || 0;
                            results.totalUnits += fallbackUnits;
                            
                            results.palletDetails.push({
                                palletId: pallet.containerId,
                                palletType: pallet.containerType || 'N/A',
                                toteCount: 0,
                                unitCount: fallbackUnits,
                                sortationCategory: pallet.sortationCategory || 'N/A',
                                destination: pallet.destinationId || 'N/A',
                                status: pallet.status || 'N/A',
                                location: pallet.currentLocation || 'N/A',
                                lastModified: pallet.modifiedDate || null,
                                totes: [],
                                note: 'Limited data available'
                            });
                        }
                        
                        // Small delay to prevent overwhelming the API
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                    } catch (palletError) {
                        console.warn(`⚠️ Error scanning pallet ${pallet.containerId}:`, palletError.message);
                        
                        // Add failed pallet to results with error info
                        results.palletDetails.push({
                            palletId: pallet.containerId,
                            palletType: pallet.containerType || 'N/A',
                            toteCount: 0,
                            unitCount: 0,
                            sortationCategory: 'Error',
                            destination: 'Error',
                            status: 'Scan Failed',
                            location: pallet.currentLocation || 'N/A',
                            lastModified: pallet.modifiedDate || null,
                            totes: [],
                            error: palletError.message
                        });
                    }
                }
                
                // Find oldest CDD date with verification
                if (results.allCDDDates.length > 0) {
                    console.log(`🔍 Processing ${results.allCDDDates.length} CDD entries:`, results.allCDDDates.slice(0, 3));
                    const verifiedCDDEntry = await this.findAndVerifyOldestCDD(results.allCDDDates);
                    results.oldestCDD = verifiedCDDEntry ? verifiedCDDEntry.date : null;
                    results.oldestCDDDetails = verifiedCDDEntry;
                    console.log(`🔍 Final verified oldest CDD:`, results.oldestCDD);
                } else {
                    console.log(`⚠️ No CDD dates found in scan results`);
                    results.oldestCDD = null;
                    results.oldestCDDDetails = null;
                }
                
                results.scanDuration = Date.now() - startTime;
                
                console.log(`✅ Advanced deep scan completed for ${containerId}:`, {
                    pallets: results.totalPallets,
                    totes: results.totalTotes,
                    units: results.totalUnits,
                    categories: results.sortationCategories.size,
                    destinations: results.destinationMapping.size,
                    duration: `${(results.scanDuration / 1000).toFixed(1)}s`
                });
                
                return results;
                
            } catch (error) {
                console.error(`❌ Advanced deep scan failed for ${containerId}:`, error);
                throw error;
            }
        },
        
        // Export advanced scan results to detailed CSV
        exportAdvancedScanResults: function(scanResults) {
            if (!scanResults || !scanResults.palletDetails || scanResults.palletDetails.length === 0) {
                alert('No scan data to export. Please perform an advanced deep scan first.');
                return;
            }
            
            // Create comprehensive CSV with multiple sheets worth of data
            const timestamp = new Date().toISOString().split('T')[0];
            const csvData = [];
            
            // Header
            csvData.push([
                'Container ID',
                'Pallet ID', 
                'Pallet Type',
                'Tote Count',
                'Unit Count',
                'Sortation Category',
                'Destination',
                'Status',
                'Location',
                'Last Modified',
                'Tote ID',
                'Tote Units',
                'Tote Category',
                'Tote Destination',
                'Tote Status',
                'Scan Notes'
            ].join(','));
            
            // Data rows - one row per tote, with pallet info repeated
            scanResults.palletDetails.forEach(pallet => {
                if (pallet.totes && pallet.totes.length > 0) {
                    // One row per tote
                    pallet.totes.forEach(tote => {
                        csvData.push([
                            scanResults.containerId,
                            pallet.palletId,
                            pallet.palletType,
                            pallet.toteCount,
                            pallet.unitCount,
                            `"${pallet.sortationCategory}"`,
                            `"${pallet.destination}"`,
                            pallet.status,
                            `"${pallet.location}"`,
                            pallet.lastModified || '',
                            tote.toteId,
                            tote.units,
                            `"${tote.sortationCategory}"`,
                            `"${tote.destination}"`,
                            tote.status,
                            pallet.note || pallet.error || ''
                        ].join(','));
                    });
                } else {
                    // Pallet without tote details
                    csvData.push([
                        scanResults.containerId,
                        pallet.palletId,
                        pallet.palletType,
                        pallet.toteCount,
                        pallet.unitCount,
                        `"${pallet.sortationCategory}"`,
                        `"${pallet.destination}"`,
                        pallet.status,
                        `"${pallet.location}"`,
                        pallet.lastModified || '',
                        '',
                        '',
                        '',
                        '',
                        '',
                        pallet.note || pallet.error || ''
                    ].join(','));
                }
            });
            
            // Create and download file
            const csvContent = csvData.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `advanced-deep-scan-${scanResults.containerId}-${timestamp}.csv`;
            link.click();
            URL.revokeObjectURL(url);
            
            console.log('✅ Advanced deep scan CSV exported successfully');
        },
        
        // Find the oldest CDD date from array of date strings
        findOldestCDD: function(cddData) {
            console.log(`🔍 findOldestCDD called with ${cddData ? cddData.length : 0} CDD entries:`, cddData?.slice(0, 3));
            
            if (!cddData || cddData.length === 0) {
                console.log(`⚠️ findOldestCDD: No CDD data provided`);
                return null;
            }
            
            // Sort all CDD entries by date (oldest first)
            const sortedEntries = [];
            let processedCount = 0;
            let errorCount = 0;
            
            cddData.forEach((entry, index) => {
                try {
                    const dateStr = entry.date;
                    const parts = dateStr.split(' ');
                    if (parts.length >= 1) {
                        const datePart = parts[0];
                        const timePart = parts[1] || '00:00';
                        
                        // Convert DD-MM-YYYY to YYYY-MM-DD for proper parsing
                        const dateComponents = datePart.split('-');
                        if (dateComponents.length === 3) {
                            const day = dateComponents[0];
                            const month = dateComponents[1];
                            const year = dateComponents[2];
                            
                            const formattedDate = `${year}-${month}-${day}T${timePart}`;
                            const timestamp = new Date(formattedDate).getTime();
                            
                            if (!isNaN(timestamp)) {
                                processedCount++;
                                sortedEntries.push({
                                    ...entry,
                                    timestamp: timestamp
                                });
                            }
                        }
                    }
                } catch (error) {
                    errorCount++;
                    console.warn('Error parsing CDD date:', entry, error);
                }
            });
            
            // Sort by timestamp (oldest first)
            sortedEntries.sort((a, b) => a.timestamp - b.timestamp);
            
            console.log(`📊 Sorted ${sortedEntries.length} CDD entries by date (oldest first)`);
            
            // Now check each entry starting from oldest to see if it exists in visible table
            for (let i = 0; i < sortedEntries.length; i++) {
                const candidateEntry = sortedEntries[i];
                const isVisible = this.checkCDDVisibleInTable(candidateEntry.date, candidateEntry.toteId);
                
                console.log(`🔍 Checking CDD candidate ${i + 1}/${sortedEntries.length}: ${candidateEntry.date} (Tote: ${candidateEntry.toteId}) - Visible: ${isVisible}`);
                
                if (isVisible) {
                    console.log(`✅ Found matching visible CDD:`, {
                        date: candidateEntry.date,
                        toteId: candidateEntry.toteId,
                        palletId: candidateEntry.palletId,
                        units: candidateEntry.units,
                        sortationCategory: candidateEntry.sortationCategory,
                        destination: candidateEntry.destination,
                        position: `${i + 1} of ${sortedEntries.length} sorted entries`
                    });
                    
                    // Enhanced console output
                    console.log(`🎯 VERIFIED OLDEST CDD DETAILS (matches visible table):
                    📅 Date: ${candidateEntry.date}
                    📦 Tote ID: ${candidateEntry.toteId}
                    🚛 Pallet ID: ${candidateEntry.palletId}
                    📊 Units: ${candidateEntry.units}
                    🏷️ Category: ${candidateEntry.sortationCategory}
                    🎯 Destination: ${candidateEntry.destination}
                    ⚡ Position in sorted list: ${i + 1}/${sortedEntries.length}`);
                    
                    return candidateEntry;
                }
            }
            
            // If no visible CDD found, return the oldest anyway but with warning
            if (sortedEntries.length > 0) {
                const oldestEntry = sortedEntries[0];
                console.warn(`⚠️ No visible CDD found in table! Using oldest from data: ${oldestEntry.date} (Tote: ${oldestEntry.toteId})`);
                console.log(`🔍 This suggests the visible table doesn't show all totes or there's a data mismatch.`);
                return oldestEntry;
            }
            
            console.log(`❌ No valid CDD found (processed: ${processedCount}, errors: ${errorCount})`);
            return null;
        },
        
        // Check if a specific CDD date and tote ID is visible in the current table
        checkCDDVisibleInTable: function(cddDate, toteId) {
            try {
                // Look for tables that might contain LPN/CDD information
                const tables = document.querySelectorAll('table');
                
                for (const table of tables) {
                    // Skip our own RIV enhanced tables
                    if (table.closest('[style*="position: fixed"]') || 
                        table.closest('[id*="riv"]') || 
                        table.closest('[id*="modal"]')) {
                        continue;
                    }
                    
                    const rows = table.querySelectorAll('tr');
                    
                    for (const row of rows) {
                        const cells = row.querySelectorAll('td, th');
                        const rowText = Array.from(cells).map(cell => cell.textContent.trim()).join(' ');
                        
                        // Check if this row contains our tote ID or CDD date
                        const containsToteId = rowText.includes(toteId);
                        const containsCDD = rowText.includes(cddDate.split(' ')[0]); // Check date part
                        
                        if (containsToteId || containsCDD) {
                            console.log(`🔍 Found potential match in table row:`, rowText);
                            
                            // More precise check - look for CDD column specifically
                            for (const cell of cells) {
                                const cellText = cell.textContent.trim();
                                
                                // Check for exact CDD match (with or without time)
                                if (cellText.includes(cddDate) || 
                                    cellText.includes(cddDate.split(' ')[0])) {
                                    console.log(`✅ Exact CDD match found in cell: "${cellText}"`);
                                    return true;
                                }
                            }
                        }
                    }
                }
                
                return false;
            } catch (error) {
                console.warn('Error checking CDD visibility:', error);
                return false; // If error, assume not visible to be safe
            }
        },
        
        // Verify CDD by deep scanning specific tote for items with potentially older CDD
        verifyTotelCDD: async function(currentOldestEntry) {
            try {
                console.log(`🔍 Deep verification: scanning tote ${currentOldestEntry.toteId} for items to verify CDD ${currentOldestEntry.date}`);
                
                // Get detailed information about items inside this tote
                const toteDetails = await Core.performContainerSearch(currentOldestEntry.toteId, true);
                
                if (!toteDetails || !toteDetails.childContainers || !Array.isArray(toteDetails.childContainers)) {
                    console.log(`⚠️ No child containers found in tote ${currentOldestEntry.toteId}`);
                    return currentOldestEntry; // Return original if no deeper data
                }
                
                console.log(`📦 Found ${toteDetails.childContainers.length} items in tote ${currentOldestEntry.toteId}`);
                
                let foundMatchingCDD = false;
                let actualOldestEntry = null;
                let actualOldestTimestamp = null;
                
                // Check each item (LPN) inside the tote
                toteDetails.childContainers.forEach(item => {
                    if (item.containerProperties && item.containerProperties.cleanDecantDate) {
                        const itemCDD = item.containerProperties.cleanDecantDate;
                        const itemTimestamp = this.parseTimestamp(itemCDD);
                        
                        console.log(`🔍 Item ${item.containerId}: CDD ${itemCDD}`);
                        
                        // Check if this matches our tote-level CDD
                        if (itemCDD === currentOldestEntry.date) {
                            foundMatchingCDD = true;
                            console.log(`✅ Found matching CDD in item: ${item.containerId} - ${itemCDD}`);
                        }
                        
                        // Also track the actual oldest item CDD
                        if (itemTimestamp && (actualOldestTimestamp === null || itemTimestamp < actualOldestTimestamp)) {
                            actualOldestTimestamp = itemTimestamp;
                            actualOldestEntry = {
                                date: itemCDD,
                                toteId: currentOldestEntry.toteId,
                                itemId: item.containerId, // LPN ID
                                palletId: currentOldestEntry.palletId,
                                units: 1, // Each item is 1 unit
                                sortationCategory: item.sortationCategory || currentOldestEntry.sortationCategory,
                                destination: item.destinationId || currentOldestEntry.destination,
                                source: 'item-verified',
                                asin: item.containerProperties?.Asin || 'N/A',
                                rmaId: item.containerProperties?.RMAId || 'N/A'
                            };
                        }
                    }
                });
                
                // Decision logic
                if (foundMatchingCDD) {
                    console.log(`✅ VERIFIED: Tote CDD ${currentOldestEntry.date} matches item CDD - using tote-level CDD`);
                    return {
                        ...currentOldestEntry,
                        verified: true
                    };
                } else if (actualOldestEntry) {
                    console.log(`🔄 MISMATCH: Tote CDD ${currentOldestEntry.date} not found in items. Verification failed.`);
                    console.log(`📋 Verification details:`, {
                        toteCDD: currentOldestEntry.date,
                        actualOldestItemCDD: actualOldestEntry.date,
                        itemId: actualOldestEntry.itemId,
                        verified: false
                    });
                    return {
                        ...currentOldestEntry,
                        verified: false
                    };
                } else {
                    console.log(`⚠️ No CDD found in items, verification failed`);
                    return {
                        ...currentOldestEntry,
                        verified: false
                    };
                }
                
            } catch (error) {
                console.error(`❌ Error in deep CDD verification for tote ${currentOldestEntry.toteId}:`, error);
                return currentOldestEntry; // Return original on error
            }
        },
        
        // Helper function to parse timestamp from date string
        parseTimestamp: function(dateStr) {
            try {
                if (!dateStr) return null;
                
                const parts = dateStr.split(' ');
                if (parts.length >= 1) {
                    const datePart = parts[0];
                    const timePart = parts[1] || '00:00';
                    
                    // Convert DD-MM-YYYY to YYYY-MM-DD for proper parsing
                    const dateComponents = datePart.split('-');
                    if (dateComponents.length === 3) {
                        const day = dateComponents[0];
                        const month = dateComponents[1];
                        const year = dateComponents[2];
                        
                        const formattedDate = `${year}-${month}-${day}T${timePart}`;
                        const timestamp = new Date(formattedDate).getTime();
                        
                        return isNaN(timestamp) ? null : timestamp;
                    }
                }
                return null;
            } catch (error) {
                console.warn('Error parsing timestamp:', dateStr, error);
                return null;
            }
        },
        
        // Find and verify oldest CDD by iterating through sorted candidates
        findAndVerifyOldestCDD: async function(cddData) {
            console.log(`🔍 findAndVerifyOldestCDD called with ${cddData ? cddData.length : 0} CDD entries`);
            
            if (!cddData || cddData.length === 0) {
                console.log(`⚠️ No CDD data provided`);
                return null;
            }
            
            // First, sort all entries by date (oldest first)
            const sortedCandidates = this.sortCDDEntries(cddData);
            console.log(`📊 Sorted ${sortedCandidates.length} CDD entries by date (oldest first)`);
            
            // Now iterate through candidates and verify each one
            for (let i = 0; i < sortedCandidates.length; i++) {
                const candidate = sortedCandidates[i];
                console.log(`🔍 Testing candidate ${i + 1}/${sortedCandidates.length}: ${candidate.date} (Tote: ${candidate.toteId})`);
                
                // Perform deep verification for this candidate
                const verificationResult = await this.verifyTotelCDD(candidate);
                
                // Check if the verification was successful (CDD matches)
                if (verificationResult && verificationResult.verified === true) {
                    console.log(`✅ VERIFIED MATCH FOUND at position ${i + 1}:`, {
                        date: verificationResult.date,
                        toteId: verificationResult.toteId,
                        itemId: verificationResult.itemId,
                        position: `${i + 1} of ${sortedCandidates.length}`
                    });
                    
                    console.log(`🎯 FINAL VERIFIED OLDEST CDD:
                    📅 Date: ${verificationResult.date}
                    🎨 Formatted: ${this.formatCDDDate(verificationResult.date)}
                    📦 Tote ID: ${verificationResult.toteId}
                    🏷️ Item ID: ${verificationResult.itemId || 'N/A'}
                    🚛 Pallet ID: ${verificationResult.palletId}
                    ⚡ Verified at position: ${i + 1}/${sortedCandidates.length}`);
                    
                    return verificationResult;
                }
                
                console.log(`❌ Candidate ${i + 1} failed verification, trying next...`);
            }
            
            // If no candidate was verified, return the oldest one anyway with warning
            if (sortedCandidates.length > 0) {
                const fallback = sortedCandidates[0];
                console.warn(`⚠️ No CDD candidate could be verified! Using oldest unverified: ${fallback.date} (Tote: ${fallback.toteId})`);
                fallback.verified = false;
                return fallback;
            }
            
            console.log(`❌ No valid CDD candidates found`);
            return null;
        },
        
        // Helper function to sort CDD entries by date
        sortCDDEntries: function(cddData) {
            const sortedEntries = [];
            
            cddData.forEach(entry => {
                const timestamp = this.parseTimestamp(entry.date);
                if (timestamp) {
                    sortedEntries.push({
                        ...entry,
                        timestamp: timestamp
                    });
                }
            });
            
            // Sort by timestamp (oldest first)
            sortedEntries.sort((a, b) => a.timestamp - b.timestamp);
            return sortedEntries;
        },
        
        // Convert CDD date format from "DD-MM-YYYY HH:MM" to "Wed 07 May 02:07"
        formatCDDDate: function(dateStr) {
            try {
                if (!dateStr) return 'No CDD';
                
                const parts = dateStr.split(' ');
                if (parts.length >= 1) {
                    const datePart = parts[0];
                    const timePart = parts[1] || '00:00';
                    
                    // Convert DD-MM-YYYY to proper date
                    const dateComponents = datePart.split('-');
                    if (dateComponents.length === 3) {
                        const day = dateComponents[0];
                        const month = dateComponents[1];
                        const year = dateComponents[2];
                        
                        // Create proper date string for parsing: YYYY-MM-DD
                        const properDateStr = `${year}-${month}-${day}T${timePart}`;
                        const date = new Date(properDateStr);
                        
                        if (!isNaN(date.getTime())) {
                            // Format as "Wed 07 May 02:07"
                            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            
                            const dayName = dayNames[date.getDay()];
                            const dayNum = String(date.getDate()).padStart(2, '0');
                            const monthName = monthNames[date.getMonth()];
                            const timeFormatted = timePart;
                            
                            return `${dayName} ${dayNum} ${monthName} ${timeFormatted}`;
                        }
                    }
                }
                
                // Fallback to original if parsing fails
                console.warn('Could not format CDD date:', dateStr);
                return dateStr;
                
            } catch (error) {
                console.warn('Error formatting CDD date:', dateStr, error);
                return dateStr;
            }
        },
        
        // Clean category name by removing number prefix and dash
        cleanCategoryName: function(categoryName) {
            if (!categoryName || categoryName === 'Unknown' || categoryName === 'N/A') {
                return 'Unknown';
            }
            
            // Remove pattern like "3 - " from the beginning
            const cleaned = categoryName.replace(/^\d+\s*-\s*/, '').trim();
            return cleaned || categoryName; // Return original if cleaning failed
        },
        
        // Generate detailed description with destination breakdown
        generateDescription: function(scanResults, containerId) {
            try {
                if (!scanResults || !scanResults.palletDetails) {
                    return 'No data available';
                }
                
                let description = '';
                
                // Group by cleaned category names from item level (totes)
                const destinationStats = new Map();
                
                scanResults.palletDetails.forEach(pallet => {
                    // Process each tote in the pallet to get item-level categories
                    if (pallet.totes && pallet.totes.length > 0) {
                        // Case 1: We have detailed tote data with items inside
                        pallet.totes.forEach(tote => {
                            // Get sortation category from tote (item level)
                            let category = 'Unknown';
                            if (tote.sortationCategory && tote.sortationCategory !== 'N/A') {
                                category = this.cleanCategoryName(tote.sortationCategory);
                            }
                            
                            // If still unknown, try destination as fallback
                            if (category === 'Unknown' && tote.destination && tote.destination !== 'N/A') {
                                category = tote.destination;
                            }
                            
                            console.log(`📦 Tote ${tote.toteId}: category="${category}", raw sortationCategory="${tote.sortationCategory}", units=${tote.units}`);
                            
                            if (!destinationStats.has(category)) {
                                destinationStats.set(category, { pallets: 0, units: 0 });
                            }
                            
                            const stats = destinationStats.get(category);
                            stats.units += tote.units || 0;
                        });
                        
                        // Count this pallet for the dominant category
                        if (pallet.totes.length > 0) {
                            // Find the dominant category in this pallet (by units)
                            const palletCategoryStats = new Map();
                            pallet.totes.forEach(tote => {
                                let category = 'Unknown';
                                if (tote.sortationCategory && tote.sortationCategory !== 'N/A') {
                                    category = this.cleanCategoryName(tote.sortationCategory);
                                } else if (tote.destination && tote.destination !== 'N/A') {
                                    category = tote.destination;
                                }
                                
                                if (!palletCategoryStats.has(category)) {
                                    palletCategoryStats.set(category, 0);
                                }
                                palletCategoryStats.set(category, palletCategoryStats.get(category) + (tote.units || 0));
                            });
                            
                            // Find category with most units in this pallet
                            let dominantCategory = 'Unknown';
                            let maxUnits = 0;
                            for (const [cat, units] of palletCategoryStats.entries()) {
                                if (units > maxUnits) {
                                    maxUnits = units;
                                    dominantCategory = cat;
                                }
                            }
                            
                            // Add pallet count to dominant category
                            if (destinationStats.has(dominantCategory)) {
                                destinationStats.get(dominantCategory).pallets += 1;
                            }
                            
                            console.log(`🚛 Pallet ${pallet.palletId}: dominant category="${dominantCategory}" (${maxUnits} units)`);
                        }
                    } else {
                        // Case 2: We only have basic pallet data, use pallet-level or tote-level categories
                        let category = 'Unknown';
                        let totalUnits = 0;
                        
                        // Try to get category from pallet level first
                        if (pallet.sortationCategory && pallet.sortationCategory !== 'N/A') {
                            category = this.cleanCategoryName(pallet.sortationCategory);
                            totalUnits = pallet.unitCount || 0;
                        }
                        // Use the raw pallet data from the scan results to get tote categories
                        else {
                            // Find corresponding raw pallet data in scanResults
                            const rawPalletData = scanResults.containerInfo?.childContainers?.find(p => p.containerId === pallet.palletId);
                            if (rawPalletData && rawPalletData.childContainers && rawPalletData.childContainers.length > 0) {
                                console.log(`🔍 Found raw pallet data for ${pallet.palletId} with ${rawPalletData.childContainers.length} totes`);
                                
                                // Collect all categories and units from totes
                                const categoryCounts = new Map();
                                let palletTotalUnits = 0;
                                
                                rawPalletData.childContainers.forEach(tote => {
                                    const toteUnits = tote.numOfChildContainers || 0;
                                    palletTotalUnits += toteUnits;
                                    
                                    // Get category from sortationCategories array
                                    if (tote.sortationCategories && Array.isArray(tote.sortationCategories) && tote.sortationCategories.length > 0) {
                                        const rawCategory = tote.sortationCategories[0]; // Use first category
                                        const cleanedCategory = this.cleanCategoryName(rawCategory);
                                        
                                        if (!categoryCounts.has(cleanedCategory)) {
                                            categoryCounts.set(cleanedCategory, 0);
                                        }
                                        categoryCounts.set(cleanedCategory, categoryCounts.get(cleanedCategory) + toteUnits);
                                        
                                        console.log(`📦 Tote ${tote.containerId}: rawCategory="${rawCategory}", cleanedCategory="${cleanedCategory}", units=${toteUnits}`);
                                    }
                                });
                                
                                // Find dominant category (most units)
                                let dominantCategory = 'Unknown';
                                let maxUnits = 0;
                                for (const [cat, units] of categoryCounts.entries()) {
                                    if (units > maxUnits) {
                                        maxUnits = units;
                                        dominantCategory = cat;
                                    }
                                }
                                
                                category = dominantCategory;
                                totalUnits = palletTotalUnits;
                                
                                console.log(`🚛 Pallet ${pallet.palletId}: dominant category="${dominantCategory}" from ${categoryCounts.size} categories, total units=${totalUnits}`);
                                console.log(`📊 Category breakdown:`, Array.from(categoryCounts.entries()));
                            } else {
                                console.warn(`⚠️ No raw pallet data found for ${pallet.palletId}`);
                                totalUnits = pallet.unitCount || 0;
                            }
                        }
                        
                        console.log(`📦 Pallet ${pallet.palletId} (basic data): category="${category}", units=${totalUnits}`);
                        
                        if (!destinationStats.has(category)) {
                            destinationStats.set(category, { pallets: 0, units: 0 });
                        }
                        
                        const stats = destinationStats.get(category);
                        stats.pallets += 1;
                        stats.units += totalUnits;
                    }
                });
                
                // Sort destinations by pallets (descending) to show most important first
                const sortedDestinations = Array.from(destinationStats.entries()).sort((a, b) => b[1].pallets - a[1].pallets);
                
                // Add each destination line in format "CATEGORY:pallets/units"
                sortedDestinations.forEach(([category, stats]) => {
                    if (description !== '') description += '\n';
                    description += `${category}:${stats.pallets}/${stats.units}`;
                });
                
                // Add total line only if there are multiple destinations
                if (sortedDestinations.length > 1) {
                    const totalUnits = scanResults.totalUnits || 0;
                    const totalPallets = scanResults.totalPallets || 0;
                    if (description !== '') description += '\n';
                    description += `TOTAL:${totalPallets}/${totalUnits}`;
                }
                
                console.log(`📝 Generated description for ${containerId}:`, description);
                console.log(`📊 Final destination stats:`, Array.from(destinationStats.entries()));
                return description;
                
            } catch (error) {
                console.error('Error generating description:', error);
                return 'Error generating description';
            }
        },
        
        // Add Units and CSV columns to search results table (like original)
        enhanceSearchResultsTable: function() {
            // Only enhance tables if we're on the search page
            if (!this.isOnSearchPage()) {
                return;
            }
            
            const tables = document.querySelectorAll('table');
            
            tables.forEach(table => {
                if (this.isSearchResultsTable(table) && !table.querySelector('[data-riv-column]')) {
                    this.addUnitsAndCSVColumns(table);
                    // Also clean up sortation category cells
                    this.cleanSortationCategoryCells(table);
                }
            });
        },
        
        // Check if we're currently on the search page
        isOnSearchPage: function() {
            return window.location.pathname.includes('/search') || 
                   document.title.toLowerCase().includes('search') ||
                   document.querySelector('[data-testid="search"]') !== null;
        },
        
        // Check if table is a search results table
        isSearchResultsTable: function(table) {
            // Don't enhance tables in modals or overlays
            const modal = table.closest('[style*="position: fixed"]');
            const overlay = table.closest('[id*="-app"], [id*="modal"], [id*="overlay"]');
            if (modal || overlay) {
                return false;
            }
            
            // Must have the specific search container table class
            if (!table.classList.contains('searched-container-table')) {
                return false;
            }
            
            const headers = table.querySelectorAll('th');
            const headerTexts = Array.from(headers).map(h => h.textContent.trim());
            
            // Look for specific search result table headers
            const hasTrailerInfo = headerTexts.some(text => text.includes('TRAILER Information'));
            const hasContainerInfo = headerTexts.some(text => text.includes('Container Information'));
            const hasTrailerID = headerTexts.some(text => text.includes('Trailer ID'));
            const hasPallet = headerTexts.some(text => text.includes('PALLET'));
            const hasTote = headerTexts.some(text => text.includes('TOTE'));
            
            // Must be a search results table with proper structure
            return (hasTrailerInfo || hasContainerInfo) && (hasTrailerID || hasPallet || hasTote);
        },
        
        // Add Units and CSV columns to table (exactly like original)
        addUnitsAndCSVColumns: function(table) {
            const headerRows = table.querySelectorAll('thead tr');
            
            // First, shorten existing column names to save space
            this.shortenColumnNames(table);
            
            // Copy functionality is now handled globally - no need for table-specific setup
            
            // First header row (main title) - update colspan
            if (headerRows[0]) {
                const mainHeader = headerRows[0].querySelector('th');
                if (mainHeader) {
                    const currentColspan = parseInt(mainHeader.getAttribute('colspan')) || 6;
                    mainHeader.setAttribute('colspan', currentColspan + 4); // +4 for Units, CSV, CDD, Description
                }
            }
            
            // Second header row - add Units and CSV headers
            if (headerRows[1]) {
                // Add Units column header
                const totalItemsHeader = document.createElement('th');
                totalItemsHeader.className = 'css-18tzy6q';
                totalItemsHeader.scope = 'col';
                totalItemsHeader.setAttribute('data-riv-column', 'true');
                totalItemsHeader.innerHTML = '<span>Units</span>';
                headerRows[1].appendChild(totalItemsHeader);
                
                // Add CDD column header
                const cddHeader = document.createElement('th');
                cddHeader.className = 'css-18tzy6q';
                cddHeader.scope = 'col';
                cddHeader.setAttribute('data-riv-cdd-column', 'true');
                cddHeader.innerHTML = '<span>CDD</span>';
                headerRows[1].appendChild(cddHeader);
                
                // Add Description column header
                const descHeader = document.createElement('th');
                descHeader.className = 'css-18tzy6q';
                descHeader.scope = 'col';
                descHeader.setAttribute('data-riv-desc-column', 'true');
                descHeader.innerHTML = '<span>Description</span>';
                headerRows[1].appendChild(descHeader);
                
                // Add CSV column header
                const csvHeader = document.createElement('th');
                csvHeader.className = 'css-18tzy6q';
                csvHeader.scope = 'col';
                csvHeader.setAttribute('data-riv-csv-column', 'true');
                csvHeader.innerHTML = '<span>CSV</span>';
                headerRows[1].appendChild(csvHeader);
            }
            
            // Add data cells to existing data row
            const dataRows = table.querySelectorAll('tbody tr');
            dataRows.forEach((row, index) => {
                if (!row.querySelector('td[data-riv-cell]')) {
                    // Add Units cell
                    const totalItemsCell = document.createElement('td');
                    totalItemsCell.className = 'css-18tzy6q';
                    totalItemsCell.setAttribute('data-riv-cell', 'true');
                    totalItemsCell.innerHTML = `<span id="riv-total-items-${index}">Analyzing...</span>`;
                    row.appendChild(totalItemsCell);
                    
                    // Add CDD cell
                    const cddCell = document.createElement('td');
                    cddCell.className = 'css-18tzy6q';
                    cddCell.setAttribute('data-riv-cdd-cell', 'true');
                    cddCell.innerHTML = `<span id="riv-cdd-${index}">-</span>`;
                    row.appendChild(cddCell);
                    
                    // Add Description cell
                    const descCell = document.createElement('td');
                    descCell.className = 'css-18tzy6q';
                    descCell.setAttribute('data-riv-desc-cell', 'true');
                    descCell.innerHTML = `<span id="riv-desc-${index}">-</span>`;
                    row.appendChild(descCell);
                    
                    // Add CSV cell
                    const csvCell = document.createElement('td');
                    csvCell.className = 'css-18tzy6q';
                    csvCell.setAttribute('data-riv-csv-cell', 'true');
                    csvCell.style.textAlign = 'center';
                    csvCell.innerHTML = `<button id="riv-export-btn-${index}" style="display:none; background:none; border:none; cursor:pointer; font-size:16px; padding:5px;" title="Download CSV">📊</button>`;
                    row.appendChild(csvCell);
                    
                    // Start analysis for this container
                    this.analyzeContainerInRow(row, index);
                }
            });
        },
        
        // Get container ID from table row
        getContainerIdFromRow: function(row) {
            const cells = row.querySelectorAll('td');
            for (const cell of cells) {
                const text = cell.textContent.trim();
                // Look for container ID patterns
                if (text.match(/^[A-Z0-9-]+$/i) && text.length > 3) {
                    return text;
                }
            }
            return '';
        },
        
        // Add Ctrl+Click copy functionality to container ID cells
        addContainerIdCopyFunctionality: function(table) {
            const containerIdCells = this.findContainerIdCells(table);
            
            containerIdCells.forEach(cell => {
                // Skip if already enhanced
                if (cell.dataset.rivCopyEnabled) return;
                
                // Mark as enhanced
                cell.dataset.rivCopyEnabled = 'true';
                
                // Get the container ID text
                const containerIdText = cell.textContent.trim();
                
                // Add visual indication that Ctrl+Click is available
                cell.style.position = 'relative';
                cell.title = `Container ID: ${containerIdText}\nCtrl+Click to copy instead of search`;
                
                // Add subtle visual indicator
                const copyIndicator = document.createElement('span');
                copyIndicator.innerHTML = '📋';
                copyIndicator.style.cssText = `
                    position: absolute;
                    top: 2px;
                    right: 2px;
                    font-size: 10px;
                    opacity: 0.3;
                    pointer-events: none;
                    transition: opacity 0.2s ease;
                `;
                cell.appendChild(copyIndicator);
                
                // Show indicator on hover
                cell.addEventListener('mouseenter', () => {
                    if (copyIndicator) copyIndicator.style.opacity = '0.7';
                });
                
                cell.addEventListener('mouseleave', () => {
                    if (copyIndicator) copyIndicator.style.opacity = '0.3';
                });
                
                // Add click event handler using capture phase to intercept before child elements
                cell.addEventListener('click', (event) => {
                    if (event.ctrlKey || event.metaKey) {
                        // Ctrl+Click: Copy to clipboard
                        event.preventDefault();
                        event.stopPropagation();
                        event.stopImmediatePropagation(); // Stop other handlers on the same element
                        
                        this.copyToClipboard(containerIdText);
                        
                        // Visual feedback
                        this.showCopyFeedback(cell, containerIdText);
                        
                        console.log(`📋 Copied container ID: ${containerIdText}`);
                        
                        return false; // Extra precaution to prevent default behavior
                    }
                    // Regular click: Let the original functionality proceed (search)
                }, true); // Use capture phase to intercept before any child element handlers
            });
        },
        
        // Find container ID cells in the table
        findContainerIdCells: function(table) {
            const containerIdCells = [];
            
            // Look through all table cells for container ID patterns
            const allCells = table.querySelectorAll('td');
            
            allCells.forEach(cell => {
                const text = cell.textContent.trim();
                
                // Container ID patterns: Usually alphanumeric with dashes, 4+ characters
                // Common patterns: DZ-CDPL-A01, P001234567, TOTE123456, etc.
                if (this.looksLikeContainerId(text) && this.isCellClickable(cell)) {
                    containerIdCells.push(cell);
                }
            });
            
            return containerIdCells;
        },
        
        // Check if text looks like a container ID
        looksLikeContainerId: function(text) {
            // Skip empty or very short text
            if (!text || text.length < 4) return false;
            
            // Skip common non-container text
            const excludePatterns = [
                /^\d{1,3}$/, // Simple numbers (quantities, etc.)
                /^(yes|no|true|false)$/i,
                /^(processing|urgent|tech|sideline)$/i,
                /^\d{1,2}\/\d{1,2}\/\d{2,4}/, // Dates
                /^\d{1,2}:\d{2}/, // Times
                /^[a-z\s]+$/i // Pure text without numbers or special chars
            ];
            
            for (const pattern of excludePatterns) {
                if (pattern.test(text)) return false;
            }
            
            // Container ID patterns
            const containerPatterns = [
                /^[A-Z0-9]{3,}-[A-Z0-9]{3,}-[A-Z0-9]{2,}$/i, // DZ-CDPL-A01 format
                /^[P]\d{6,}$/i, // Pallet IDs like P001234567
                /^[T][A-Z0-9]{5,}$/i, // Tote IDs like TOTE123456
                /^[A-Z]{2,4}\d{6,}$/i, // General container format
                /^[A-Z0-9]{8,}$/i, // Long alphanumeric IDs
                /^[A-Z0-9-]{6,}$/i // General pattern with dashes
            ];
            
            return containerPatterns.some(pattern => pattern.test(text));
        },
        
        // Check if cell appears to be clickable (has cursor pointer or click handlers)
        isCellClickable: function(cell) {
            const style = window.getComputedStyle(cell);
            const hasPointerCursor = style.cursor === 'pointer';
            const hasClickHandler = cell.onclick !== null;
            const hasEventListeners = cell.hasAttribute('onclick');
            const isInClickableRow = cell.closest('tr[onclick]') !== null;
            
            return hasPointerCursor || hasClickHandler || hasEventListeners || isInClickableRow;
        },
        
        // Copy text to clipboard
        copyToClipboard: function(text) {
            if (navigator.clipboard && window.isSecureContext) {
                // Use modern Clipboard API
                navigator.clipboard.writeText(text).catch(err => {
                    console.warn('Failed to copy using Clipboard API:', err);
                    this.fallbackCopyToClipboard(text);
                });
            } else {
                // Fallback for older browsers
                this.fallbackCopyToClipboard(text);
            }
        },
        
        // Fallback copy method for older browsers
        fallbackCopyToClipboard: function(text) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.cssText = 'position: fixed; top: -1000px; opacity: 0;';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                console.log('✅ Fallback copy successful');
            } catch (err) {
                console.warn('❌ Fallback copy failed:', err);
            } finally {
                document.body.removeChild(textArea);
            }
        },
        
        // Show visual feedback when copying
        showCopyFeedback: function(cell, copiedText) {
            // Create feedback element
            const feedback = document.createElement('div');
            feedback.textContent = `Copied: ${copiedText}`;
            feedback.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #28a745;
                color: white;
                padding: 8px 16px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 500;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                z-index: 999999;
                opacity: 0;
                transform: translateY(-10px);
                transition: all 0.3s ease;
            `;
            
            document.body.appendChild(feedback);
            
            // Animate in
            setTimeout(() => {
                feedback.style.opacity = '1';
                feedback.style.transform = 'translateY(0)';
            }, 10);
            
            // Remove after delay
            setTimeout(() => {
                feedback.style.opacity = '0';
                feedback.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    if (feedback.parentNode) {
                        feedback.parentNode.removeChild(feedback);
                    }
                }, 300);
            }, 2000);
            
            // Brief highlight of the copied cell
            const originalBg = cell.style.backgroundColor;
            const originalTransition = cell.style.transition;
            
            cell.style.transition = 'background-color 0.3s ease';
            cell.style.backgroundColor = '#d4edda';
            
            setTimeout(() => {
                cell.style.backgroundColor = originalBg;
                setTimeout(() => {
                    cell.style.transition = originalTransition;
                }, 300);
            }, 500);
        },
        
        // Shorten column names to save space
        shortenColumnNames: function(table) {
            const columnMappings = {
                'Sortation Category': 'Category',
                'Latest Operation Associate': 'Associate',
                'Trailer ID': 'Trailer'
            };
            
            // Find all header cells and shorten long column names
            const headerCells = table.querySelectorAll('thead th');
            headerCells.forEach(cell => {
                const span = cell.querySelector('span');
                if (span) {
                    const originalText = span.textContent.trim();
                    if (columnMappings[originalText]) {
                        span.textContent = columnMappings[originalText];
                        cell.title = originalText; // Keep original text in tooltip
                        console.log(`📏 Shortened column: "${originalText}" → "${columnMappings[originalText]}"`);
                    }
                }
            });
        },
        
        // Clean and format sortation category cells to save space
        cleanSortationCategoryCells: function(table) {
            // Find the sortation category column index
            const headerRow = table.querySelector('thead tr:last-child');
            if (!headerRow) return;
            
            const headers = headerRow.querySelectorAll('th');
            let categoryColumnIndex = -1;
            
            headers.forEach((header, index) => {
                const headerText = header.textContent.trim().toLowerCase();
                if (headerText.includes('sortation') || headerText.includes('category')) {
                    categoryColumnIndex = index;
                }
            });
            
            if (categoryColumnIndex === -1) {
                console.log('📝 Sortation Category column not found');
                return;
            }
            
            console.log(`📝 Found Sortation Category column at index ${categoryColumnIndex}`);
            
            // Process each data row
            const dataRows = table.querySelectorAll('tbody tr');
            dataRows.forEach((row, rowIndex) => {
                const cells = row.querySelectorAll('td');
                if (cells[categoryColumnIndex]) {
                    const cell = cells[categoryColumnIndex];
                    const span = cell.querySelector('span');
                    if (span) {
                        const originalText = span.textContent.trim();
                        
                        if (originalText && originalText !== '-' && originalText.length > 0) {
                            const cleanedText = this.formatSortationCategoryText(originalText);
                            
                            // Update the cell content
                            span.innerHTML = cleanedText.replace(/\n/g, '<br>');
                            cell.style.lineHeight = '1.3'; // Compact line spacing
                            cell.style.whiteSpace = 'normal'; // Allow line breaks
                            cell.title = originalText; // Keep original in tooltip
                            
                            console.log(`📝 Cleaned category cell ${rowIndex}: "${originalText}" → "${cleanedText.replace(/\n/g, ' | ')}"`);
                        }
                    }
                }
            });
        },
        
        // Format sortation category text: clean and display on separate lines
        formatSortationCategoryText: function(originalText) {
            try {
                // Split by comma to get individual categories
                const categories = originalText.split(',').map(cat => cat.trim());
                
                // Clean each category by removing number prefix
                const cleanedCategories = categories.map(category => {
                    return this.cleanCategoryName(category);
                }).filter(cat => cat && cat !== 'Unknown'); // Remove empty or Unknown
                
                // Join with line breaks for vertical display
                return cleanedCategories.join('\n');
                
            } catch (error) {
                console.warn('Error formatting sortation category text:', originalText, error);
                return originalText; // Return original on error
            }
        },
        
        // Analyze container and update Units count
        analyzeContainerInRow: async function(row, index) {
            const containerId = this.getContainerIdFromRow(row);
            if (!containerId) return;
            
            const totalItemsElement = document.getElementById(`riv-total-items-${index}`);
            const exportButton = document.getElementById(`riv-export-btn-${index}`);
            
            if (!totalItemsElement) return;
            
            try {
                // Update progress
                totalItemsElement.innerHTML = '<span>Scanning...</span>';
                
                // Perform deep scan using our advanced function
                const scanResults = await this.performAdvancedDeepScan(containerId, 
                    (message, progress) => {
                        if (totalItemsElement) {
                            totalItemsElement.innerHTML = `<span>${Math.round(progress)}%</span>`;
                            totalItemsElement.title = message;
                        }
                    }
                );
                
                // Update with final results
                if (totalItemsElement) {
                    totalItemsElement.innerHTML = `<strong>${scanResults.totalUnits}</strong>`;
                    totalItemsElement.title = `Deep scan completed: ${scanResults.totalPallets} pallets, ${scanResults.totalTotes} totes, ${scanResults.totalUnits} units`;
                    
                    // Add subtle highlight to the cell
                    const cell = totalItemsElement.closest('td');
                    if (cell) {
                        cell.style.background = 'rgba(40, 167, 69, 0.1)';
                        cell.style.border = '1px solid rgba(40, 167, 69, 0.3)';
                    }
                }
                
                // Update CDD field
                const cddElement = document.getElementById(`riv-cdd-${index}`);
                console.log(`🔍 Looking for CDD element: riv-cdd-${index}`, cddElement);
                console.log(`🔍 Scan results CDD:`, scanResults.oldestCDD);
                
                if (cddElement) {
                    if (scanResults.oldestCDD) {
                        // Format CDD for display in new format
                        const cddDisplay = this.formatCDDDate(scanResults.oldestCDD);
                        cddElement.innerHTML = cddDisplay;
                        
                        // Enhanced tooltip with detailed info
                        if (scanResults.oldestCDDDetails) {
                            const details = scanResults.oldestCDDDetails;
                            cddElement.title = `Oldest Clean Decant Date: ${details.date}
                            Tote ID: ${details.toteId}
                            Pallet ID: ${details.palletId}
                            Units: ${details.units}
                            Category: ${details.sortationCategory}
                            Destination: ${details.destination}
                            Formatted: ${cddDisplay}`;
                        } else {
                            cddElement.title = `Oldest Clean Decant Date: ${scanResults.oldestCDD}
                            Formatted: ${cddDisplay}`;
                        }
                        
                        cddElement.style.whiteSpace = 'nowrap'; // Prevent wrapping
                        console.log(`✅ CDD updated to: ${cddDisplay} (original: ${scanResults.oldestCDD})`);
                    } else {
                        cddElement.innerHTML = 'No CDD';
                        console.log(`⚠️ No CDD found for container`);
                    }
                } else {
                    console.error(`❌ CDD element not found: riv-cdd-${index}`);
                }
                
                // Update Description field
                const descElement = document.getElementById(`riv-desc-${index}`);
                console.log(`🔍 Looking for Description element: riv-desc-${index}`, descElement);
                
                if (descElement) {
                    const description = this.generateDescription(scanResults, containerId);
                    // Use white-space: pre-line to preserve line breaks
                    descElement.innerHTML = description.replace(/\n/g, '<br>');
                    descElement.style.whiteSpace = 'pre-line';
                    descElement.style.lineHeight = '1.2';
                    descElement.title = description; // Full text in tooltip
                    console.log(`✅ Description updated for container ${containerId}`);
                } else {
                    console.error(`❌ Description element not found: riv-desc-${index}`);
                }
                
                // Show export button
                if (exportButton) {
                    exportButton.style.display = 'block';
                    exportButton.onclick = () => this.exportAdvancedScanResults(scanResults);
                }
                
                // Store results for export
                window[`rivScanResults_${index}`] = scanResults;
                
                console.log(`✅ Container ${containerId} analysis complete:`, scanResults);
                
            } catch (error) {
                console.error(`❌ Error analyzing ${containerId}:`, error);
                
                if (totalItemsElement) {
                    totalItemsElement.innerHTML = '<span>Error</span>';
                    totalItemsElement.title = error.message;
                    
                    // Add error styling
                    const cell = totalItemsElement.closest('td');
                    if (cell) {
                        cell.style.background = 'rgba(220, 53, 69, 0.1)';
                        cell.style.border = '1px solid rgba(220, 53, 69, 0.3)';
                    }
                }
                
                // Update Description with error
                const descElement = document.getElementById(`riv-desc-${index}`);
                if (descElement) {
                    descElement.innerHTML = 'Analysis failed';
                    descElement.title = error.message;
                }
            }
        },
        
        // Export container data (for CSV button)
        exportContainerData: function(containerId) {
            // Find the scan results for this container
            for (let key in window) {
                if (key.startsWith('rivScanResults_') && window[key] && window[key].containerId === containerId) {
                    this.exportAdvancedScanResults(window[key]);
                    return;
                }
            }
            alert('No scan data found for this container. Please wait for analysis to complete.');
        },
        
        // Start monitoring for search results tables
        startTableMonitoring: function() {
            // Check for tables immediately
            this.enhanceSearchResultsTable();
            
            // Set up mutation observer to watch for new tables
            const observer = new MutationObserver((mutations) => {
                let shouldCheck = false;
                
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                if (node.tagName === 'TABLE' || node.querySelector('table')) {
                                    shouldCheck = true;
                                }
                            }
                        });
                    }
                });
                
                if (shouldCheck) {
                    setTimeout(() => this.enhanceSearchResultsTable(), 500);
                }
            });
            
            // Start observing
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            // Also check periodically for tables that might be dynamically created
            setInterval(() => {
                this.enhanceSearchResultsTable();
            }, 2000);
            
            console.log('🔍 Search table monitoring started');
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
            dashboardCustomDestinations: 'DZ-CD-ALL',
            // Category to destination mappings
            categoryMappings: {
                '6 - NON TECH TTA': 'BTS2',
                '4 - FAST PROCESSING TTA': 'BTS2',
                'S&A FAST PROCESSING TTA': 'KTW1',
                'NON TECH TTA LCJ4': 'LCJ4',
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
                '1 - TECH TTA': 'BTS2',
                'Tech TTA LCJ4': 'LCJ4'
            }
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
            
            // Category mappings
            const categoryMappingsInput = document.getElementById('category-mappings');

            this.settings.filenamePrefix = filenamePrefixInput?.value || 'RIV';
            this.settings.includeTimestamp = includeTimestampInput?.checked || false;
            this.settings.showPalletLand = showPalletLandInput?.checked ?? true; // Default true if undefined
            
            // PalletLand settings
            this.settings.palletlandCustomDestinations = customDestInput?.value || '';
            
            // Dashboard settings
            this.settings.dashboardCustomDestinations = dashboardCustomDestInput?.value || '';
            
            // Category mappings
            if (categoryMappingsInput) {
                try {
                    const mappings = JSON.parse(categoryMappingsInput.value);
                    if (typeof mappings === 'object' && mappings !== null) {
                        this.settings.categoryMappings = mappings;
                        console.log('✅ Category mappings updated successfully');
                    }
                } catch (e) {
                    console.warn('⚠️ Invalid category mappings JSON, keeping previous settings:', e.message);
                }
            }
            
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
            
            // Category mappings
            const categoryMappingsInput = document.getElementById('category-mappings');

            if (filenamePrefixInput) filenamePrefixInput.value = this.settings.filenamePrefix;
            if (includeTimestampInput) includeTimestampInput.checked = this.settings.includeTimestamp;
            if (showPalletLandInput) showPalletLandInput.checked = this.settings.showPalletLand;
            
            // PalletLand settings
            if (customDestInput) customDestInput.value = this.settings.palletlandCustomDestinations || '';
            
            // Dashboard settings
            if (dashboardCustomDestInput) dashboardCustomDestInput.value = this.settings.dashboardCustomDestinations || '';
            
            // Category mappings
            if (categoryMappingsInput) {
                const mappings = this.settings.categoryMappings || this.defaultSettings.categoryMappings;
                categoryMappingsInput.value = JSON.stringify(mappings, null, 2);
            }
            
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

            // Create modal content - much larger size
            const modal = document.createElement('div');
            modal.style.cssText = `
                background: white;
                border-radius: 12px;
                padding: 0;
                width: 95%;
                max-width: 1200px;
                height: 90vh;
                max-height: 800px;
                overflow: hidden;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                display: flex;
                flex-direction: column;
            `;

            modal.innerHTML = `
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 2px solid #e0e0e0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                    <h2 style="margin: 0; font-size: 24px; font-weight: 600;">⚙️ RIV - ReloUp Settings</h2>
                    <button id="close-settings" style="background: rgba(255,255,255,0.2); border: none; font-size: 28px; cursor: pointer; color: white; padding: 5px 10px; border-radius: 6px; transition: all 0.3s ease;">&times;</button>
                </div>
                
                <!-- Tab Navigation -->
                <div style="display: flex; background: #f8f9fa; border-bottom: 1px solid #dee2e6;">
                    <button class="settings-tab" data-tab="interface" style="flex: 1; padding: 15px 20px; background: white; border: none; border-bottom: 3px solid #007bff; cursor: pointer; font-weight: 600; color: #007bff; transition: all 0.3s ease;">
                        🎨 Interface
                    </button>
                    <button class="settings-tab" data-tab="palletland" style="flex: 1; padding: 15px 20px; background: transparent; border: none; border-bottom: 3px solid transparent; cursor: pointer; font-weight: 500; color: #6c757d; transition: all 0.3s ease;">
                        📦 Palletland
                    </button>
                    <button class="settings-tab" data-tab="dashboard" style="flex: 1; padding: 15px 20px; background: transparent; border: none; border-bottom: 3px solid transparent; cursor: pointer; font-weight: 500; color: #6c757d; transition: all 0.3s ease;">
                        📊 Dashboard
                    </button>
                    <button class="settings-tab" data-tab="advanced" style="flex: 1; padding: 15px 20px; background: transparent; border: none; border-bottom: 3px solid transparent; cursor: pointer; font-weight: 500; color: #6c757d; transition: all 0.3s ease;">
                        🔧 Advanced
                    </button>
                </div>
                
                <!-- Tab Content Container -->
                <div style="flex: 1; overflow-y: auto; padding: 30px;">
                    
                    <!-- Interface Tab -->
                    <div id="tab-interface" class="tab-content" style="display: block;">
                        <div style="max-width: 800px; margin: 0 auto;">
                            <h3 style="color: #495057; margin-bottom: 20px; font-size: 20px; display: flex; align-items: center;">
                                🎨 <span style="margin-left: 10px;">Interface Settings</span>
                            </h3>
                            
                            <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 25px;">
                                <h4 style="color: #6c757d; margin-bottom: 15px; font-size: 16px;">Menu Options</h4>
                                
                                <label style="display: flex; align-items: center; margin-bottom: 15px; cursor: pointer; padding: 10px; border-radius: 8px; transition: background-color 0.3s ease;" onmouseover="this.style.backgroundColor='#f8f9fa'" onmouseout="this.style.backgroundColor='transparent'">
                                    <input type="checkbox" id="show-palletland" style="margin-right: 15px; transform: scale(1.2);">
                                    <div>
                                        <div style="font-weight: 500; color: #495057;">Show Palletland option in footer menu</div>
                                        <div style="font-size: 12px; color: #6c757d; margin-top: 2px;">Enable/disable the Palletland feature in the footer navigation</div>
                                    </div>
                                </label>
                            </div>
                            
                            <div style="background: #e3f2fd; padding: 20px; border-radius: 12px; border-left: 4px solid #2196f3;">
                                <h5 style="margin: 0 0 8px 0; color: #1976d2; font-size: 14px;">💡 Tip</h5>
                                <p style="margin: 0; font-size: 13px; color: #1565c0; line-height: 1.5;">
                                    Uncheck the Palletland option if you only need Dashboard functionality. This will clean up the footer menu and focus on core features.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Palletland Tab -->
                    <div id="tab-palletland" class="tab-content" style="display: none;">
                        <div style="max-width: 1000px; margin: 0 auto;">
                            <h3 style="color: #495057; margin-bottom: 20px; font-size: 20px; display: flex; align-items: center;">
                                📦 <span style="margin-left: 10px;">Palletland Configuration</span>
                            </h3>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px;">
                                <!-- Destination Segments -->
                                <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                    <h4 style="color: #6c757d; margin-bottom: 15px; font-size: 16px;">🎯 Destination Segments</h4>
                                    <div id="segments-container" style="border: 1px solid #dee2e6; padding: 15px; border-radius: 8px; background: #f8f9fa; margin-bottom: 15px; min-height: 200px;">
                                        <!-- Segments will be dynamically generated here -->
                                    </div>
                                    <button type="button" id="add-segment" style="width: 100%; padding: 10px; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; transition: background-color 0.3s ease;">
                                        + Add New Segment
                                    </button>
                                </div>
                                
                                <!-- Custom Destinations -->
                                <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                    <h4 style="color: #6c757d; margin-bottom: 15px; font-size: 16px;">📝 Custom Destinations</h4>
                                    <label style="display: block; margin-bottom: 10px; font-size: 14px; color: #6c757d;">
                                        Additional destinations (one per line):
                                    </label>
                                    <textarea id="custom-destinations"
                                              style="width: 100%; height: 200px; padding: 12px; font-family: 'Courier New', monospace; font-size: 13px; border: 1px solid #dee2e6; border-radius: 8px; resize: vertical;"></textarea>
                                </div>
                            </div>
                            
                            <div style="background: #e8f5e8; padding: 20px; border-radius: 12px; border-left: 4px solid #28a745; margin-top: 25px;">
                                <h5 style="margin: 0 0 8px 0; color: #155724; font-size: 14px;">💡 How it works</h5>
                                <p style="margin: 0; font-size: 13px; color: #155724; line-height: 1.5;">
                                    <strong>Segments:</strong> Prefix "DZ-CDPL-A" from 1 to 25 generates: DZ-CDPL-A01, DZ-CDPL-A02, ..., DZ-CDPL-A25<br>
                                    <strong>Custom:</strong> Use for special zones that don't follow the standard naming pattern
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Dashboard Tab -->
                    <div id="tab-dashboard" class="tab-content" style="display: none;">
                        <div style="max-width: 1000px; margin: 0 auto;">
                            <h3 style="color: #495057; margin-bottom: 20px; font-size: 20px; display: flex; align-items: center;">
                                📊 <span style="margin-left: 10px;">Dashboard Configuration</span>
                            </h3>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px;">
                                <!-- Dashboard Segments -->
                                <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                    <h4 style="color: #6c757d; margin-bottom: 15px; font-size: 16px;">🎯 Dashboard Segments</h4>
                                    <div id="dashboard-segments-container" style="border: 1px solid #dee2e6; padding: 15px; border-radius: 8px; background: #f8f9fa; margin-bottom: 15px; min-height: 200px;">
                                        <!-- Dashboard segments will be dynamically generated here -->
                                    </div>
                                    <button type="button" id="add-dashboard-segment" style="width: 100%; padding: 10px; background: #17a2b8; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; transition: background-color 0.3s ease;">
                                        + Add Dashboard Segment
                                    </button>
                                </div>
                                
                                <!-- Custom Dashboard Destinations -->
                                <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                    <h4 style="color: #6c757d; margin-bottom: 15px; font-size: 16px;">📝 Custom Dashboard Destinations</h4>
                                    <label style="display: block; margin-bottom: 10px; font-size: 14px; color: #6c757d;">
                                        Additional destinations (one per line):
                                    </label>
                                    <textarea id="dashboard-custom-destinations" placeholder="DZ-CDALL&#10;DZ-SPECIAL&#10;DZ-OVERFLOW" 
                                              style="width: 100%; height: 200px; padding: 12px; font-family: 'Courier New', monospace; font-size: 13px; border: 1px solid #dee2e6; border-radius: 8px; resize: vertical;"></textarea>
                                </div>
                            </div>
                            
                            <div style="background: #e3f2fd; padding: 20px; border-radius: 12px; border-left: 4px solid #2196f3; margin-top: 25px;">
                                <h5 style="margin: 0 0 8px 0; color: #1976d2; font-size: 14px;">📈 Dashboard vs Palletland</h5>
                                <p style="margin: 0; font-size: 13px; color: #1565c0; line-height: 1.5;">
                                    <strong>Dashboard:</strong> Quick overview with fewer zones for daily monitoring<br>
                                    <strong>Palletland:</strong> Comprehensive analysis with many zones for detailed reporting
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Advanced Tab -->
                    <div id="tab-advanced" class="tab-content" style="display: none;">
                        <div style="max-width: 800px; margin: 0 auto;">
                            <h3 style="color: #495057; margin-bottom: 20px; font-size: 20px; display: flex; align-items: center;">
                                🔧 <span style="margin-left: 10px;">Advanced Settings</span>
                            </h3>
                            
                            <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 25px;">
                                <h4 style="color: #6c757d; margin-bottom: 15px; font-size: 16px;">📁 Export Settings</h4>
                                
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                                    <label style="display: block;">
                                        <span style="display: block; margin-bottom: 5px; font-weight: 500; color: #495057;">Filename Prefix:</span>
                                        <input type="text" id="filename-prefix" style="width: 100%; padding: 10px; border: 1px solid #dee2e6; border-radius: 6px;" placeholder="RIV" value="RIV">
                                    </label>
                                    
                                    <label style="display: flex; align-items: center; margin-top: 25px;">
                                        <input type="checkbox" id="include-timestamp" style="margin-right: 10px; transform: scale(1.2);" checked>
                                        <span style="font-weight: 500; color: #495057;">Include timestamp in filename</span>
                                    </label>
                                </div>
                            </div>
                            
                            <!-- Category Mappings Section -->
                            <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 25px;">
                                <h4 style="color: #6c757d; margin-bottom: 15px; font-size: 16px;">🗂️ Category to Destination Mapping</h4>
                                
                                <div style="margin-bottom: 15px;">
                                    <label style="display: block; margin-bottom: 10px; font-size: 14px; color: #6c757d;">
                                        Category mappings (JSON format):
                                    </label>
                                    <textarea id="category-mappings" placeholder='{\n  "6 - NON TECH TTA": "BTS2",\n  "S&A FAST PROCESSING TTA": "KTW1",\n  "NON TECH TTA LCJ4": "LCJ4"\n}'
                                              style="width: 100%; height: 250px; padding: 12px; font-family: 'Courier New', monospace; font-size: 12px; border: 1px solid #dee2e6; border-radius: 8px; resize: vertical;"></textarea>
                                    
                                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                                        <button type="button" id="validate-mappings" style="padding: 8px 16px; background: #17a2b8; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">✓ Validate JSON</button>
                                        <button type="button" id="reset-mappings" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">↺ Reset to Defaults</button>
                                    </div>
                                    
                                    <div id="mappings-status" style="margin-top: 10px; padding: 8px; border-radius: 4px; font-size: 12px; display: none;"></div>
                                </div>
                                
                                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
                                    <h5 style="margin: 0 0 8px 0; color: #1976d2; font-size: 13px;">💡 How Category Mapping Works</h5>
                                    <p style="margin: 0; font-size: 12px; color: #1565c0; line-height: 1.5;">
                                        This maps sortation categories found in containers to main destination codes (BTS2, KTW1, LCJ4). When the script analyzes containers, it will use these mappings to determine the main destination for each category found.
                                    </p>
                                </div>
                            </div>
                            
                            <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-top: 20px;">
                                <h5 style="margin: 0 0 8px 0; color: #495057; font-size: 14px;">ℹ️ Script Info</h5>
                                <p style="margin: 0; font-size: 13px; color: #6c757d; line-height: 1.5; font-family: 'Courier New', monospace;">
                                    <strong>Version:</strong> ${Core.version || '3.9.3'}<br>
                                    <strong>Author:</strong> ${Core.metadata?.authorFull || 'Dariusz Kubica (kubicdar)'}<br>
                                    <strong>GitHub:</strong> <a href="${Core.metadata?.homepageURL || 'https://github.com/dariuszkubica/RIV-ReloUp'}" target="_blank" style="color: #007bff;">Repository</a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="padding: 20px; border-top: 1px solid #dee2e6; background: #f8f9fa; display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 12px; color: #6c757d;">
                        RIV+ | Settings are saved automatically
                    </div>
                    <div>
                        <button id="reset-settings" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 10px; font-size: 14px;">
                            Reset to Defaults
                        </button>
                        <button id="save-settings" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
                            Save & Close
                        </button>
                    </div>
                </div>
            `;

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // Setup tab switching functionality
            const tabs = modal.querySelectorAll('.settings-tab');
            const tabContents = modal.querySelectorAll('.tab-content');
            
            // Function to update tab visibility based on settings
            const updateTabVisibility = () => {
                const showPalletlandCheckbox = modal.querySelector('#show-palletland');
                const palletlandTab = modal.querySelector('[data-tab="palletland"]');
                const palletlandContent = modal.querySelector('#tab-palletland');
                
                if (showPalletlandCheckbox && palletlandTab && palletlandContent) {
                    const isEnabled = showPalletlandCheckbox.checked;
                    
                    if (isEnabled) {
                        palletlandTab.style.display = 'block';
                        palletlandTab.style.flex = '1';
                    } else {
                        palletlandTab.style.display = 'none';
                        palletlandTab.style.flex = '0';
                        
                        // If Palletland tab is currently active, switch to Interface tab
                        if (palletlandContent.style.display === 'block') {
                            // Hide Palletland content
                            palletlandContent.style.display = 'none';
                            
                            // Show Interface tab and content
                            const interfaceTab = modal.querySelector('[data-tab="interface"]');
                            const interfaceContent = modal.querySelector('#tab-interface');
                            
                            if (interfaceTab && interfaceContent) {
                                // Reset all tabs
                                tabs.forEach(t => {
                                    t.style.background = 'transparent';
                                    t.style.borderBottomColor = 'transparent';
                                    t.style.color = '#6c757d';
                                    t.style.fontWeight = '500';
                                });
                                
                                // Activate Interface tab
                                interfaceTab.style.background = 'white';
                                interfaceTab.style.borderBottomColor = '#007bff';
                                interfaceTab.style.color = '#007bff';
                                interfaceTab.style.fontWeight = '600';
                                
                                // Hide all content, show Interface
                                tabContents.forEach(content => {
                                    content.style.display = 'none';
                                });
                                interfaceContent.style.display = 'block';
                            }
                        }
                    }
                }
            };
            
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    // Skip if tab is hidden (Palletland when disabled)
                    if (tab.style.display === 'none') {
                        return;
                    }
                    
                    // Remove active state from all tabs
                    tabs.forEach(t => {
                        t.style.background = 'transparent';
                        t.style.borderBottomColor = 'transparent';
                        t.style.color = '#6c757d';
                        t.style.fontWeight = '500';
                    });
                    
                    // Add active state to clicked tab
                    tab.style.background = 'white';
                    tab.style.borderBottomColor = '#007bff';
                    tab.style.color = '#007bff';
                    tab.style.fontWeight = '600';
                    
                    // Hide all tab content
                    tabContents.forEach(content => {
                        content.style.display = 'none';
                    });
                    
                    // Show clicked tab content
                    const targetTab = modal.querySelector(`#tab-${tab.dataset.tab}`);
                    if (targetTab) {
                        targetTab.style.display = 'block';
                    }
                });
            });

            // Apply current settings to modal
            this.applyToModal();
            
            // Set up Palletland dependency - update tab visibility when checkbox changes
            const showPalletlandCheckbox = modal.querySelector('#show-palletland');
            if (showPalletlandCheckbox) {
                showPalletlandCheckbox.addEventListener('change', updateTabVisibility);
            }
            
            // Initial tab visibility update
            updateTabVisibility();

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

            // Category mappings event listeners
            const validateMappingsBtn = modal.querySelector('#validate-mappings');
            const resetMappingsBtn = modal.querySelector('#reset-mappings');
            const mappingsTextarea = modal.querySelector('#category-mappings');
            const mappingsStatus = modal.querySelector('#mappings-status');
            
            if (validateMappingsBtn && mappingsTextarea && mappingsStatus) {
                validateMappingsBtn.onclick = () => {
                    try {
                        const mappings = JSON.parse(mappingsTextarea.value);
                        if (typeof mappings === 'object' && mappings !== null) {
                            mappingsStatus.style.display = 'block';
                            mappingsStatus.style.background = '#d4edda';
                            mappingsStatus.style.color = '#155724';
                            mappingsStatus.textContent = `✓ Valid JSON! Found ${Object.keys(mappings).length} category mappings.`;
                        } else {
                            throw new Error('Must be an object');
                        }
                    } catch (e) {
                        mappingsStatus.style.display = 'block';
                        mappingsStatus.style.background = '#f8d7da';
                        mappingsStatus.style.color = '#721c24';
                        mappingsStatus.textContent = `✗ Invalid JSON: ${e.message}`;
                    }
                };
            }
            
            if (resetMappingsBtn && mappingsTextarea) {
                resetMappingsBtn.onclick = () => {
                    mappingsTextarea.value = JSON.stringify(this.defaultSettings.categoryMappings, null, 2);
                    if (mappingsStatus) {
                        mappingsStatus.style.display = 'block';
                        mappingsStatus.style.background = '#d1ecf1';
                        mappingsStatus.style.color = '#0c5460';
                        mappingsStatus.textContent = '↺ Reset to default mappings';
                    }
                };
            }

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
    
    // Start monitoring search results tables
    SearchModule.startTableMonitoring();
    
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
    console.log(`📊 CategoryMapper loaded with dynamic configuration from settings`);
    console.log('⚙️ Settings Manager initialized');
    console.log('🎨 UI Enhancements initialized');
    console.log('🗂️ Category mappings are now user-configurable in Settings -> Advanced tab');
    
    // Initialize copy functionality
    Core.initializeCopyToClipboard();
    console.log('📋 Copy to clipboard functionality initialized');
    
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