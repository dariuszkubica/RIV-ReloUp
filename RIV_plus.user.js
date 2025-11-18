// ==UserScript==
// @name         RIV+
// @namespace    KTW1
// @version      3.8.4
// @author       Dariusz Kubica (kubicdar)
// @copyright    2025+, Dariusz Kubica (https://github.com/dariuszkubica)
// @license      Licensed with the consent of the author
// @description  Enhanced warehouse analysis with smart session monitoring - Auto-loading modular version
// @match        https://dub.prod.item-visibility.returns.amazon.dev/*
// @grant        none
// @run-at       document-start
// @homepageURL  https://github.com/dariuszkubica/RIV-ReloUp
// @supportURL   https://github.com/dariuszkubica/RIV-ReloUp/issues
// @downloadURL  https://raw.githubusercontent.com/dariuszkubica/RIV-ReloUp/main/RIV_plus.user.js
// @updateURL    https://raw.githubusercontent.com/dariuszkubica/RIV-ReloUp/main/RIV_plus.user.js
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('🚀 RIV+ script starting...');
    
    // Configuration
    const SCRIPT_VERSION = '3.8.4';
    const MODULE_BASE_URL = 'https://raw.githubusercontent.com/dariuszkubica/RIV-ReloUp/main/src/';
    const FALLBACK_BASE_URL = 'https://cdn.jsdelivr.net/gh/dariuszkubica/RIV-ReloUp@main/src/';
    
    // Module loading configuration
    const MODULES = [
        { name: 'core', file: 'core.js', required: true },
        { name: 'settings', file: 'settings.js', required: true },
        { name: 'dashboard', file: 'dashboard.js', required: true },
        { name: 'palletland', file: 'palletland.js', required: true }
    ];
    
    // Module instances
    let coreModule, dashboardModule, palletlandModule, settingsModule;
    let loadedModules = {};
    let moduleLoadPromises = [];
    
    // Show loading progress
    function showLoadingStatus(message, progress = null) {
        const statusId = 'riv-loading-status';
        let statusDiv = document.getElementById(statusId);
        
        if (!statusDiv) {
            statusDiv = document.createElement('div');
            statusDiv.id = statusId;
            statusDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #007bff, #0056b3);
                color: white;
                padding: 15px 20px;
                border-radius: 10px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                box-shadow: 0 4px 20px rgba(0, 123, 255, 0.3);
                z-index: 1000000;
                min-width: 250px;
                transition: all 0.3s ease;
            `;
            document.body.appendChild(statusDiv);
        }
        
        const progressBar = progress !== null ? 
            `<div style="background: rgba(255,255,255,0.3); height: 4px; border-radius: 2px; margin: 8px 0;">
                <div style="background: white; height: 100%; width: ${progress}%; border-radius: 2px; transition: width 0.3s ease;"></div>
            </div>` : '';
        
        statusDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <span><strong>RIV+</strong> ${message}</span>
            </div>
            ${progressBar}
        `;
        
        // Add CSS animation for spinner
        if (!document.getElementById('riv-spinner-style')) {
            const style = document.createElement('style');
            style.id = 'riv-spinner-style';
            style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
            document.head.appendChild(style);
        }
    }
    
    function hideLoadingStatus() {
        const statusDiv = document.getElementById('riv-loading-status');
        if (statusDiv) {
            statusDiv.style.opacity = '0';
            statusDiv.style.transform = 'translateX(100%)';
            setTimeout(() => statusDiv.remove(), 300);
        }
        
        const spinnerStyle = document.getElementById('riv-spinner-style');
        if (spinnerStyle) spinnerStyle.remove();
    }
    
    // Enhanced module loader with fallback and caching
    async function loadModule(module, useLocal = false) {
        const moduleName = module.name;
        console.log(`📦 Loading module: ${moduleName}`);
        
        // Check if module is already loaded
        if (loadedModules[moduleName]) {
            console.log(`✅ Module ${moduleName} already loaded from cache`);
            return loadedModules[moduleName];
        }
        
        let moduleCode = null;
        let error = null;
        
        // Try loading from localStorage cache first
        const cacheKey = `riv-module-${moduleName}-v${SCRIPT_VERSION}`;
        const cachedModule = localStorage.getItem(cacheKey);
        
        if (cachedModule && !useLocal) {
            try {
                console.log(`💾 Loading ${moduleName} from cache`);
                eval(cachedModule);
                loadedModules[moduleName] = true;
                return true;
            } catch (e) {
                console.warn(`⚠️ Cached module ${moduleName} failed, fetching fresh copy`);
                localStorage.removeItem(cacheKey);
            }
        }
        
        // Try primary URL
        if (!moduleCode) {
            try {
                const primaryUrl = MODULE_BASE_URL + module.file;
                console.log(`🌐 Fetching ${moduleName} from: ${primaryUrl}`);
                const response = await fetch(primaryUrl);
                if (response.ok) {
                    moduleCode = await response.text();
                    console.log(`✅ Module ${moduleName} loaded from primary source`);
                }
            } catch (e) {
                console.warn(`⚠️ Primary source failed for ${moduleName}:`, e.message);
                error = e;
            }
        }
        
        // Try fallback URL
        if (!moduleCode) {
            try {
                const fallbackUrl = FALLBACK_BASE_URL + module.file;
                console.log(`🔄 Trying fallback for ${moduleName}: ${fallbackUrl}`);
                const response = await fetch(fallbackUrl);
                if (response.ok) {
                    moduleCode = await response.text();
                    console.log(`✅ Module ${moduleName} loaded from fallback source`);
                }
            } catch (e) {
                console.warn(`⚠️ Fallback source failed for ${moduleName}:`, e.message);
                error = e;
            }
        }
        
        // Execute module code
        if (moduleCode) {
            try {
                // Cache the module for future use
                localStorage.setItem(cacheKey, moduleCode);
                
                // Execute module code
                eval(moduleCode);
                loadedModules[moduleName] = true;
                console.log(`🎯 Module ${moduleName} executed successfully`);
                return true;
            } catch (e) {
                console.error(`❌ Failed to execute module ${moduleName}:`, e);
                throw new Error(`Module execution failed: ${e.message}`);
            }
        } else {
            const errorMsg = `Failed to load module ${moduleName}`;
            console.error(`❌ ${errorMsg}`);
            if (module.required) {
                throw new Error(errorMsg + ' (required module)');
            }
            return false;
        }
    }
    
    // Load all modules with progress tracking
    async function loadAllModules() {
        showLoadingStatus('Loading modules...', 0);
        
        try {
            const totalModules = MODULES.length;
            let loadedCount = 0;
            
            // Load modules in parallel for better performance
            const loadPromises = MODULES.map(async (module) => {
                try {
                    await loadModule(module);
                    loadedCount++;
                    const progress = Math.round((loadedCount / totalModules) * 100);
                    showLoadingStatus(`Loading modules... (${loadedCount}/${totalModules})`, progress);
                    return { module: module.name, success: true };
                } catch (error) {
                    console.error(`❌ Failed to load ${module.name}:`, error);
                    return { module: module.name, success: false, error };
                }
            });
            
            const results = await Promise.all(loadPromises);
            
            // Check if all required modules loaded successfully
            const failed = results.filter(r => !r.success && MODULES.find(m => m.name === r.module)?.required);
            
            if (failed.length > 0) {
                throw new Error(`Required modules failed to load: ${failed.map(f => f.module).join(', ')}`);
            }
            
            console.log('📦 All modules loaded successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Module loading failed:', error);
            showLoadingStatus('❌ Module loading failed', 100);
            setTimeout(hideLoadingStatus, 3000);
            throw error;
        }
    }
    
    // Initialize modules and setup global references
    function initializeModules() {
        try {
            showLoadingStatus('Initializing modules...', 90);
            
            // Initialize module instances
            if (window.CoreModule) coreModule = new window.CoreModule();
            if (window.DashboardModule) dashboardModule = new window.DashboardModule();
            if (window.PalletLandModule) palletlandModule = new window.PalletLandModule();
            if (window.SettingsModule) settingsModule = new window.SettingsModule();
            
            if (!coreModule || !settingsModule) {
                throw new Error('Critical modules (Core/Settings) failed to initialize');
            }
            
            // Setup global references for cross-module communication
            window.coreModule = coreModule;
            window.dashboardModule = dashboardModule;
            window.palletlandModule = palletlandModule;
            window.settingsModule = settingsModule;
            window.SCRIPT_VERSION = SCRIPT_VERSION;
            
            // Make core functions globally accessible for backward compatibility
            window.sessionData = coreModule.sessionData;
            window.performContainerSearch = (containerId, silent) => coreModule.performContainerSearch(containerId, silent);
            window.getMainDestination = (sortationCategory) => coreModule.getMainDestination(sortationCategory);
            window.scriptSettings = settingsModule.scriptSettings;
            window.generatePalletLandDestinations = () => settingsModule.generatePalletLandDestinations();
            window.generateDashboardDestinations = () => settingsModule.generateDashboardDestinations();
            
            // CSV export function for compatibility
            window.rivExportCSV = function() {
                if (coreModule.collectedContainerData.length === 0) {
                    alert('No data available for export. Please run analysis first.');
                    return;
                }
                
                const csvContent = coreModule.convertToCSV(coreModule.collectedContainerData);
                const timestamp = settingsModule.scriptSettings.includeTimestamp ? 
                    new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) : '';
                const filename = settingsModule.scriptSettings.includeTimestamp ? 
                    `${settingsModule.scriptSettings.filenamePrefix}_${timestamp}.csv` : 
                    `${settingsModule.scriptSettings.filenamePrefix}.csv`;
                
                coreModule.downloadCSV(csvContent, filename);
                
                // Show success feedback
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
            
            console.log('🔗 Module initialization complete');
            return true;
            
        } catch (error) {
            console.error('❌ Module initialization failed:', error);
            return false;
        }
    }
    
    // Main application initialization
    async function initializeApp() {
        try {
            showLoadingStatus('Starting application...', 95);
            
            // Load user settings
            settingsModule.loadSettings();
            
            // Restore session data from localStorage
            const sessionRestored = coreModule.sessionData.load();
            if (sessionRestored) {
                console.log('🔄 Session data restored from previous session');
            }
            
            // Initialize core functionality
            coreModule.addTotalItemsColumn();
            coreModule.initializeCopyToClipboard();
            coreModule.initializeSessionMonitoring();
            coreModule.addMenuOptions();
            
            // Session management with automatic fallback
            setTimeout(async () => {
                if (!sessionRestored) {
                    console.log('🚀 Attempting automatic session capture...');
                    const success = await autoTriggerSessionCapture();
                    if (success) {
                        console.log('✅ Automatic session capture successful');
                    } else {
                        console.log('⚠️ Using monitoring mode for session detection');
                    }
                }
            }, 1000);
            
            showLoadingStatus('✅ Ready!', 100);
            setTimeout(hideLoadingStatus, 2000);
            
            console.log('📄 RIV+ ready - Full functionality enabled');
            console.log('🔧 Debug functions: rivTestSessionCapture(), rivSetKnownSession()');
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            showLoadingStatus('❌ Initialization failed', 100);
            setTimeout(hideLoadingStatus, 5000);
        }
    }
    
    // Simplified session capture with known values
    async function autoTriggerSessionCapture() {
        try {
            const warehouseId = 'KTW1';
            const associate = 'kubicdar';
            
            // Test API availability
            const requestData = {
                containerId: "DZ",
                warehouseId: warehouseId,
                associate: associate,
                includeChildren: true,
                mode: "SEARCH",
                locale: "pl-PL",
                movingContainers: []
            };
            
            await fetch('/api/getContainer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/plain, */*',
                    'Origin': window.location.origin,
                    'Referer': window.location.href
                },
                body: JSON.stringify(requestData)
            });
            
            // Update session data
            if (coreModule && warehouseId && associate) {
                coreModule.sessionData.update(warehouseId, associate);
                console.log('✅ Session data set successfully');
                return true;
            }
            
            return false;
        } catch (error) {
            console.log('❌ Session capture error, using fallback values');
            
            // Fallback: Use known working values
            if (coreModule) {
                coreModule.sessionData.update('KTW1', 'kubicdar');
                console.log('✅ Session data set using fallback values');
                return true;
            }
            return false;
        }
    }
    
    // Debug functions for console
    window.rivTestSessionCapture = async function() {
        console.log('🧪 Testing session capture...');
        try {
            const result = await autoTriggerSessionCapture();
            console.log('🧪 Session test result:', {
                success: result,
                sessionData: coreModule ? {
                    warehouseId: coreModule.sessionData.warehouseId,
                    associate: coreModule.sessionData.associate,
                    lastCaptured: coreModule.sessionData.lastCaptured
                } : 'Core module not available'
            });
            return result;
        } catch (error) {
            console.error('🧪 Session test failed:', error);
            return false;
        }
    };
    
    window.rivSetKnownSession = function() {
        console.log('🔧 Setting known session data...');
        try {
            if (coreModule) {
                coreModule.sessionData.update('KTW1', 'kubicdar');
                console.log('✅ Known session data set successfully');
                return true;
            } else {
                console.error('❌ Core module not available');
                return false;
            }
        } catch (error) {
            console.error('❌ Error setting known session:', error);
            return false;
        }
    };
    
    window.rivReloadModules = async function() {
        console.log('🔄 Reloading modules...');
        try {
            // Clear cache from all versions
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('riv-module-')) {
                    localStorage.removeItem(key);
                    console.log(`🗑️ Cleared cache: ${key}`);
                }
            });
            
            // Reset loaded modules
            loadedModules = {};
            
            // Reload all modules
            await loadAllModules();
            initializeModules();
            await initializeApp();
            
            console.log('✅ Modules reloaded successfully');
            return true;
        } catch (error) {
            console.error('❌ Module reload failed:', error);
            return false;
        }
    };
    
    // Main startup sequence
    async function startup() {
        try {
            console.log('🔄 RIV+ initializing...');
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
            }
            
            // Load all modules
            await loadAllModules();
            
            // Initialize module instances
            if (!initializeModules()) {
                throw new Error('Module initialization failed');
            }
            
            // Initialize the application
            await initializeApp();
            
        } catch (error) {
            console.error('❌ RIV+ startup failed:', error);
            showLoadingStatus('❌ Startup failed - Check console', 100);
            setTimeout(hideLoadingStatus, 5000);
            
            // Show error notification to user
            setTimeout(() => {
                if (confirm('RIV+ failed to start. Would you like to try reloading modules?')) {
                    window.rivReloadModules();
                }
            }, 2000);
        }
    }
    
    // Start the application
    startup();
    
    console.log('✅ RIV+ loaded');
    
})();