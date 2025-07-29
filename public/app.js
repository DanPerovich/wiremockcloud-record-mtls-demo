class MTLSDemo {
    constructor() {
        this.currentEndpoint = 'live';
        this.config = {
            live: { url: 'https://localhost:8443' },
            wiremock: { port: 8000, url: 'http://localhost:8000' },
            mock: { url: '' }
        };
        this.init();
    }

    init() {
        this.loadConfiguration();
        this.bindEvents();
        this.updateEndpointDisplay();
        this.updateConfigurationUI();
    }

    bindEvents() {
        // Endpoint selection
        const endpointRadios = document.querySelectorAll('input[name="endpoint"]');
        endpointRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentEndpoint = e.target.value;
                this.updateEndpointDisplay();
                this.updateConfigurationUI();
            });
        });

        // Configuration inputs
        document.getElementById('live-url').addEventListener('input', (e) => {
            this.config.live.url = e.target.value;
        });

        document.getElementById('wiremock-port').addEventListener('input', (e) => {
            const port = parseInt(e.target.value) || 8000;
            this.config.wiremock.port = port;
            this.config.wiremock.url = `http://localhost:${port}`;
            document.getElementById('wiremock-url').value = this.config.wiremock.url;
        });

        document.getElementById('mock-url').addEventListener('input', (e) => {
            // Remove trailing slash to prevent invalid requests
            let url = e.target.value.trim();
            if (url.endsWith('/') && url.length > 1) {
                url = url.slice(0, -1);
                e.target.value = url; // Update the input field
            }
            this.config.mock.url = url;
        });

        // Save configuration button
        document.getElementById('save-config').addEventListener('click', () => this.saveConfiguration());

        // Action buttons
        document.getElementById('fetch-data').addEventListener('click', () => this.fetchData());
        document.getElementById('post-data').addEventListener('click', () => this.postData());
        document.getElementById('clear-results').addEventListener('click', () => this.clearResults());
    }

    updateEndpointDisplay() {
        const endpointSpan = document.querySelector('.endpoint-url');
        let endpointText, endpointUrl;
        
        switch(this.currentEndpoint) {
            case 'live':
                endpointText = 'Live API';
                endpointUrl = this.config.live.url;
                break;
            case 'wiremock':
                endpointText = 'WireMock Recorder';
                endpointUrl = this.config.wiremock.url;
                break;
            case 'mock':
                endpointText = 'Mock API';
                endpointUrl = this.config.mock.url || 'Not configured';
                break;
            default:
                endpointText = 'Unknown';
                endpointUrl = '';
        }
        
        endpointSpan.textContent = `${endpointText} (${endpointUrl})`;
    }

    updateConfigurationUI() {
        // Hide all config panels
        document.querySelectorAll('.endpoint-config').forEach(panel => {
            panel.classList.remove('active');
        });
        
        // Show active panel
        const activePanel = document.getElementById(`${this.currentEndpoint}-config`);
        if (activePanel) {
            activePanel.classList.add('active');
        }
        
        // Update input values
        document.getElementById('live-url').value = this.config.live.url;
        document.getElementById('wiremock-port').value = this.config.wiremock.port;
        document.getElementById('wiremock-url').value = this.config.wiremock.url;
        document.getElementById('mock-url').value = this.config.mock.url;
    }

    loadConfiguration() {
        const savedConfig = localStorage.getItem('mtls-demo-config');
        if (savedConfig) {
            try {
                const parsed = JSON.parse(savedConfig);
                this.config = { ...this.config, ...parsed.config };
                this.currentEndpoint = parsed.currentEndpoint || 'live';
                
                // Clean up any trailing slashes from loaded config
                if (this.config.mock.url && this.config.mock.url.endsWith('/') && this.config.mock.url.length > 1) {
                    this.config.mock.url = this.config.mock.url.slice(0, -1);
                }
                
                // Update radio button
                const radio = document.querySelector(`input[name="endpoint"][value="${this.currentEndpoint}"]`);
                if (radio) radio.checked = true;
            } catch (e) {
                console.warn('Failed to load saved configuration:', e);
            }
        }
    }

    saveConfiguration() {
        // Clean up any trailing slashes before saving
        if (this.config.mock.url && this.config.mock.url.endsWith('/') && this.config.mock.url.length > 1) {
            this.config.mock.url = this.config.mock.url.slice(0, -1);
            document.getElementById('mock-url').value = this.config.mock.url;
        }
        
        const configData = {
            currentEndpoint: this.currentEndpoint,
            config: this.config,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('mtls-demo-config', JSON.stringify(configData));
        
        // Show feedback
        const button = document.getElementById('save-config');
        const originalText = button.textContent;
        button.textContent = 'Saved!';
        button.style.background = '#48bb78';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '#667eea';
        }, 2000);
        
        this.updateEndpointDisplay();
    }

    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('error').classList.add('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    showError(message) {
        const errorDiv = document.getElementById('error');
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
        this.hideLoading();
    }

    displayResponse(data) {
        const responseDiv = document.getElementById('response-data');
        responseDiv.textContent = JSON.stringify(data, null, 2);
        this.hideLoading();
    }

    async makeRequest(endpoint, options = {}) {
        try {
            this.showLoading();
            
            // Get current configuration
            const currentConfig = this.config[this.currentEndpoint];
            
            // Validate configuration
            if (!currentConfig.url) {
                throw new Error(`${this.currentEndpoint} endpoint URL not configured`);
            }
            
            const queryParams = new URLSearchParams({
                mode: this.currentEndpoint,
                url: currentConfig.url
            });
            
            if (this.currentEndpoint === 'wiremock') {
                queryParams.set('port', currentConfig.port.toString());
            }
            
            const response = await fetch(`/api/${endpoint}?${queryParams}`, {
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                body: options.body ? JSON.stringify(options.body) : undefined
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.displayResponse(data);
            this.updateRecordingStatus('success');
        } catch (error) {
            console.error('Request failed:', error);
            this.showError(`Request failed: ${error.message}`);
            this.updateRecordingStatus('error');
        }
    }

    async fetchData() {
        await this.makeRequest('data');
    }

    async postData() {
        // Generate fun sample user data
        const names = ['Alex Morgan', 'Jordan Smith', 'Casey Johnson', 'Riley Davis', 'Avery Wilson'];
        const domains = ['wiremock.com', 'example.org', 'demo.dev', 'test.io', 'mock.net'];
        
        const randomName = names[Math.floor(Math.random() * names.length)];
        const randomEmail = `${randomName.toLowerCase().replace(' ', '.')}@${domains[Math.floor(Math.random() * domains.length)]}`;
        
        const sampleUserData = {
            name: randomName,
            email: randomEmail,
            role: 'user',
            department: 'Engineering',
            timestamp: new Date().toISOString(),
            source: `WireMock Demo (${this.currentEndpoint} mode)`
        };
        
        await this.makeRequest('data', {
            method: 'POST',
            body: sampleUserData
        });
    }

    clearResults() {
        document.getElementById('response-data').textContent = '';
        document.getElementById('error').classList.add('hidden');
        this.updateRecordingStatus('ready');
    }

    updateRecordingStatus(status) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        switch(status) {
            case 'success':
                statusDot.style.background = '#48bb78';
                statusText.textContent = 'Request Successful';
                break;
            case 'error':
                statusDot.style.background = '#f56565';
                statusText.textContent = 'Request Failed';
                break;
            case 'ready':
            default:
                statusDot.style.background = '#667eea';
                statusText.textContent = 'Ready';
                break;
        }
    }
}

// Initialize the demo when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MTLSDemo();
});