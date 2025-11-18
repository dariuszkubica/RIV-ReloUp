// core.js - Core functionality for RIV ReloUp
// Session management, API interactions, and main utilities

class CoreModule {
    constructor() {
        this.SCRIPT_VERSION = '3.7';
        this.GITHUB_RAW_URL = 'https://raw.githubusercontent.com/dariuszkubica/RIV-ReloUp/main/RIV%20-%20ReloUp.user.js';
        
        // Global session data storage with localStorage persistence
        this.sessionData = {
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

        // Category to Main Destination mapping
        this.categoryDestinationMap = {
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

        // Processing state for search analysis
        this.isProcessing = false;
        
        // Store collected data for CSV export
        this.collectedContainerData = [];
    }

    // Get main destination for category
    getMainDestination(sortationCategory) {
        if (!sortationCategory || sortationCategory === 'N/A' || sortationCategory === 'Empty') {
            return 'Unknown';
        }
        
        // Handle multiple categories separated by commas
        const categories = sortationCategory.split(',').map(cat => cat.trim());
        const destinations = new Set();
        
        categories.forEach(category => {
            const destination = this.categoryDestinationMap[category] || 'Unknown';
            destinations.add(destination);
        });
        
        // If multiple destinations, join them
        return Array.from(destinations).sort().join(', ');
    }

    // Enhanced container search with silent mode option
    async performContainerSearch(containerId, silent = false) {
        // Use captured session data or try to extract from page
        let warehouseId = this.sessionData.warehouseId || 'CDPL1';
        let associate = this.sessionData.associate || 'System';
        
        // If we don't have session data, try multiple extraction methods
        if (!this.sessionData.warehouseId || !this.sessionData.associate) {
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
            this.sessionData.update(warehouseId, associate);
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

    // CSV Export functionality
    collectContainerData(data, parentInfo = null) {
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
    
    convertToCSV(data) {
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
    
    downloadCSV(csvContent, filename) {
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

    // Add Total Items column to existing DROP_ZONE table
    addTotalItemsColumn() {
        const table = document.querySelector('table.searched-container-table');
        if (!table) {
            // Try again after a short delay if table not found
            setTimeout(() => this.addTotalItemsColumn(), 1000);
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

    // Update Total Items display
    updateTotalItemsDisplay(totalItems = null, message = '', isError = false) {
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
            this.addTotalItemsColumn();
            // Retry after short delay
            setTimeout(() => this.updateTotalItemsDisplay(totalItems, message, isError), 200);
        }
    }

    // Fast parallel processing
    async processChildContainersFast(childContainers, warehouseId, associate) {
        console.log(`🎯 Starting FAST analysis of ${childContainers.length} containers with warehouseId: ${warehouseId}, associate: ${associate}`);
        
        this.updateTotalItemsDisplay(null, `Starting analysis...`);
        
        // Reset collected data
        this.collectedContainerData = [];
        
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
                    const details = await this.getContainerDetails(container.containerId, warehouseId, associate);
                    
                    // Collect main container data (Pallet level)
                    const mainContainerData = this.collectContainerData(details, null);
                    this.collectedContainerData.push(...mainContainerData);
                    
                    // Collect sub-container data (TOTE level) if any
                    if (details.childContainers && details.childContainers.length > 0) {
                        for (const childContainer of details.childContainers) {
                            try {
                                const childDetails = await this.getContainerDetails(childContainer.containerId, warehouseId, associate);
                                const subContainerData = this.collectContainerData(childDetails, container);
                                this.collectedContainerData.push(...subContainerData);
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
            this.updateTotalItemsDisplay(null, `${processed}/${childContainers.length} (${totalItems} found)`);
        }
        
        // Final result
        this.updateTotalItemsDisplay(totalItems, 'Analysis Complete!');
        
        // Show export button
        const exportBtn = document.getElementById('riv-export-btn');
        if (exportBtn) {
            exportBtn.style.display = 'inline-block';
        }
        
        console.log(`🎉 FAST ANALYSIS COMPLETE:
        - Total items: ${totalItems}
        - Successful: ${successCount}/${childContainers.length}
        - Errors: ${errorCount}
        - CSV records collected: ${this.collectedContainerData.length}`);
        
        return totalItems;
    }

    // Fast API request with session management
    async getContainerDetails(containerId, warehouseId, associate) {
        // Use global session data if available
        const actualWarehouseId = this.sessionData.warehouseId || warehouseId;
        const actualAssociate = this.sessionData.associate || associate;
        
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

    // Process response data
    processApiResponse(data, requestBody) {
        console.log('📊 processApiResponse called with:', {
            hasData: !!data,
            hasChildContainers: data?.childContainers?.length,
            isProcessing: this.isProcessing,
            containerId: requestBody?.containerId
        });
        
        if (data && data.childContainers && Array.isArray(data.childContainers) && data.childContainers.length > 0) {
            if (!this.isProcessing) {
                this.isProcessing = true;
                console.log(`🚀 Starting analysis for ${data.childContainers.length} containers`);
                
                const warehouseId = requestBody.warehouseId;
                const associate = requestBody.associate;
                
                this.updateTotalItemsDisplay(null, `Found ${data.childContainers.length} containers`);
                
                // Start fast processing immediately
                setTimeout(async () => {
                    try {
                        await this.processChildContainersFast(data.childContainers, warehouseId, associate);
                    } catch (error) {
                        this.updateTotalItemsDisplay(0, `Analysis failed: ${error.message}`, true);
                        console.error('❌ Error during analysis:', error);
                    } finally {
                        this.isProcessing = false;
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

    // Copy to clipboard functionality
    initializeCopyToClipboard() {
        // Add click event listener to document for table elements
        document.addEventListener('click', (event) => {
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
                navigator.clipboard.writeText(textToCopy).then(() => {
                    // Show visual feedback if enabled in settings
                    const settings = window.scriptSettings || {};
                    if (settings.showCopyTooltip || settings.highlightCopiedCell) {
                        this.showCopyFeedback(cell, textToCopy);
                    }
                }).catch(() => {
                    // Fallback for older browsers
                    this.fallbackCopyToClipboard(textToCopy);
                    const settings = window.scriptSettings || {};
                    if (settings.showCopyTooltip || settings.highlightCopiedCell) {
                        this.showCopyFeedback(cell, textToCopy);
                    }
                });
            }
        });
    }
    
    // Fallback copy function for older browsers
    fallbackCopyToClipboard(text) {
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
    showCopyFeedback(cell, copiedText) {
        const settings = window.scriptSettings || {};
        
        // Create temporary tooltip if enabled
        let tooltip;
        if (settings.showCopyTooltip) {
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
        if (settings.highlightCopiedCell) {
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
            if (settings.highlightCopiedCell) {
                cell.style.border = originalBorder;
                cell.style.backgroundColor = originalBackground;
            }
        }, 1500);
    }

    // Enhanced XHR interceptor for session management
    initializeSessionMonitoring() {
        const originalXHRSend = XMLHttpRequest.prototype.send;
        const coreModule = this;
        
        XMLHttpRequest.prototype.send = function(data) {
            const xhr = this;
            
            if (this._url && this._url.includes('getContainer') && data) {
                try {
                    // Capture session data from real API requests
                    const requestData = JSON.parse(data);
                    if (requestData.warehouseId && requestData.associate) {
                        // Only update if we get non-default values
                        if (requestData.warehouseId !== 'CDPL1' && requestData.associate !== 'System') {
                            coreModule.sessionData.update(requestData.warehouseId, requestData.associate);
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
                            if (!coreModule.isProcessing && requestData.containerId) {
                                console.log(`🔍 Processing search response for: ${requestData.containerId}`);
                                coreModule.processApiResponse(responseData, requestData);
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
    }

    // Menu management
    addMenuOptions() {
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
        dashboardItem.onclick = (e) => {
            e.preventDefault();
            if (window.dashboardModule) {
                window.dashboardModule.showDashboard();
            }
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
        palletlandItem.onclick = (e) => {
            e.preventDefault();
            if (window.palletlandModule) {
                window.palletlandModule.showPalletLand();
            }
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
        settingsItem.onclick = (e) => {
            e.preventDefault();
            if (window.settingsModule) {
                window.settingsModule.showSettingsModal();
            }
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
        
        // Apply visibility settings from settings module
        if (window.settingsModule) {
            window.settingsModule.updateMenuVisibility();
        }
    }

    // Version comparison utility
    isNewerVersion(remote, current) {
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
}

// Export for global access
window.CoreModule = CoreModule;