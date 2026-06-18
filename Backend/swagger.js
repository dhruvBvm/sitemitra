const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Order Management ERP API',
      version: '1.0.0',
      description: 'API documentation for the Order Management ERP application',
      contact: {
        name: 'Developer',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '60d0fe4f5311236168a109ca' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@example.com' },
            role: { type: 'string', enum: ['owner', 'manager', 'staff'], example: 'manager' },
            status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
            phone: { type: 'string', example: '+1234567890' },
          },
        },
        Site: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '60d0fe4f5311236168a109cb' },
            siteName: { type: 'string', example: 'Downtown Skyscraper' },
            siteCode: { type: 'string', example: 'DTS-001' },
            location: { type: 'string', example: '123 Main St, City' },
            managerId: { $ref: '#/components/schemas/User' },
            status: { type: 'string', enum: ['active', 'inactive', 'completed'], example: 'active' },
          },
        },
        Material: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '60d0fe4f5311236168a109cc' },
            materialName: { type: 'string', example: 'Cement Bags (50kg)' },
            unit: { type: 'string', example: 'Bags' },
            category: { type: 'string', example: 'Building Materials' },
            status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
          },
        },
        Request: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '60d0fe4f5311236168a109cd' },
            requestNo: { type: 'string', example: 'REQ-210405-001' },
            siteId: { $ref: '#/components/schemas/Site' },
            staffId: { $ref: '#/components/schemas/User' },
            type: { type: 'string', enum: ['manual', 'photo'], example: 'manual' },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'partially_approved', 'fulfilled'], example: 'pending' },
            materials: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  materialId: { $ref: '#/components/schemas/Material' },
                  materialName: { type: 'string' },
                  requestedQty: { type: 'number', example: 100 },
                  approvedQty: { type: 'number', example: 100 },
                  unit: { type: 'string' },
                },
              },
            },
            notes: { type: 'string', example: 'Need this urgently' },
            photoUrls: { type: 'array', items: { type: 'string' } },
            managerApproval: { $ref: '#/components/schemas/ApprovalHistory' },
            ownerApproval: { $ref: '#/components/schemas/ApprovalHistory' },
          },
        },
        InventoryEntry: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '60d0fe4f5311236168a109ce' },
            entryNo: { type: 'string', example: 'REC-123456' },
            siteId: { $ref: '#/components/schemas/Site' },
            type: { type: 'string', enum: ['received', 'used'], example: 'received' },
            date: { type: 'string', format: 'date', example: '2023-10-01' },
            materials: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  materialId: { $ref: '#/components/schemas/Material' },
                  materialName: { type: 'string' },
                  quantity: { type: 'number', example: 50 },
                  unit: { type: 'string' },
                  price: { type: 'number', example: 10.5 },
                  vendor: { type: 'string' },
                },
              },
            },
            notes: { type: 'string' },
            imageUrls: { type: 'array', items: { type: 'string' } },
            createdBy: { $ref: '#/components/schemas/User' },
            requestId: { type: 'string' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            recipient: { $ref: '#/components/schemas/User' },
            title: { type: 'string', example: 'New Request' },
            message: { type: 'string', example: 'Request REQ-123 needs approval' },
            type: { type: 'string', example: 'request_created' },
            isRead: { type: 'boolean', example: false },
            referenceId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ApprovalHistory: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['pending', 'approved', 'rejected'], example: 'approved' },
            approvedBy: { $ref: '#/components/schemas/User' },
            date: { type: 'string', format: 'date-time' },
            notes: { type: 'string' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./modules/**/*.routes.js'], // Files containing annotations
};

const specs = swaggerJsdoc(options);

module.exports = specs;
