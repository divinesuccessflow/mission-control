/**
 * Google Apps Script for Command Center
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Form
 * 2. Click "Responses" tab → Click green Sheets icon → Create spreadsheet
 * 3. In the spreadsheet, go to Extensions → Apps Script
 * 4. Delete any existing code and paste this entire file
 * 5. Click "Deploy" → "New Deployment" → "Web app"
 * 6. Execute as: "Me", Who has access: "Anyone"
 * 7. Copy the Web App URL
 * 8. Add the URL to your Command Center campaign settings
 * 
 * This script will automatically send new form submissions to Command Center
 */

// ============ CONFIGURATION ============
// Paste your Command Center webhook URL here (or use localStorage in browser)
const COMMAND_CENTER_WEBHOOK = ''; // Leave empty if using browser-based sync

// Map your Google Form fields to lead fields
// Adjust these based on your actual form field names
const FIELD_MAPPING = {
  'Name': 'name',
  'Full Name': 'name',
  'Email': 'email',
  'Email Address': 'email',
  'Phone': 'phone',
  'Phone Number': 'phone',
  'Message': 'notes',
  'How did you hear about us?': 'source'
};

// ============ TRIGGER SETUP ============
/**
 * Run this function ONCE to set up the form submission trigger
 */
function setupTrigger() {
  // Remove any existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  // Create new trigger for form submissions
  ScriptApp.newTrigger('onFormSubmit')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onFormSubmit()
    .create();
  
  Logger.log('Trigger created successfully!');
}

// ============ FORM SUBMISSION HANDLER ============
/**
 * Automatically called when a new form is submitted
 */
function onFormSubmit(e) {
  try {
    const sheet = e.source.getActiveSheet();
    const row = e.range.getRow();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const values = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Build lead object
    const lead = {
      id: 'L' + Date.now(),
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      stage: 'new',
      source: 'Form'
    };
    
    // Map form fields to lead fields
    headers.forEach((header, index) => {
      const mappedField = FIELD_MAPPING[header] || header.toLowerCase().replace(/\s+/g, '_');
      if (values[index]) {
        lead[mappedField] = values[index];
      }
    });
    
    // Log the lead for debugging
    Logger.log('New lead: ' + JSON.stringify(lead));
    
    // If webhook is configured, send to Command Center
    if (COMMAND_CENTER_WEBHOOK) {
      sendToCommandCenter(lead);
    }
    
    // Add a status column to track sync
    addSyncStatus(sheet, row, 'Synced');
    
    return lead;
  } catch (error) {
    Logger.log('Error processing form submission: ' + error);
    return null;
  }
}

// ============ WEBHOOK SENDER ============
/**
 * Send lead data to Command Center webhook
 */
function sendToCommandCenter(lead) {
  if (!COMMAND_CENTER_WEBHOOK) return;
  
  try {
    const options = {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(lead),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(COMMAND_CENTER_WEBHOOK, options);
    Logger.log('Webhook response: ' + response.getContentText());
    return true;
  } catch (error) {
    Logger.log('Webhook error: ' + error);
    return false;
  }
}

// ============ SYNC STATUS ============
/**
 * Add/update sync status column
 */
function addSyncStatus(sheet, row, status) {
  // Find or create "Sync Status" column
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  let statusCol = headers.indexOf('Sync Status');
  
  if (statusCol === -1) {
    statusCol = sheet.getLastColumn() + 1;
    sheet.getRange(1, statusCol).setValue('Sync Status');
  } else {
    statusCol += 1; // Convert to 1-based index
  }
  
  sheet.getRange(row, statusCol).setValue(status + ' - ' + new Date().toLocaleString());
}

// ============ MANUAL SYNC ============
/**
 * Manually sync all leads from the sheet
 * Run this to do a bulk export
 */
function syncAllLeads() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const leads = [];
  
  for (let i = 1; i < data.length; i++) {
    const lead = {
      id: 'L' + Date.now() + i,
      timestamp: new Date().toISOString(),
      stage: 'new',
      source: 'Form'
    };
    
    headers.forEach((header, index) => {
      const mappedField = FIELD_MAPPING[header] || header.toLowerCase().replace(/\s+/g, '_');
      if (data[i][index]) {
        lead[mappedField] = data[i][index];
      }
    });
    
    // Try to extract date from Timestamp column if exists
    const timestampCol = headers.indexOf('Timestamp');
    if (timestampCol !== -1 && data[i][timestampCol]) {
      const date = new Date(data[i][timestampCol]);
      lead.date = date.toISOString().split('T')[0];
    } else {
      lead.date = new Date().toISOString().split('T')[0];
    }
    
    leads.push(lead);
    addSyncStatus(sheet, i + 1, 'Synced');
  }
  
  Logger.log('Total leads: ' + leads.length);
  Logger.log('Leads JSON: ' + JSON.stringify(leads));
  
  // Create a new sheet with JSON output for easy copy
  let outputSheet = SpreadsheetApp.getActive().getSheetByName('Command Center Export');
  if (!outputSheet) {
    outputSheet = SpreadsheetApp.getActive().insertSheet('Command Center Export');
  }
  outputSheet.clear();
  outputSheet.getRange(1, 1).setValue('Copy this JSON to Command Center:');
  outputSheet.getRange(2, 1).setValue(JSON.stringify(leads, null, 2));
  
  SpreadsheetApp.getUi().alert(
    'Export Complete',
    `${leads.length} leads exported.\n\nCheck the "Command Center Export" sheet for JSON data you can paste into Command Center.`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
  
  return leads;
}

// ============ API ENDPOINT ============
/**
 * Web app endpoint for external access
 * Deploy as web app to get leads via API
 */
function doGet(e) {
  const action = e.parameter.action || 'getLeads';
  
  if (action === 'getLeads') {
    const leads = syncAllLeads();
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, leads: leads }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({ error: 'Unknown action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  // Handle incoming webhooks (if needed for two-way sync)
  try {
    const data = JSON.parse(e.postData.contents);
    Logger.log('Received data: ' + JSON.stringify(data));
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============ MENU ============
/**
 * Add custom menu to spreadsheet
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Command Center')
    .addItem('Setup Trigger', 'setupTrigger')
    .addItem('Sync All Leads', 'syncAllLeads')
    .addSeparator()
    .addItem('View Logs', 'viewLogs')
    .addToUi();
}

function viewLogs() {
  const logs = Logger.getLog();
  SpreadsheetApp.getUi().alert('Recent Logs', logs || 'No logs available', SpreadsheetApp.getUi().ButtonSet.OK);
}
