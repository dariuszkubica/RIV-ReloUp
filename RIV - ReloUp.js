// ==UserScript==
// @name         RIV - ReloUp
// @namespace    http://tampermonkey.net/
// @version      1.3
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
    
    // Global session data storage
    let sessionData = {
        warehouseId: null,
        associate: null,
        sessionId: null,
        lastCaptured: null
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
        footer.appendChild(settingsItem);
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
                <h3 style="color: #555; margin-bottom: 10px;">📊 Analysis Settings</h3>
                <label style="display: block; margin-bottom: 10px;">
                    <input type="number" id="batch-size" value="5" min="1" max="20" style="width: 60px; margin-right: 10px;">
                    Batch Size (containers processed simultaneously)
                </label>
                <small style="color: #666;">Higher values = faster analysis but more server load</small>
            </div>

            <div style="margin-bottom: 20px;">
                <h3 style="color: #555; margin-bottom: 10px;">📋 Copy Settings</h3>
                <label style="display: block; margin-bottom: 10px;">
                    <input type="checkbox" id="show-copy-tooltip" checked style="margin-right: 10px;">
                    Show tooltip when copying (Ctrl + Click)
                </label>
                <label style="display: block; margin-bottom: 10px;">
                    <input type="checkbox" id="highlight-copied-cell" checked style="margin-right: 10px;">
                    Highlight copied cell
                </label>
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
                <h3 style="color: #555; margin-bottom: 10px;">ℹ️ Script Info</h3>
                <p style="margin: 5px 0; color: #666;"><strong>Version:</strong> 1.3</p>
                <p style="margin: 5px 0; color: #666;"><strong>Author:</strong> kubicdar</p>
                <p style="margin: 5px 0; color: #666;"><strong>Features:</strong> Fast analysis, CSV export, Copy functionality</p>
                <p style="margin: 5px 0; color: #666;">
                    <strong>Repository:</strong> 
                    <a href="https://github.com/dariuszkubica/RIV-ReloUp/blob/main/RIV%20-%20ReloUp.js" 
                       target="_blank" style="color: #007bff; text-decoration: none;">
                        GitHub Repository
                    </a>
                </p>
                <div id="update-info" style="margin-top: 10px;"></div>
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
        
        // Check for updates and show status
        checkUpdateStatus();
        
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
                            <h1 style="margin: 0; font-size: 28px; font-weight: 600;">📊 RIV Dashboard</h1>
                            <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Drop Zone Monitoring System</p>
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
                            ">🔄 Refresh Data</button>
                            
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
                            <p style="color: #6c757d; margin-bottom: 30px;">Fetching Drop Zone information automatically</p>
                        </div>
                    </div>
                </main>
        `;
        
        overlay.appendChild(dashboardContainer);
        document.body.appendChild(overlay);

        // Add CSS for hover effects
        const style = document.createElement('style');
        style.textContent = `
            #refresh-dashboard:hover { background: #138496 !important; transform: translateY(-1px); }
            #export-dashboard:not(:disabled):hover { background: #545b62 !important; transform: translateY(-1px); opacity: 1 !important; }
            #close-dashboard:hover { background: rgba(255,255,255,0.3) !important; }
        `;
        document.head.appendChild(style);

        // Event listeners
        document.getElementById('close-dashboard').onclick = () => closeDashboard(overlay);
        document.getElementById('refresh-dashboard').onclick = () => startDropZoneScan();
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
            debugInfo.innerHTML = `
                <strong>🔧 Session Debug Info:</strong><br>
                warehouseId: ${sessionData.warehouseId || 'Not captured'}<br>
                associate: ${sessionData.associate || 'Not captured'}<br>
                lastCaptured: ${sessionData.lastCaptured ? sessionData.lastCaptured.toLocaleString() : 'Never'}
            `;
            overlay.appendChild(debugInfo);
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                if (debugInfo.parentNode) {
                    debugInfo.remove();
                }
            }, 10000);
        }, 1000);
        
        // Auto-start scan when dashboard opens
        setTimeout(() => {
            startDropZoneScan();
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

    // Dashboard data storage
    let dashboardData = [];
    
    async function startDropZoneScan() {
        dashboardData = [];
        const progressDiv = document.getElementById('scan-progress');
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        const progressPercentage = document.getElementById('progress-percentage');
        const refreshBtn = document.getElementById('refresh-dashboard');
        const exportBtn = document.getElementById('export-dashboard');
        
        // Show progress and disable buttons
        progressDiv.style.display = 'block';
        refreshBtn.disabled = true;
        exportBtn.disabled = true;
        
        // Wait for valid session data or try to get it
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
        
        // Show deep scanning warning
        progressText.textContent = 'Starting deep scan - this will take longer but provides accurate unit counts...';
        progressPercentage.textContent = 'Starting';
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generate drop zone list (DZ-CDPL-A01 to DZ-CDPL-D50)
        const dropZones = [];
        const categories = ['A', 'B', 'C', 'D'];
        
        categories.forEach(category => {
            for (let i = 1; i <= 50; i++) {
                const dzNumber = i.toString().padStart(2, '0');
                dropZones.push(`DZ-CDPL-${category}${dzNumber}`);
            }
        });
        
        const totalZones = dropZones.length;
        let completedZones = 0;
        
        // Process zones in batches (smaller batch size for deep scanning)
        const batchSize = 1; // Single zone at a time due to deep scanning
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
                        
                        // Get sortation category from first pallet
                        if (searchDetails.childContainers[0]) {
                            const firstPallet = searchDetails.childContainers[0];
                            // sortationCategories is an array, take first element
                            if (firstPallet.sortationCategories && Array.isArray(firstPallet.sortationCategories) && firstPallet.sortationCategories.length > 0) {
                                sortationCategory = firstPallet.sortationCategories[0];
                            } else if (firstPallet.sortationCategory) {
                                sortationCategory = firstPallet.sortationCategory;
                            }
                        }
                        
                        // Deep scan: Get actual units from each pallet
                        progressText.textContent = `Deep scanning ${dropZoneId} - ${totalPallets} pallets...`;
                        
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
                        
                        console.log(`🏁 ${dropZoneId} summary: ${totalPallets} pallets, ${totalUnits} total units`);
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
            progressText.textContent = `Deep scanned ${completedZones}/${totalZones} zones`;
            
            // Update dashboard display with current data
            updateDashboardDisplay();
        }
        
        // Hide progress and enable buttons
        progressDiv.style.display = 'none';
        refreshBtn.disabled = false;
        exportBtn.disabled = false;
        exportBtn.style.opacity = '1';
        
        // Update last scan time
        const lastScanElement = document.getElementById('last-scan-time');
        if (lastScanElement) {
            lastScanElement.textContent = `Last scan: ${new Date().toLocaleString('pl-PL')}`;
        }
        
        console.log('Dashboard scan complete:', dashboardData);
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
    
    // Perform container search like the main application does
    async function performContainerSearch(containerId) {
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
                            sessionData.warehouseId = warehouseId;
                        }
                        if (associateMatch && associateMatch[1] !== 'System') {
                            associate = associateMatch[1];
                            sessionData.associate = associate;
                        }
                    }
                }
                
                // Method 2: Check URL parameters or path
                const url = window.location.href;
                const warehouseUrlMatch = url.match(/warehouse[=/]([A-Z0-9]{3,10})/i);
                const userUrlMatch = url.match(/user[=/]([A-Z0-9]{3,20})/i);
                
                if (warehouseUrlMatch) {
                    warehouseId = warehouseUrlMatch[1];
                    sessionData.warehouseId = warehouseId;
                }
                if (userUrlMatch) {
                    associate = userUrlMatch[1];
                    sessionData.associate = associate;
                }
                
            } catch (e) {
                console.warn('🔧 Could not extract session data, using defaults:', e.message);
            }
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
                            
                            // Debug sortation categories
                            if (data.childContainers && data.childContainers.length > 0) {
                                const firstContainer = data.childContainers[0];
                                if (firstContainer.sortationCategories) {
                                    console.log(`📋 ${containerId} sortationCategories:`, firstContainer.sortationCategories);
                                }
                            }
                            
                            console.log(`✅ Success for ${containerId}:`, data.childContainers ? `${data.childContainers.length} containers` : 'No containers');
                            resolve(data);
                        } catch (e) {
                            console.error(`❌ Parse error for ${containerId}:`, e.message);
                            reject(new Error(`Parse error: ${e.message}`));
                        }
                    } else {
                        console.error(`❌ HTTP error for ${containerId}: ${xhr.status} ${xhr.statusText}`);
                        console.error('Request data:', requestData);
                        console.error('Response text:', xhr.responseText);
                        
                        // For 400 errors, suggest session data issues
                        if (xhr.status === 400) {
                            console.error(`🚫 Likely cause: Invalid session parameters. Try refreshing the page and using the main search function first to capture valid session data.`);
                        }
                        
                        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                    }
                }
            };
            
            xhr.onerror = () => {
                console.error(`❌ Network error for ${containerId}`);
                reject(new Error('Network error'));
            };
            
            console.log(`🚀 Sending request for ${containerId}:`, requestData);
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
        
        // Group by category (A, B, C, D) and sortation category
        const categoryStats = {};
        const sortationStats = {};
        
        dashboardData.forEach(dz => {
            const category = dz.dropZoneId.match(/DZ-CDPL-([ABCD])/)?.[1] || 'Unknown';
            if (!categoryStats[category]) {
                categoryStats[category] = { total: 0, active: 0, empty: 0, error: 0, pallets: 0, units: 0 };
            }
            categoryStats[category].total++;
            if (dz.status === 'Active') {
                categoryStats[category].active++;
                categoryStats[category].pallets += dz.totalPallets;
                categoryStats[category].units += dz.totalUnits;
                
                // Count sortation categories
                const sortCat = dz.sortationCategory;
                if (sortCat && sortCat !== 'N/A' && sortCat !== 'Empty') {
                    if (!sortationStats[sortCat]) {
                        sortationStats[sortCat] = { zones: 0, pallets: 0, units: 0 };
                    }
                    sortationStats[sortCat].zones++;
                    sortationStats[sortCat].pallets += dz.totalPallets;
                    sortationStats[sortCat].units += dz.totalUnits;
                }
            } else if (dz.status === 'Empty') {
                categoryStats[category].empty++;
            } else if (dz.status === 'Error') {
                categoryStats[category].error++;
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
                
                <!-- Category Breakdown -->
                <h4 style="margin: 20px 0 15px 0; color: #555;">📂 By Category:</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    ${Object.keys(categoryStats).sort().map(category => `
                        <div style="padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid ${category === 'A' ? '#28a745' : category === 'B' ? '#17a2b8' : category === 'C' ? '#ffc107' : '#dc3545'};">
                            <div style="font-weight: bold; color: #495057; margin-bottom: 8px;">Category ${category}</div>
                            <div style="font-size: 12px; color: #6c757d;">Active: <strong>${categoryStats[category].active}</strong> / ${categoryStats[category].total}</div>
                            <div style="font-size: 12px; color: #6c757d;">Pallets: <strong>${categoryStats[category].pallets}</strong></div>
                            <div style="font-size: 12px; color: #6c757d;">Units: <strong>${categoryStats[category].units}</strong></div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Sortation Categories -->
            ${Object.keys(sortationStats).length > 0 ? `
            <div style="background: white; border-radius: 12px; padding: 25px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 20px 0; color: #333;">🏷️ Sortation Categories</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                    ${Object.keys(sortationStats).sort().map(category => `
                        <div style="padding: 15px; background: #f1f3f4; border-radius: 8px; border-left: 4px solid #007bff;">
                            <div style="font-weight: bold; color: #495057; margin-bottom: 8px; font-size: 14px;">${category}</div>
                            <div style="font-size: 12px; color: #6c757d;">Zones: <strong>${sortationStats[category].zones}</strong></div>
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
                            ${dashboardData.map((dz, index) => {
                                const statusColor = dz.status === 'Active' ? '#28a745' : 
                                                   dz.status === 'Empty' ? '#6c757d' : '#dc3545';
                                const categoryColor = dz.dropZoneId.includes('-A') ? '#28a745' :
                                                     dz.dropZoneId.includes('-B') ? '#17a2b8' :
                                                     dz.dropZoneId.includes('-C') ? '#ffc107' : '#dc3545';
                                
                                return `
                                <tr style="border-bottom: 1px solid #dee2e6; ${index % 2 === 0 ? 'background: #f8f9fa;' : ''}">
                                    <td style="padding: 10px 8px; font-weight: 500; color: ${categoryColor};">${dz.dropZoneId}</td>
                                    <td style="padding: 10px 8px; text-align: center;">
                                        <span style="color: ${statusColor}; font-weight: 500;">${dz.status}</span>
                                    </td>
                                    <td style="padding: 10px 8px; text-align: center; color: #495057;">${dz.totalPallets}</td>
                                    <td style="padding: 10px 8px; text-align: center; color: #495057;">${dz.totalUnits}</td>
                                    <td style="padding: 10px 8px; color: #6c757d; font-size: 12px;" title="${dz.sortationCategory}">
                                        ${dz.sortationCategory && dz.sortationCategory.length > 20 ? dz.sortationCategory.substring(0, 20) + '...' : dz.sortationCategory || 'N/A'}
                                    </td>
                                    <td style="padding: 10px 8px; text-align: center; color: #6c757d; font-size: 12px;">${dz.lastUpdated}</td>
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
        const filename = `dashboard_overview_${timestamp}.csv`;
        
        downloadCSV(csvContent, filename);
        
        console.log('Dashboard data exported:', csvData.length, 'records');
    }

    // Settings storage
    let scriptSettings = {
        batchSize: 5,
        showCopyTooltip: true,
        highlightCopiedCell: true,
        filenamePrefix: 'container_analysis',
        includeTimestamp: true
    };

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
        const batchSizeInput = document.getElementById('batch-size');
        const showTooltipInput = document.getElementById('show-copy-tooltip');
        const highlightCellInput = document.getElementById('highlight-copied-cell');
        const filenamePrefixInput = document.getElementById('filename-prefix');
        const includeTimestampInput = document.getElementById('include-timestamp');

        if (batchSizeInput) batchSizeInput.value = scriptSettings.batchSize;
        if (showTooltipInput) showTooltipInput.checked = scriptSettings.showCopyTooltip;
        if (highlightCellInput) highlightCellInput.checked = scriptSettings.highlightCopiedCell;
        if (filenamePrefixInput) filenamePrefixInput.value = scriptSettings.filenamePrefix;
        if (includeTimestampInput) includeTimestampInput.checked = scriptSettings.includeTimestamp;
    }
    
    async function checkUpdateStatus() {
        const updateInfo = document.getElementById('update-info');
        if (!updateInfo) return;
        
        updateInfo.innerHTML = '<span style="color: #666; font-size: 12px;">Checking for updates...</span>';
        
        try {
            const response = await fetch(GITHUB_RAW_URL);
            if (!response.ok) throw new Error('Failed to fetch');
            
            const scriptContent = await response.text();
            const versionMatch = scriptContent.match(/@version\s+([\d\.]+)/);
            
            if (versionMatch) {
                const remoteVersion = versionMatch[1];
                if (compareVersions(remoteVersion, CURRENT_VERSION) > 0) {
                    updateInfo.innerHTML = `
                        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 8px; border-radius: 4px; margin-top: 10px;">
                            <span style="color: #856404; font-size: 12px;">📢 Update available: v${remoteVersion}</span>
                            <button id="settings-update-now" data-version="${remoteVersion}" 
                                    style="margin-left: 10px; background: #ffc107; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 11px;">Update Now</button>
                        </div>
                    `;
                    
                    // Add event listener for the update button
                    setTimeout(() => {
                        const updateBtn = document.getElementById('settings-update-now');
                        if (updateBtn) {
                            updateBtn.onclick = async () => {
                                try {
                                    const response = await fetch(GITHUB_RAW_URL);
                                    const scriptContent = await response.text();
                                    const version = updateBtn.getAttribute('data-version');
                                    performUpdate(scriptContent, version);
                                } catch (error) {
                                    alert('Failed to fetch update: ' + error.message);
                                }
                            };
                        }
                    }, 100);
                } else {
                    updateInfo.innerHTML = '<span style="color: #28a745; font-size: 12px;">✅ Up to date</span>';
                }
            } else {
                updateInfo.innerHTML = '<span style="color: #dc3545; font-size: 12px;">❌ Cannot check version</span>';
            }
        } catch (error) {
            updateInfo.innerHTML = '<span style="color: #6c757d; font-size: 12px;">⚠️ Update check failed</span>';
        }
    }

    function saveSettings() {
        // Get values from modal
        const batchSizeInput = document.getElementById('batch-size');
        const showTooltipInput = document.getElementById('show-copy-tooltip');
        const highlightCellInput = document.getElementById('highlight-copied-cell');
        const filenamePrefixInput = document.getElementById('filename-prefix');
        const includeTimestampInput = document.getElementById('include-timestamp');

        scriptSettings.batchSize = parseInt(batchSizeInput?.value) || 5;
        scriptSettings.showCopyTooltip = showTooltipInput?.checked || false;
        scriptSettings.highlightCopiedCell = highlightCellInput?.checked || false;
        scriptSettings.filenamePrefix = filenamePrefixInput?.value || 'container_analysis';
        scriptSettings.includeTimestamp = includeTimestampInput?.checked || false;

        try {
            localStorage.setItem('riv-reloup-settings', JSON.stringify(scriptSettings));
            console.log('Settings saved successfully');
        } catch (e) {
            console.warn('Could not save settings:', e);
        }
    }

    // Auto-update functionality
    const CURRENT_VERSION = '1.3';
    const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/dariuszkubica/RIV-ReloUp/main/RIV%20-%20ReloUp.js';
    
    async function checkForUpdates() {
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
            
            if (compareVersions(remoteVersion, CURRENT_VERSION) > 0) {
                showUpdateNotification(remoteVersion, scriptContent);
            }
            
        } catch (error) {
            console.warn('Update check failed:', error);
        }
    }
    
    function compareVersions(version1, version2) {
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
            <p style="margin: 5px 0; font-size: 12px; opacity: 0.9;">Current: ${CURRENT_VERSION}</p>
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
                <p style="color: #666;">Version ${CURRENT_VERSION} → ${newVersion}</p>
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
        console.log(`🎯 Starting FAST analysis of ${childContainers.length} containers`);
        
        updateTotalItemsDisplay(null, `Starting analysis...`);
        
        // Reset collected data
        collectedContainerData = [];
        
        // Process containers in parallel batches for maximum speed
        const batchSize = scriptSettings.batchSize || 5; // Use setting or default to 5
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
                        sessionData.warehouseId = requestData.warehouseId;
                        sessionData.associate = requestData.associate;
                        sessionData.lastCaptured = new Date();
                        console.log(`🔐 Valid session data captured: warehouseId=${sessionData.warehouseId}, associate=${sessionData.associate}`);
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
        initializeCopyToClipboard();
        addMenuOptions();
        loadSettings(); // Load saved settings on startup
        
        // Check for updates (delayed to not interfere with main functionality)
        setTimeout(() => {
            const skipVersion = localStorage.getItem('riv-skip-version');
            if (!skipVersion || skipVersion !== CURRENT_VERSION) {
                checkForUpdates();
            }
        }, 5000); // Check after 5 seconds
        
        console.log('📄 Fast container analysis ready - Full functionality enabled');
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    console.log('✅ RIV - ReloUp loaded (Speed Optimized)');
})();