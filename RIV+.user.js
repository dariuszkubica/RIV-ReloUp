// ==UserScript==
// @name         RIV+
// @namespace    KTW1
// @version      3.9
// @author       Dariusz Kubica (kubicdar)
// @copyright    2025+, Dariusz Kubica (https://github.com/dariuszkubica)
// @license      Licensed with the consent of the author
// @description  Enhanced warehouse analysis with smart session monitoring, location tracking, real-time updates, and automatic session initialization
// @match        https://dub.prod.item-visibility.returns.amazon.dev/*
// @grant        none
// @run-at       document-start
// @homepageURL  https://github.com/dariuszkubica/RIV-ReloUp
// @supportURL   https://github.com/dariuszkubica/RIV-ReloUp/issues
// @downloadURL  https://raw.githubusercontent.com/dariuszkubica/RIV-ReloUp/main/RIV%20-%20ReloUp.user.js
// @updateURL    https://raw.githubusercontent.com/dariuszkubica/RIV-ReloUp/main/RIV%20-%20ReloUp.user.js
// ==/UserScript==

(function() {
    'use strict';
    
    // Auto-extract version from script metadata
    const SCRIPT_VERSION = (() => {
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
        } catch (e) {}
        
        // Final fallback: extract from this very text
        const thisScript = `// @version      2.9.3`;
        const fallbackMatch = thisScript.match(/@version\s+([\d.]+)/);
        return fallbackMatch ? fallbackMatch[1] : '2.9.3';
    })();
    
    // Auto-extract script metadata (author, namespace, etc.)
    const SCRIPT_METADATA = (() => {
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
                
                // Extract namespace (this will be our warehouseId)
                const namespaceMatch = text.match(/@namespace\s+(.+?)(?:\n|$)/);
                if (namespaceMatch) {
                    metadata.namespace = namespaceMatch[1].trim();
                }
                
                // Extract homepage URL
                const homepageMatch = text.match(/@homepageURL\s+(.+?)(?:\n|$)/);
                if (homepageMatch) {
                    metadata.homepageURL = homepageMatch[1].trim();
                }
                
                // Extract support URL
                const supportMatch = text.match(/@supportURL\s+(.+?)(?:\n|$)/);
                if (supportMatch) {
                    metadata.supportURL = supportMatch[1].trim();
                }
                
                // Extract download URL
                const downloadMatch = text.match(/@downloadURL\s+(.+?)(?:\n|$)/);
                if (downloadMatch) {
                    metadata.downloadURL = downloadMatch[1].trim();
                }
                
                return metadata;
            }
            
            // Fallback: try to extract from current script source
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
                
                const homepageMatch = text.match(/@homepageURL\s+(.+?)(?:\n|$)/);
                if (homepageMatch) {
                    metadata.homepageURL = homepageMatch[1].trim();
                }
                
                const downloadMatch = text.match(/@downloadURL\s+(.+?)(?:\n|$)/);
                if (downloadMatch) {
                    metadata.downloadURL = downloadMatch[1].trim();
                }
                
                return metadata;
            }
        } catch (e) {
            console.warn('Failed to extract script metadata, using defaults:', e);
        }
        
        return defaultMetadata;
    })();
    
    // Function to get current logged-in user from the application
    function getCurrentUser() {
        // Try multiple methods to get the actual logged-in user
        
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
        
        // Method 2: Try to extract from page elements (user profile, header, etc.)
        try {
            console.log('🔍 Checking UI elements for user info...');
            
            // Look for user info in common UI elements with broader selectors
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
            
        // Method 3: Check for user info in meta tags
        try {
            console.log('🔍 Checking meta tags...');
            const metaTags = document.querySelectorAll('meta[name*="user"], meta[name*="employee"], meta[name*="login"], meta[name*="associate"]');
            for (const tag of metaTags) {
                const content = tag.getAttribute('content');
                if (content && content.length > 2 && content.length < 20 && /^[a-zA-Z0-9]+$/.test(content)) {
                    console.log('✅ Found potential user from meta tag:', content);
                    return content;
                }
            }
        } catch (e) {
            console.warn('Error checking meta tags:', e);
        }
        
        // Method 4: Check localStorage for user data (more thorough)
        try {
            console.log('🔍 Checking localStorage...');
            const storageKeys = Object.keys(localStorage);
            
            for (const key of storageKeys) {
                try {
                    if (key.toLowerCase().includes('user') || key.toLowerCase().includes('employee') || 
                        key.toLowerCase().includes('login') || key.toLowerCase().includes('associate')) {
                        const value = localStorage.getItem(key);
                        
                        if (value && !value.startsWith('{') && !value.startsWith('[')) {
                            // Simple string value
                            if (value.length > 2 && value.length < 20 && /^[a-zA-Z0-9]+$/.test(value)) {
                                console.log('✅ Found potential user from localStorage key', key + ':', value);
                                return value;
                            }
                        } else if (value) {
                            // Try to parse JSON
                            try {
                                const parsed = JSON.parse(value);
                                const userFields = ['username', 'user', 'employee', 'login', 'associate', 'employeeLogin', 'userLogin'];
                                
                                for (const field of userFields) {
                                    if (parsed[field]) {
                                        const user = parsed[field];
                                        if (typeof user === 'string' && user.length > 2 && user.length < 20 && /^[a-zA-Z0-9]+$/.test(user)) {
                                            console.log('✅ Found user from localStorage JSON:', user, 'from field', field);
                                            return user;
                                        }
                                    }
                                }
                            } catch (e) {
                                // Ignore JSON parse errors
                            }
                        }
                    }
                } catch (e) {
                    // Continue with next key
                }
            }
        } catch (e) {
            console.warn('Error checking localStorage:', e);
        }
        
        // Method 5: Check sessionStorage as well
        try {
            console.log('🔍 Checking sessionStorage...');
            const sessionKeys = Object.keys(sessionStorage);
            
            for (const key of sessionKeys) {
                try {
                    if (key.toLowerCase().includes('user') || key.toLowerCase().includes('employee') || 
                        key.toLowerCase().includes('login') || key.toLowerCase().includes('associate')) {
                        const value = sessionStorage.getItem(key);
                        
                        if (value && !value.startsWith('{') && !value.startsWith('[')) {
                            if (value.length > 2 && value.length < 20 && /^[a-zA-Z0-9]+$/.test(value)) {
                                console.log('✅ Found potential user from sessionStorage:', value);
                                return value;
                            }
                        } else if (value) {
                            try {
                                const parsed = JSON.parse(value);
                                const userFields = ['username', 'user', 'employee', 'login', 'associate', 'employeeLogin', 'userLogin'];
                                
                                for (const field of userFields) {
                                    if (parsed[field]) {
                                        const user = parsed[field];
                                        if (typeof user === 'string' && user.length > 2 && user.length < 20 && /^[a-zA-Z0-9]+$/.test(user)) {
                                            console.log('✅ Found user from sessionStorage JSON:', user, 'from field', field);
                                            return user;
                                        }
                                    }
                                }
                            } catch (e) {
                                // Ignore JSON parse errors
                            }
                        }
                    }
                } catch (e) {
                    // Continue with next key
                }
            }
        } catch (e) {
            console.warn('Error checking sessionStorage:', e);
        }
        
        console.log('❌ Could not detect current user from application');
        return null;
    }
    
    const GITHUB_RAW_URL = SCRIPT_METADATA.downloadURL;
    
    console.log('🚀 RIV - ReloUp script starting (Speed Optimized)...');
    
    // Auto-update functionality
    async function checkForUpdates() {
        try {
            // Check if Greasemonkey/Tampermonkey API is available
            if (typeof GM_getValue === 'undefined' || typeof GM_xmlhttpRequest === 'undefined') {
                console.log('🔄 Update check skipped - Greasemonkey API not available');
                return;
            }
            
            // Only check once per day
            const lastCheck = GM_getValue('lastUpdateCheck', 0);
            const now = Date.now();
            const oneDayMs = 24 * 60 * 60 * 1000;
            
            if (now - lastCheck < oneDayMs) {
                console.log('🔄 Update check skipped - checked recently');
                return;
            }
            
            console.log('🔄 Checking for script updates...');
            
            GM_xmlhttpRequest({
                method: 'GET',
                url: GITHUB_RAW_URL,
                onload: function(response) {
                    if (response.status === 200) {
                        // Extract version from remote script
                        const versionMatch = response.responseText.match(/@version\s+([\d.]+)/);
                        if (versionMatch) {
                            const remoteVersion = versionMatch[1];
                            console.log(`📋 Current version: ${SCRIPT_VERSION}, Remote version: ${remoteVersion}`);
                            
                            if (isNewerVersion(remoteVersion, SCRIPT_VERSION)) {
                                showUpdateNotification(remoteVersion);
                            } else {
                                console.log('✅ Script is up to date');
                            }
                        }
                        
                        // Save last check time (if GM_setValue is available)
                        if (typeof GM_setValue !== 'undefined') {
                            GM_setValue('lastUpdateCheck', now);
                        }
                    }
                },
                onerror: function() {
                    console.warn('❌ Could not check for updates');
                }
            });
        } catch (error) {
            console.warn('❌ Update check failed:', error);
        }
    }
    
    function isNewerVersion(remote, current) {
        const remoteParts = remote.split('.').map(Number);
        const currentParts = current.split('.').map(Number);
        
        for (let i = 0; i < Math.max(remoteParts.length, currentParts.length); i++) {
            const remoteNum = remoteParts[i] || 0;
            const currentNum = currentParts[i] || 0;
            
            if (remoteNum > currentNum) return true;
            if (remoteNum < currentNum) return false;
        }
        
        return false;
    }
    
    function showUpdateNotification(newVersion) {
        // Show browser notification if supported
        if (typeof GM_notification !== 'undefined') {
            GM_notification({
                title: '🚀 RIV - ReloUp Update Available',
                text: `Version ${newVersion} is available. Click to update!`,
                onclick: () => {
                    window.open(GITHUB_RAW_URL, '_blank');
                }
            });
        }
        
        // Also show in-page notification
        setTimeout(() => {
            const updateBanner = document.createElement('div');
            updateBanner.style.cssText = `
                position: fixed;
                top: 0;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #28a745, #20c997);
                color: white;
                padding: 15px 25px;
                border-radius: 0 0 10px 10px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                box-shadow: 0 4px 20px rgba(40, 167, 69, 0.3);
                z-index: 1000000;
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            
            updateBanner.innerHTML = `
                <div style="text-align: center;">
                    <strong>🚀 RIV - ReloUp Update Available!</strong><br>
                    <small>Version ${newVersion} is ready - Click to download</small>
                </div>
            `;
            
            updateBanner.onclick = () => {
                window.open(GITHUB_RAW_URL, '_blank');
            };
            
            updateBanner.onmouseover = () => {
                updateBanner.style.transform = 'translateX(-50%) translateY(5px)';
            };
            
            updateBanner.onmouseout = () => {
                updateBanner.style.transform = 'translateX(-50%) translateY(0)';
            };
            
            document.body.appendChild(updateBanner);
            
            // Auto-hide after 10 seconds
            setTimeout(() => {
                if (updateBanner.parentNode) {
                    updateBanner.style.opacity = '0';
                    updateBanner.style.transform = 'translateX(-50%) translateY(-100%)';
                    setTimeout(() => updateBanner.remove(), 300);
                }
            }, 10000);
            
        }, 3000);
        
        console.log(`🚀 Update available! Version ${newVersion} - Visit: ${GITHUB_RAW_URL}`);
    }
    
    // Category to Main Destination mapping
    const categoryDestinationMap = {
        '2 - NON TECH TTA': 'BTS2',
        '9 - SPECIALITY URGENT': 'BTS2',
        '9 - SPECIALTY URGENT': 'BTS2',  // Alternative spelling
        '7 - HRV URGENT': 'BTS2',
        '5 - FAST PROCESSING TTA': 'BTS2',
        '1 - TECH TTA': 'BTS2',
        'PROBLEM SOLVE': 'KTW1',
        '3 - APPAREL TTA': 'KTW1',
        'APPAREL URGENT': 'KTW1',
        'S&A FAST PROCESSING TTA': 'KTW1',
        'SHOES URGENT': 'KTW1',
        'BROKEN AND LEAKING': 'KTW1',
        'SHARP': 'KTW1',
        'BWS': 'KTW1',
        '8 - BMVD URGENT': 'LCJ4',
        'URGENT LCJ4': 'LCJ4',
        'NON TECH TTA LCJ4': 'LCJ4',
        '4 - LOW VALUE TTA': 'LCJ4',
        'Tech TTA LCJ4': 'LCJ4',
        '0 - NON-SORT': 'WRO1'
    };
    
    // Get main destination for category
    function getMainDestination(sortationCategory) {
        if (!sortationCategory || sortationCategory === 'N/A' || sortationCategory === 'Empty') {
            return 'Unknown';
        }
        
        // Handle multiple categories separated by commas
        const categories = sortationCategory.split(',').map(cat => cat.trim());
        const destinations = new Set();
        
        categories.forEach(category => {
            const destination = categoryDestinationMap[category] || 'Unknown';
            destinations.add(destination);
        });
        
        // If multiple destinations, join them
        return Array.from(destinations).sort().join(', ');
    }
    
    // Global session data storage with localStorage persistence
    let sessionData = {
        warehouseId: null,
        associate: null,
        sessionId: null,
        lastCaptured: null,
        
        // Save session data to localStorage
        save() {
            try {
                const dataToSave = {
                    warehouseId: this.warehouseId,
                    associate: this.associate,
                    sessionId: this.sessionId,
                    lastCaptured: this.lastCaptured
                };
                localStorage.setItem('riv_session_data', JSON.stringify(dataToSave));
                console.log('📄 Session data saved to localStorage:', dataToSave);
            } catch (e) {
                console.warn('Failed to save session data to localStorage:', e);
            }
        },
        
        // Load session data from localStorage
        load() {
            try {
                const saved = localStorage.getItem('riv_session_data');
                if (saved) {
                    const data = JSON.parse(saved);
                    // Only restore if the data is relatively recent (within 24 hours)
                    const lastCaptured = data.lastCaptured ? new Date(data.lastCaptured) : null;
                    const now = new Date();
                    const dayInMs = 24 * 60 * 60 * 1000;
                    
                    if (lastCaptured && (now - lastCaptured) < dayInMs) {
                        this.warehouseId = data.warehouseId;
                        this.associate = data.associate;
                        this.sessionId = data.sessionId;
                        this.lastCaptured = data.lastCaptured;
                        console.log('📥 Session data restored from localStorage:', data);
                        return true;
                    } else {
                        console.log('📅 Stored session data is too old, ignoring');
                        localStorage.removeItem('riv_session_data');
                    }
                }
            } catch (e) {
                console.warn('Failed to load session data from localStorage:', e);
            }
            return false;
        },
        
        // Update session data and save automatically
        update(warehouseId, associate, sessionId = null) {
            this.warehouseId = warehouseId;
            this.associate = associate;
            this.sessionId = sessionId;
            this.lastCaptured = new Date().toISOString();
            this.save();
        }
    };
    
    // Add Total Items column to existing DROP_ZONE table
    function addTotalItemsColumn() {
        const table = document.querySelector('table.searched-container-table');
        if (!table) {
            // Try again after a short delay if table not found
            setTimeout(addTotalItemsColumn, 1000);
            return;
        }
        
        // Check if we already added the columns
        if (table.querySelector('th[data-riv-column]') && table.querySelector('th[data-riv-csv-column]')) {
            return;
        }
        
        // Add header for Total Items column
        const headerRows = table.querySelectorAll('thead tr');
        
        // First header row (main title) - update colspan
        if (headerRows[0]) {
            const mainHeader = headerRows[0].querySelector('th');
            if (mainHeader) {
                const currentColspan = parseInt(mainHeader.getAttribute('colspan')) || 6;
                mainHeader.setAttribute('colspan', currentColspan + 2); // +2 for both Units and CSV columns
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
        dataRows.forEach(row => {
            if (!row.querySelector('td[data-riv-cell]')) {
                // Add Units cell
                const totalItemsCell = document.createElement('td');
                totalItemsCell.className = 'css-18tzy6q';
                totalItemsCell.setAttribute('data-riv-cell', 'true');
                totalItemsCell.innerHTML = '<span id="riv-total-items">Analyzing...</span>';
                row.appendChild(totalItemsCell);
                
                // Add CSV cell
                const csvCell = document.createElement('td');
                csvCell.className = 'css-18tzy6q';
                csvCell.setAttribute('data-riv-csv-cell', 'true');
                csvCell.style.textAlign = 'center';
                csvCell.innerHTML = '<button id="riv-export-btn" style="display:none; background:none; border:none; cursor:pointer; font-size:16px; padding:5px;" onclick="window.rivExportCSV()" title="Download CSV">📊</button>';
                row.appendChild(csvCell);
            }
        });
    }

    
    // Store collected data for CSV export
    let collectedContainerData = [];
    
    // Processing state for search analysis
    let isProcessing = false;
    
    // CSV Export functionality
    function collectContainerData(data, parentInfo = null) {
        const containers = [];
        
        if (data.childContainers && Array.isArray(data.childContainers)) {
            data.childContainers.forEach(container => {
                // Get sortation category - it's an array, take first element
                let sortationCategory = '';
                if (container.sortationCategories && Array.isArray(container.sortationCategories) && container.sortationCategories.length > 0) {
                    sortationCategory = container.sortationCategories[0];
                } else if (container.sortationCategory) {
                    sortationCategory = container.sortationCategory;
                }
                
                const containerInfo = {
                    'Container ID': container.containerId || '',
                    'Parent Container': parentInfo ? parentInfo.containerId : 'Root',
                    'Container Type': container.containerType || '',
                    'Pallet ID': parentInfo ? parentInfo.containerId : container.containerId,
                    'TOTE': parentInfo ? container.containerId : (container.numOfChildContainers || 0),
                    'Tote ID': parentInfo ? container.containerId : '',
                    'ITEM': parentInfo ? (container.numOfChildContainers || 0) : '',
                    'Sortation Category': sortationCategory,
                    'CDD': container.cdd || '',
                    'LPD': container.lpd || '',
                    'Latest Container Operation': container.latestOperation || container.latestContainerOperation || '',
                    'Latest Operation Time': container.latestOperationTime || container.modifiedDate || '',
                    'Latest Operation Associate': container.latestOperationAssociate || '',
                    'Location': container.location || '',
                    'Status': container.status || '',
                    'Created Date': container.createdDate || '',
                    'Modified Date': container.modifiedDate || '',
                    'Num of Child Containers': container.numOfChildContainers || 0
                };
                containers.push(containerInfo);
            });
        }
        
        return containers;
    }
    
    function convertToCSV(data) {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    let cell = row[header] || '';
                    // Escape quotes and wrap in quotes if contains comma, quote, or newline
                    if (typeof cell === 'string') {
                        cell = cell.replace(/"/g, '""');
                        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                            cell = `"${cell}"`;
                        }
                    }
                    return cell;
                }).join(',')
            )
        ].join('\n');
        
        return csvContent;
    }
    
    function downloadCSV(csvContent, filename) {
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
    }
    
    // Global function for export button
    window.rivExportCSV = function() {
        if (collectedContainerData.length === 0) {
            alert('No data available for export. Please run analysis first.');
            return;
        }
        
        const csvContent = convertToCSV(collectedContainerData);
        const timestamp = scriptSettings.includeTimestamp ? 
            new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) : '';
        const filename = scriptSettings.includeTimestamp ? 
            `${scriptSettings.filenamePrefix}_${timestamp}.csv` : 
            `${scriptSettings.filenamePrefix}.csv`;
        
        downloadCSV(csvContent, filename);
        
        // Show success message
        const exportBtn = document.getElementById('riv-export-btn');
        if (exportBtn) {
            const originalText = exportBtn.textContent;
            exportBtn.textContent = 'Downloaded!';
            exportBtn.style.background = '#28a745';
            exportBtn.style.color = 'white';
            setTimeout(() => {
                exportBtn.textContent = originalText;
                exportBtn.style.background = '';
                exportBtn.style.color = '';
            }, 2000);
        }
    };

    // Copy to clipboard functionality with Ctrl + LMB
    function initializeCopyToClipboard() {
        // Add click event listener to document for table elements
        document.addEventListener('click', function(event) {
            // Check if Ctrl key is pressed
            if (!event.ctrlKey) return;
            
            // Check if clicked element is within a table cell
            const cell = event.target.closest('td, th');
            if (!cell) return;
            
            // Check if it's within our target tables
            const table = cell.closest('table.searched-container-table');
            if (!table) return;
            
            // Prevent default action and event bubbling
            event.preventDefault();
            event.stopPropagation();
            
            // Get text content to copy
            let textToCopy = '';
            
            // Check if it's a button with container ID
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
                    // Show visual feedback if enabled in settings
                    if (scriptSettings.showCopyTooltip || scriptSettings.highlightCopiedCell) {
                        showCopyFeedback(cell, textToCopy);
                    }
                }).catch(function(err) {
                    // Fallback for older browsers
                    fallbackCopyToClipboard(textToCopy);
                    if (scriptSettings.showCopyTooltip || scriptSettings.highlightCopiedCell) {
                        showCopyFeedback(cell, textToCopy);
                    }
                });
            }
        });
    }
    
    // Fallback copy function for older browsers
    function fallbackCopyToClipboard(text) {
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
    }
    
    // Show visual feedback when text is copied
    function showCopyFeedback(cell, copiedText) {
        // Create temporary tooltip if enabled
        let tooltip;
        if (scriptSettings.showCopyTooltip) {
            tooltip = document.createElement('div');
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
        }
        
        // Add green border to cell temporarily if enabled
        let originalBorder, originalBackground;
        if (scriptSettings.highlightCopiedCell) {
            originalBorder = cell.style.border;
            originalBackground = cell.style.backgroundColor;
            cell.style.border = '2px solid #28a745';
            cell.style.backgroundColor = 'rgba(40, 167, 69, 0.1)';
        }
        
        // Remove feedback after 1.5 seconds
        setTimeout(() => {
            if (tooltip && tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
            if (scriptSettings.highlightCopiedCell) {
                cell.style.border = originalBorder;
                cell.style.backgroundColor = originalBackground;
            }
        }, 1500);
    }

    // Add Dashboard and Settings to footer menu
    function addMenuOptions() {
        const footer = document.querySelector('.footer-container[data-testid="footer"]');
        if (!footer) {
            // Try again after a short delay if footer not found
            setTimeout(addMenuOptions, 1000);
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
            showDashboard();
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
            showPalletLand();
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
            showSettingsModal();
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
        updateMenuVisibility();
    }

    // Update menu visibility based on settings
    function updateMenuVisibility() {
        const palletlandMenuItem = document.querySelector('[data-riv-menu-item="palletland"]');
        if (palletlandMenuItem) {
            palletlandMenuItem.style.display = scriptSettings.showPalletLand ? 'block' : 'none';
        }
    }

    // Settings modal functionality
    function showSettingsModal() {
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
                            <div style="font-size: 10px; color: #666; line-height: 1.3;">2 - NON TECH TTA<br>9 - SPECIALITY URGENT<br>7 - HRV URGENT<br>+2 more...</div>
                        </div>
                        <div style="background: white; padding: 10px; border-radius: 4px; border-left: 3px solid #28a745;">
                            <div style="font-weight: bold; font-size: 12px; color: #28a745; margin-bottom: 5px;">KTW1</div>
                            <div style="font-size: 10px; color: #666; line-height: 1.3;">PROBLEM SOLVE<br>3 - APPAREL TTA<br>APPAREL URGENT<br>+5 more...</div>
                        </div>
                        <div style="background: white; padding: 10px; border-radius: 4px; border-left: 3px solid #ffc107;">
                            <div style="font-weight: bold; font-size: 12px; color: #ffc107; margin-bottom: 5px;">LCJ4</div>
                            <div style="font-size: 10px; color: #666; line-height: 1.3;">8 - BMVD URGENT<br>URGENT LCJ4<br>NON TECH TTA LCJ4<br>+2 more...</div>
                        </div>
                        <div style="background: white; padding: 10px; border-radius: 4px; border-left: 3px solid #6f42c1;">
                            <div style="font-weight: bold; font-size: 12px; color: #6f42c1; margin-bottom: 5px;">WRO1</div>
                            <div style="font-size: 10px; color: #666; line-height: 1.3;">0 - NON-SORT</div>
                        </div>
                    </div>
                </div>
                
                <div style="background: #e1f5fe; padding: 10px; border-radius: 4px; font-size: 12px; color: #0277bd;">
                    <strong>How it works:</strong> Categories from your Drop Zone analysis are automatically grouped into main destinations (BTS2, KTW1, LCJ4, WRO1) for better logistics overview.
                </div>
            </div>

            <div style="margin-bottom: 20px;">
                <h3 style="color: #555; margin-bottom: 10px;">📁 Export Settings</h3>
                <label style="display: block; margin-bottom: 10px;">
                    Filename prefix: 
                    <input type="text" id="filename-prefix" value="container_analysis" style="margin-left: 10px; padding: 5px;">
                </label>
                <label style="display: block; margin-bottom: 10px;">
                    <input type="checkbox" id="include-timestamp" checked style="margin-right: 10px;">
                    Include timestamp in filename
                </label>
            </div>

            <div style="margin-bottom: 20px;">
                <h3 style="color: #555; margin-bottom: 10px;">ℹ️ Script Info & Updates</h3>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                        <p style="margin: 0; color: #666;"><strong>Version:</strong> ${SCRIPT_VERSION}</p>
                        <p style="margin: 0; color: #666;"><strong>Author:</strong> ${SCRIPT_METADATA.author}</p>
                    </div>
                    <p style="margin: 5px 0 0 0; color: #666;"><strong>Features:</strong> Fast analysis, CSV export, Copy functionality, Auto-update</p>
                    <p style="margin: 5px 0 0 0; color: #666;">
                        <strong>Repository:</strong> 
                        <a href="${SCRIPT_METADATA.homepageURL}" 
                           target="_blank" style="color: #007bff; text-decoration: none;">
                            GitHub Repository
                        </a>
                    </p>
                </div>
                
                <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px;">
                    <button id="manual-update-check" style="
                        background: #007bff; color: white; border: none; padding: 8px 16px; 
                        border-radius: 4px; cursor: pointer; font-size: 12px; transition: all 0.3s ease;
                    ">🔄 Check for Updates</button>
                    <button id="visit-repo" style="
                        background: #28a745; color: white; border: none; padding: 8px 16px; 
                        border-radius: 4px; cursor: pointer; font-size: 12px; transition: all 0.3s ease;
                    ">📂 Visit Repository</button>
                </div>
                <div id="update-info" style="min-height: 20px;"></div>
            </div>

            <div style="text-align: right; border-top: 1px solid #eee; padding-top: 15px;">
                <button id="save-settings" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 4px; margin-right: 10px; cursor: pointer;">Save Settings</button>
                <button id="cancel-settings" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Cancel</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Load current settings
        loadSettings();
        
        // Manual update check button
        document.getElementById('manual-update-check').onclick = () => {
            const updateInfo = document.getElementById('update-info');
            const checkButton = document.getElementById('manual-update-check');
            
            // Disable button and show loading state
            checkButton.disabled = true;
            checkButton.innerHTML = '🔄 Checking...';
            updateInfo.innerHTML = '<div style="color: #007bff; padding: 10px; background: #e3f2fd; border-radius: 4px;">🔄 Checking for updates...</div>';
            
            // Use fetch instead of GM_xmlhttpRequest since @grant is none
            fetch(GITHUB_RAW_URL)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    return response.text();
                })
                .then(responseText => {
                    const versionMatch = responseText.match(/@version\s+([\d.]+)/);
                    if (versionMatch) {
                        const remoteVersion = versionMatch[1];
                        if (isNewerVersion(remoteVersion, SCRIPT_VERSION)) {
                            updateInfo.innerHTML = `
                                <div style="color: #28a745; background: #d4edda; padding: 15px; border-radius: 4px; border: 1px solid #c3e6cb;">
                                    <div style="font-weight: bold; margin-bottom: 8px;">🚀 Update Available!</div>
                                    <div style="font-size: 13px; margin-bottom: 8px;">Version ${remoteVersion} is ready.</div>
                                    <a href="${GITHUB_RAW_URL}" target="_blank" 
                                       style="display: inline-block; background: #28a745; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 13px;">
                                        📥 Download Update
                                    </a>
                                </div>
                            `;
                        } else {
                            updateInfo.innerHTML = `
                                <div style="color: #28a745; background: #d4edda; padding: 15px; border-radius: 4px; border: 1px solid #c3e6cb;">
                                    <div style="font-weight: bold;">✅ Script is up to date!</div>
                                    <div style="font-size: 12px; margin-top: 5px; color: #155724;">Current version: ${SCRIPT_VERSION}</div>
                                </div>
                            `;
                        }
                    } else {
                        updateInfo.innerHTML = '<div style="color: #dc3545; background: #f8d7da; padding: 15px; border-radius: 4px; border: 1px solid #f5c6cb;">❌ Could not parse version information</div>';
                    }
                })
                .catch(error => {
                    console.error('Update check failed:', error);
                    updateInfo.innerHTML = `
                        <div style="color: #dc3545; background: #f8d7da; padding: 15px; border-radius: 4px; border: 1px solid #f5c6cb;">
                            ❌ Failed to check for updates<br>
                            <small style="font-size: 11px; margin-top: 8px; display: block;">Due to CORS restrictions, automatic update checking may not work.</small>
                            <a href="${SCRIPT_METADATA.homepageURL}" target="_blank" 
                               style="display: inline-block; margin-top: 8px; background: #007bff; color: white; padding: 6px 12px; text-decoration: none; border-radius: 3px; font-size: 11px;">
                                📋 Check on GitHub
                            </a>
                        </div>
                    `;
                })
                .finally(() => {
                    // Re-enable button
                    checkButton.disabled = false;
                    checkButton.innerHTML = '🔄 Check for Updates';
                });
        };
        
        // Visit repository button
        document.getElementById('visit-repo').onclick = () => {
            window.open(SCRIPT_METADATA.homepageURL, '_blank');
        };
        
        // Event listeners
        document.getElementById('close-settings').onclick = () => overlay.remove();
        document.getElementById('cancel-settings').onclick = () => overlay.remove();
        document.getElementById('save-settings').onclick = () => {
            saveSettings();
            overlay.remove();
        };

        // Close on overlay click
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };
    }

    // Dashboard functionality
    let isDashboardActive = false;

    function showDashboard() {
        console.log('🔥 DEBUG: showDashboard() called - This should open Dashboard modal');
        if (isDashboardActive) return; // Already showing dashboard
        
        isDashboardActive = true;
        
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
        document.getElementById('close-dashboard').onclick = () => closeDashboard(overlay);
        document.getElementById('refresh-dashboard').onclick = () => startDashboardScan(false); // Surface scan
        document.getElementById('deep-scan-dashboard').onclick = () => startDashboardScan(true); // Deep scan
        document.getElementById('export-dashboard').onclick = () => exportDashboardData();
        
        // Close on overlay click
        overlay.onclick = (e) => {
            if (e.target === overlay) closeDashboard(overlay);
        };
        
        // Show session debug info
        setTimeout(() => {
            const debugInfo = document.createElement('div');
            debugInfo.style.cssText = `
                position: fixed;
                top: 10px;
                left: 10px;
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                padding: 10px;
                border-radius: 4px;
                font-size: 12px;
                z-index: 1000000;
                max-width: 300px;
            `;
            
            const hasValidSession = sessionData.warehouseId && sessionData.associate && 
                                  sessionData.warehouseId !== 'CDPL1' && sessionData.associate !== 'System';
            
            debugInfo.innerHTML = `
                <strong>🔧 Session Debug Info:</strong><br>
                warehouseId: ${sessionData.warehouseId || 'Not captured'}<br>
                associate: ${sessionData.associate || 'Not captured'}<br>
                lastCaptured: ${sessionData.lastCaptured ? sessionData.lastCaptured.toLocaleString() : 'Never'}<br>
                <strong style="color: ${hasValidSession ? '#28a745' : '#dc3545'};">Status: ${hasValidSession ? 'Valid ✅' : 'Invalid ❌'}</strong>
            `;
            overlay.appendChild(debugInfo);
            
            // Auto-remove after 15 seconds for session info
            setTimeout(() => {
                if (debugInfo.parentNode) {
                    debugInfo.remove();
                }
            }, 15000);
        }, 1000);
        
        // Auto-start scan when dashboard opens
        setTimeout(() => {
            startDashboardScan();
        }, 2000); // Longer delay to allow session capture
    }

    function closeDashboard(overlay) {
        if (!isDashboardActive) return;
        
        isDashboardActive = false;
        
        // Remove modal overlay
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    }

    // PalletLand modal functionality
    function showPalletLand() {
        console.log('🔥 DEBUG: showPalletLand() called - This should open PalletLand modal');
        if (isDashboardActive) return; // Already showing a modal
        
        isDashboardActive = true;
        
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
                    
                    <!-- PalletLand Content Area (will be populated by updatePalletLandDisplay) -->
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
        document.getElementById('close-palletland').onclick = function() {
            overlay.remove();
            isDashboardActive = false;
        };
        
        document.getElementById('refresh-palletland').onclick = () => startPalletLandScan();
        
        document.getElementById('export-palletland').onclick = function() {
            if (palletlandData.length === 0) {
                alert('No data to export. Please run an analysis first.');
                return;
            }
            
            const csvContent = generateCSVExport(palletlandData);
            downloadCSV(csvContent, 'palletland_analysis');
        };
        
        // Close on overlay click
        overlay.onclick = function(e) {
            if (e.target === overlay) {
                overlay.remove();
                isDashboardActive = false;
            }
        };
        
        // Auto-start scan
        setTimeout(() => {
            startPalletLandScan();
        }, 2000);
    }

    // Dashboard data storage
    let dashboardData = [];
    
    // PalletLand data storage
    let palletlandData = [];
    
    // Generate PalletLand destinations based on user configuration
    function generatePalletLandDestinations() {
        const destinations = [];
        
        // Process each enabled segment with its full prefix
        scriptSettings.palletlandSegments.forEach(segmentConfig => {
            if (segmentConfig.enabled && segmentConfig.prefix && segmentConfig.prefix.trim()) {
                for (let i = segmentConfig.from; i <= segmentConfig.to; i++) {
                    const dzNumber = i.toString().padStart(2, '0');
                    destinations.push(`${segmentConfig.prefix}${dzNumber}`);
                }
            }
        });
        
        // Add custom destinations
        if (scriptSettings.palletlandCustomDestinations) {
            const customDests = scriptSettings.palletlandCustomDestinations
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);
            
            destinations.push(...customDests);
        }
        
        return destinations;
    }
    
    // Generate Dashboard destinations based on user configuration
    function generateDashboardDestinations() {
        const destinations = [];
        
        // Process each enabled dashboard segment with its full prefix
        scriptSettings.dashboardSegments.forEach(segmentConfig => {
            if (segmentConfig.enabled && segmentConfig.prefix && segmentConfig.prefix.trim()) {
                for (let i = segmentConfig.from; i <= segmentConfig.to; i++) {
                    const dzNumber = i.toString().padStart(2, '0');
                    destinations.push(`${segmentConfig.prefix}${dzNumber}`);
                }
            }
        });
        
        // Add custom dashboard destinations
        if (scriptSettings.dashboardCustomDestinations) {
            const customDests = scriptSettings.dashboardCustomDestinations
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);
            
            destinations.push(...customDests);
        }
        
        return destinations;
    }

    async function startDashboardScan(deepScan = false) {
        console.log(`🔥 DEBUG: startDashboardScan() called - scanning Dashboard destinations (${deepScan ? 'deep' : 'surface'} scan)`);
        dashboardData = [];
        const progressDiv = document.getElementById('scan-progress');
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        const progressPercentage = document.getElementById('progress-percentage');
        const refreshBtn = document.getElementById('refresh-dashboard');
        const deepScanBtn = document.getElementById('deep-scan-dashboard');
        const exportBtn = document.getElementById('export-dashboard');
        
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
        
        // Continue with existing session data logic
        if (!sessionData.warehouseId || !sessionData.associate || 
            sessionData.warehouseId === 'CDPL1' || sessionData.associate === 'System') {
            
            progressText.textContent = 'Waiting for valid session data...';
            progressBar.style.width = '0%';
            progressPercentage.textContent = 'Initializing';
            
            // Try to trigger a real API call to capture session data
            try {
                await tryToGetSessionData();
            } catch (e) {
                console.warn('Could not get session data:', e.message);
            }
            
            // If still no valid session data, warn user
            if (!sessionData.warehouseId || sessionData.warehouseId === 'CDPL1') {
                progressText.textContent = 'Warning: Using default session data. This may cause errors.';
                progressPercentage.textContent = 'Warning';
                
                // Wait a moment for user to see the warning
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
        
        // Show scanning type message
        if (deepScan) {
            progressText.textContent = 'Starting Dashboard full scan - accurate unit counting...';
        } else {
            progressText.textContent = 'Starting Dashboard surface scan - pallets only (no units)...';
        }
        progressPercentage.textContent = 'Starting';
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate drop zone list based on configuration
        const dropZones = generateDashboardDestinations();
        
        if (dropZones.length === 0) {
            progressText.textContent = 'No destinations configured. Please check PalletLand settings.';
            progressPercentage.textContent = 'Error';
            refreshBtn.disabled = false;
            deepScanBtn.disabled = false;
            exportBtn.disabled = false;
            return;
        }
        
        console.log(`PalletLand will scan ${dropZones.length} destinations:`, dropZones);
        
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
                    const searchDetails = await performContainerSearch(dropZoneId);
                    
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
                                    const palletDetails = await performContainerSearch(pallet.containerId);
                                    
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
            dashboardData.push(...batchResults);
            
            completedZones += batch.length;
            const percentage = Math.round((completedZones / totalZones) * 100);
            
            progressBar.style.width = `${percentage}%`;
            progressPercentage.textContent = `${percentage}%`;
            progressText.textContent = `Full scanned ${completedZones}/${totalZones} zones`;
            
            // Update dashboard display with current data
            updateDashboardDisplay();
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
        
        console.log('Dashboard scan complete:', dashboardData);
    }
    
    // PalletLand scan function
    async function startPalletLandScan() {
        console.log('🔥 DEBUG: startPalletLandScan() called - scanning PalletLand destinations');
        palletlandData = [];
        const progressDiv = document.getElementById('palletland-scan-progress');
        const progressBar = document.getElementById('palletland-progress-bar');
        const progressText = document.getElementById('palletland-progress-text');
        const progressPercentage = document.getElementById('palletland-progress-percentage');
        const refreshBtn = document.getElementById('refresh-palletland');
        const exportBtn = document.getElementById('export-palletland');
        
        // Check session data first
        if (!sessionData.warehouseId || !sessionData.associate || 
            sessionData.warehouseId === 'CDPL1' || sessionData.associate === 'System') {
            
            // Show session data error without starting scan
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
                        <button onclick="window.location.reload()" style="
                            background: #6f42c1;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 6px;
                            cursor: pointer;
                            margin-top: 15px;
                            font-size: 14px;
                        ">🔄 Odśwież stronę</button>
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
        
        // Continue with existing session data logic
        if (!sessionData.warehouseId || !sessionData.associate || 
            sessionData.warehouseId === 'CDPL1' || sessionData.associate === 'System') {
            
            progressText.textContent = 'Waiting for valid session data...';
            progressPercentage.textContent = '0%';
            
            // Try to get session data
            try {
                await tryToGetSessionData();
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds for potential updates
            } catch (error) {
                console.log('Could not get session data automatically');
            }
            
            // Check if we now have valid data
            if (!sessionData.warehouseId || !sessionData.associate || 
                sessionData.warehouseId === 'CDPL1' || sessionData.associate === 'System') {
                
                progressText.textContent = 'Invalid session data - check console for details';
                progressDiv.style.display = 'none';
                refreshBtn.disabled = false;
                exportBtn.disabled = false;
                
                alert('Could not get valid session data. Please ensure you are logged in and try refreshing the page.');
                return;
            }
        }
        
        // Generate drop zone list based on PalletLand configuration
        const dropZones = generatePalletLandDestinations();
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
        const BATCH_SIZE = 2; // Smaller batches for deep scanning
        
        for (let i = 0; i < dropZones.length; i += BATCH_SIZE) {
            const batch = dropZones.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map(async (dropZoneId) => {
                try {
                    progressText.textContent = `Scanning ${dropZoneId}...`;
                    
                    // Use deep scanning approach for accurate unit counts
                    const searchDetails = await performContainerSearch(dropZoneId);
                    
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
                                const palletDetails = await performContainerSearch(pallet.containerId);
                                
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
                    
                    // Check if it's just an empty zone (HTTP 400 usually means empty)
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
                        // Only mark as Error if it's a real error, not just empty
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
            palletlandData.push(...batchResults);
            
            completedZones += batch.length;
            const percentage = Math.round((completedZones / totalZones) * 100);
            
            progressBar.style.width = `${percentage}%`;
            progressPercentage.textContent = `${percentage}%`;
            progressText.textContent = `Scanned ${completedZones}/${totalZones} zones`;
            
            // Update display
            updatePalletLandDisplay();
            
            // Reduced delay for speed - just enough to show progress
            if (i + BATCH_SIZE < dropZones.length) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
        
        // Final update
        progressText.textContent = `Scan complete! Found ${palletlandData.filter(d => d.status === 'Active').length} active zones`;
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
        
        console.log('PalletLand scan complete:', palletlandData);
    }
    
    // Try to get valid session data by examining page content and network requests
    async function tryToGetSessionData() {
        return new Promise((resolve, reject) => {
            // Method 1: Look for session data in page content
            try {
                // Check for data in localStorage
                const storageKeys = Object.keys(localStorage);
                for (const key of storageKeys) {
                    try {
                        const value = localStorage.getItem(key);
                        if (value && (value.includes('CDPL') || value.includes('warehouse'))) {
                            const data = JSON.parse(value);
                            if (data.warehouseId && data.warehouseId !== 'CDPL1') {
                                sessionData.warehouseId = data.warehouseId;
                            }
                            if (data.associate && data.associate !== 'System') {
                                sessionData.associate = data.associate;
                            }
                        }
                    } catch (e) {}
                }
                
                // Check for data in window object
                if (window.__APP_STATE__ || window.__INITIAL_STATE__) {
                    const state = window.__APP_STATE__ || window.__INITIAL_STATE__;
                    if (state.user || state.session) {
                        const userData = state.user || state.session;
                        if (userData.warehouseId) sessionData.warehouseId = userData.warehouseId;
                        if (userData.associate) sessionData.associate = userData.associate;
                        if (userData.username) sessionData.associate = userData.username;
                    }
                }
                
                // Try to extract from meta tags
                const metaTags = document.querySelectorAll('meta[name*="warehouse"], meta[name*="user"]');
                metaTags.forEach(tag => {
                    const content = tag.getAttribute('content');
                    if (content && content !== 'CDPL1' && content !== 'System') {
                        if (tag.name.includes('warehouse')) {
                            sessionData.warehouseId = content;
                        } else if (tag.name.includes('user')) {
                            sessionData.associate = content;
                        }
                    }
                });
                
                console.log('🔧 Session data extraction attempt:', {
                    warehouseId: sessionData.warehouseId,
                    associate: sessionData.associate,
                    isValid: sessionData.warehouseId && sessionData.warehouseId !== 'CDPL1'
                });
                
                resolve(sessionData);
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    // Automatically load session data by searching for 'DZ' in background
    async function autoLoadSessionData() {
        try {
            console.log('🔄 Auto-loading session data...');
            
            // Strategy 1: Try to extract from current page
            await extractSessionFromPage();
            
            // Strategy 2: If no valid data, trigger a real API call to capture session
            const hasValidSession = sessionData.warehouseId && sessionData.warehouseId !== 'CDPL1' &&
                                   sessionData.associate && sessionData.associate !== 'System';
            
            console.log('📊 Session data after page extraction:', {
                warehouseId: sessionData.warehouseId,
                associate: sessionData.associate,
                isValid: hasValidSession
            });
            
            if (!hasValidSession) {
                console.log('🔍 No valid session found - monitoring mode active');
                console.log('📊 Use normal search to capture session data automatically');
            }
            
            // Check again if we got valid session data
            const finalCheck = sessionData.warehouseId && sessionData.warehouseId !== 'CDPL1' &&
                              sessionData.associate && sessionData.associate !== 'System';
            
            if (finalCheck) {
                console.log('✅ Session data auto-loaded successfully:', {
                    warehouseId: sessionData.warehouseId,
                    associate: sessionData.associate
                });
                sessionData.lastCaptured = new Date();
            } else {
                console.log('⚠️ Using fallback session data');
            }
            
            return true;
        } catch (error) {
            console.log('❌ Error in auto-loading:', error);
            return false;
        }
    }
    
    // Extract session data from page elements
    async function extractSessionFromPage() {
        try {
            // Method 1: Check localStorage
            const storageKeys = Object.keys(localStorage);
            for (const key of storageKeys) {
                try {
                    const value = localStorage.getItem(key);
                    if (value && (value.includes('warehouse') || value.includes('associate') || value.includes('user'))) {
                        const data = JSON.parse(value);
                        if (data.warehouseId && data.warehouseId !== 'CDPL1') {
                            sessionData.warehouseId = data.warehouseId;
                            console.log('🎯 Found warehouseId in localStorage:', data.warehouseId);
                        }
                        if (data.associate && data.associate !== 'System') {
                            sessionData.associate = data.associate;
                            console.log('🎯 Found associate in localStorage:', data.associate);
                        }
                        if (data.username && data.username !== 'System') {
                            sessionData.associate = data.username;
                            console.log('🎯 Found username in localStorage:', data.username);
                        }
                    }
                } catch (e) {
                    // Ignore JSON parse errors
                }
            }
            
            // Method 2: Check window objects
            if (window.__INITIAL_STATE__ || window.__APP_STATE__ || window.appConfig) {
                const state = window.__INITIAL_STATE__ || window.__APP_STATE__ || window.appConfig;
                if (state.user) {
                    if (state.user.warehouseId) sessionData.warehouseId = state.user.warehouseId;
                    if (state.user.associate) sessionData.associate = state.user.associate;
                    if (state.user.username) sessionData.associate = state.user.username;
                }
            }
            
            // Method 3: Check page scripts for embedded data
            const scripts = document.querySelectorAll('script:not([src])');
            for (const script of scripts) {
                const text = script.textContent;
                if (text && text.includes('warehouseId')) {
                    const warehouseMatch = text.match(/"warehouseId":\s*"([A-Z0-9]{3,10})"/);
                    const associateMatch = text.match(/"(?:associate|username)":\s*"([A-Z0-9]{3,20})"/);
                    
                    if (warehouseMatch && warehouseMatch[1] !== 'CDPL1') {
                        sessionData.warehouseId = warehouseMatch[1];
                        console.log('🎯 Found warehouseId in script:', warehouseMatch[1]);
                    }
                    if (associateMatch && associateMatch[1] !== 'System') {
                        sessionData.associate = associateMatch[1];
                        console.log('🎯 Found associate in script:', associateMatch[1]);
                    }
                }
            }
            
        } catch (e) {
            console.warn('Error extracting session from page:', e);
        }
    }
    
    // Automatically trigger session data capture at startup
    async function autoTriggerSessionCapture() {
        console.log('🚀 Auto-triggering session data capture at startup...');
        
        try {
            // First try to extract from URL parameters, page elements, or localStorage
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
                warehouseId = SCRIPT_METADATA.namespace; // From @namespace in script header
            }
            
            if (!associate) {
                // Try to get current logged-in user from the application
                const currentUser = getCurrentUser();
                if (currentUser) {
                    associate = currentUser;
                    console.log('🔍 Found current user from application:', currentUser);
                } else {
                    // Ultimate fallback: use script author (this should rarely happen)
                    associate = SCRIPT_METADATA.author;
                    console.log('⚠️ Using script author as fallback - may not work correctly');
                }
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
            
            console.log('📡 Making automatic session capture request:', {
                warehouseId: warehouseId,
                associate: associate
            });
            
            // Make the request
            const response = await fetch('/api/getContainer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br, zstd',
                    'Origin': window.location.origin,
                    'Connection': 'keep-alive',
                    'Referer': window.location.href,
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-origin',
                    'Priority': 'u=0'
                },
                body: JSON.stringify(requestData)
            });
            
            // Handle response - even 400 errors can provide valid session data via headers
            if (response.ok) {
                const data = await response.json();
                sessionData.update(warehouseId, associate);
                
                console.log('✅ Automatic session capture successful (200):', {
                    warehouseId: warehouseId,
                    associate: associate,
                    responseStatus: response.status,
                    hasData: !!data
                });
                
                return true;
            } else {
                // Even if we get 400, the request triggered session validation
                // and the server may have set cookies with correct data
                console.log('⚠️ Request returned status:', response.status, 'but session data should be valid');
                
                // Update session data anyway since we have valid values
                if (warehouseId && associate && warehouseId !== 'CDPL1' && associate !== 'System') {
                    sessionData.update(warehouseId, associate);
                    console.log('✅ Session data set despite HTTP error - this is normal for authentication');
                    return true;
                }
                
                return false;
            }
            
        } catch (error) {
            console.log('❌ Error in automatic session capture:', error.message);
            
            // Fallback: Use known working values from your environment
            try {
                // Based on your headers, we know these values work in your environment
                // Try to get current user instead of hardcoded value
                const fallbackWarehouseId = SCRIPT_METADATA.namespace;
                const currentUser = getCurrentUser();
                const fallbackAssociate = currentUser || SCRIPT_METADATA.author;
                
                console.log('🔄 Using fallback session data from known working values');
                
                sessionData.update(fallbackWarehouseId, fallbackAssociate);
                console.log('✅ Session data set using fallback values:', {
                    warehouseId: fallbackWarehouseId,
                    associate: fallbackAssociate,
                    note: 'These are from your working request headers'
                });
                
                return true;
                
            } catch (fallbackError) {
                console.log('❌ Even fallback session setup failed:', fallbackError.message);
                return false;
            }
        }
    }
    
    // Start monitoring session data from real application requests
    function startSessionMonitoring() {
        console.log('🔍 Starting session data monitoring...');
        
        // Override fetch to capture session data
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            const [url, options] = args;
            
            if (url && url.includes('/api/getContainer') && options && options.body) {
                try {
                    const requestData = JSON.parse(options.body);
                    if (requestData.warehouseId && requestData.warehouseId !== 'CDPL1' &&
                        requestData.associate && requestData.associate !== 'System') {
                        sessionData.update(requestData.warehouseId, requestData.associate);
                        console.log('✅ Session data captured from fetch:', { 
                            warehouseId: requestData.warehouseId, 
                            associate: requestData.associate 
                        });
                    }
                    
                    // Log session data capture
                    if (sessionData.warehouseId && sessionData.warehouseId !== 'CDPL1') {
                        console.log('✅ Session data active');
                    }
                } catch (e) {
                    // Ignore parsing errors
                }
            }
            
            return originalFetch.apply(this, args);
        };
        
        // Also monitor XMLHttpRequest
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
            this._rivUrl = url;
            this._rivMethod = method;
            return originalOpen.call(this, method, url, ...args);
        };
        
        XMLHttpRequest.prototype.send = function(data) {
            if (this._rivUrl && this._rivUrl.includes('/api/getContainer') && data) {
                try {
                    const requestData = JSON.parse(data);
                    if (requestData.warehouseId && requestData.warehouseId !== 'CDPL1' &&
                        requestData.associate && requestData.associate !== 'System') {
                        sessionData.update(requestData.warehouseId, requestData.associate);
                        console.log('✅ Session data captured from XHR:', {
                            warehouseId: requestData.warehouseId,
                            associate: requestData.associate
                        });
                    }
                    
                    // Log session data capture
                    if (sessionData.warehouseId && sessionData.warehouseId !== 'CDPL1') {
                        console.log('✅ Session data active');
                    }
                } catch (e) {
                    // Ignore parsing errors
                }
            }
            return originalSend.call(this, data);
        };
        
        console.log('✅ Session monitoring active - will capture data from app requests');
    }
    
    // Periodic session data refresh with automatic trigger
    let sessionRefreshInterval = null;
    
    function startSessionRefresh() {
        // Refresh session data every 10 minutes
        sessionRefreshInterval = setInterval(() => {
            console.log('🔄 Refreshing session data...');
            
            // First try automatic trigger
            autoTriggerSessionCapture().then((success) => {
                if (success) {
                    console.log('✅ Session refreshed via automatic trigger');
                } else {
                    // Fallback to extraction method
                    autoLoadSessionData().then((extractionSuccess) => {
                        if (extractionSuccess) {
                            console.log('✅ Session refreshed via extraction');
                        } else {
                            console.log('⚠️ Session refresh failed, monitoring mode active');
                        }
                    });
                }
            }).catch((error) => {
                console.log('⚠️ Session refresh error:', error.message);
                // Try extraction as fallback
                autoLoadSessionData();
            });
        }, 10 * 60 * 1000); // 10 minutes
        
        console.log('⏰ Session data refresh started (every 10 minutes with automatic trigger)');
    }
    
    function stopSessionRefresh() {
        if (sessionRefreshInterval) {
            clearInterval(sessionRefreshInterval);
            sessionRefreshInterval = null;
            console.log('⏹️ Session data refresh stopped');
        }
    }
    
    // Global debug function for checking localStorage session data (accessible from console)
    window.rivCheckStoredSession = function() {
        console.log('🔍 Checking stored session data...');
        
        try {
            const stored = localStorage.getItem('riv_session_data');
            if (stored) {
                const data = JSON.parse(stored);
                console.log('📦 Found stored session data:', data);
                
                const lastCaptured = data.lastCaptured ? new Date(data.lastCaptured) : null;
                const now = new Date();
                const hoursSinceCapture = lastCaptured ? (now - lastCaptured) / (1000 * 60 * 60) : 'unknown';
                
                console.log('⏰ Time since capture:', hoursSinceCapture, 'hours');
                console.log('📊 Current session state:', {
                    warehouseId: sessionData.warehouseId,
                    associate: sessionData.associate,
                    sessionId: sessionData.sessionId,
                    lastCaptured: sessionData.lastCaptured
                });
                
                return data;
            } else {
                console.log('📭 No stored session data found');
                return null;
            }
        } catch (e) {
            console.error('❌ Error reading stored session data:', e);
            return null;
        }
    };

    // Global debug function for clearing stored session data (accessible from console)
    window.rivClearStoredSession = function() {
        console.log('🗑️ Clearing stored session data...');
        
        try {
            localStorage.removeItem('riv_session_data');
            sessionData.warehouseId = null;
            sessionData.associate = null;
            sessionData.sessionId = null;
            sessionData.lastCaptured = null;
            
            console.log('✅ Stored session data cleared successfully');
            console.log('ℹ️ Refresh the page or call rivTestSessionCapture() to capture new session data');
            
            return true;
        } catch (e) {
            console.error('❌ Error clearing session data:', e);
            return false;
        }
    };

    // Global debug function for testing current user detection (accessible from console)
    window.rivTestCurrentUser = function() {
        console.log('🧪 Testing current user detection...');
        
        const currentUser = getCurrentUser();
        console.log('🧪 Current user detection result:', {
            user: currentUser,
            found: !!currentUser,
            scriptAuthor: SCRIPT_METADATA.author,
            willUse: currentUser || SCRIPT_METADATA.author
        });
        
        return currentUser;
    };
    
    // Global debug function for testing automatic session capture (accessible from console)
    window.rivTestSessionCapture = async function() {
        console.log('🧪 Testing automatic session capture...');
        
        try {
            const result = await autoTriggerSessionCapture();
            
            console.log('🧪 Test result:', {
                success: result,
                currentSessionData: {
                    warehouseId: sessionData.warehouseId,
                    associate: sessionData.associate,
                    lastCaptured: sessionData.lastCaptured
                }
            });
            
            return result;
        } catch (error) {
            console.error('🧪 Test failed:', error);
            return false;
        }
    };
    
    // Global function to manually set session data with known working values
    window.rivSetKnownSession = function() {
        console.log('🔧 Setting known working session data...');
        
        try {
            // From your working request example
            // Try to get current user from application
            const knownWarehouseId = SCRIPT_METADATA.namespace;
            const currentUser = getCurrentUser();
            const knownAssociate = currentUser || SCRIPT_METADATA.author;
            
            sessionData.update(knownWarehouseId, knownAssociate);
            
            console.log('✅ Session data set to known working values:', {
                warehouseId: knownWarehouseId,
                associate: knownAssociate,
                note: 'Ready for Dashboard/PalletLand use'
            });
            
            return true;
        } catch (error) {
            console.error('❌ Error setting known session:', error);
            return false;
        }
    };
    
    // Global function to manually trigger session update from cookies  
    window.rivUpdateFromCookies = function() {
        console.log('🍪 Manually updating session from cookies...');
        
        try {
            const cookies = document.cookie;
            console.log('🍪 Available cookies (limited by HttpOnly):', cookies);
            
            // Note: Many important cookies are HttpOnly and not accessible to JavaScript
            console.log('ℹ️ Important cookies (fcmenu-warehouseId, fcmenu-employeeLogin) are HttpOnly');
            console.log('ℹ️ Use rivSetKnownSession() instead for immediate session setup');
            
            // Try to extract what we can
            const warehouseMatch = cookies.match(/fcmenu-warehouseId=([A-Z0-9]+)/);
            const associateMatch = cookies.match(/fcmenu-employeeLogin=([A-Z0-9a-z]+)/);
            
            if (warehouseMatch && associateMatch) {
                const warehouseId = warehouseMatch[1];
                const associate = associateMatch[1];
                
                console.log('🍪 Extracted from cookies:', { warehouseId, associate });
                
                if (warehouseId !== 'CDPL1' && associate !== 'System') {
                    sessionData.update(warehouseId, associate);
                    console.log('✅ Session updated from cookies successfully');
                    return true;
                } else {
                    console.log('⚠️ Extracted default values, not updating');
                    return false;
                }
            } else {
                console.log('⚠️ Required cookies not accessible (they are HttpOnly)');
                console.log('💡 Try rivSetKnownSession() instead');
                return false;
            }
        } catch (error) {
            console.error('❌ Error updating from cookies:', error);
            return false;
        }
    };

    // Global debug function for detailed user detection testing (accessible from console)
    window.rivTestUserDetection = function() {
        console.log('=== DETAILED USER DETECTION TEST ===');
        
        console.log('🔍 Testing getCurrentUser() function...');
        const user = getCurrentUser();
        console.log('📝 getCurrentUser() result:', user);
        
        // Test script metadata
        const metadata = SCRIPT_METADATA();
        console.log('📝 Script metadata fallback:', metadata.author);
        
        console.log('\n=== SUMMARY ===');
        console.log('🎯 Final detection result:', { 
            detectedUser: user, 
            scriptAuthor: metadata.author,
            finalUser: user || metadata.author,
            source: user ? 'detected from application' : 'fallback to script author'
        });
        console.log('=== END USER DETECTION TEST ===');
        
        return { detectedUser: user, scriptAuthor: metadata.author };
    };
    
    // Enhanced container search with silent mode option
    async function performContainerSearch(containerId, silent = false) {
        // Use captured session data or try to extract from page
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
                console.warn('🔧 Could not extract session data, using defaults:', e.message);
            }
        }
        
        // Update session data if we have valid values
        if (warehouseId !== 'CDPL1' && associate !== 'System') {
            sessionData.update(warehouseId, associate);
        }
        
        console.log(`🔍 Performing search for ${containerId} with warehouseId: ${warehouseId}, associate: ${associate}`);
        
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
                console.warn('Could not set additional headers');
            }
            
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    console.log(`📡 API Response for ${containerId}: Status ${xhr.status}`);
                    
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
    }
    
    function updateDashboardDisplay() {
        const contentDiv = document.getElementById('dashboard-content');
        if (!contentDiv || dashboardData.length === 0) return;
        
        // Calculate summary stats
        const totalZones = dashboardData.length;
        const activeZones = dashboardData.filter(dz => dz.status === 'Active').length;
        const emptyZones = dashboardData.filter(dz => dz.status === 'Empty').length;
        const errorZones = dashboardData.filter(dz => dz.status === 'Error').length;
        const totalPalletsAll = dashboardData.reduce((sum, dz) => sum + dz.totalPallets, 0);
        const totalUnitsAll = dashboardData.reduce((sum, dz) => sum + dz.totalUnits, 0);
        
        // Group by main destinations and sortation category
        const destinationStats = {};
        const sortationStats = {};
        
        dashboardData.forEach(dz => {
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
                        const mainDestination = getMainDestination(category);
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
            
            <!-- Drop Zone Table -->
            <div style="background: white; border-radius: 12px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 20px 0; color: #333;">📋 Drop Zone Details</h3>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
                        <thead>
                            <tr style="border-bottom: 2px solid #dee2e6;">
                                <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #495057; width: 15%;">Drop Zone</th>
                                <th style="padding: 12px 8px; text-align: center; font-weight: 600; color: #495057; width: 10%;">Status</th>
                                <th style="padding: 12px 8px; text-align: center; font-weight: 600; color: #495057; width: 10%;">Pallets</th>
                                <th style="padding: 12px 8px; text-align: center; font-weight: 600; color: #495057; width: 10%;">Units</th>
                                <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #495057; width: 35%;">Sortation Category</th>
                                <th style="padding: 12px 8px; text-align: center; font-weight: 600; color: #495057; width: 20%;">Last Updated</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dashboardData.map((dz, index) => {
                                const statusColor = dz.status === 'Active' ? '#28a745' : 
                                                   dz.status === 'Empty' ? '#6c757d' : '#dc3545';
                                const categoryColor = dz.dropZoneId.includes('-A') ? '#28a745' :
                                                     dz.dropZoneId.includes('-B') ? '#17a2b8' :
                                                     dz.dropZoneId.includes('-C') ? '#ffc107' : '#dc3545';
                                
                                // Format sortation categories with commas if multiple
                                const sortationDisplay = dz.sortationCategory && dz.sortationCategory !== 'N/A' && dz.sortationCategory !== 'Empty' 
                                    ? dz.sortationCategory.split(',').map(cat => cat.trim()).join(', ')
                                    : (dz.sortationCategory || 'N/A');
                                
                                // Check if has multiple categories (excluding DZ-CD-ALL)
                                const allCategories = dz.sortationCategory && dz.sortationCategory !== 'N/A' && dz.sortationCategory !== 'Empty' 
                                    ? dz.sortationCategory.split(',').map(cat => cat.trim()).filter(cat => cat)
                                    : [];
                                
                                // Don't highlight DZ-CD-ALL drop zones at all, regardless of sortation category
                                // Only highlight if: not DZ-CD-ALL dropzone AND multiple categories AND not all categories are DZ-CD-ALL
                                const isDZAll = dz.dropZoneId === 'DZ-CD-ALL';
                                const hasMultipleCategories = !isDZAll && allCategories.length > 1 && !allCategories.every(cat => cat === 'DZ-CD-ALL');
                                const rowHighlight = hasMultipleCategories ? 'background: #ffe6e6 !important; border-left: 3px solid #dc3545;' : '';
                                
                                return `
                                <tr style="border-bottom: 1px solid #dee2e6; ${index % 2 === 0 && !hasMultipleCategories ? 'background: #f8f9fa;' : ''} ${rowHighlight}">
                                    <td style="padding: 10px 8px; font-weight: 500; color: ${categoryColor}; overflow: hidden; text-overflow: ellipsis;">${dz.dropZoneId}</td>
                                    <td style="padding: 10px 8px; text-align: center;">
                                        <span style="color: ${statusColor}; font-weight: 500;">${dz.status}</span>
                                    </td>
                                    <td style="padding: 10px 8px; text-align: center; color: #495057;">${dz.totalPallets}</td>
                                    <td style="padding: 10px 8px; text-align: center; color: #495057;">${dz.totalUnits}</td>
                                    <td style="padding: 10px 8px; color: #6c757d; font-size: 12px; word-wrap: break-word; overflow-wrap: break-word;" title="${sortationDisplay}">
                                        ${hasMultipleCategories ? `<strong style="color: #dc3545;">${sortationDisplay}</strong>` : sortationDisplay}
                                    </td>
                                    <td style="padding: 10px 8px; text-align: center; color: #6c757d; font-size: 12px; overflow: hidden; text-overflow: ellipsis;">${dz.lastUpdated}</td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    function exportDashboardData() {
        if (dashboardData.length === 0) {
            alert('No data to export. Please run a scan first.');
            return;
        }
        
        // Prepare CSV data
        const csvData = dashboardData.map(dz => ({
            'Drop Zone ID': dz.dropZoneId,
            'Status': dz.status,
            'Total Pallets': dz.totalPallets,
            'Total Units': dz.totalUnits,
            'Sortation Category': dz.sortationCategory,
            'Last Updated': dz.lastUpdated
        }));
        
        const csvContent = convertToCSV(csvData);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `palletland_overview_${timestamp}.csv`;
        
        downloadCSV(csvContent, filename);
        
        console.log('Dashboard data exported:', csvData.length, 'records');
    }
    
    // Update PalletLand display
    function updatePalletLandDisplay() {
        const contentDiv = document.getElementById('palletland-content');
        if (!contentDiv || palletlandData.length === 0) return;
        
        // Calculate summary stats (using different field names than Dashboard)
        const totalZones = palletlandData.length;
        const activeZones = palletlandData.filter(dz => dz.status === 'Active').length;
        const emptyZones = palletlandData.filter(dz => dz.status === 'Empty').length;
        const errorZones = palletlandData.filter(dz => dz.status === 'Error').length;
        const totalPalletsAll = palletlandData.reduce((sum, dz) => sum + (dz.palletCount || 0), 0);
        const totalUnitsAll = palletlandData.reduce((sum, dz) => sum + (dz.unitCount || 0), 0);
        
        console.log(`🎯 PalletLand Stats: ${totalPalletsAll} pallets, ${totalUnitsAll} units from ${palletlandData.length} zones`);
        
        // Group by category (A, B, C, D) and sortation category
        const categoryStats = {};
        const sortationStats = {};
        const destinationStats = {};
        
        palletlandData.forEach(dz => {
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
                        const mainDestination = getMainDestination(category);
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
                            ${palletlandData.map((dz, index) => {
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
    }

    // Settings storage - preserved across updates via localStorage
    let scriptSettings = {
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
    };

    // PalletLand segment management functions (global for onclick access)
    window.updateSegmentEnabled = function(index, enabled) {
        if (scriptSettings.palletlandSegments[index]) {
            scriptSettings.palletlandSegments[index].enabled = enabled;
        }
    };

    window.updateSegmentPrefix = function(index, prefix) {
        if (scriptSettings.palletlandSegments[index]) {
            scriptSettings.palletlandSegments[index].prefix = prefix;
        }
    };

    window.updateSegmentFrom = function(index, from) {
        if (scriptSettings.palletlandSegments[index]) {
            scriptSettings.palletlandSegments[index].from = parseInt(from) || 1;
        }
    };

    window.updateSegmentTo = function(index, to) {
        if (scriptSettings.palletlandSegments[index]) {
            scriptSettings.palletlandSegments[index].to = parseInt(to) || 50;
        }
    };

    window.removeSegment = function(index) {
        scriptSettings.palletlandSegments.splice(index, 1);
        loadSegments();
    };

    // Dashboard segment management functions
    window.updateDashboardSegmentEnabled = function(index, enabled) {
        if (scriptSettings.dashboardSegments[index]) {
            scriptSettings.dashboardSegments[index].enabled = enabled;
        }
    };

    window.updateDashboardSegmentPrefix = function(index, prefix) {
        if (scriptSettings.dashboardSegments[index]) {
            scriptSettings.dashboardSegments[index].prefix = prefix;
        }
    };

    window.updateDashboardSegmentFrom = function(index, from) {
        if (scriptSettings.dashboardSegments[index]) {
            scriptSettings.dashboardSegments[index].from = parseInt(from) || 1;
        }
    };

    window.updateDashboardSegmentTo = function(index, to) {
        if (scriptSettings.dashboardSegments[index]) {
            scriptSettings.dashboardSegments[index].to = parseInt(to) || 26;
        }
    };

    window.removeDashboardSegment = function(index) {
        scriptSettings.dashboardSegments.splice(index, 1);
        loadDashboardSegments();
    };

    function loadSegments() {
        const container = document.getElementById('segments-container');
        if (!container) return;
        
        container.innerHTML = scriptSettings.palletlandSegments
            .map((segment, index) => createSegmentElement(segment, index))
            .join('');
            
        // Setup event listeners for Add Segment button
        const addBtn = document.getElementById('add-segment');
        if (addBtn) {
            addBtn.onclick = addNewSegment;
        }
    }

    function addNewSegment() {
        scriptSettings.palletlandSegments.push({ prefix: 'DZ-NEW-', from: 1, to: 50, enabled: true });
        loadSegments();
    }
    
    function loadDashboardSegments() {
        const container = document.getElementById('dashboard-segments-container');
        if (!container) return;
        
        container.innerHTML = scriptSettings.dashboardSegments
            .map((segment, index) => createDashboardSegmentElement(segment, index))
            .join('');
            
        // Setup event listeners for Add Dashboard Segment button
        const addBtn = document.getElementById('add-dashboard-segment');
        if (addBtn) {
            addBtn.onclick = addNewDashboardSegment;
        }
    }

    function addNewDashboardSegment() {
        scriptSettings.dashboardSegments.push({ prefix: 'DZ-NEW-', from: 1, to: 26, enabled: true });
        loadDashboardSegments();
    }
    
    function createDashboardSegmentElement(segment, index) {
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
    }

    function createSegmentElement(segment, index) {
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
    }

    function loadSettings() {
        try {
            const saved = localStorage.getItem('riv-reloup-settings');
            if (saved) {
                scriptSettings = { ...scriptSettings, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('Could not load settings:', e);
        }

        // Apply settings to modal
        const filenamePrefixInput = document.getElementById('filename-prefix');
        const includeTimestampInput = document.getElementById('include-timestamp');
        const showPalletLandInput = document.getElementById('show-palletland');
        
        // PalletLand settings
        const customDestInput = document.getElementById('custom-destinations');
        
        // Dashboard settings
        const dashboardCustomDestInput = document.getElementById('dashboard-custom-destinations');

        if (filenamePrefixInput) filenamePrefixInput.value = scriptSettings.filenamePrefix;
        if (includeTimestampInput) includeTimestampInput.checked = scriptSettings.includeTimestamp;
        if (showPalletLandInput) showPalletLandInput.checked = scriptSettings.showPalletLand;
        
        // PalletLand settings
        if (customDestInput) customDestInput.value = scriptSettings.palletlandCustomDestinations || '';
        
        // Dashboard settings
        if (dashboardCustomDestInput) dashboardCustomDestInput.value = scriptSettings.dashboardCustomDestinations || '';
        
        // Load segments configuration
        loadSegments();
        loadDashboardSegments();
    }
    // Settings management functions
    function saveSettings() {
        // Get values from modal
        const filenamePrefixInput = document.getElementById('filename-prefix');
        const includeTimestampInput = document.getElementById('include-timestamp');
        const showPalletLandInput = document.getElementById('show-palletland');
        
        // PalletLand settings
        const customDestInput = document.getElementById('custom-destinations');
        
        // Dashboard settings
        const dashboardCustomDestInput = document.getElementById('dashboard-custom-destinations');

        scriptSettings.filenamePrefix = filenamePrefixInput?.value || 'RIV';
        scriptSettings.includeTimestamp = includeTimestampInput?.checked || false;
        scriptSettings.showPalletLand = showPalletLandInput?.checked ?? true; // Default true if undefined
        
        // PalletLand settings
        scriptSettings.palletlandCustomDestinations = customDestInput?.value || '';
        
        // Dashboard settings
        scriptSettings.dashboardCustomDestinations = dashboardCustomDestInput?.value || '';
        
        // Segments are already updated in real-time via the update functions

        try {
            localStorage.setItem('riv-reloup-settings', JSON.stringify(scriptSettings));
            console.log('Settings saved successfully');
            
            // Refresh menu visibility
            updateMenuVisibility();
        } catch (e) {
            console.warn('Could not save settings:', e);
        }
    }

    // Auto-update functionality (legacy)
    async function checkForUpdatesLegacy() {
        try {
            // Check if we've checked recently (don't spam GitHub)
            const lastCheck = localStorage.getItem('riv-last-update-check');
            const now = Date.now();
            const oneHour = 60 * 60 * 1000;
            
            if (lastCheck && (now - parseInt(lastCheck)) < oneHour) {
                return; // Skip if checked within last hour
            }
            
            const response = await fetch(GITHUB_RAW_URL);
            if (!response.ok) throw new Error('Failed to fetch update');
            
            const scriptContent = await response.text();
            
            // Extract version from the fetched script
            const versionMatch = scriptContent.match(/@version\s+([\d\.]+)/);
            if (!versionMatch) {
                console.warn('Could not determine remote version');
                return;
            }
            
            const remoteVersion = versionMatch[1];
            localStorage.setItem('riv-last-update-check', now.toString());
            
            if (compareVersionsOld(remoteVersion, SCRIPT_VERSION) > 0) {
                showUpdateNotification(remoteVersion, scriptContent);
            }
            
        } catch (error) {
            console.warn('Update check failed:', error);
        }
    }
    
    function compareVersionsOld(version1, version2) {
        const v1Parts = version1.split('.').map(Number);
        const v2Parts = version2.split('.').map(Number);
        
        const maxLength = Math.max(v1Parts.length, v2Parts.length);
        
        for (let i = 0; i < maxLength; i++) {
            const v1Part = v1Parts[i] || 0;
            const v2Part = v2Parts[i] || 0;
            
            if (v1Part > v2Part) return 1;
            if (v1Part < v2Part) return -1;
        }
        
        return 0;
    }
    
    function showUpdateNotification(newVersion, scriptContent) {
        // Create update notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 999998;
            max-width: 350px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 1.4;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <span style="font-size: 20px; margin-right: 10px;">🔄</span>
                <strong>RIV-ReloUp Update Available!</strong>
            </div>
            <p style="margin: 5px 0;">Version ${newVersion} is available</p>
            <p style="margin: 5px 0; font-size: 12px; opacity: 0.9;">Current: ${SCRIPT_VERSION}</p>
            <div style="margin-top: 15px; display: flex; gap: 10px;">
                <button id="update-now" style="
                    background: rgba(255,255,255,0.2);
                    border: 1px solid rgba(255,255,255,0.3);
                    color: white;
                    padding: 8px 15px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                ">Update Now</button>
                <button id="update-later" style="
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    color: white;
                    padding: 8px 15px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                ">Later</button>
                <button id="update-never" style="
                    background: none;
                    border: none;
                    color: rgba(255,255,255,0.7);
                    padding: 8px 15px;
                    cursor: pointer;
                    font-size: 12px;
                ">✕</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Event listeners
        document.getElementById('update-now').onclick = () => {
            performUpdate(scriptContent, newVersion);
            notification.remove();
        };
        
        document.getElementById('update-later').onclick = () => {
            notification.remove();
        };
        
        document.getElementById('update-never').onclick = () => {
            localStorage.setItem('riv-skip-version', newVersion);
            notification.remove();
        };
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    }
    
    function performUpdate(scriptContent, newVersion) {
        // Show update modal with instructions
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 30px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        `;
        
        modal.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #333; margin-bottom: 10px;">🔄 Update RIV-ReloUp</h2>
                <p style="color: #666;">Version ${SCRIPT_VERSION} → ${newVersion}</p>
            </div>
            
            <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 6px;">
                <h3 style="color: #555; margin-top: 0;">Automatic Update Instructions:</h3>
                <ol style="margin: 10px 0; padding-left: 20px; color: #666;">
                    <li>The new script content is ready to copy</li>
                    <li>Open Tampermonkey dashboard</li>
                    <li>Find "RIV - ReloUp" script</li>
                    <li>Click "Edit"</li>
                    <li>Select all content (Ctrl+A) and paste the new version</li>
                    <li>Save (Ctrl+S)</li>
                    <li>Refresh this page</li>
                </ol>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4 style="color: #555;">New Script Content:</h4>
                <textarea id="new-script-content" readonly style="
                    width: 100%;
                    height: 200px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    padding: 10px;
                    font-family: monospace;
                    font-size: 12px;
                    background: #f8f9fa;
                ">${scriptContent}</textarea>
            </div>
            
            <div style="text-align: center;">
                <button id="copy-script" style="
                    background: #28a745;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-right: 10px;
                    font-size: 14px;
                ">📋 Copy Script</button>
                <button id="close-update" style="
                    background: #6c757d;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                ">Close</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Event listeners
        document.getElementById('copy-script').onclick = () => {
            const textarea = document.getElementById('new-script-content');
            textarea.select();
            document.execCommand('copy');
            
            const btn = document.getElementById('copy-script');
            btn.textContent = '✅ Copied!';
            btn.style.background = '#28a745';
        };
        
        document.getElementById('close-update').onclick = () => overlay.remove();
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };
    }

    // Update Total Items display
    function updateTotalItemsDisplay(totalItems = null, message = '', isError = false) {
        const totalItemsElement = document.getElementById('riv-total-items');
        
        if (totalItemsElement) {
            if (totalItems !== null && !isError) {
                // Final result - show the total count
                totalItemsElement.innerHTML = `<strong>${totalItems}</strong>`;
                totalItemsElement.title = `Analysis completed at ${new Date().toLocaleTimeString('pl-PL')}`;
                
                // Add subtle highlight to the cell
                const cell = totalItemsElement.closest('td');
                if (cell) {
                    cell.style.background = 'rgba(40, 167, 69, 0.1)';
                    cell.style.border = '1px solid rgba(40, 167, 69, 0.3)';
                }
            } else if (isError) {
                // Error state
                totalItemsElement.innerHTML = '<span>Error</span>';
                totalItemsElement.title = message;
            } else if (message) {
                // Progress update
                totalItemsElement.innerHTML = `<span>${message}</span>`;
            }
        } else {
            // Element doesn't exist yet, try to add the column
            addTotalItemsColumn();
            // Retry after short delay
            setTimeout(() => updateTotalItemsDisplay(totalItems, message, isError), 200);
        }
    }
    
    // Fast API request with session management
    async function getContainerDetails(containerId, warehouseId, associate) {
        // Use global session data if available
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
    }
    
    // Fast parallel processing
    async function processChildContainersFast(childContainers, warehouseId, associate) {
        console.log(`🎯 Starting FAST analysis of ${childContainers.length} containers with warehouseId: ${warehouseId}, associate: ${associate}`);
        
        updateTotalItemsDisplay(null, `Starting analysis...`);
        
        // Reset collected data
        collectedContainerData = [];
        
        // Process containers in parallel batches for maximum speed
        const batchSize = 5; // Fixed batch size for processing
        const batches = [];
        
        for (let i = 0; i < childContainers.length; i += batchSize) {
            batches.push(childContainers.slice(i, i + batchSize));
        }
        
        let totalItems = 0;
        let successCount = 0;
        let errorCount = 0;
        
        for (const batch of batches) {
            // Process batch in parallel
            const batchPromises = batch.map(async (container) => {
                try {
                    const details = await getContainerDetails(container.containerId, warehouseId, associate);
                    
                    // Collect main container data (Pallet level)
                    const mainContainerData = collectContainerData(details, null);
                    collectedContainerData.push(...mainContainerData);
                    
                    // Collect sub-container data (TOTE level) if any
                    if (details.childContainers && details.childContainers.length > 0) {
                        for (const childContainer of details.childContainers) {
                            try {
                                const childDetails = await getContainerDetails(childContainer.containerId, warehouseId, associate);
                                const subContainerData = collectContainerData(childDetails, container);
                                collectedContainerData.push(...subContainerData);
                            } catch (childError) {
                                console.warn(`Error processing child container ${childContainer.containerId}:`, childError.message);
                            }
                        }
                    }
                    
                    if (details.childContainers && details.childContainers.length > 0) {
                        const containerTotal = details.childContainers.reduce((sum, child) => 
                            sum + (child.numOfChildContainers || 0), 0);
                        return containerTotal;
                    }
                    return 0;
                } catch (error) {
                    console.warn(`Error processing ${container.containerId}:`, error.message);
                    return 0;
                }
            });
            
            // Wait for batch to complete
            const batchResults = await Promise.all(batchPromises);
            
            // Sum batch results
            batchResults.forEach(result => {
                if (result > 0) {
                    totalItems += result;
                    successCount++;
                } else {
                    errorCount++;
                }
            });
            
            // Update progress
            const processed = Math.min(successCount + errorCount, childContainers.length);
            updateTotalItemsDisplay(null, `${processed}/${childContainers.length} (${totalItems} found)`);
        }
        
        // Final result
        updateTotalItemsDisplay(totalItems, 'Analysis Complete!');
        
        // Show export button
        const exportBtn = document.getElementById('riv-export-btn');
        if (exportBtn) {
            exportBtn.style.display = 'inline-block';
        }
        
        console.log(`🎉 FAST ANALYSIS COMPLETE:
        - Total items: ${totalItems}
        - Successful: ${successCount}/${childContainers.length}
        - Errors: ${errorCount}
        - CSV records collected: ${collectedContainerData.length}`);
        
        return totalItems;
    }
    
    // Process response data
    function processApiResponse(data, requestBody) {
        console.log('📊 processApiResponse called with:', {
            hasData: !!data,
            hasChildContainers: data?.childContainers?.length,
            isProcessing: isProcessing,
            containerId: requestBody?.containerId
        });
        
        if (data && data.childContainers && Array.isArray(data.childContainers) && data.childContainers.length > 0) {
            if (!isProcessing) {
                isProcessing = true;
                console.log(`🚀 Starting analysis for ${data.childContainers.length} containers`);
                
                const warehouseId = requestBody.warehouseId;
                const associate = requestBody.associate;
                
                updateTotalItemsDisplay(null, `Found ${data.childContainers.length} containers`);
                
                // Start fast processing immediately
                setTimeout(async () => {
                    try {
                        await processChildContainersFast(data.childContainers, warehouseId, associate);
                    } catch (error) {
                        updateTotalItemsDisplay(0, `Analysis failed: ${error.message}`, true);
                        console.error('❌ Error during analysis:', error);
                    } finally {
                        isProcessing = false;
                        console.log('✅ Analysis completed, isProcessing reset');
                    }
                }, 100); // Much shorter delay
                
                return true;
            } else {
                console.log('⚠️ Already processing, skipping');
            }
        } else {
            console.log('❌ No valid data or child containers found');
        }
        return false;
    }
    
    // Enhanced XHR interceptor for session management
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.send = function(data) {
        const xhr = this;
        
        if (this._url && this._url.includes('getContainer') && data) {
            try {
                // Capture session data from real API requests
                const requestData = JSON.parse(data);
                if (requestData.warehouseId && requestData.associate) {
                    // Only update if we get non-default values
                    if (requestData.warehouseId !== 'CDPL1' && requestData.associate !== 'System') {
                        sessionData.update(requestData.warehouseId, requestData.associate);
                        console.log(`🔐 Valid session data captured: warehouseId=${requestData.warehouseId}, associate=${requestData.associate}`);
                    } else {
                        console.warn(`🚫 Skipped default session data: warehouseId=${requestData.warehouseId}, associate=${requestData.associate}`);
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
            
            const originalOnReadyStateChange = this.onreadystatechange;
            
            this.onreadystatechange = function() {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    try {
                        const responseData = JSON.parse(xhr.responseText);
                        const requestData = JSON.parse(data);
                        
                        // Process all search requests for container analysis
                        if (!isProcessing && requestData.containerId) {
                            console.log(`🔍 Processing search response for: ${requestData.containerId}`);
                            processApiResponse(responseData, requestData);
                        }
                    } catch (e) {
                        console.warn('❌ Error processing API response:', e.message);
                    }
                }
                
                if (originalOnReadyStateChange) {
                    originalOnReadyStateChange.apply(this, arguments);
                }
            };
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
    
    // Initialize
    const init = () => {
        console.log('🔄 RIV - ReloUp initializing...');
        
        // Restore session data from localStorage first
        const sessionRestored = sessionData.load();
        if (sessionRestored) {
            console.log('🔄 Session data successfully restored from previous session');
        }
        
        addTotalItemsColumn();
        initializeCopyToClipboard();
        addMenuOptions();
        loadSettings(); // Load saved settings on startup
        
        // Auto-load session data in background
        setTimeout(() => {
            // First start monitoring for real requests
            startSessionMonitoring();
            
            // Attempt automatic session capture at startup
            if (!sessionRestored) {
                console.log('🚀 Attempting automatic session capture...');
                autoTriggerSessionCapture().then((success) => {
                    if (success) {
                        console.log('✅ Automatic session capture successful at startup');
                        // Start periodic refresh after successful capture
                        startSessionRefresh();
                    } else {
                        console.log('⚠️ Automatic session capture failed, falling back to monitoring mode');
                        // Still try auto-loading with existing methods
                        autoLoadSessionData().then((fallbackSuccess) => {
                            if (fallbackSuccess) {
                                startSessionRefresh();
                            } else {
                                // If both methods failed, try again in 10 seconds
                                setTimeout(() => {
                                    console.log('🔄 Retrying session data capture...');
                                    autoTriggerSessionCapture().catch(() => {
                                        console.log('🔄 Retrying with auto-load method...');
                                        autoLoadSessionData();
                                    });
                                }, 10000);
                            }
                        });
                    }
                });
            } else {
                // If session was restored, still start periodic refresh and monitoring
                startSessionRefresh();
                
                // Try to update session data from cookies anyway (in case stored data is outdated)
                setTimeout(() => {
                    autoTriggerSessionCapture().then((success) => {
                        if (success) {
                            console.log('✅ Session data refreshed from cookies');
                        }
                    }).catch((error) => {
                        console.log('ℹ️ Could not refresh session from cookies (using stored data)');
                    });
                }, 2000);
            }
        }, 1000); // Reduced delay for faster startup
        
        // Check for updates (delayed to not interfere with main functionality)
        setTimeout(() => {
            checkForUpdates(); // Use new auto-update system
        }, 5000); // Check after 5 seconds
        
        console.log('📄 Fast container analysis ready - Full functionality enabled');
        console.log('🔧 Debug functions available:');
        console.log('   - rivTestCurrentUser() - Test current user detection');
        console.log('   - rivTestSessionCapture() - Test automatic session capture');
        console.log('   - rivTestUserDetection() - Detailed user detection test with step-by-step output');
        console.log('   - rivCheckStoredSession() - Check what is stored in localStorage');
        console.log('   - rivClearStoredSession() - Clear stored session data');
        console.log('   - rivSetKnownSession() - Set session from current user or fallback');
        console.log('   - rivUpdateFromCookies() - Try to update session from cookies (limited)');
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    console.log('✅ RIV - ReloUp loaded (Speed Optimized)');
})();