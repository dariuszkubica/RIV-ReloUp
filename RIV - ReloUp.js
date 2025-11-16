// ==UserScript==
// @name         RIV - ReloUp
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Fast deep container analysis - optimized for speed
// @author       kubicdar
// @match        https://dub.prod.item-visibility.returns.amazon.dev/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('🚀 RIV - ReloUp script starting (Speed Optimized)...');
    
    let isProcessing = false;
    
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
    
    // CSV Export functionality
    function collectContainerData(data, parentInfo = null) {
        const containers = [];
        
        if (data.childContainers && Array.isArray(data.childContainers)) {
            data.childContainers.forEach(container => {
                const containerInfo = {
                    'Container ID': container.containerId || '',
                    'Parent Container': parentInfo ? parentInfo.containerId : 'Root',
                    'Container Type': container.containerType || '',
                    'Pallet ID': parentInfo ? parentInfo.containerId : container.containerId,
                    'TOTE': parentInfo ? container.containerId : (container.numOfChildContainers || 0),
                    'Tote ID': parentInfo ? container.containerId : '',
                    'ITEM': parentInfo ? (container.numOfChildContainers || 0) : '',
                    'Sortation Category': container.sortationCategory || '',
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
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `container_analysis_${timestamp}.csv`;
        
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
    
    // Fast API request without excessive logging
    async function getContainerDetails(containerId, warehouseId, associate) {
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
        console.log(`🎯 Starting FAST analysis of ${childContainers.length} containers`);
        
        updateTotalItemsDisplay(null, `Starting analysis...`);
        
        // Reset collected data
        collectedContainerData = [];
        
        // Process containers in parallel batches for maximum speed
        const batchSize = 5; // Process 5 containers simultaneously
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
        if (data && data.childContainers && Array.isArray(data.childContainers) && data.childContainers.length > 0) {
            if (!isProcessing) {
                isProcessing = true;
                
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
                    }
                }, 100); // Much shorter delay
                
                return true;
            }
        }
        return false;
    }
    
    // Minimal XHR interceptor
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.send = function(data) {
        const xhr = this;
        
        if (this._url && this._url.includes('getContainer') && data) {
            const originalOnReadyStateChange = this.onreadystatechange;
            
            this.onreadystatechange = function() {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    try {
                        const responseData = JSON.parse(xhr.responseText);
                        const requestData = JSON.parse(data);
                        
                        // Only process main search requests
                        if (!isProcessing || requestData.containerId.includes('DZ-')) {
                            processApiResponse(responseData, requestData);
                        }
                    } catch (e) {
                        // Silent fail for speed
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
        addTotalItemsColumn();
        console.log('📄 Fast container analysis ready - Integrated column view enabled');
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    console.log('✅ RIV - ReloUp loaded (Speed Optimized)');
})();