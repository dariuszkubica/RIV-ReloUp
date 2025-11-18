// palletland.js - PalletLand functionality for RIV ReloUp
// Comprehensive Drop Zone Analysis System

class PalletLandModule {
    constructor() {
        this.isDashboardActive = false; // Shared flag with dashboard
        this.palletlandData = [];
    }

    // Main PalletLand modal functionality
    showPalletLand() {
        console.log('🔥 DEBUG: showPalletLand() called - This should open PalletLand modal');
        if (this.isDashboardActive) return; // Already showing a modal
        
        this.isDashboardActive = true;
        
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
        
        palletlandContainer.innerHTML = this.getPalletLandHTML();
        
        overlay.appendChild(palletlandContainer);
        document.body.appendChild(overlay);
        
        // Set up event handlers
        this.setupEventHandlers(overlay);
        
        // Auto-start scan
        setTimeout(() => {
            this.startPalletLandScan();
        }, 2000);
    }

    getPalletLandHTML() {
        return `
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
    }

    setupEventHandlers(overlay) {
        document.getElementById('close-palletland').onclick = () => {
            overlay.remove();
            this.isDashboardActive = false;
        };
        
        document.getElementById('refresh-palletland').onclick = () => this.startPalletLandScan();
        
        document.getElementById('export-palletland').onclick = () => {
            if (this.palletlandData.length === 0) {
                alert('No data to export. Please run an analysis first.');
                return;
            }
            
            const csvContent = this.generateCSVExport(this.palletlandData);
            window.downloadCSV(csvContent, 'palletland_analysis');
        };
        
        // Close on overlay click
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                overlay.remove();
                this.isDashboardActive = false;
            }
        };
    }

    // PalletLand scan function
    async startPalletLandScan() {
        console.log('🔥 DEBUG: startPalletLandScan() called - scanning PalletLand destinations');
        this.palletlandData = [];
        const progressDiv = document.getElementById('palletland-scan-progress');
        const progressBar = document.getElementById('palletland-progress-bar');
        const progressText = document.getElementById('palletland-progress-text');
        const progressPercentage = document.getElementById('palletland-progress-percentage');
        const refreshBtn = document.getElementById('refresh-palletland');
        const exportBtn = document.getElementById('export-palletland');
        
        // Check session data first
        if (!window.sessionData.warehouseId || !window.sessionData.associate || 
            window.sessionData.warehouseId === 'CDPL1' || window.sessionData.associate === 'System') {
            
            this.showSessionDataError();
            return;
        }
        
        // Show progress and disable buttons
        progressDiv.style.display = 'block';
        refreshBtn.disabled = true;
        exportBtn.disabled = true;
        
        // Generate drop zone list based on PalletLand configuration
        const dropZones = window.generatePalletLandDestinations();
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
                return await this.scanSinglePalletLandZone(dropZoneId, progressText);
            });
            
            // Wait for batch to complete
            const batchResults = await Promise.all(batchPromises);
            this.palletlandData.push(...batchResults);
            
            completedZones += batch.length;
            const percentage = Math.round((completedZones / totalZones) * 100);
            
            progressBar.style.width = `${percentage}%`;
            progressPercentage.textContent = `${percentage}%`;
            progressText.textContent = `Scanned ${completedZones}/${totalZones} zones`;
            
            // Update display
            this.updatePalletLandDisplay();
            
            // Reduced delay for speed - just enough to show progress
            if (i + BATCH_SIZE < dropZones.length) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
        
        // Final update
        progressText.textContent = `Scan complete! Found ${this.palletlandData.filter(d => d.status === 'Active').length} active zones`;
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
        
        console.log('PalletLand scan complete:', this.palletlandData);
    }

    async scanSinglePalletLandZone(dropZoneId, progressText) {
        try {
            progressText.textContent = `Scanning ${dropZoneId}...`;
            
            // Use deep scanning approach for accurate unit counts
            const searchDetails = await window.performContainerSearch(dropZoneId);
            
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
                        const palletDetails = await window.performContainerSearch(pallet.containerId);
                        
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
    }

    showSessionDataError() {
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
    }

    // Update PalletLand display
    updatePalletLandDisplay() {
        const contentDiv = document.getElementById('palletland-content');
        if (!contentDiv || this.palletlandData.length === 0) return;
        
        // Calculate summary stats (using different field names than Dashboard)
        const totalZones = this.palletlandData.length;
        const activeZones = this.palletlandData.filter(dz => dz.status === 'Active').length;
        const emptyZones = this.palletlandData.filter(dz => dz.status === 'Empty').length;
        const errorZones = this.palletlandData.filter(dz => dz.status === 'Error').length;
        const totalPalletsAll = this.palletlandData.reduce((sum, dz) => sum + (dz.palletCount || 0), 0);
        const totalUnitsAll = this.palletlandData.reduce((sum, dz) => sum + (dz.unitCount || 0), 0);
        
        console.log(`🎯 PalletLand Stats: ${totalPalletsAll} pallets, ${totalUnitsAll} units from ${this.palletlandData.length} zones`);
        
        // Group by category (A, B, C, D) and sortation category
        const categoryStats = {};
        const sortationStats = {};
        const destinationStats = {};
        
        this.palletlandData.forEach(dz => {
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
        
        contentDiv.innerHTML = this.generatePalletLandContentHTML(
            totalZones, activeZones, emptyZones, errorZones, totalPalletsAll, totalUnitsAll,
            categoryStats, sortationStats, destinationStats
        );
    }

    generatePalletLandContentHTML(totalZones, activeZones, emptyZones, errorZones, totalPalletsAll, totalUnitsAll, categoryStats, sortationStats, destinationStats) {
        return `
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
        `;
    }

    generateDropZoneTableHTML() {
        return `
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
                            ${this.palletlandData.map((dz, index) => {
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

    generateCSVExport(data) {
        const csvData = data.map(dz => ({
            'Drop Zone ID': dz.dropZoneId,
            'Status': dz.status,
            'Pallet Count': dz.palletCount,
            'Unit Count': dz.unitCount,
            'Sortation Category': dz.sortationCategory,
            'Last Updated': dz.lastUpdated
        }));
        
        return window.convertToCSV(csvData);
    }
}

// Export for global access
window.PalletLandModule = PalletLandModule;