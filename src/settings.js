// settings.js - Settings management for RIV ReloUp
// Configuration interface and persistence management

class SettingsModule {
    constructor() {
        // Default settings configuration
        this.defaultSettings = {
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

        this.scriptSettings = { ...this.defaultSettings };
    }

    // Settings modal functionality
    showSettingsModal() {
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

        modal.innerHTML = this.getSettingsModalHTML();

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Load current settings
        this.loadSettings();
        
        // Setup event listeners
        this.setupSettingsEventListeners(overlay);
    }

    getSettingsModalHTML() {
        return `
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
                        <p style="margin: 0; color: #666;"><strong>Version:</strong> ${window.SCRIPT_VERSION || '3.7'}</p>
                        <p style="margin: 0; color: #666;"><strong>Author:</strong> kubicdar</p>
                    </div>
                    <p style="margin: 5px 0 0 0; color: #666;"><strong>Features:</strong> Fast analysis, CSV export, Copy functionality, Auto-update</p>
                    <p style="margin: 5px 0 0 0; color: #666;">
                        <strong>Repository:</strong> 
                        <a href="https://github.com/dariuszkubica/RIV-ReloUp" 
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
    }

    setupSettingsEventListeners(overlay) {
        // Modal close events
        document.getElementById('close-settings').onclick = () => overlay.remove();
        document.getElementById('cancel-settings').onclick = () => overlay.remove();
        document.getElementById('save-settings').onclick = () => {
            this.saveSettings();
            overlay.remove();
        };

        // Close on overlay click
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };

        // Update check button
        document.getElementById('manual-update-check').onclick = () => this.manualUpdateCheck();
        
        // Visit repository button
        document.getElementById('visit-repo').onclick = () => {
            window.open('https://github.com/dariuszkubica/RIV-ReloUp', '_blank');
        };
    }

    manualUpdateCheck() {
        const updateInfo = document.getElementById('update-info');
        const checkButton = document.getElementById('manual-update-check');
        
        // Disable button and show loading state
        checkButton.disabled = true;
        checkButton.innerHTML = '🔄 Checking...';
        updateInfo.innerHTML = '<div style="color: #007bff; padding: 10px; background: #e3f2fd; border-radius: 4px;">🔄 Checking for updates...</div>';
        
        const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/dariuszkubica/RIV-ReloUp/main/RIV%20-%20ReloUp.user.js';
        
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
                    const currentVersion = window.SCRIPT_VERSION || '3.7';
                    
                    if (window.isNewerVersion && window.isNewerVersion(remoteVersion, currentVersion)) {
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
                                <div style="font-size: 12px; margin-top: 5px; color: #155724;">Current version: ${currentVersion}</div>
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
                        <a href="https://github.com/dariuszkubica/RIV-ReloUp" target="_blank" 
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
    }

    // Load settings from localStorage and apply to modal
    loadSettings() {
        try {
            const saved = localStorage.getItem('riv-reloup-settings');
            if (saved) {
                this.scriptSettings = { ...this.defaultSettings, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('Could not load settings:', e);
        }

        // Apply settings to modal elements
        const filenamePrefixInput = document.getElementById('filename-prefix');
        const includeTimestampInput = document.getElementById('include-timestamp');
        const showPalletLandInput = document.getElementById('show-palletland');
        const customDestInput = document.getElementById('custom-destinations');
        const dashboardCustomDestInput = document.getElementById('dashboard-custom-destinations');

        if (filenamePrefixInput) filenamePrefixInput.value = this.scriptSettings.filenamePrefix;
        if (includeTimestampInput) includeTimestampInput.checked = this.scriptSettings.includeTimestamp;
        if (showPalletLandInput) showPalletLandInput.checked = this.scriptSettings.showPalletLand;
        if (customDestInput) customDestInput.value = this.scriptSettings.palletlandCustomDestinations || '';
        if (dashboardCustomDestInput) dashboardCustomDestInput.value = this.scriptSettings.dashboardCustomDestinations || '';
        
        // Load segments configuration
        this.loadSegments();
        this.loadDashboardSegments();
    }

    // Save settings to localStorage
    saveSettings() {
        const filenamePrefixInput = document.getElementById('filename-prefix');
        const includeTimestampInput = document.getElementById('include-timestamp');
        const showPalletLandInput = document.getElementById('show-palletland');
        const customDestInput = document.getElementById('custom-destinations');
        const dashboardCustomDestInput = document.getElementById('dashboard-custom-destinations');

        this.scriptSettings.filenamePrefix = filenamePrefixInput?.value || 'RIV';
        this.scriptSettings.includeTimestamp = includeTimestampInput?.checked || false;
        this.scriptSettings.showPalletLand = showPalletLandInput?.checked ?? true; // Default true if undefined
        this.scriptSettings.palletlandCustomDestinations = customDestInput?.value || '';
        this.scriptSettings.dashboardCustomDestinations = dashboardCustomDestInput?.value || '';
        
        // Segments are already updated in real-time via the update functions

        try {
            localStorage.setItem('riv-reloup-settings', JSON.stringify(this.scriptSettings));
            console.log('Settings saved successfully');
            
            // Update global scriptSettings
            if (window.scriptSettings) {
                Object.assign(window.scriptSettings, this.scriptSettings);
            }
            
            // Refresh menu visibility
            this.updateMenuVisibility();
        } catch (e) {
            console.warn('Could not save settings:', e);
        }
    }

    // Update menu visibility based on settings
    updateMenuVisibility() {
        const palletlandMenuItem = document.querySelector('[data-riv-menu-item="palletland"]');
        if (palletlandMenuItem) {
            palletlandMenuItem.style.display = this.scriptSettings.showPalletLand ? 'block' : 'none';
        }
    }

    // Segment management functions
    loadSegments() {
        const container = document.getElementById('segments-container');
        if (!container) return;
        
        container.innerHTML = this.scriptSettings.palletlandSegments
            .map((segment, index) => this.createSegmentElement(segment, index))
            .join('');
            
        // Setup event listeners for Add Segment button
        const addBtn = document.getElementById('add-segment');
        if (addBtn) {
            addBtn.onclick = () => this.addNewSegment();
        }
    }

    addNewSegment() {
        this.scriptSettings.palletlandSegments.push({ prefix: 'DZ-NEW-', from: 1, to: 50, enabled: true });
        this.loadSegments();
    }
    
    loadDashboardSegments() {
        const container = document.getElementById('dashboard-segments-container');
        if (!container) return;
        
        container.innerHTML = this.scriptSettings.dashboardSegments
            .map((segment, index) => this.createDashboardSegmentElement(segment, index))
            .join('');
            
        // Setup event listeners for Add Dashboard Segment button
        const addBtn = document.getElementById('add-dashboard-segment');
        if (addBtn) {
            addBtn.onclick = () => this.addNewDashboardSegment();
        }
    }

    addNewDashboardSegment() {
        this.scriptSettings.dashboardSegments.push({ prefix: 'DZ-NEW-', from: 1, to: 26, enabled: true });
        this.loadDashboardSegments();
    }

    createSegmentElement(segment, index) {
        return `
            <div class="segment-item" data-index="${index}" style="display: flex; align-items: center; margin-bottom: 8px; padding: 8px; border: 1px solid #ccc; border-radius: 3px; background: #fff;">
                <input type="checkbox" ${segment.enabled ? 'checked' : ''} 
                       onchange="window.settingsModule.updateSegmentEnabled(${index}, this.checked)" 
                       style="margin-right: 8px;">
                <input type="text" value="${segment.prefix}" placeholder="DZ-CDPL-A" 
                       onchange="window.settingsModule.updateSegmentPrefix(${index}, this.value)"
                       style="width: 120px; margin-right: 8px; padding: 3px; font-family: monospace; font-weight: bold;">
                <span style="margin-right: 5px; font-size: 12px;">from:</span>
                <input type="number" value="${segment.from}" min="1" max="999" 
                       onchange="window.settingsModule.updateSegmentFrom(${index}, this.value)"
                       style="width: 50px; margin-right: 8px; padding: 3px;">
                <span style="margin-right: 5px; font-size: 12px;">to:</span>
                <input type="number" value="${segment.to}" min="1" max="999" 
                       onchange="window.settingsModule.updateSegmentTo(${index}, this.value)"
                       style="width: 50px; margin-right: 8px; padding: 3px;">
                <button type="button" onclick="window.settingsModule.removeSegment(${index})" 
                        style="background: #ff4444; color: white; border: none; border-radius: 2px; padding: 2px 6px; cursor: pointer; font-size: 11px;">×</button>
            </div>
        `;
    }

    createDashboardSegmentElement(segment, index) {
        return `
            <div style="margin-bottom: 8px; display: flex; align-items: center; flex-wrap: wrap; gap: 5px; padding: 8px; background: white; border-radius: 4px;">
                <input type="checkbox" ${segment.enabled ? 'checked' : ''} 
                       onchange="window.settingsModule.updateDashboardSegmentEnabled(${index}, this.checked)"
                       style="margin-right: 5px;">
                <span style="margin-right: 5px; font-size: 12px;">prefix:</span>
                <input type="text" value="${segment.prefix}" 
                       onchange="window.settingsModule.updateDashboardSegmentPrefix(${index}, this.value)"
                       style="width: 120px; margin-right: 8px; padding: 3px; font-family: monospace; font-weight: bold;">
                <span style="margin-right: 5px; font-size: 12px;">from:</span>
                <input type="number" value="${segment.from}" min="1" max="999" 
                       onchange="window.settingsModule.updateDashboardSegmentFrom(${index}, this.value)"
                       style="width: 50px; margin-right: 8px; padding: 3px;">
                <span style="margin-right: 5px; font-size: 12px;">to:</span>
                <input type="number" value="${segment.to}" min="1" max="999" 
                       onchange="window.settingsModule.updateDashboardSegmentTo(${index}, this.value)"
                       style="width: 50px; margin-right: 8px; padding: 3px;">
                <button type="button" onclick="window.settingsModule.removeDashboardSegment(${index})" 
                        style="background: #ff4444; color: white; border: none; border-radius: 2px; padding: 2px 6px; cursor: pointer; font-size: 11px;">×</button>
            </div>
        `;
    }

    // Segment update functions (called from inline events)
    updateSegmentEnabled(index, enabled) {
        if (this.scriptSettings.palletlandSegments[index]) {
            this.scriptSettings.palletlandSegments[index].enabled = enabled;
        }
    }

    updateSegmentPrefix(index, prefix) {
        if (this.scriptSettings.palletlandSegments[index]) {
            this.scriptSettings.palletlandSegments[index].prefix = prefix;
        }
    }

    updateSegmentFrom(index, from) {
        if (this.scriptSettings.palletlandSegments[index]) {
            this.scriptSettings.palletlandSegments[index].from = parseInt(from) || 1;
        }
    }

    updateSegmentTo(index, to) {
        if (this.scriptSettings.palletlandSegments[index]) {
            this.scriptSettings.palletlandSegments[index].to = parseInt(to) || 50;
        }
    }

    removeSegment(index) {
        this.scriptSettings.palletlandSegments.splice(index, 1);
        this.loadSegments();
    }

    // Dashboard segment functions
    updateDashboardSegmentEnabled(index, enabled) {
        if (this.scriptSettings.dashboardSegments[index]) {
            this.scriptSettings.dashboardSegments[index].enabled = enabled;
        }
    }

    updateDashboardSegmentPrefix(index, prefix) {
        if (this.scriptSettings.dashboardSegments[index]) {
            this.scriptSettings.dashboardSegments[index].prefix = prefix;
        }
    }

    updateDashboardSegmentFrom(index, from) {
        if (this.scriptSettings.dashboardSegments[index]) {
            this.scriptSettings.dashboardSegments[index].from = parseInt(from) || 1;
        }
    }

    updateDashboardSegmentTo(index, to) {
        if (this.scriptSettings.dashboardSegments[index]) {
            this.scriptSettings.dashboardSegments[index].to = parseInt(to) || 26;
        }
    }

    removeDashboardSegment(index) {
        this.scriptSettings.dashboardSegments.splice(index, 1);
        this.loadDashboardSegments();
    }

    // Generate destinations based on configuration
    generatePalletLandDestinations() {
        const destinations = [];
        
        // Process each enabled segment with its full prefix
        this.scriptSettings.palletlandSegments.forEach(segmentConfig => {
            if (segmentConfig.enabled && segmentConfig.prefix && segmentConfig.prefix.trim()) {
                for (let i = segmentConfig.from; i <= segmentConfig.to; i++) {
                    const dzNumber = i.toString().padStart(2, '0');
                    destinations.push(`${segmentConfig.prefix}${dzNumber}`);
                }
            }
        });
        
        // Add custom destinations
        if (this.scriptSettings.palletlandCustomDestinations) {
            const customDests = this.scriptSettings.palletlandCustomDestinations
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);
            
            destinations.push(...customDests);
        }
        
        return destinations;
    }
    
    // Generate Dashboard destinations based on user configuration
    generateDashboardDestinations() {
        const destinations = [];
        
        // Process each enabled dashboard segment with its full prefix
        this.scriptSettings.dashboardSegments.forEach(segmentConfig => {
            if (segmentConfig.enabled && segmentConfig.prefix && segmentConfig.prefix.trim()) {
                for (let i = segmentConfig.from; i <= segmentConfig.to; i++) {
                    const dzNumber = i.toString().padStart(2, '0');
                    destinations.push(`${segmentConfig.prefix}${dzNumber}`);
                }
            }
        });
        
        // Add custom dashboard destinations
        if (this.scriptSettings.dashboardCustomDestinations) {
            const customDests = this.scriptSettings.dashboardCustomDestinations
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);
            
            destinations.push(...customDests);
        }
        
        return destinations;
    }
}

// Export for global access
window.SettingsModule = SettingsModule;