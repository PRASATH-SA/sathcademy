import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const testConnection = async () => {
  const uri = process.env.MONGODB_URI;
  
  console.log('Testing connection string...');
  console.log('Raw URI:', uri);
  console.log('URI format check:', {
    startsWithCorrect: uri?.startsWith('mongodb+srv://') || uri?.startsWith('mongodb://'),
    hasUsername: uri?.includes('://') ? uri.split('://')[1]?.split(':')[0] : 'no',
    hasAtSymbol: uri?.includes('@'),
    hasHostname: uri?.includes('.mongodb.net') || uri?.includes('.mlab.com') || uri?.includes('localhost'),
    length: uri?.length
  });

  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connection successful!');
    console.log('Database:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.error('💡 TIP: Check your cluster hostname - it should be something like cluster0.abcde.mongodb.net');
    } else if (error.message.includes('Authentication failed')) {
      console.error('💡 TIP: Check your username and password - make sure special chars are URL encoded');
    }
  }
};

testConnection();