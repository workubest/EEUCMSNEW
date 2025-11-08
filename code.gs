// Complete Google Apps Script Backend for Ethiopian Electric Utility
// Updated for your specific Google Sheet structure
// Spreadsheet ID: 1wHZT8vXoAjQwRUHGNKbvKaYW_Eo0517tvUh-zg8RxVM

const CONFIG = {
  SHEET_ID: '1wHZT8vXoAjQwRUHGNKbvKaYW_Eo0517tvUh-zg8RxVM',
  DRIVE_FOLDER_ID: PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID') || '1AMbkns9nonfAnEMYRxkyqhbmA2YBXfIM',
  JWT_SECRET: PropertiesService.getScriptProperties().getProperty('JWT_SECRET') || 'eeu-complaint-jwt-secret-2025-enhanced',
  API_KEY: PropertiesService.getScriptProperties().getProperty('API_KEY') || 'eeu-complaint-api-key-2025',
  VERSION: '3.2.2',
  MAX_LOGIN_ATTEMPTS: 5,
  SESSION_DURATION: 24 * 60 * 60 * 1000,
  PAGINATION_LIMIT: 1000,
  RATE_LIMIT_WINDOW_MS: 60000,
  RATE_LIMIT_MAX_REQUESTS: 100,
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, x-client-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json',
  'X-API-Version': CONFIG.VERSION
};

// App roles enum
const APP_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager', 
  STAFF: 'staff',
  CUSTOMER: 'customer'
};

// Rate limiting storage
const rateLimitStore = {};

// ========== UTILITY FUNCTIONS ==========

function generateId() {
  return Utilities.getUuid();
}

function getCurrentTimestamp() {
  return new Date().toISOString();
}

function hashPassword(password) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8)
    .map(byte => (byte + 256).toString(16).slice(-2)).join('');
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

function generateJWT(payload) {
  const header = Utilities.base64Encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }), Utilities.Charset.UTF_8);
  const payloadEncoded = Utilities.base64Encode(JSON.stringify(payload), Utilities.Charset.UTF_8);
  const signature = Utilities.base64Encode(Utilities.computeHmacSha256Signature(header + '.' + payloadEncoded, CONFIG.JWT_SECRET));
  return header + '.' + payloadEncoded + '.' + signature;
}

function verifyJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const signature = Utilities.base64Encode(Utilities.computeHmacSha256Signature(parts[0] + '.' + parts[1], CONFIG.JWT_SECRET));
    if (signature !== parts[2]) return null;
    
    const payload = JSON.parse(Utilities.newBlob(Utilities.base64Decode(parts[1])).getDataAsString());
    
    if (payload.exp && Date.now() > payload.exp) return null;
    
    return payload;
  } catch (e) {
    return null;
  }
}

// ========== DATABASE OPERATIONS ==========

function getSheet(sheetName) {
  const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`Sheet '${sheetName}' not found. Please ensure it exists and is correctly named.`);
  }
  return sheet;
}

function getSheetData(sheetName, filters = {}) {
  const sheet = getSheet(sheetName);

  const data = sheet.getDataRange().getValues();
  if (data.length === 0) return [];

  // Use actual headers from the sheet
  const headers = data[0];
  Logger.log(`Headers for ${sheetName}:`, headers);

  let result = data.slice(1);

  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined && filters[key] !== '') {
      const headerIndex = headers.indexOf(key);
      if (headerIndex !== -1) {
        result = result.filter(row => row[headerIndex] == filters[key]);
      }
    }
  });

  result = result.map((row, index) => {
    const obj = { _row: index + 2 };
    headers.forEach((header, colIndex) => {
      obj[header] = row[colIndex] || '';
    });
    return obj;
  });

  return result;
}

function insertRecord(sheetName, record) {
  const sheet = getSheet(sheetName);
  if (!sheet) {
    throw new Error(`Sheet ${sheetName} not found`);
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowData = headers.map(header => record[header] !== undefined ? record[header] : '');
  sheet.appendRow(rowData);
  return record;
}

function updateRecord(sheetName, record) {
  const sheet = getSheet(sheetName);
  if (!sheet) {
    throw new Error(`Sheet ${sheetName} not found`);
  }
  
  const data = sheet.getDataRange().getValues();
  if (data.length === 0) {
    throw new Error('No data in sheet');
  }
  
  const headers = data[0];
  let idIndex = headers.indexOf('ID');
  if (idIndex === -1) {
    idIndex = headers.findIndex(h => h.toLowerCase() === 'id');
  }
  
  if (idIndex === -1) {
    throw new Error(`ID column not found in sheet ${sheetName}`);
  }
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === record.ID) {
      const rowData = headers.map(header => record[header] !== undefined ? record[header] : data[i][headers.indexOf(header)]);
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([rowData]);
      return record;
    }
  }
  throw new Error('Record not found');
}

// ========== SIMPLIFIED SEED DATA FUNCTIONS ==========

function seedAllData() {
  try {
    console.log('Starting data seeding...');
    
    // First, ensure sheets exist with correct headers
    initializeSheets();
    
    // Then seed data
    seedProfiles();
    seedUserRoles();
    seedComplaints();
    seedComplaintHistory();
    seedSystemSettings();
    
    console.log('All seed data inserted successfully!');
    return {
      success: true,
      message: 'Data seeding completed successfully'
    };
    
  } catch (error) {
    console.error('Error seeding data:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

function initializeSheets() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  
  const sheetsConfig = [
    {
      name: 'Profiles',
      headers: ['ID', 'Email', 'Full Name', 'Name', 'Phone', 'Region', 'Service Center', 'Active', 'PasswordHash', 'Created At', 'Updated At', 'Last Login']
    },
    {
      name: 'User_Roles',
      headers: ['ID', 'User ID', 'Role']
    },
    {
      name: 'Complaints',
      headers: ['ID', 'Ticket Number', 'Customer ID', 'Customer Name', 'Customer Phone', 'Customer Email', 'Customer Address', 'Contract Account Number', 'Business Partner Number', 'Category', 'Priority', 'Status', 'Title', 'Description', 'Region', 'Service Center', 'Assigned To', 'Notes', 'Created At', 'Updated At', 'Resolved At']
    },
    {
      name: 'Complaint_History',
      headers: ['ID', 'Complaint ID', 'User ID', 'User Name', 'Action', 'Old Value', 'New Value', 'Notes', 'Created At']
    },
    {
      name: 'Complaint_Attachments',
      headers: ['ID', 'Complaint ID', 'File Name', 'File Path', 'File Type', 'File Size', 'Uploaded By', 'Uploaded At']
    },
    {
      name: 'Notifications',
      headers: ['ID', 'User ID', 'Type', 'Title', 'Message', 'Read', 'Related ID', 'Created At']
    },
    {
      name: 'System_Settings',
      headers: ['ID', 'Key', 'Value', 'Updated At', 'Updated By']
    },
    {
      name: 'System_Logs',
      headers: ['Timestamp', 'Action', 'User ID', 'User Email', 'Details', 'IP Address', 'User Agent']
    }
  ];
  
  sheetsConfig.forEach(sheetConfig => {
    let sheet = ss.getSheetByName(sheetConfig.name);
    if (!sheet) {
      sheet = ss.insertSheet(sheetConfig.name);
      console.log(`Created sheet: ${sheetConfig.name}`);
    }
    
    // Set headers if sheet is empty or headers don't match
    const currentData = sheet.getDataRange().getValues();
    if (currentData.length === 0 || !arraysEqual(currentData[0], sheetConfig.headers)) {
      sheet.clear();
      sheet.getRange(1, 1, 1, sheetConfig.headers.length).setValues([sheetConfig.headers]);
      sheet.getRange(1, 1, 1, sheetConfig.headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
      console.log(`Set headers for: ${sheetConfig.name}`);
    }
  });
  
  return 'Sheets initialized successfully';
}

function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
}

function seedProfiles() {
  const profileSheet = getSheet('Profiles');
  if (profileSheet.getLastRow() > 1) {
    console.log('Profiles sheet already contains data, skipping seeding.');
    return;
  }
  const profiles = [
    // Admin users
    {
      'ID': 'a1b2c3d4-1234-5678-9abc-123456789001',
      'Email': 'admin@eeu.com',
      'Full Name': 'System Administrator',
      'Name': 'Admin',
      'Phone': '+251-911-123456',
      'Region': 'Addis Ababa',
      'Service Center': 'Head Office',
      'Active': true,
      'PasswordHash': hashPassword('admin123'),
      'Created At': '2024-01-01T08:00:00.000Z',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Last Login': '2024-01-12T08:00:00.000Z'
    },
    {
      'ID': 'a1b2c3d4-1234-5678-9abc-123456789002',
      'Email': 'manager@eeu.com',
      'Full Name': 'Operations Manager',
      'Name': 'Manager',
      'Phone': '+251-911-123457',
      'Region': 'Addis Ababa',
      'Service Center': 'Head Office',
      'Active': true,
      'PasswordHash': hashPassword('manager123'),
      'Created At': '2024-01-01T08:00:00.000Z',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Last Login': '2024-01-12T08:30:00.000Z'
    },
    // Staff users
    {
      'ID': 'a1b2c3d4-1234-5678-9abc-123456789003',
      'Email': 'staff1@eeu.com',
      'Full Name': 'Abebe Kebede',
      'Name': 'Abebe',
      'Phone': '+251-911-123458',
      'Region': 'Addis Ababa',
      'Service Center': 'Bole Service Center',
      'Active': true,
      'PasswordHash': hashPassword('staff123'),
      'Created At': '2024-01-01T08:00:00.000Z',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Last Login': '2024-01-12T09:00:00.000Z'
    },
    {
      'ID': 'a1b2c3d4-1234-5678-9abc-123456789005',
      'Email': 'staff2@eeu.com',
      'Full Name': 'Meron Getachew',
      'Name': 'Meron',
      'Phone': '+251-911-123459',
      'Region': 'Addis Ababa',
      'Service Center': 'Megenagna Service Center',
      'Active': true,
      'PasswordHash': hashPassword('staff123'),
      'Created At': '2024-01-01T08:00:00.000Z',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Last Login': '2024-01-12T09:15:00.000Z'
    }
  ];
  
  let insertedCount = 0;
  profiles.forEach(profile => {
    try {
      insertRecord('Profiles', profile);
      insertedCount++;
    } catch (error) {
      console.error(`Error inserting profile ${profile.Email}:`, error);
    }
  });
  console.log(`Inserted ${insertedCount} profiles`);
  return insertedCount;
}

function seedUserRoles() {
  const userRoleSheet = getSheet('User_Roles');
  if (userRoleSheet.getLastRow() > 1) {
    console.log('User_Roles sheet already contains data, skipping seeding.');
    return;
  }
  const userRoles = [
    { 'ID': generateId(), 'User ID': 'a1b2c3d4-1234-5678-9abc-123456789001', 'Role': 'admin' },
    { 'ID': generateId(), 'User ID': 'a1b2c3d4-1234-5678-9abc-123456789002', 'Role': 'manager' },
    { 'ID': generateId(), 'User ID': 'a1b2c3d4-1234-5678-9abc-123456789003', 'Role': 'staff' },
    { 'ID': generateId(), 'User ID': 'a1b2c3d4-1234-5678-9abc-123456789005', 'Role': 'staff' }
  ];
  
  let insertedCount = 0;
  userRoles.forEach(role => {
    try {
      insertRecord('User_Roles', role);
      insertedCount++;
    } catch (error) {
      console.error(`Error inserting user role:`, error);
    }
  });
  console.log(`Inserted ${insertedCount} user roles`);
  return insertedCount;
}

function seedComplaints() {
  const complaintSheet = getSheet('Complaints');
  if (complaintSheet.getLastRow() > 1) {
    console.log('Complaints sheet already contains data, skipping seeding.');
    return;
  }
  const complaints = [
    {
      'ID': 'c1d2e3f4-1234-5678-9abc-123456789001',
      'Ticket Number': 'TKT-2024-001',
      'Customer ID': 'a1b2c3d4-1234-5678-9abc-123456789001',
      'Customer Name': 'System Administrator',
      'Customer Phone': '+251-911-123456',
      'Customer Email': 'admin@eeu.com',
      'Customer Address': 'Bole, Addis Ababa',
      'Contract Account Number': 'ACC-00123456',
      'Business Partner Number': 'BP-987654321',
      'Category': 'billing',
      'Priority': 'high',
      'Status': 'open',
      'Title': 'Incorrect billing amount',
      'Description': 'I received a bill for 2,500 Birr but my actual consumption should be around 1,200 Birr. There seems to be a meter reading error.',
      'Region': 'Addis Ababa',
      'Service Center': 'Bole Service Center',
      'Assigned To': 'a1b2c3d4-1234-5678-9abc-123456789003',
      'Notes': 'Customer claims meter reading is incorrect. Need to verify meter reading and billing calculation.',
      'Created At': '2024-01-10T09:15:00.000Z',
      'Updated At': '2024-01-10T09:15:00.000Z',
      'Resolved At': ''
    },
    {
      'ID': 'c1d2e3f4-1234-5678-9abc-123456789002',
      'Ticket Number': 'TKT-2024-002',
      'Customer ID': 'a1b2c3d4-1234-5678-9abc-123456789002',
      'Customer Name': 'Operations Manager',
      'Customer Phone': '+251-911-123457',
      'Customer Email': 'manager@eeu.com',
      'Customer Address': 'Megenagna, Addis Ababa',
      'Contract Account Number': 'ACC-00123457',
      'Business Partner Number': 'BP-987654322',
      'Category': 'power_outage',
      'Priority': 'high',
      'Status': 'in_progress',
      'Title': 'No power for 24 hours',
      'Description': 'Our area has been without electricity for more than 24 hours. This is affecting our business operations.',
      'Region': 'Addis Ababa',
      'Service Center': 'Megenagna Service Center',
      'Assigned To': 'a1b2c3d4-1234-5678-9abc-123456789005',
      'Notes': 'Technical team dispatched to investigate transformer issue in Megenagna area.',
      'Created At': '2024-01-10T10:30:00.000Z',
      'Updated At': '2024-01-11T08:45:00.000Z',
      'Resolved At': ''
    }
  ];
  
  let insertedCount = 0;
  complaints.forEach(complaint => {
    try {
      insertRecord('Complaints', complaint);
      insertedCount++;
    } catch (error) {
      console.error(`Error inserting complaint ${complaint['Ticket Number']}:`, error);
    }
  });
  console.log(`Inserted ${insertedCount} complaints`);
  return insertedCount;
}

function seedComplaintHistory() {
  const complaintHistorySheet = getSheet('Complaint_History');
  if (complaintHistorySheet.getLastRow() > 1) {
    console.log('Complaint_History sheet already contains data, skipping seeding.');
    return;
  }
  const complaintHistory = [
    {
      'ID': generateId(),
      'Complaint ID': 'c1d2e3f4-1234-5678-9abc-123456789001',
      'User ID': 'a1b2c3d4-1234-5678-9abc-123456789001',
      'User Name': 'System Administrator',
      'Action': 'created',
      'Old Value': '',
      'New Value': 'open',
      'Notes': 'Complaint created',
      'Created At': '2024-01-10T09:15:00.000Z'
    },
    {
      'ID': generateId(),
      'Complaint ID': 'c1d2e3f4-1234-5678-9abc-123456789001',
      'User ID': 'a1b2c3d4-1234-5678-9abc-123456789003',
      'User Name': 'Abebe Kebede',
      'Action': 'assigned',
      'Old Value': '',
      'New Value': 'a1b2c3d4-1234-5678-9abc-123456789003',
      'Notes': 'Complaint assigned to Abebe Kebede',
      'Created At': '2024-01-10T09:30:00.000Z'
    }
  ];
  
  let insertedCount = 0;
  complaintHistory.forEach(history => {
    try {
      insertRecord('Complaint_History', history);
      insertedCount++;
    } catch (error) {
      console.error(`Error inserting complaint history:`, error);
    }
  });
  console.log(`Inserted ${insertedCount} complaint history records`);
  return insertedCount;
}

function seedSystemSettings() {
  const systemSettingsSheet = getSheet('System_Settings');
  if (systemSettingsSheet.getLastRow() > 1) {
    console.log('System_Settings sheet already contains data, skipping seeding.');
    return;
  }
  const settings = [
    {
      'ID': generateId(),
      'Key': 'system_name',
      'Value': 'Ethiopian Electric Utility - Complaint Management System',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Updated By': 'a1b2c3d4-1234-5678-9abc-123456789001'
    },
    {
      'ID': generateId(),
      'Key': 'system_version',
      'Value': '3.2.2',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Updated By': 'a1b2c3d4-1234-5678-9abc-123456789001'
    },
    {
      'ID': generateId(),
      'Key': 'maintenance_mode',
      'Value': 'false',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Updated By': 'a1b2c3d4-1234-5678-9abc-123456789001'
    }
  ];
  
  let insertedCount = 0;
  settings.forEach(setting => {
    try {
      insertRecord('System_Settings', setting);
      insertedCount++;
    } catch (error) {
      console.error(`Error inserting system setting ${setting.Key}:`, error);
    }
  });
  console.log(`Inserted ${insertedCount} system settings`);
  return insertedCount;
}

// ========== MAIN API FUNCTIONS ==========

function doOptions(e) {
  const response = ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.JSON);

  // CORS headers are handled by the proxy server, not GAS directly
  // GAS setHeader() method is not available in all environments

  return response;
}

function handleRequest(e) {
  // This function will handle both GET and POST requests
  if (!e) {
    // This case should ideally not be reached in a web app context
    return createResponse({ error: 'Request event object is missing.' }, 500);
  }

  try {
    const isPost = e.postData && e.postData.contents;

    let path, action, data;

    if (isPost) {
      // It's a POST request
      const requestData = JSON.parse(e.postData.contents);
      Logger.log('Incoming POST request:', requestData);
      path = requestData.path;
      action = requestData.action;
      data = requestData.data;
    } else {
      // It's a GET request
      Logger.log('Incoming GET request:', e.parameter);
      path = e.pathInfo || (e.parameter ? e.parameter.path : undefined);
      action = e.parameter ? e.parameter.action || 'get' : 'get';
      data = e.parameters;
    }
    return routeRequest(path, action, data, e);
  } catch (error) {
    console.error('Error in handleRequest:', error);
    return createResponse({ error: `Failed to handle request: ${error.message}` }, 400);
  }
}

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function routeRequest(path, action, data, e) {
  try {
    Logger.log(`Routing request: path=${path}, action=${action}`);

    // Normalize path by removing leading slash
    const normalizedPath = path && path.startsWith('/') ? path.substring(1) : path;

    switch (normalizedPath) {
      case 'auth/login':
        return handleLogin(data);
      
      case 'complaints':
        if (action === 'get') return handleGetComplaints(data);
        if (action === 'create') return handleCreateComplaint(data);
        if (action === 'update') return handleUpdateComplaint(data);
        if (action === 'delete') return handleDeleteComplaint(data);
        break;

      case 'users':
        if (action === 'get') return handleGetUsers(data);
        if (action === 'create') return handleCreateUser(data);
        if (action === 'update') return handleUpdateUser(data);
        if (action === 'delete') return handleDeleteUser(data);
        break;
      
      case 'users/manage':
        if (action === 'get') return handleGetUsers(data);
        if (action === 'update') return handleUpdateUser(data);
        if (action === 'delete') return handleDeleteUser(data);
        break;

      case 'users/export':
        if (action === 'export') return handleExportUsers(data);
        break;

      case 'seed-data':
        return createResponse(seedAllData());

      case 'initialize-sheets':
        return createResponse({ success: true, message: initializeSheets() });

      case 'activities':
        if (action === 'get') return handleGetActivities(data);
        break;

      case 'test-connection':
        return createResponse({
          success: true,
          message: 'Connected to Google Apps Script',
          timestamp: getCurrentTimestamp(),
          sheetId: CONFIG.SHEET_ID
        });

      default:
        // Handle dynamic paths like /complaints/{id}
        if (normalizedPath && normalizedPath.startsWith('complaints/')) {
          const parts = normalizedPath.split('/');
          const complaintId = parts[1];
          if (parts.length === 2) {
            if (action === 'get') return handleGetComplaintById(complaintId);
            if (action === 'update') return handleUpdateComplaint({ ...data, ID: complaintId });
            if (action === 'delete') return handleDeleteComplaint({ ...data, ID: complaintId });
          } else if (parts.length === 3 && parts[2] === 'attachments') {
            if (action === 'get') return handleGetAttachments(complaintId);
            if (action === 'upload') return handleUploadAttachment({ ...data, complaintId });
          }
        }
        if (normalizedPath && normalizedPath.startsWith('attachments/')) {
          const parts = normalizedPath.split('/');
          const attachmentId = parts[1];
          if (parts.length === 3 && parts[2] === 'download') {
            if (action === 'download') return handleDownloadAttachment(attachmentId);
          } else if (parts.length === 2) {
            if (action === 'delete') return handleDeleteAttachment(attachmentId);
          }
        }
        break;
    }

    return createResponse({ error: `Path not found or action not supported: ${path}` }, 404);

  } catch (error) {
    console.error(`Error routing request for path "${path}":`, error.message, error.stack);
    return createResponse({ error: `An error occurred while processing the request: ${error.message}` }, 500);
  }
}

function handleLogin(loginData) {
  const { email, password } = loginData;
  
  if (!email || !password) {
    return createResponse({ error: 'Email and password are required' }, 400);
  }
  
  // For demo purposes, use hardcoded admin credentials
  if (email === 'admin@eeu.com' && password === 'admin123') {
    const tokenPayload = {
      userId: 'a1b2c3d4-1234-5678-9abc-123456789001',
      email: email,
      role: 'admin',
      exp: Date.now() + CONFIG.SESSION_DURATION
    };
    
    const token = generateJWT(tokenPayload);
    
    return createResponse({
      success: true,
      user: {
        id: 'a1b2c3d4-1234-5678-9abc-123456789001',
        email: email,
        name: 'Admin',
        full_name: 'System Administrator',
        role: 'admin',
        region: 'Addis Ababa',
        service_center: 'Head Office'
      },
      token: token
    });
  }
  
  return createResponse({ error: 'Invalid email or password' }, 401);
}

function handleGetComplaints(filters = {}) {
  try {
    const complaints = getSheetData('Complaints', filters);
    return createResponse({
      success: true,
      data: complaints,
      count: complaints.length
    });
  } catch (error) {
    console.error('Error getting complaints:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function handleCreateComplaint(complaintData) {
  try {
    const complaint = {
      'ID': generateId(),
      'Ticket Number': generateTicketNumber(),
      'Customer ID': complaintData.customer_id || '',
      'Customer Name': complaintData.customer_name || '',
      'Customer Phone': complaintData.customer_phone || '',
      'Customer Email': complaintData.customer_email || '',
      'Customer Address': complaintData.customer_address || '',
      'Contract Account Number': complaintData.contract_account_number || '',
      'Business Partner Number': complaintData.business_partner_number || '',
      'Category': complaintData.category || 'general',
      'Priority': complaintData.priority || 'medium',
      'Status': 'open',
      'Title': complaintData.title || '',
      'Description': complaintData.description || '',
      'Region': complaintData.region || '',
      'Service Center': complaintData.service_center || '',
      'Assigned To': complaintData.assigned_to || '',
      'Notes': complaintData.notes || '',
      'Created At': getCurrentTimestamp(),
      'Updated At': getCurrentTimestamp(),
      'Resolved At': ''
    };

    insertRecord('Complaints', complaint);

    // Add to complaint history
    const historyRecord = {
      'ID': generateId(),
      'Complaint ID': complaint.ID,
      'User ID': complaintData.user_id || '',
      'User Name': complaintData.user_name || '',
      'Action': 'created',
      'Old Value': '',
      'New Value': 'open',
      'Notes': 'Complaint created',
      'Created At': getCurrentTimestamp()
    };

    insertRecord('Complaint_History', historyRecord);

    return createResponse({
      success: true,
      data: complaint,
      message: 'Complaint created successfully'
    });
  } catch (error) {
    console.error('Error creating complaint:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function handleUpdateComplaint(complaintData) {
  try {
    const { ID, user_id, user_name, ...updatedFields } = complaintData;

    if (!ID) {
      throw new Error('Complaint ID is required for update');
    }

    const existingComplaints = getSheetData('Complaints', { ID: ID });
    if (existingComplaints.length === 0) {
      throw new Error('Complaint not found');
    }
    const existingComplaint = existingComplaints[0];

    const complaint = {
      ...existingComplaint,
      ...updatedFields,
      'Updated At': getCurrentTimestamp()
    };

    updateRecord('Complaints', complaint);

    // Add to complaint history
    const historyRecord = {
      'ID': generateId(),
      'Complaint ID': complaint.ID,
      'User ID': user_id || '',
      'User Name': user_name || '',
      'Action': 'updated',
      'Old Value': JSON.stringify(existingComplaint),
      'New Value': JSON.stringify(complaint),
      'Notes': 'Complaint updated',
      'Created At': getCurrentTimestamp()
    };

    insertRecord('Complaint_History', historyRecord);

    return createResponse({
      success: true,
      message: 'Complaint updated successfully'
    });
  } catch (error) {
    console.error('Error updating complaint:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function handleGetComplaintById(complaintId) {
  try {
    if (!complaintId) {
      throw new Error('Complaint ID is required');
    }

    const complaints = getSheetData('Complaints', { ID: complaintId });
    if (complaints.length === 0) {
      throw new Error('Complaint not found');
    }

    const complaint = complaints[0];

    // Convert to frontend expected format
    const formattedComplaint = {
      id: complaint.ID,
      ticketNumber: complaint['Ticket Number'],
      customerId: complaint['Customer ID'],
      customerName: complaint['Customer Name'],
      customerPhone: complaint['Customer Phone'],
      customerEmail: complaint['Customer Email'],
      customerAddress: complaint['Customer Address'],
      contractAccountNumber: complaint['Contract Account Number'],
      businessPartnerNumber: complaint['Business Partner Number'],
      category: complaint.Category,
      priority: complaint.Priority,
      status: complaint.Status,
      title: complaint.Title,
      description: complaint.Description,
      region: complaint.Region,
      serviceCenter: complaint['Service Center'],
      assignedTo: complaint['Assigned To'],
      notes: complaint.Notes,
      createdAt: complaint['Created At'],
      updatedAt: complaint['Updated At'],
      resolvedAt: complaint['Resolved At']
    };

    return createResponse({
      success: true,
      data: formattedComplaint
    });
  } catch (error) {
    console.error('Error getting complaint by ID:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function handleDeleteComplaint(complaintData) {
  try {
    const { ID, user_id, user_name } = complaintData;

    if (!ID) {
      throw new Error('Complaint ID is required for deletion');
    }

    const complaintSheet = getSheet('Complaints');
    const complaintDataRange = complaintSheet.getDataRange().getValues();
    const complaintHeaders = complaintDataRange[0];
    const complaintIdIndex = complaintHeaders.indexOf('ID');

    let rowIndexToDelete = -1;
    let deletedComplaint = null;

    for (let i = 1; i < complaintDataRange.length; i++) {
      if (complaintDataRange[i][complaintIdIndex] === ID) {
        rowIndexToDelete = i + 1;
        deletedComplaint = {};
        complaintHeaders.forEach((header, colIndex) => {
          deletedComplaint[header] = complaintDataRange[i][colIndex];
        });
        break;
      }
    }

    if (rowIndexToDelete === -1) {
      throw new Error('Complaint not found');
    }

    complaintSheet.deleteRow(rowIndexToDelete);

    // Add to complaint history
    const historyRecord = {
      'ID': generateId(),
      'Complaint ID': ID,
      'User ID': user_id || '',
      'User Name': user_name || '',
      'Action': 'deleted',
      'Old Value': JSON.stringify(deletedComplaint),
      'New Value': '',
      'Notes': 'Complaint deleted',
      'Created At': getCurrentTimestamp()
    };

    insertRecord('Complaint_History', historyRecord);

    return createResponse({
      success: true,
      message: 'Complaint deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function generateTicketNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  // Get count of complaints for today
  const todayComplaints = getSheetData('Complaints').filter(c => {
    const createdDate = new Date(c['Created At']);
    return createdDate.toDateString() === now.toDateString();
  });

  const sequence = String(todayComplaints.length + 1).padStart(3, '0');
  return `TKT-${year}-${month}${day}-${sequence}`;
}

function handleGetUsers(filters = {}) {
  try {
    const profiles = getSheetData('Profiles', filters);
    const userRoles = getSheetData('User_Roles');

    if (!Array.isArray(profiles) || !Array.isArray(userRoles)) {
      throw new Error('Failed to retrieve data from one or more sheets.');
    }

    const users = profiles.map((profile, index) => {
      try {
        if (!profile || typeof profile !== 'object') {
          throw new Error(`Profile at index ${index} is not a valid object.`);
        }

        const roleRecord = userRoles.find(role => role && typeof role === 'object' && role['User ID'] === profile.ID);
        
        const user = {
          id: profile.ID,
          email: profile.Email,
          name: profile['Full Name'] || profile.Name,
          role: roleRecord && roleRecord.Role ? roleRecord.Role : 'staff',
          region: profile.Region,
          serviceCenter: profile['Service Center'],
          active: profile.Active === true || String(profile.Active).toLowerCase() === 'true',
          createdAt: profile['Created At']
        };
        return user;
      } catch (innerError) {
        // Throw a new error that includes information about the problematic profile
        throw new Error(`Error processing profile at index ${index}: ${innerError.message}. Profile data: ${JSON.stringify(profile)}`);
      }
    });

    const responseData = {
      success: true,
      data: users.filter(Boolean),
      count: users.filter(Boolean).length
    };

    return createResponse(responseData);
  } catch (error) {
    console.error('Error in handleGetUsers:', error.message, error.stack);
    // Make sure the error message is detailed in the response
    return createResponse({ error: 'An internal error occurred while fetching users: ' + error.message }, 500);
  }
}

function handleCreateUser(userData) {
  try {
    const userId = generateId();

    // Create profile record
    const profile = {
      'ID': userId,
      'Email': userData.email,
      'Full Name': userData.name,
      'Name': userData.name.split(' ')[0],
      'Phone': userData.phone || '',
      'Region': userData.region || '',
      'Service Center': userData.serviceCenter || '',
      'Active': userData.active !== false,
      'PasswordHash': hashPassword(userData.password),
      'Created At': getCurrentTimestamp(),
      'Updated At': getCurrentTimestamp(),
      'Last Login': ''
    };

    insertRecord('Profiles', profile);

    // Create user role record
    const userRole = {
      'ID': generateId(),
      'User ID': userId,
      'Role': userData.role || 'staff'
    };

    insertRecord('User_Roles', userRole);

    return createResponse({
      success: true,
      data: {
        id: userId,
        email: profile.Email,
        name: profile['Full Name'],
        role: userRole.Role,
        region: profile.Region,
        serviceCenter: profile['Service Center'],
        active: profile.Active
      },
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function handleUpdateUser(userData) {
  try {
    const { userId, name, role, region, serviceCenter, active } = userData;

    // Update profile
    const profile = {
      'ID': userId,
      'Full Name': name,
      'Region': region || '',
      'Service Center': serviceCenter || '',
      'Active': active !== false,
      'Updated At': getCurrentTimestamp()
    };

    updateRecord('Profiles', profile);

    // Update role if provided
    if (role) {
      const userRoles = getSheetData('User_Roles');
      const existingRole = userRoles.find(r => r['User ID'] === userId);

      if (existingRole) {
        updateRecord('User_Roles', {
          'ID': existingRole.ID,
          'User ID': userId,
          'Role': role
        });
      } else {
        // Create new role record
        const userRole = {
          'ID': generateId(),
          'User ID': userId,
          'Role': role
        };
        insertRecord('User_Roles', userRole);
      }
    }

    return createResponse({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function handleDeleteUser(userData) {
  try {
    const { userId } = userData;

    // Get sheet references
    const profileSheet = getSheet('Profiles');
    const roleSheet = getSheet('User_Roles');

    // Delete from profiles
    const profileData = profileSheet.getDataRange().getValues();
    const profileHeaders = profileData[0];
    const profileIdIndex = profileHeaders.indexOf('ID');

    for (let i = 1; i < profileData.length; i++) {
      if (profileData[i][profileIdIndex] === userId) {
        profileSheet.deleteRow(i + 1);
        break;
      }
    }

    // Delete from user roles
    const roleData = roleSheet.getDataRange().getValues();
    const roleHeaders = roleData[0];
    const roleUserIdIndex = roleHeaders.indexOf('User ID');

    for (let i = 1; i < roleData.length; i++) {
      if (roleData[i][roleUserIdIndex] === userId) {
        roleSheet.deleteRow(i + 1);
        break;
      }
    }

    return createResponse({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function handleExportUsers(filters = {}) {
  try {
    const users = getSheetData('Profiles', filters);

    // Format for export
    const exportData = users.map(user => ({
      'ID': user.ID,
      'Email': user.Email,
      'Full Name': user['Full Name'],
      'Role': 'staff', // Default role, could be enhanced to join with User_Roles
      'Region': user.Region,
      'Service Center': user['Service Center'],
      'Active': user.Active,
      'Created At': user['Created At']
    }));

    return createResponse({
      success: true,
      data: exportData,
      count: exportData.length
    });
  } catch (error) {
    console.error('Error exporting users:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function handleGetActivities(filters = {}) {
  try {
    const activities = getSheetData('Complaint_History', filters);

    // Format activities for frontend
    const formattedActivities = activities.map(activity => ({
      id: activity.ID,
      action: activity.Action,
      userName: activity['User Name'] || 'Unknown',
      createdAt: activity['Created At'],
      ticketNumber: activity['Complaint ID'] ? `TKT-${activity['Complaint ID'].slice(-4)}` : null
    }));

    return createResponse({
      success: true,
      data: formattedActivities,
      count: formattedActivities.length
    });
  } catch (error) {
    console.error('Error getting activities:', error);
    return createResponse({ error: error.message }, 500);
  }
}

// ========== ATTACHMENT FUNCTIONS ==========

function handleGetAttachments(complaintId) {
  try {
    if (!complaintId) {
      throw new Error('Complaint ID is required');
    }

    const attachments = getSheetData('Complaint_Attachments', { 'Complaint ID': complaintId });

    // Format attachments for frontend
    const formattedAttachments = attachments.map(attachment => ({
      id: attachment.ID,
      complaintId: attachment['Complaint ID'],
      fileName: attachment['File Name'],
      filePath: attachment['File Path'],
      fileType: attachment['File Type'],
      fileSize: attachment['File Size'],
      uploadedBy: attachment['Uploaded By'],
      uploadedByName: attachment['Uploaded By'] || 'Unknown',
      createdAt: attachment['Uploaded At']
    }));

    return createResponse({
      success: true,
      data: formattedAttachments,
      count: formattedAttachments.length
    });
  } catch (error) {
    console.error('Error getting attachments:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function handleUploadAttachment(attachmentData) {
  try {
    const { complaintId, fileName, fileData, fileType, fileSize, uploadedBy, uploadedByName } = attachmentData;

    if (!complaintId || !fileName || !fileData) {
      throw new Error('Complaint ID, file name, and file data are required');
    }

    // Decode base64 file data
    const decodedData = Utilities.base64Decode(fileData);

    // Get or create Drive folder
    const folder = getOrCreateDriveFolder();

    // Create file in Drive
    const file = folder.createFile(Utilities.newBlob(decodedData, fileType, fileName));
    const fileId = file.getId();
    const fileUrl = file.getUrl();

    // Save attachment metadata to sheet
    const attachment = {
      'ID': generateId(),
      'Complaint ID': complaintId,
      'File Name': fileName,
      'File Path': fileUrl,
      'File Type': fileType,
      'File Size': fileSize || decodedData.length,
      'Uploaded By': uploadedBy || '',
      'Uploaded At': getCurrentTimestamp()
    };

    insertRecord('Complaint_Attachments', attachment);

    return createResponse({
      success: true,
      data: {
        id: attachment.ID,
        complaintId: attachment['Complaint ID'],
        fileName: attachment['File Name'],
        filePath: attachment['File Path'],
        fileType: attachment['File Type'],
        fileSize: attachment['File Size'],
        uploadedBy: attachment['Uploaded By'],
        uploadedByName: uploadedByName || 'Unknown',
        createdAt: attachment['Uploaded At']
      },
      message: 'Attachment uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function handleDownloadAttachment(attachmentId) {
  try {
    if (!attachmentId) {
      throw new Error('Attachment ID is required');
    }

    const attachments = getSheetData('Complaint_Attachments', { ID: attachmentId });
    if (attachments.length === 0) {
      throw new Error('Attachment not found');
    }

    const attachment = attachments[0];
    const fileUrl = attachment['File Path'];

    // Extract file ID from Google Drive URL
    const fileIdMatch = fileUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!fileIdMatch) {
      throw new Error('Invalid file URL');
    }

    const fileId = fileIdMatch[1];
    const file = DriveApp.getFileById(fileId);

    // Return file content
    const contentType = file.getMimeType();
    const fileName = file.getName();

    return ContentService
      .createTextOutput()
      .setMimeType(contentType)
      .append(file.getBlob().getBytes())
      .setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

  } catch (error) {
    console.error('Error downloading attachment:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function handleDeleteAttachment(attachmentId) {
  try {
    if (!attachmentId) {
      throw new Error('Attachment ID is required');
    }

    const attachments = getSheetData('Complaint_Attachments', { ID: attachmentId });
    if (attachments.length === 0) {
      throw new Error('Attachment not found');
    }

    const attachment = attachments[0];
    const fileUrl = attachment['File Path'];

    // Delete file from Drive
    try {
      const fileIdMatch = fileUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (fileIdMatch) {
        const fileId = fileIdMatch[1];
        DriveApp.getFileById(fileId).setTrashed(true);
      }
    } catch (driveError) {
      console.warn('Could not delete file from Drive:', driveError);
    }

    // Delete record from sheet
    const sheet = getSheet('Complaint_Attachments');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('ID');

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] === attachmentId) {
        sheet.deleteRow(i + 1);
        break;
      }
    }

    return createResponse({
      success: true,
      message: 'Attachment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function getOrCreateDriveFolder() {
  const folderId = CONFIG.DRIVE_FOLDER_ID;
  let folder;

  if (folderId) {
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch (e) {
      console.log('Folder ID not found, creating new folder');
    }
  }

  if (!folder) {
    folder = DriveApp.createFolder('EEU Complaint Attachments');
    // Update the script properties with the new folder ID
    PropertiesService.getScriptProperties().setProperty('DRIVE_FOLDER_ID', folder.getId());
  }

  return folder;
}

function createResponse(data, statusCode = 200) {
  const response = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);

  // CORS headers are handled by the proxy server, not GAS directly
  // GAS setHeader() method is not available in all environments

  return response;
}

// ========== DEPLOYMENT FUNCTIONS ==========

function testConnection() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheets = ss.getSheets();
    const sheetNames = sheets.map(sheet => sheet.getName());
    
    return {
      success: true,
      message: 'Successfully connected to Google Sheet',
      sheetCount: sheets.length,
      sheetNames: sheetNames,
      timestamp: getCurrentTimestamp()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: getCurrentTimestamp()
    };
  }
}

function initializeWithSeedData() {
  const result = seedAllData();
  return result;
}

// Create menu for easy access
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('⚡ EEU System')
    .addItem('Initialize Sheets', 'initializeSheets')
    .addItem('Seed Data', 'seedAllData')
    .addItem('Test Connection', 'testConnection')
    .addToUi();
}

// Quick test function
function quickTest() {
  console.log('Running quick test...');
  
  // Test connection
  const connectionTest = testConnection();
  console.log('Connection test:', connectionTest);
  
  // Initialize sheets
  const initResult = initializeSheets();
  console.log('Sheets initialization:', initResult);
  
  // Seed minimal data
  const seedResult = seedAllData();
  console.log('Seed data result:', seedResult);
  
  return {
    connection: connectionTest,
    initialization: initResult,
    seeding: seedResult
  };
}