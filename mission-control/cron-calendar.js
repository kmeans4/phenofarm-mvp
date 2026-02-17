/**
 * Cron Calendar Component
 * Visual timeline/calendar view for cron jobs
 */

class CronCalendar {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container #${containerId} not found`);
    }
    
    this.options = {
      apiEndpoint: options.apiEndpoint || '/api/cron',
      refreshInterval: options.refreshInterval || 60000,
      compact: options.compact || false,
      ...options
    };
    
    this.jobs = [];
    this.selectedJob = null;
    this.refreshTimer = null;
    this.currentTimePosition = 0;
    
    this.init();
  }
  
  init() {
    this.render();
    this.attachEventListeners();
    this.loadJobs();
    this.startRefreshTimer();
  }
  
  // Generate mock data for 24 cron jobs
  generateMockJobs() {
    const jobNames = [
      'Backup Database', 'Clean Temp Files', 'Sync Analytics', 'Health Check',
      'Send Notifications', 'Update Cache', 'Generate Reports', 'Archive Logs',
      'Check SSL Certs', 'Update Search Index', 'Sync Users', 'Cleanup Sessions',
      'Process Webhooks', 'Refresh Tokens', 'Send Digest', 'Check Disk Space',
      'Update Sitemap', 'Prune Old Data', 'Sync External API', 'Verify Integrity',
      'Rotate Logs', 'Update Stats', 'Check Dependencies', 'Cleanup Orphans'
    ];
    
    const schedules = [
      { kind: 'cron', expr: '0 */4 * * *' },      // Every 4 hours
      { kind: 'cron', expr: '0 2 * * *' },        // Daily at 2am
      { kind: 'cron', expr: '0 */6 * * *' },      // Every 6 hours
      { kind: 'cron', expr: '*/30 * * * *' },     // Every 30 minutes
      { kind: 'cron', expr: '0 9,17 * * *' },     // Twice daily
      { kind: 'every', everyMs: 3600000 },        // Every hour
      { kind: 'every', everyMs: 900000 },         // Every 15 minutes
      { kind: 'cron', expr: '0 0 * * 0' },        // Weekly
    ];
    
    const now = Date.now();
    const hourMs = 3600000;
    
    return jobNames.map((name, i) => {
      const schedule = schedules[i % schedules.length];
      const nextRun = now + (Math.random() * 12 * hourMs) - (6 * hourMs);
      const lastRun = Math.random() > 0.2 ? now - (Math.random() * 24 * hourMs) : null;
      const lastStatus = Math.random() > 0.1 ? 'ok' : 'error';
      const enabled = Math.random() > 0.1;
      const running = Math.random() > 0.95;
      
      return {
        id: `cron-${String(i + 1).padStart(3, '0')}`,
        name,
        enabled,
        schedule,
        state: {
          lastStatus: lastRun ? lastStatus : null,
          lastRunAtMs: lastRun,
          nextRunAtMs: nextRun,
          runningAtMs: running ? now : null
        }
      };
    });
  }
  
  // Calculate status for display
  getJobStatus(job) {
    const now = Date.now();
    const { state, enabled } = job;
    
    if (!enabled) return 'disabled';
    if (state.runningAtMs) return 'running';
    if (!state.lastRunAtMs && !state.nextRunAtMs) return 'pending';
    if (state.nextRunAtMs && state.nextRunAtMs - now < 600000) return 'running'; // Within 10 min
    if (state.lastStatus === 'error') return 'error';
    if (state.lastStatus === 'ok') return 'ok';
    return 'pending';
  }
  
  // Get status icon
  getStatusIcon(status) {
    const icons = {
      ok: '✅',
      running: '⏳',
      error: '❌',
      disabled: '⏸️',
      pending: '⏺️'
    };
    return icons[status] || '⏺️';
  }
  
  // Parse cron expression to get next runs
  parseCronExpression(expr) {
    // Simplified cron parser - returns estimated runs
    const runs = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    for (let hour = 0; hour < 24; hour++) {
      try {
        if (this.matchesCron(expr, hour)) {
          runs.push(new Date(today.getTime() + hour * 3600000).getTime());
        }
      } catch (e) {
        // Invalid expression, use current time
      }
    }
    
    return runs;
  }
  
  // Simple cron matcher
  matchesCron(expr, hour) {
    if (expr === '* * * * *') return true;
    if (expr === `0 ${hour} * * *`) return true;
    if (expr.startsWith('*/')) {
      const interval = parseInt(expr.split(' ')[0].replace('*/', '')) || 60;
      return hour % Math.ceil(interval / 60) === 0;
    }
    if (expr.includes('* * * * *')) {
      return expr.includes(String(hour)) || expr.startsWith('0');
    }
    return false;
  }
  
  // Format time display
  formatTime(timestamp) {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  
  // Format duration
  formatDuration(ms) {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  }
  
  // Calculate position on 24-hour timeline (0-100%)
  getTimePosition(timestamp) {
    if (!timestamp) return 0;
    const date = new Date(timestamp);
    const hour = date.getHours();
    const minute = date.getMinutes();
    return ((hour * 60 + minute) / 1440) * 100;
  }
  
  // Calculate block width based on duration
  getBlockWidth(startTime, endTime) {
    if (!startTime || !endTime) return 2; // Minimum 2%
    const duration = endTime - startTime;
    const dayMs = 24 * 60 * 60 * 1000;
    return Math.max(2, Math.min(20, (duration / dayMs) * 100));
  }
  
  // Render the component
  render() {
    this.container.innerHTML = `
      <div class="cron-calendar ${this.options.compact ? 'compact' : ''}">
        <header class="cron-calendar-header">
          <h2 class="cron-calendar-title">⏰ Cron Jobs</h2>
          <div class="cron-calendar-actions">
            <button class="btn-cron btn-cron-secondary" id="cron-refresh">↻ Refresh</button>
            <button class="btn-cron" id="cron-add-new">+ Add Job</button>
          </div>
        </header>
        
        <div class="cron-legend">
          <span class="legend-item"><span class="legend-dot ok"></span> Running OK</span>
          <span class="legend-item"><span class="legend-dot running"></span> Running/Scheduled</span>
          <span class="legend-item"><span class="legend-dot error"></span> Error</span>
          <span class="legend-item"><span class="legend-dot disabled"></span> Disabled</span>
          <span class="legend-item"><span class="legend-dot pending"></span> No History</span>
        </div>
        
        <div class="cron-timeline" id="cron-timeline">
          <div class="timeline-header" id="timeline-header"></div>
          <div class="current-time-line" id="current-time-line"></div>
          <div class="jobs-list" id="jobs-list">
            <div class="cron-loading">
              <div class="cron-spinner"></div>
              <span>Loading cron jobs...</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Edit Modal -->
      <div class="cron-modal" id="cron-edit-modal">
        <div class="cron-modal-content">
          <div class="cron-modal-header">
            <h3 class="cron-modal-title">Edit Cron Job</h3>
            <button class="cron-modal-close" id="modal-close">×</button>
          </div>
          <div class="cron-modal-body" id="modal-body">
            <!-- Dynamic content -->
          </div>
          <div class="cron-modal-footer" id="modal-footer">
            <!-- Dynamic buttons -->
          </div>
        </div>
      </div>
      
      <!-- Add Job Modal -->
      <div class="cron-modal" id="cron-add-modal">
        <div class="cron-modal-content">
          <div class="cron-modal-header">
            <h3 class="cron-modal-title">Add New Cron Job</h3>
            <button class="cron-modal-close" id="add-modal-close">×</button>
          </div>
          <div class="cron-modal-body">
            <div class="template-grid">
              <button class="template-btn" data-template="daily">
                <span class="template-icon">🌅</span>
                <span>Daily</span>
              </button>
              <button class="template-btn" data-template="hourly">
                <span class="template-icon">🕐</span>
                <span>Hourly</span>
              </button>
              <button class="template-btn" data-template="15min">
                <span class="template-icon">⚡</span>
                <span>Every 15m</span>
              </button>
              <button class="template-btn" data-template="30min">
                <span class="template-icon">⏱️</span>
                <span>Every 30m</span>
              </button>
              <button class="template-btn" data-template="custom">
                <span class="template-icon">⚙️</span>
                <span>Custom</span>
              </button>
              <button class="template-btn" data-template="interval">
                <span class="template-icon">🔄</span>
                <span>Interval</span>
              </button>
            </div>
            <div id="add-form-container" style="display: none;">
              <div class="form-group">
                <label class="form-label">Job Name</label>
                <input type="text" class="form-input" id="new-job-name" placeholder="My Cron Job">
              </div>
              <div class="form-group">
                <label class="form-label">Schedule</label>
                <select class="form-select" id="new-job-schedule-type">
                  <option value="cron">Cron Expression</option>
                  <option value="every">Interval (ms)</option>
                </select>
              </div>
              <div class="form-group" id="cron-expr-group">
                <label class="form-label">Cron Expression</label>
                <input type="text" class="form-input" id="new-job-cron" placeholder="0 */4 * * *">
                <span class="form-hint">Format: minute hour day month weekday</span>
              </div>
              <div class="form-group" id="interval-group" style="display: none;">
                <label class="form-label">Interval (milliseconds)</label>
                <input type="number" class="form-input" id="new-job-interval" placeholder="3600000" value="3600000">
                <span class="form-hint">Default: 3600000 (1 hour)</span>
              </div>
              <div class="form-group">
                <div class="toggle-switch">
                  <input type="checkbox" class="toggle-input" id="new-job-enabled" checked>
                  <label for="new-job-enabled">Enabled</label>
                </div>
              </div>
            </div>
          </div>
          <div class="cron-modal-footer">
            <button class="btn-cron btn-cron-secondary" id="add-cancel">Cancel</button>
            <button class="btn-cron" id="add-confirm" style="display: none;">Create Job</button>
          </div>
        </div>
      </div>
    `;
  }
  
  // Render time header (24 hour slots)
  renderTimeHeader() {
    const header = document.getElementById('timeline-header');
    if (!header) return;
    
    let html = '';
    for (let hour = 0; hour < 24; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      html += `<div class="time-slot" data-hour="${hour}">${time}</div>`;
    }
    header.innerHTML = html;
  }
  
  // Update current time indicator position
  updateCurrentTime() {
    const line = document.getElementById('current-time-line');
    if (!line) return;
    
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const position = ((hour * 60 + minute) / 1440) * 100;
    
    line.style.left = `calc(180px + ${position}% - ${position * 0.05}px)`;
    
    // Scroll to current time on mobile
    const timeline = document.getElementById('cron-timeline');
    if (timeline && window.innerWidth < 768) {
      const scrollPosition = (timeline.scrollWidth - timeline.clientWidth) * (position / 100);
      timeline.scrollLeft = scrollPosition;
    }
  }
  
  // Render jobs list
  renderJobs() {
    const jobList = document.getElementById('jobs-list');
    if (!jobList) return;
    
    if (this.jobs.length === 0) {
      jobList.innerHTML = `
        <div class="cron-empty">
          <div class="cron-empty-icon">⏰</div>
          <div class="cron-empty-title">No Cron Jobs</div>
          <div class="cron-empty-desc">Click "Add Job" to create your first cron job.</div>
        </div>
      `;
      return;
    }
    
    jobList.innerHTML = this.jobs.map(job => {
      const status = this.getJobStatus(job);
      const statusIcon = this.getStatusIcon(status);
      const nextRunPos = this.getTimePosition(job.state.nextRunAtMs);
      const scheduleText = job.schedule.kind === 'cron' 
        ? job.schedule.expr 
        : `Every ${this.formatDuration(job.schedule.everyMs)}`;
      
      // Calculate if job span should show
      const showBlock = job.state.lastRunAtMs && job.schedule.kind === 'every';
      const blockWidth = showBlock ? this.getBlockWidth(job.state.lastRunAtMs, job.state.nextRunAtMs) : 0;
      
      return `
        <div class="job-row" data-job-id="${job.id}">
          <div class="job-info" data-action="edit">
            <span class="job-status-icon ${status}">${statusIcon}</span>
            <div class="job-details">
              <div class="job-name" title="${job.name}">${job.name}</div>
              <div class="job-schedule">${scheduleText}</div>
            </div>
          </div>
          <div class="job-track">
            ${showBlock ? `
              <div class="job-block ${status}" 
                   style="left: ${Math.max(0, this.getTimePosition(job.state.lastRunAtMs) - blockWidth/2)}%; width: ${blockWidth}%"
                   data-action="edit">
                ${status === 'running' ? '⏳ Running' : this.formatTime(job.state.lastRunAtMs)}
              </div>
            ` : ''}
            ${job.state.nextRunAtMs ? `
              <div class="next-run-indicator ${status}" 
                   style="left: ${nextRunPos}%"
                   data-time="Next: ${this.formatTime(job.state.nextRunAtMs)}"
                   data-action="edit"></div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
    
    this.updateCurrentTime();
  }
  
  // Load jobs from API (or mock data)
  async loadJobs() {
    try {
      // In production, this would fetch from actual API
      // const response = await fetch(this.options.apiEndpoint);
      // this.jobs = await response.json();
      
      // For demo: use mock data
      this.jobs = this.generateMockJobs();
      this.renderTimeHeader();
      this.renderJobs();
    } catch (error) {
      console.error('Failed to load cron jobs:', error);
      const jobList = document.getElementById('jobs-list');
      if (jobList) {
        jobList.innerHTML = `
          <div class="cron-empty">
            <div class="cron-empty-icon">⚠️</div>
            <div class="cron-empty-title">Failed to Load Jobs</div>
            <div class="cron-empty-desc">${error.message}</div>
          </div>
        `;
      }
    }
  }
  
  // Open edit modal
  openEditModal(jobId) {
    const job = this.jobs.find(j => j.id === jobId);
    if (!job) return;
    
    this.selectedJob = job;
    const modal = document.getElementById('cron-edit-modal');
    const body = document.getElementById('modal-body');
    const footer = document.getElementById('modal-footer');
    
    const status = this.getJobStatus(job);
    const lastRun = job.state.lastRunAtMs ? new Date(job.state.lastRunAtMs).toLocaleString() : 'Never';
    const nextRun = job.state.nextRunAtMs ? new Date(job.state.nextRunAtMs).toLocaleString() : 'Not scheduled';
    const scheduleText = job.schedule.kind === 'cron' 
      ? job.schedule.expr 
      : `Every ${this.formatDuration(job.schedule.everyMs)}`;
    
    body.innerHTML = `
      <div class="form-group">
        <label class="form-label">Job Name</label>
        <input type="text" class="form-input" id="edit-job-name" value="${job.name}">
      </div>
      
      <div class="form-group">
        <label class="form-label">Schedule</label>
        <input type="text" class="form-input" id="edit-job-schedule" value="${scheduleText}">
        <span class="form-hint">${job.schedule.kind === 'cron' ? 'Cron expression' : 'Interval in milliseconds'}</span>
      </div>
      
      <div class="form-group">
        <div class="toggle-switch">
          <input type="checkbox" class="toggle-input" id="edit-job-enabled" ${job.enabled ? 'checked' : ''}>
          <label for="edit-job-enabled">${job.enabled ? 'Enabled' : 'Disabled'}</label>
        </div>
      </div>
      
      <div class="job-stats">
        <div class="stat-item">
          <div class="stat-label">Status</div>
          <div class="stat-value" style="color: var(--cron-${status})">${status.toUpperCase()}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Last Run</div>
          <div class="stat-value">${lastRun}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Next Run</div>
          <div class="stat-value">${nextRun}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Job ID</div>
          <div class="stat-value" style="font-size: 0.7rem">${job.id}</div>
        </div>
      </div>
    `;
    
    footer.innerHTML = `
      <button class="btn-cron btn-cron-danger" id="btn-delete">Delete</button>
      <button class="btn-cron btn-cron-secondary" id="btn-run-now">▶ Run Now</button>
      <button class="btn-cron btn-cron-secondary" id="btn-cancel">Cancel</button>
      <button class="btn-cron" id="btn-save">Save Changes</button>
    `;
    
    // Attach footer event listeners
    document.getElementById('btn-delete').addEventListener('click', () => this.deleteJob(job.id));
    document.getElementById('btn-run-now').addEventListener('click', () => this.runJobNow(job.id));
    document.getElementById('btn-cancel').addEventListener('click', () => this.closeModal('cron-edit-modal'));
    document.getElementById('btn-save').addEventListener('click', () => this.saveJobChanges());
    
    modal.classList.add('active');
  }
  
  // Open add modal
  openAddModal() {
    const modal = document.getElementById('cron-add-modal');
    const formContainer = document.getElementById('add-form-container');
    const confirmBtn = document.getElementById('add-confirm');
    const scheduleType = document.getElementById('new-job-schedule-type');
    const cronGroup = document.getElementById('cron-expr-group');
    const intervalGroup = document.getElementById('interval-group');
    
    // Reset form
    document.getElementById('new-job-name').value = '';
    document.getElementById('new-job-cron').value = '';
    document.getElementById('new-job-interval').value = '3600000';
    document.getElementById('new-job-enabled').checked = true;
    formContainer.style.display = 'none';
    confirmBtn.style.display = 'none';
    
    // Template buttons
    document.querySelectorAll('[data-template]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const template = e.currentTarget.dataset.template;
        formContainer.style.display = 'block';
        confirmBtn.style.display = 'inline-flex';
        
        const presets = {
          daily: { kind: 'cron', expr: '0 2 * * *', name: 'Daily Task' },
          hourly: { kind: 'cron', expr: '0 * * * *', name: 'Hourly Task' },
          '15min': { kind: 'every', expr: '*/15 * * * *', name: '15 Minute Task', interval: 900000 },
          '30min': { kind: 'cron', expr: '*/30 * * * *', name: '30 Minute Task' },
          custom: { kind: 'cron', expr: '', name: '' },
          interval: { kind: 'every', expr: '', name: '', interval: 3600000 }
        };
        
        const preset = presets[template];
        document.getElementById('new-job-name').value = preset.name;
        
        if (preset.kind === 'every') {
          scheduleType.value = 'every';
          cronGroup.style.display = 'none';
          intervalGroup.style.display = 'block';
          document.getElementById('new-job-interval').value = preset.interval || 3600000;
        } else {
          scheduleType.value = 'cron';
          cronGroup.style.display = 'block';
          intervalGroup.style.display = 'none';
          document.getElementById('new-job-cron').value = preset.expr || '';
        }
      });
    });
    
    // Schedule type toggle
    scheduleType.addEventListener('change', (e) => {
      if (e.target.value === 'every') {
        cronGroup.style.display = 'none';
        intervalGroup.style.display = 'block';
      } else {
        cronGroup.style.display = 'block';
        intervalGroup.style.display = 'none';
      }
    });
    
    // Confirm button
    confirmBtn.addEventListener('click', () => this.createJob());
    
    modal.classList.add('active');
  }
  
  // Close modal
  closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    this.selectedJob = null;
  }
  
  // Create new job
  createJob() {
    const name = document.getElementById('new-job-name').value.trim();
    if (!name) {
      alert('Please enter a job name');
      return;
    }
    
    const scheduleType = document.getElementById('new-job-schedule-type').value;
    const enabled = document.getElementById('new-job-enabled').checked;
    
    let schedule;
    if (scheduleType === 'cron') {
      const expr = document.getElementById('new-job-cron').value.trim();
      if (!expr) {
        alert('Please enter a cron expression');
        return;
      }
      schedule = { kind: 'cron', expr };
    } else {
      const interval = parseInt(document.getElementById('new-job-interval').value);
      if (!interval || interval < 60000) {
        alert('Interval must be at least 60 seconds');
        return;
      }
      schedule = { kind: 'every', everyMs: interval };
    }
    
    const newJob = {
      id: `cron-${Date.now().toString(36)}`,
      name,
      enabled,
      schedule,
      state: {
        lastStatus: null,
        lastRunAtMs: null,
        nextRunAtMs: Date.now() + (schedule.everyMs || 3600000),
        runningAtMs: null
      }
    };
    
    this.jobs.push(newJob);
    this.renderJobs();
    this.closeModal('cron-add-modal');
    
    // Flash success
    this.showNotification('Cron job created successfully!');
  }
  
  // Save job changes
  saveJobChanges() {
    if (!this.selectedJob) return;
    
    const name = document.getElementById('edit-job-name').value.trim();
    const enabled = document.getElementById('edit-job-enabled').checked;
    
    this.selectedJob.name = name || this.selectedJob.name;
    this.selectedJob.enabled = enabled;
    
    this.renderJobs();
    this.closeModal('cron-edit-modal');
    this.showNotification('Changes saved!');
  }
  
  // Delete job
  deleteJob(jobId) {
    if (confirm('Are you sure you want to delete this cron job?')) {
      this.jobs = this.jobs.filter(j => j.id !== jobId);
      this.renderJobs();
      this.closeModal('cron-edit-modal');
      this.showNotification('Cron job deleted');
    }
  }
  
  // Run job now
  async runJobNow(jobId) {
    const job = this.jobs.find(j => j.id === jobId);
    if (!job) return;
    
    job.state.runningAtMs = Date.now();
    this.renderJobs();
    
    // Simulate running
    setTimeout(() => {
      job.state.runningAtMs = null;
      job.state.lastRunAtMs = Date.now();
      job.state.lastStatus = Math.random() > 0.1 ? 'ok' : 'error';
      this.renderJobs();
    }, 2000);
    
    this.closeModal('cron-edit-modal');
    this.showNotification('Job triggered!');
  }
  
  // Show notification
  showNotification(message) {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--bg-secondary, #1a1a24);
      color: var(--text-primary, #f3f4f6);
      padding: 1rem 1.5rem;
      border-radius: 8px;
      border: 1px solid var(--border-color, #2a2a3a);
      z-index: 2000;
      animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
  
  // Start refresh timer
  startRefreshTimer() {
    this.refreshTimer = setInterval(() => {
      this.updateCurrentTime();
      // Optionally reload jobs from server
      // this.loadJobs();
    }, this.options.refreshInterval);
    
    // Update time line every minute
    setInterval(() => this.updateCurrentTime(), 60000);
  }
  
  // Attach event listeners
  attachEventListeners() {
    // Refresh button
    document.getElementById('cron-refresh')?.addEventListener('click', () => {
      this.loadJobs();
    });
    
    // Add new button
    document.getElementById('cron-add-new')?.addEventListener('click', () => {
      this.openAddModal();
    });
    
    // Job row clicks (delegation)
    document.getElementById('jobs-list')?.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action="edit"]');
      if (target) {
        const row = target.closest('.job-row');
        if (row) {
          this.openEditModal(row.dataset.jobId);
        }
      }
    });
    
    // Close modals on overlay click
    ['cron-edit-modal', 'cron-add-modal'].forEach(id => {
      const modal = document.getElementById(id);
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            this.closeModal(id);
          }
        });
      }
    });
    
    // Modal close buttons
    document.getElementById('modal-close')?.addEventListener('click', () => {
      this.closeModal('cron-edit-modal');
    });
    
    document.getElementById('add-modal-close')?.addEventListener('click', () => {
      this.closeModal('cron-add-modal');
    });
    
    document.getElementById('add-cancel')?.addEventListener('click', () => {
      this.closeModal('cron-add-modal');
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal('cron-edit-modal');
        this.closeModal('cron-add-modal');
      }
      if (e.key === 'r' && e.metaKey) {
        e.preventDefault();
        this.loadJobs();
      }
    });
    
    // Visibility change - update on focus
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.updateCurrentTime();
      }
    });
  }
  
  // Destroy component
  destroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    this.container.innerHTML = '';
  }
}

// Auto-initialize if data-auto-init attribute present
document.addEventListener('DOMContentLoaded', () => {
  const autoInit = document.querySelector('[data-cron-calendar]');
  if (autoInit) {
    window.cronCalendar = new CronCalendar(autoInit.id, {
      compact: autoInit.dataset.compact === 'true'
    });
  }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CronCalendar;
}
