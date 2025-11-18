// dashboard.js - Dashboard functionality for RIV ReloUp
// Comprehensive Drop Zone Overview System

class DashboardModule {
    constructor() {
        this.isDashboardActive = false;
        this.dashboardData = [];
    }

    // Main Dashboard display function
    showDashboard() {
        console.log('🔥 DEBUG: showDashboard() called - This should open Dashboard modal');
        if (this.isDashboardActive) return; // Already showing dashboard
        
        this.isDashboardActive = true;
        
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
        
        dashboardContainer.innerHTML = this.getDashboardHTML();
        
        overlay.appendChild(dashboardContainer);
        document.body.appendChild(overlay);

        // Add CSS for hover effects
        this.addDashboardCSS();

        // Event listeners
        document.getElementById('close-dashboard').onclick = () => this.closeDashboard(overlay);
        document.getElementById('refresh-dashboard').onclick = () => this.startDashboardScan(false); // Surface scan
        document.getElementById('deep-scan-dashboard').onclick = () => this.startDashboardScan(true); // Deep scan
        document.getElementById('export-dashboard').onclick = () => this.exportDashboardData();
        
        // Close on overlay click
        overlay.onclick = (e) => {
            if (e.target === overlay) this.closeDashboard(overlay);
        };
        
        // Show session debug info
        this.showSessionDebugInfo(overlay);
        
        // Auto-start scan when dashboard opens
        setTimeout(() => {
            this.startDashboardScan();
        }, 2000); // Longer delay to allow session capture
    }

    getDashboardHTML() {
        return `
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
    }

    addDashboardCSS() {
        const style = document.createElement('style');
        style.textContent = `
            #refresh-dashboard:hover { background: #218838 !important; transform: translateY(-1px); }
            #deep-scan-dashboard:hover { background: #138496 !important; transform: translateY(-1px); }
            #export-dashboard:not(:disabled):hover { background: #545b62 !important; transform: translateY(-1px); opacity: 1 !important; }
            #close-dashboard:hover { background: rgba(255,255,255,0.3) !important; }
        `;
        document.head.appendChild(style);
    }

    showSessionDebugInfo(overlay) {
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
            
            const hasValidSession = window.sessionData.warehouseId && window.sessionData.associate && 
                                  window.sessionData.warehouseId !== 'CDPL1' && window.sessionData.associate !== 'System';
            
            debugInfo.innerHTML = `
                <strong>🔧 Session Debug Info:</strong><br>
                warehouseId: ${window.sessionData.warehouseId || 'Not captured'}<br>
                associate: ${window.sessionData.associate || 'Not captured'}<br>
                lastCaptured: ${window.sessionData.lastCaptured ? window.sessionData.lastCaptured.toLocaleString() : 'Never'}<br>
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
    }

    closeDashboard(overlay) {
        if (!this.isDashboardActive) return;
        
        this.isDashboardActive = false;
        
        // Remove modal overlay
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    }

    // Dashboard scanning functionality
    async startDashboardScan(deepScan = false) {
        console.log(`🔥 DEBUG: startDashboardScan() called - scanning Dashboard destinations (${deepScan ? 'deep' : 'surface'} scan)`);
        this.dashboardData = [];
        const progressDiv = document.getElementById('scan-progress');
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        const progressPercentage = document.getElementById('progress-percentage');
        const refreshBtn = document.getElementById('refresh-dashboard');
        const deepScanBtn = document.getElementById('deep-scan-dashboard');
        const exportBtn = document.getElementById('export-dashboard');
        
        // Check session data first
        if (!window.sessionData?.warehouseId || !window.sessionData?.associate || 
            window.sessionData.warehouseId === 'CDPL1' || window.sessionData.associate === 'System') {
            
            this.showSessionDataError();
            return;
        }
        
        // Check if required functions are available
        if (!window.performContainerSearch || !window.generateDashboardDestinations) {
            console.error('❌ Required functions not available yet');
            progressText.textContent = 'Required functions not loaded. Please wait and try again.';
            progressPercentage.textContent = 'Error';
            setTimeout(() => {
                refreshBtn.disabled = false;
                deepScanBtn.disabled = false;
                exportBtn.disabled = false;
            }, 1000);
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
        const dropZones = window.generateDashboardDestinations();
        
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
                return await this.scanSingleDropZone(dropZoneId, deepScan, progressText);
            });
            
            // Wait for batch to complete
            const batchResults = await Promise.all(batchPromises);
            this.dashboardData.push(...batchResults);
            
            completedZones += batch.length;
            const percentage = Math.round((completedZones / totalZones) * 100);
            
            progressBar.style.width = `${percentage}%`;
            progressPercentage.textContent = `${percentage}%`;
            progressText.textContent = `Full scanned ${completedZones}/${totalZones} zones`;
            
            // Update dashboard display with current data
            this.updateDashboardDisplay();
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
        
        console.log('Dashboard scan complete:', this.dashboardData);
    }

    async scanSingleDropZone(dropZoneId, deepScan, progressText) {
        try {
            progressText.textContent = `Scanning ${dropZoneId}...`;
            
            // Add timeout to prevent hanging
            const searchPromise = window.performContainerSearch(dropZoneId);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Search timeout')), 10000)
            );
            
            const searchDetails = await Promise.race([searchPromise, timeoutPromise]);
            
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
                            // Add delay to avoid overwhelming the API
                            await new Promise(resolve => setTimeout(resolve, 200));
                            
                            // Get detailed contents of this pallet
                            const palletDetails = await window.performContainerSearch(pallet.containerId);
                            
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
    }

    showSessionDataError() {
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
    }

    updateDashboardDisplay() {
        const contentDiv = document.getElementById('dashboard-content');
        if (!contentDiv || this.dashboardData.length === 0) return;
        
        // Calculate summary stats
        const totalZones = this.dashboardData.length;
        const activeZones = this.dashboardData.filter(dz => dz.status === 'Active').length;
        const emptyZones = this.dashboardData.filter(dz => dz.status === 'Empty').length;
        const errorZones = this.dashboardData.filter(dz => dz.status === 'Error').length;
        const totalPalletsAll = this.dashboardData.reduce((sum, dz) => sum + dz.totalPallets, 0);
        const totalUnitsAll = this.dashboardData.reduce((sum, dz) => sum + dz.totalUnits, 0);
        
        // Group by main destinations and sortation category
        const destinationStats = {};
        const sortationStats = {};
        
        this.dashboardData.forEach(dz => {
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
                        const mainDestination = window.getMainDestination(category);
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
        
        contentDiv.innerHTML = this.generateDashboardContentHTML(
            totalZones, activeZones, emptyZones, errorZones, totalPalletsAll, totalUnitsAll,
            destinationStats, sortationStats
        );
    }

    generateDashboardContentHTML(totalZones, activeZones, emptyZones, errorZones, totalPalletsAll, totalUnitsAll, destinationStats, sortationStats) {
        return `
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
            
            ${this.generateMainDestinationsHTML(destinationStats)}
            
            ${this.generateSortationCategoriesHTML(sortationStats)}
            
            ${this.generateDropZoneTableHTML()}
        `;
    }

    generateMainDestinationsHTML(destinationStats) {
        if (Object.keys(destinationStats).length === 0) return '';
        
        return `
            <!-- Main Destinations -->
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
                            ${this.generateLocationDetailsHTML(stats, color)}
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    generateLocationDetailsHTML(stats, color) {
        if (!stats.categoryDetails || Object.keys(stats.categoryDetails).length === 0) {
            return `
                <div style="font-size: 11px; color: #888; line-height: 1.3;">
                    Categories: ${Array.from(stats.categories).slice(0, 2).join(', ')}${stats.categories.size > 2 ? ` +${stats.categories.size - 2} more` : ''}
                </div>
            `;
        }
        
        return `
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
        `;
    }

    generateSortationCategoriesHTML(sortationStats) {
        if (Object.keys(sortationStats).length === 0) return '';
        
        return `
            <!-- Sortation Categories -->
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
        `;
    }

    generateDropZoneTableHTML() {
        return `
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
                            ${this.dashboardData.map((dz, index) => {
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

    exportDashboardData() {
        if (this.dashboardData.length === 0) {
            alert('No data to export. Please run a scan first.');
            return;
        }
        
        // Prepare CSV data
        const csvData = this.dashboardData.map(dz => ({
            'Drop Zone ID': dz.dropZoneId,
            'Status': dz.status,
            'Total Pallets': dz.totalPallets,
            'Total Units': dz.totalUnits,
            'Sortation Category': dz.sortationCategory,
            'Last Updated': dz.lastUpdated
        }));
        
        const csvContent = window.convertToCSV(csvData);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `dashboard_overview_${timestamp}.csv`;
        
        window.downloadCSV(csvContent, filename);
        
        console.log('Dashboard data exported:', csvData.length, 'records');
    }
}

// Export for global access
window.DashboardModule = DashboardModule;