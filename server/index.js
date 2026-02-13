import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

dotenv.config();

const app = express();

// ==================== MIDDLEWARE ====================
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// ==================== DATABASE CONNECTION (Serverless Optimized) ====================
// ==================== DATABASE CONNECTION (Serverless Optimized - FIXED) ====================
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    console.log('Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0, // REMOVE THIS LINE - it's deprecated
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 10, // Add connection pooling
      minPoolSize: 0,
      maxIdleTimeMS: 10000,
      waitQueueTimeoutMS: 5000
    };

    console.log('Connecting to MongoDB...');
    console.log('Connection string:', process.env.MONGODB_URI?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Log safely
    
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 10,
      minPoolSize: 0,
      maxIdleTimeMS: 10000,
      waitQueueTimeoutMS: 5000
    }).then((mongoose) => {
      console.log('✅ Connected to MongoDB successfully');
      console.log('Database host:', mongoose.connection.host);
      console.log('Database name:', mongoose.connection.name);
      return mongoose;
    }).catch(err => {
      console.error('❌ MongoDB connection error details:', {
        name: err.name,
        message: err.message,
        code: err.code,
        codeName: err.codeName
      });
      cached.promise = null;
      throw err;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// ==================== DATABASE MODELS ====================
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  enrolledClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  profilePicture: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

const classSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  instructor: { type: String, required: true },
  type: { type: String, enum: ['live', 'recorded'], required: true },
  videoUrl: { type: String, required: true },
  thumbnail: { type: String, default: 'https://via.placeholder.com/300x200' },
  duration: { type: String, required: true },
  schedule: { 
    type: Date, 
    required: function() { return this.type === 'live'; } 
  },
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
  views: { type: Number, default: 0 },
  category: { type: String, required: true }
}, { timestamps: true });

const Class = mongoose.models.Class || mongoose.model('Class', classSchema);

// ==================== MIDDLEWARE FUNCTIONS ====================
const authenticateToken = async (req, res, next) => {
  try {
    await connectToDatabase();
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
      }
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// ==================== AUTH ROUTES ====================
app.post('/api/auth/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty().trim()
], async (req, res) => {
  try {
    await connectToDatabase();
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ email, password, name, role: 'student' });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

app.post('/api/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    await connectToDatabase();
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    await connectToDatabase();
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== HEALTH CHECK ENDPOINT ====================
app.get('/api/health', async (req, res) => {
  try {
    await connectToDatabase();
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({ 
      status: 'ok', 
      database: dbStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==================== CLASS ROUTES ====================
app.get('/api/classes', authenticateToken, async (req, res) => {
  try {
    await connectToDatabase();
    const { type, category, search } = req.query;
    let query = { isActive: true };

    if (type) query.type = type;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { instructor: { $regex: search, $options: 'i' } }
      ];
    }

    const classes = await Class.find(query)
      .select('-enrolledStudents')
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 50);

    res.json(classes);
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/classes/stats', authenticateToken, async (req, res) => {
  try {
    await connectToDatabase();
    const totalClasses = await Class.countDocuments({ isActive: true });
    const liveClasses = await Class.countDocuments({ type: 'live', isActive: true });
    const recordedClasses = await Class.countDocuments({ type: 'recorded', isActive: true });
    
    const user = await User.findById(req.user.userId);
    const enrolledClasses = user?.enrolledClasses?.length || 0;

    const totalViews = await Class.aggregate([
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]);

    res.json({
      totalClasses,
      liveClasses,
      recordedClasses,
      enrolledClasses,
      totalViews: totalViews[0]?.total || 0
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/classes/:id', authenticateToken, async (req, res) => {
  try {
    await connectToDatabase();
    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }

    classItem.views += 1;
    await classItem.save();

    res.json(classItem);
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/classes/:id/enroll', authenticateToken, async (req, res) => {
  try {
    await connectToDatabase();
    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const user = await User.findById(req.user.userId);
    
    if (!classItem.enrolledStudents.includes(req.user.userId)) {
      classItem.enrolledStudents.push(req.user.userId);
      await classItem.save();
      
      if (!user.enrolledClasses.includes(req.params.id)) {
        user.enrolledClasses.push(req.params.id);
        await user.save();
      }
    }

    res.json({ message: 'Enrolled successfully' });
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/user/classes', authenticateToken, async (req, res) => {
  try {
    await connectToDatabase();
    const user = await User.findById(req.user.userId).populate('enrolledClasses');
    res.json(user?.enrolledClasses || []);
  } catch (error) {
    console.error('Get user classes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== ADMIN ROUTES ====================
app.get('/api/admin/dashboard', authenticateToken, isAdmin, async (req, res) => {
  try {
    await connectToDatabase();
    const totalUsers = await User.countDocuments({ role: 'student' });
    const totalClasses = await Class.countDocuments();
    const liveClasses = await Class.countDocuments({ type: 'live', isActive: true });
    
    const totalViews = await Class.aggregate([
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]);

    const recentUsers = await User.find({ role: 'student' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('-password');

    const popularClasses = await Class.find()
      .sort({ views: -1 })
      .limit(5)
      .select('title views enrolledStudents');

    const categoryStats = await Class.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    res.json({
      stats: {
        totalUsers,
        totalClasses,
        liveClasses,
        totalViews: totalViews[0]?.total || 0
      },
      recentUsers,
      popularClasses,
      categoryStats
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/admin/classes', authenticateToken, isAdmin, async (req, res) => {
  try {
    await connectToDatabase();
    const classes = await Class.find().sort({ createdAt: -1 });
    res.json(classes);
  } catch (error) {
    console.error('Admin get classes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/admin/classes', authenticateToken, isAdmin, async (req, res) => {
  try {
    await connectToDatabase();
    const classData = req.body;
    const newClass = new Class(classData);
    await newClass.save();
    res.status(201).json(newClass);
  } catch (error) {
    console.error('Admin create class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/admin/classes/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await connectToDatabase();
    const classItem = await Class.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.json(classItem);
  } catch (error) {
    console.error('Admin update class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/admin/classes/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await connectToDatabase();
    const classItem = await Class.findByIdAndDelete(req.params.id);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Admin delete class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    await connectToDatabase();
    const users = await User.find({ role: 'student' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await connectToDatabase();
    const { name, email, role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await connectToDatabase();
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/admin/setup', async (req, res) => {
  try {
    await connectToDatabase();
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const { email, password, name } = req.body;
    
    const admin = new User({ email, password, name, role: 'admin' });
    await admin.save();
    
    res.status(201).json({ message: 'Admin created successfully' });
  } catch (error) {
    console.error('Admin setup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== EXPORT FOR VERCEL ====================
export default app;