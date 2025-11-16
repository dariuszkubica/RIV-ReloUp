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
    let notificationBar = null;
    
    // Create notification bar
    function createNotificationBar() {
        const bar = document.createElement('div');
        bar.id = 'container-counter-bar';
        bar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 20px;
            z-index: 999999;
            font-family: Arial, sans-serif;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #fff;
        `;
        
        const content = document.createElement('div');
        content.id = 'notification-content';
        content.innerHTML = '🔍 <strong>Container Counter Active</strong> - Ready for analysis...';
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            font-size: 16px;
            cursor: pointer;
            padding: 5px 10px;
            border-radius: 3px;
        `;
        closeBtn.onclick = () => {
            bar.remove();
            if (document.body) document.body.style.marginTop = '0px';
        };
        
        bar.appendChild(content);
        bar.appendChild(closeBtn);
        
        const addToPage = () => {
            if (document.body) {
                document.body.insertBefore(bar, document.body.firstChild);
                document.body.style.marginTop = '70px';
            }
        };
        
        if (document.body) {
            addToPage();
        } else {
            document.addEventListener('DOMContentLoaded', addToPage);
        }
        
        return bar;
    }
    
    // Update notification content
    function updateNotification(message, isError = false) {
        if (!notificationBar) {
            notificationBar = createNotificationBar();
        }
        const content = document.getElementById('notification-content');
        if (content) {
            const emoji = isError ? '❌' : '✅';
            content.innerHTML = `${emoji} <strong>${message}</strong>`;
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
        
        updateNotification(`Analyzing ${childContainers.length} containers...`);
        
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
            updateNotification(`Processing... ${processed}/${childContainers.length} (${totalItems} items found)`);
        }
        
        // Final result
        updateNotification(`🎉 ANALYSIS COMPLETE! Total Items: ${totalItems} (${successCount}/${childContainers.length} successful)`);
        
        console.log(`🎉 FAST ANALYSIS COMPLETE:
        - Total items: ${totalItems}
        - Successful: ${successCount}/${childContainers.length}
        - Errors: ${errorCount}`);
        
        return totalItems;
    }
    
    // Process response data
    function processApiResponse(data, requestBody) {
        if (data && data.childContainers && Array.isArray(data.childContainers) && data.childContainers.length > 0) {
            if (!isProcessing) {
                isProcessing = true;
                
                const warehouseId = requestBody.warehouseId;
                const associate = requestBody.associate;
                
                updateNotification(`Found ${data.childContainers.length} containers! Starting fast analysis...`);
                
                // Start fast processing immediately
                setTimeout(async () => {
                    try {
                        await processChildContainersFast(data.childContainers, warehouseId, associate);
                    } catch (error) {
                        updateNotification(`Analysis failed: ${error.message}`, true);
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
        updateNotification('Fast analysis ready!');
        console.log('📄 Fast container analysis ready');
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    console.log('✅ RIV - ReloUp loaded (Speed Optimized)');
})();