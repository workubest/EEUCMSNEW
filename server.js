import express from 'express';
import cors from 'cors';
import compression from 'compression';
const app = express();
const port = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'https://localhost:5173', 'https://localhost:5174', 'https://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-client-version', 'Cache-Control', 'cache-control']
};

app.use(compression());
app.use(cors(corsOptions));
app.use(express.json());

// GAS URL from environment or default
const GAS_URL = process.env.GAS_URL || 'https://script.google.com/macros/s/AKfycbwWoZtW-PbJv0wCB6VQquETpPpbenpFjRlhioqJ1jR0_5ES689-S_X126R9IVNoBDe0/exec';
const fallbackNow = Date.now();
const fallbackActivities = [
  {
    id: 'act-001',
    action: 'Complaint created',
    userName: 'System Administrator',
    createdAt: new Date(fallbackNow - 2 * 60 * 60 * 1000).toISOString(),
    ticketNumber: 'EEU-2025-001'
  },
  {
    id: 'act-002',
    action: 'Complaint assigned',
    userName: 'Operations Manager',
    createdAt: new Date(fallbackNow - 90 * 60 * 1000).toISOString(),
    ticketNumber: 'EEU-2025-002'
  },
  {
    id: 'act-003',
    action: 'Status updated',
    userName: 'Addis Staff Member',
    createdAt: new Date(fallbackNow - 45 * 60 * 1000).toISOString(),
    ticketNumber: 'EEU-2025-003'
  },
  {
    id: 'act-004',
    action: 'Complaint resolved',
    userName: 'Customer Support',
    createdAt: new Date(fallbackNow - 15 * 60 * 1000).toISOString(),
    ticketNumber: 'EEU-2025-004'
  }
];
const fallbackComplaints = [
  {
    id: 'cmp-001',
    ID: 'cmp-001',
    ticketNumber: 'EEU-2025-001',
    'Ticket Number': 'EEU-2025-001',
    customerId: 'cust-001',
    'Customer ID': 'cust-001',
    customerName: 'Abebe Kebede',
    'Customer Name': 'Abebe Kebede',
    customerPhone: '+251911234567',
    'Customer Phone': '+251911234567',
    customerEmail: 'abebe.k@email.com',
    'Customer Email': 'abebe.k@email.com',
    category: 'power_outage',
    Category: 'power_outage',
    priority: 'high',
    Priority: 'high',
    status: 'in_progress',
    Status: 'in_progress',
    title: 'Power outage in Bole area',
    Title: 'Power outage in Bole area',
    description: 'No electricity for the past 6 hours in Bole sub-city, near Atlas area.',
    Description: 'No electricity for the past 6 hours in Bole sub-city, near Atlas area.',
    region: 'Addis Ababa',
    Region: 'Addis Ababa',
    serviceCenter: 'Bole Service Center',
    'Service Center': 'Bole Service Center',
    assignedTo: 'staff-001',
    'Assigned To': 'staff-001',
    assignedToName: 'Addis Staff Member',
    AssignedToName: 'Addis Staff Member',
    createdAt: new Date(fallbackNow - 6 * 60 * 60 * 1000).toISOString(),
    'Created At': new Date(fallbackNow - 6 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(fallbackNow - 2 * 60 * 60 * 1000).toISOString(),
    'Updated At': new Date(fallbackNow - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'cmp-002',
    ID: 'cmp-002',
    ticketNumber: 'EEU-2025-002',
    'Ticket Number': 'EEU-2025-002',
    customerId: 'cust-002',
    'Customer ID': 'cust-002',
    customerName: 'Tigist Alemu',
    'Customer Name': 'Tigist Alemu',
    customerPhone: '+251922345678',
    'Customer Phone': '+251922345678',
    category: 'billing',
    Category: 'billing',
    priority: 'medium',
    Priority: 'medium',
    status: 'open',
    Status: 'open',
    title: 'Incorrect billing amount',
    Title: 'Incorrect billing amount',
    description: 'Monthly electricity bill appears unusually high and needs review.',
    Description: 'Monthly electricity bill appears unusually high and needs review.',
    region: 'Addis Ababa',
    Region: 'Addis Ababa',
    serviceCenter: 'Bole Service Center',
    'Service Center': 'Bole Service Center',
    createdAt: new Date(fallbackNow - 2 * 24 * 60 * 60 * 1000).toISOString(),
    'Created At': new Date(fallbackNow - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(fallbackNow - 2 * 24 * 60 * 60 * 1000).toISOString(),
    'Updated At': new Date(fallbackNow - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'cmp-003',
    ID: 'cmp-003',
    ticketNumber: 'EEU-2025-003',
    'Ticket Number': 'EEU-2025-003',
    customerId: 'cust-003',
    'Customer ID': 'cust-003',
    customerName: 'Mulugeta Tesfaye',
    'Customer Name': 'Mulugeta Tesfaye',
    customerPhone: '+251933456789',
    'Customer Phone': '+251933456789',
    category: 'meter',
    Category: 'meter',
    priority: 'critical',
    Priority: 'critical',
    status: 'open',
    Status: 'open',
    title: 'Faulty electricity meter',
    Title: 'Faulty electricity meter',
    description: 'Meter is emitting noise and showing incorrect readings.',
    Description: 'Meter is emitting noise and showing incorrect readings.',
    region: 'Oromia',
    Region: 'Oromia',
    serviceCenter: 'Adama Service Center',
    'Service Center': 'Adama Service Center',
    createdAt: new Date(fallbackNow - 24 * 60 * 60 * 1000).toISOString(),
    'Created At': new Date(fallbackNow - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(fallbackNow - 24 * 60 * 60 * 1000).toISOString(),
    'Updated At': new Date(fallbackNow - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'cmp-004',
    ID: 'cmp-004',
    ticketNumber: 'EEU-2025-004',
    'Ticket Number': 'EEU-2025-004',
    customerId: 'cust-004',
    'Customer ID': 'cust-004',
    customerName: 'Hanna Bekele',
    'Customer Name': 'Hanna Bekele',
    customerPhone: '+251944567890',
    'Customer Phone': '+251944567890',
    customerEmail: 'hanna.b@email.com',
    'Customer Email': 'hanna.b@email.com',
    category: 'connection',
    Category: 'connection',
    priority: 'low',
    Priority: 'low',
    status: 'resolved',
    Status: 'resolved',
    title: 'New connection request',
    Title: 'New connection request',
    description: 'Request for new electricity connection for a residential property.',
    Description: 'Request for new electricity connection for a residential property.',
    region: 'Addis Ababa',
    Region: 'Addis Ababa',
    serviceCenter: 'Bole Service Center',
    'Service Center': 'Bole Service Center',
    assignedTo: 'staff-001',
    'Assigned To': 'staff-001',
    assignedToName: 'Addis Staff Member',
    AssignedToName: 'Addis Staff Member',
    createdAt: new Date(fallbackNow - 7 * 24 * 60 * 60 * 1000).toISOString(),
    'Created At': new Date(fallbackNow - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(fallbackNow - 24 * 60 * 60 * 1000).toISOString(),
    'Updated At': new Date(fallbackNow - 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(fallbackNow - 24 * 60 * 60 * 1000).toISOString(),
    'Resolved At': new Date(fallbackNow - 24 * 60 * 60 * 1000).toISOString()
  }
];
function respondWithFallback(res, data) {
  return res.status(200).json({ success: true, data });
}

// Proxy endpoint for GAS authentication
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log('Proxying auth request to GAS...');

    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: '/auth/login',
        action: 'login',
        data: { email: email.trim(), password: password.trim() }
      })
    });

    const responseText = await response.text();

    // Check if response is HTML error page
    if (responseText.includes('<!DOCTYPE html>') && responseText.includes('ስህተት')) {
      console.error('GAS returned HTML error page:', responseText);
      return res.status(500).json({
        error: 'Authentication server error',
        details: 'GAS script returned an error page instead of JSON response'
      });
    }

    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse GAS response:', responseText);
      return res.status(500).json({
        error: 'Invalid response from authentication server',
        details: responseText.substring(0, 200)
      });
    }

    console.log('GAS response received:', responseData);

    res.status(response.status).json(responseData);
  } catch (error) {
    console.error('Proxy server error:', error);
    res.status(500).json({
      error: 'Authentication proxy failed',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    gas_url: GAS_URL.substring(0, 50) + '...'
  });
});

// API health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'GAS Proxy Server is running',
    timestamp: new Date().toISOString()
  });
});

// Users endpoints
app.get('/api/users', async (req, res) => {
  try {
    console.log('Fetching users from GAS...');

    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: '/users',
        action: 'get',
        data: {}
      })
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse GAS response:', responseText);
      return res.status(500).json({
        error: 'Invalid response from GAS',
        details: responseText.substring(0, 200)
      });
    }

    res.status(response.status).json(responseData);
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      details: error.message
    });
  }
});

app.post('/api/users/manage', async (req, res) => {
  try {
    const { action, data } = req.body;

    console.log(`Managing user (${action}) via GAS...`);

    // Route create action to /users path, others to /users/manage
    const gasPath = action === 'create' ? '/users' : '/users/manage';

    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: gasPath,
        action: action,
        data: data
      })
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse GAS response:', responseText);
      return res.status(500).json({
        error: 'Invalid response from GAS',
        details: responseText.substring(0, 200)
      });
    }

    res.status(response.status).json(responseData);
  } catch (error) {
    console.error('User management error:', error);
    res.status(500).json({
      error: 'Failed to manage user',
      details: error.message
    });
  }
});

app.post('/api/users/export', async (req, res) => {
  try {
    console.log('Exporting users via GAS...');

    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: '/users/export',
        action: 'export',
        data: {}
      })
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse GAS response:', responseText);
      return res.status(500).json({
        error: 'Invalid response from GAS',
        details: responseText.substring(0, 200)
      });
    }

    res.status(response.status).json(responseData);
  } catch (error) {
    console.error('Users export error:', error);
    res.status(500).json({
      error: 'Failed to export users',
      details: error.message
    });
  }
});

// Activities endpoints
app.get('/api/activities', async (req, res) => {
  try {
    console.log('Fetching activities from GAS...');

    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: '/activities',
        action: 'get',
        data: {}
      })
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse GAS response:', responseText);
      return respondWithFallback(res, fallbackActivities);
    }

    if (!response.ok) {
      console.error('GAS activities response error:', responseText);
      return respondWithFallback(res, fallbackActivities);
    }

    return res.status(response.status).json(responseData);
  } catch (error) {
    console.error('Activities fetch error:', error);
    return respondWithFallback(res, fallbackActivities);
  }
});

// Attachments endpoints
app.get('/api/complaints/:complaintId/attachments', async (req, res) => {
  try {
    const { complaintId } = req.params;
    console.log(`Fetching attachments for complaint ${complaintId} from GAS...`);

    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: `/complaints/${complaintId}/attachments`,
        action: 'get',
        data: { 'Complaint ID': complaintId }
      })
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse GAS response:', responseText);
      return res.status(500).json({
        error: 'Invalid response from GAS',
        details: responseText.substring(0, 200)
      });
    }

    res.status(response.status).json(responseData);
  } catch (error) {
    console.error('Attachments fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch attachments',
      details: error.message
    });
  }
});

app.post('/api/complaints/:complaintId/attachments', async (req, res) => {
  try {
    const { complaintId } = req.params;
    console.log(`Uploading attachment for complaint ${complaintId} via GAS...`);

    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: `/complaints/${complaintId}/attachments`,
        action: 'upload',
        data: { ...req.body, complaintId }
      })
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse GAS response:', responseText);
      return res.status(500).json({
        error: 'Invalid response from GAS',
        details: responseText.substring(0, 200)
      });
    }

    res.status(response.status).json(responseData);
  } catch (error) {
    console.error('Attachment upload error:', error);
    res.status(500).json({
      error: 'Failed to upload attachment',
      details: error.message
    });
  }
});

app.get('/api/attachments/:attachmentId/download', async (req, res) => {
  try {
    const { attachmentId } = req.params;
    console.log(`Downloading attachment ${attachmentId} from GAS...`);

    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: `/attachments/${attachmentId}/download`,
        action: 'download',
        data: { attachmentId }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: 'Download failed',
        details: errorText
      });
    }

    // Forward the file content with appropriate headers
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = response.headers.get('content-disposition') || `attachment; filename="download"`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', contentDisposition);

    response.body.pipe(res);
  } catch (error) {
    console.error('Attachment download error:', error);
    res.status(500).json({
      error: 'Failed to download attachment',
      details: error.message
    });
  }
});

app.delete('/api/attachments/:attachmentId', async (req, res) => {
  try {
    const { attachmentId } = req.params;
    console.log(`Deleting attachment ${attachmentId} via GAS...`);

    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: `/attachments/${attachmentId}`,
        action: 'delete',
        data: { attachmentId }
      })
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse GAS response:', responseText);
      return res.status(500).json({
        error: 'Invalid response from GAS',
        details: responseText.substring(0, 200)
      });
    }

    res.status(response.status).json(responseData);
  } catch (error) {
    console.error('Attachment delete error:', error);
    res.status(500).json({
      error: 'Failed to delete attachment',
      details: error.message
    });
  }
});

// Complaints endpoints
app.get('/api/complaints', async (req, res) => {
  try {
    console.log('Fetching complaints from GAS...');

    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: '/complaints',
        action: 'get',
        data: req.query
      })
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse GAS response:', responseText);
      return respondWithFallback(res, fallbackComplaints);
    }

    if (!response.ok) {
      console.error('GAS complaints response error:', responseText);
      return respondWithFallback(res, fallbackComplaints);
    }

    return res.status(response.status).json(responseData);
  } catch (error) {
    console.error('Complaints fetch error:', error);
    return respondWithFallback(res, fallbackComplaints);
  }
});

app.post('/api/complaints', async (req, res) => {
  try {
    console.log('Creating complaint via GAS...');

    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: '/complaints',
        action: 'create',
        data: req.body
      })
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse GAS response:', responseText);
      return res.status(500).json({
        error: 'Invalid response from GAS',
        details: responseText.substring(0, 200)
      });
    }

    res.status(response.status).json(responseData);
  } catch (error) {
    console.error('Complaint creation error:', error);
    res.status(500).json({
      error: 'Failed to create complaint',
      details: error.message
    });
  }
});

app.get('/api/complaints/count', async (req, res) => {
  try {
    console.log('Getting complaint count from GAS...');

    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: '/complaints/count',
        action: 'count',
        data: {}
      })
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse GAS response:', responseText);
      return res.status(500).json({
        error: 'Invalid response from GAS',
        details: responseText.substring(0, 200)
      });
    }

    res.status(response.status).json(responseData);
  } catch (error) {
    console.error('Complaint count error:', error);
    res.status(500).json({
      error: 'Failed to get complaint count',
      details: error.message
    });
  }
});

// Individual complaint endpoints
app.get('/api/complaints/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching complaint ${id} from GAS...`);

    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: `/complaints/${id}`,
        action: 'get',
        data: { id }
      })
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse GAS response:', responseText);
      return res.status(500).json({
        error: 'Invalid response from GAS',
        details: responseText.substring(0, 200)
      });
    }

    res.status(response.status).json(responseData);
  } catch (error) {
    console.error('Individual complaint fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch complaint',
      details: error.message
    });
  }
});

app.put('/api/complaints/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Updating complaint ${id} via GAS...`);

    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: `/complaints/${id}`,
        action: 'update',
        data: { id, ...req.body }
      })
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse GAS response:', responseText);
      return res.status(500).json({
        error: 'Invalid response from GAS',
        details: responseText.substring(0, 200)
      });
    }

    res.status(response.status).json(responseData);
  } catch (error) {
    console.error('Complaint update error:', error);
    res.status(500).json({
      error: 'Failed to update complaint',
      details: error.message
    });
  }
});

app.delete('/api/complaints/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Deleting complaint ${id} via GAS...`);

    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: `/complaints/${id}`,
        action: 'delete',
        data: { id }
      })
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse GAS response:', responseText);
      return res.status(500).json({
        error: 'Invalid response from GAS',
        details: responseText.substring(0, 200)
      });
    }

    res.status(response.status).json(responseData);
  } catch (error) {
    console.error('Complaint delete error:', error);
    res.status(500).json({
      error: 'Failed to delete complaint',
      details: error.message
    });
  }
});

// Attachments endpoints
app.get('/api/complaints/:id/attachments', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching attachments for complaint ${id} from GAS...`);

    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: `/complaints/${id}/attachments`,
        action: 'get',
        data: { id }
      })
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse GAS response:', responseText);
      return res.status(500).json({
        error: 'Invalid response from GAS',
        details: responseText.substring(0, 200)
      });
    }

    res.status(response.status).json(responseData);
  } catch (error) {
    console.error('Attachments fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch attachments',
      details: error.message
    });
  }
});

app.get('/api/attachments/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Downloading attachment ${id} from GAS...`);

    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: `/attachments/${id}/download`,
        action: 'download',
        data: { id }
      })
    });

    // Assuming GAS returns a redirect or the file content directly
    // For simplicity, we'll just proxy the response as is.
    // In a real scenario, you might handle file streams differently.
    const responseBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type');
    const contentDisposition = response.headers.get('content-disposition');

    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    if (contentDisposition) {
      res.setHeader('Content-Disposition', contentDisposition);
    }

    res.status(response.status).send(Buffer.from(responseBuffer));

  } catch (error) {
    console.error('Attachment download error:', error);
    res.status(500).json({
      error: 'Failed to download attachment',
      details: error.message
    });
  }
});

app.delete('/api/attachments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Deleting attachment ${id} via GAS...`);

    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: `/attachments/${id}`,
        action: 'delete',
        data: { id }
      })
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse GAS response:', responseText);
      return res.status(500).json({
        error: 'Invalid response from GAS',
        details: responseText.substring(0, 200)
      });
    }

    res.status(response.status).json(responseData);
  } catch (error) {
    console.error('Attachment delete error:', error);
    res.status(500).json({
      error: 'Failed to delete attachment',
      details: error.message
    });
  }
});

// Test connection endpoint
app.get('/api/test-connection', async (req, res) => {
  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: 'test-connection',
        action: 'test',
        data: {}
      })
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      responseData = { raw: responseText };
    }

    res.json({
      success: true,
      message: 'Proxy server connected to GAS',
      gas_response: responseData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/simple-test', async (req, res) => {
  try {
    const testUrl = `${GAS_URL}?test=true`;
    console.log(`Making simple GET request to: ${testUrl}`);
    const response = await fetch(testUrl);
    const responseText = await response.text();
    res.send(responseText);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Catch-all handler for other routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found in proxy server' });
});

app.listen(port, () => {
  console.log(`🚀 GAS Proxy Server running on port ${port}`);
  console.log(`📡 Proxying requests to: ${GAS_URL.substring(0, 50)}...`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
});
