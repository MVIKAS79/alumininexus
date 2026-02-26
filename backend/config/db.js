const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    console.log(`   URI: ${process.env.MONGODB_URI?.replace(/\/\/.*@/, '//***@')}`);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000, // Timeout after 15 seconds
      connectTimeoutMS: 15000,
    });

    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('');
    console.error('💡 To fix this, either:');
    console.error('   1. Install & start MongoDB locally: https://www.mongodb.com/try/download/community');
    console.error('   2. Use MongoDB Atlas (free): https://www.mongodb.com/cloud/atlas');
    console.error('      Then update MONGODB_URI in backend/.env');
    console.error('');
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

module.exports = connectDB;
