// Integration test example for database operations
const mongoose = require('mongoose');

describe('Database Integration', () => {
  describe('MongoDB Connection', () => {
    test('should be connected to test database', () => {
      expect(mongoose.connection.readyState).toBe(1); // 1 = connected
    });

    test('should use in-memory database', () => {
      const dbName = mongoose.connection.db.databaseName;
      expect(dbName).toMatch(/test/i);
    });
  });

  describe('Basic Operations', () => {
    test('should create and retrieve a test document', async () => {
      // Define a simple test schema
      const TestSchema = new mongoose.Schema({
        name: String,
        value: Number,
        createdAt: { type: Date, default: Date.now }
      });

      // Create model (will be cleaned up after test)
      const TestModel = mongoose.model('IntegrationTest', TestSchema);

      // Create a test document
      const testDoc = new TestModel({
        name: 'test-document',
        value: 42
      });

      const savedDoc = await testDoc.save();
      expect(savedDoc._id).toBeDefined();
      expect(savedDoc.name).toBe('test-document');
      expect(savedDoc.value).toBe(42);

      // Retrieve the document
      const foundDoc = await TestModel.findById(savedDoc._id);
      expect(foundDoc).toBeTruthy();
      expect(foundDoc.name).toBe('test-document');
    });

    test('should handle database operations with proper cleanup', async () => {
      // Define another test schema
      const CleanupSchema = new mongoose.Schema({
        title: String,
        count: Number
      });

      const CleanupModel = mongoose.model('CleanupTest', CleanupSchema);

      // Create multiple documents
      await CleanupModel.create([
        { title: 'doc1', count: 1 },
        { title: 'doc2', count: 2 },
        { title: 'doc3', count: 3 }
      ]);

      // Verify they exist
      const docs = await CleanupModel.find();
      expect(docs).toHaveLength(3);

      // Database will be cleaned up automatically between tests
    });
  });

  describe('Environment Configuration', () => {
    test('should have test environment configured', () => {
      expect(process.env.NODE_ENV).toBe('test');
      expect(process.env.MONGODB_URI).toBeDefined();
      expect(process.env.MONGODB_URI).toContain('127.0.0.1');
    });
  });
});