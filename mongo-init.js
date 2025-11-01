// MongoDB initialization script for Elite Dangerous Mining Data
db = db.getSiblingDB('elite_mining');

// Create collections with validation schemas
db.createCollection('mining_sites', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['systemName', 'siteType', 'source'],
      properties: {
        systemName: { bsonType: 'string' },
        bodyName: { bsonType: 'string' },
        siteType: { 
          bsonType: 'string',
          enum: ['asteroid_belt', 'planetary_ring', 'hotspot', 'res_site']
        },
        materialType: {
          bsonType: 'string',
          enum: ['metallic', 'metal_rich', 'rocky', 'icy', 'pristine_metallic']
        },
        hotspotMaterials: { bsonType: 'array' },
        coordinates: {
          bsonType: 'object',
          properties: {
            type: { enum: ['Point'] },
            coordinates: {
              bsonType: 'array',
              minItems: 3,
              maxItems: 3
            }
          }
        },
        source: { bsonType: 'string' }
      }
    }
  }
});

db.createCollection('commodity_prices', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['commodityName', 'stationName', 'systemName', 'source'],
      properties: {
        commodityName: { bsonType: 'string' },
        stationName: { bsonType: 'string' },
        systemName: { bsonType: 'string' },
        prices: {
          bsonType: 'object',
          properties: {
            buy: { bsonType: 'number', minimum: 0 },
            sell: { bsonType: 'number', minimum: 0 },
            supply: { bsonType: 'number', minimum: 0 },
            demand: { bsonType: 'number', minimum: 0 }
          }
        },
        source: { bsonType: 'string' }
      }
    }
  }
});

// Create user for the application (if authentication is enabled)
// db.createUser({
//   user: 'elite_mining_user',
//   pwd: 'secure_password_here',
//   roles: [
//     { role: 'readWrite', db: 'elite_mining' },
//     { role: 'dbAdmin', db: 'elite_mining' }
//   ]
// });

print('Elite Dangerous Mining Database initialized successfully');